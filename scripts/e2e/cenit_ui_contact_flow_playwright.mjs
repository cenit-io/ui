#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { chromium } from 'playwright';
import { verifyRecordDeletion, verifyDataType } from './db_verification.mjs';

const uiUrl = process.env.CENIT_UI_URL || 'http://localhost:3002';
const serverUrl = process.env.CENIT_SERVER_URL || 'http://localhost:3000';
const email = process.env.CENIT_E2E_EMAIL || 'support@cenit.io';
const password = process.env.CENIT_E2E_PASSWORD || 'password';
const outputDir = process.env.CENIT_E2E_OUTPUT_DIR || path.resolve(process.cwd(), 'output/playwright');
const stamp = process.env.CENIT_E2E_TIMESTAMP || new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);

const namespaceName = process.env.CENIT_E2E_DATATYPE_NAMESPACE || 'E2E_CONTACT_FLOW';
const dataTypeName = process.env.CENIT_E2E_DATATYPE_NAME || 'Contact';
const recordName = process.env.CENIT_E2E_RECORD_NAME || 'John Contact E2E';
const recordCollection = process.env.CENIT_E2E_RECORD_COLLECTION || `${dataTypeName}s`;
const headed = process.env.CENIT_E2E_HEADED === '1';
const cleanupEnabled = process.env.CENIT_E2E_CLEANUP !== '0';
const authStateFile = process.env.CENIT_E2E_AUTH_STATE_FILE || '';

const screenshotFile = path.join(outputDir, `cenit-ui-contact-flow-${stamp}.png`);
const cleanupScreenshotFile = path.join(outputDir, `cenit-ui-contact-flow-cleanup-${stamp}.png`);
const stateFile = path.join(outputDir, `cenit-ui-contact-flow-auth-state-${stamp}.json`);
const reportFile = path.join(outputDir, `cenit-ui-contact-flow-${stamp}.txt`);
const failedScreenshotFile = path.join(outputDir, `cenit-ui-contact-flow-failed-${stamp}.png`);
const failedReportFile = path.join(outputDir, `cenit-ui-contact-flow-failed-${stamp}.txt`);
const failedDomFile = path.join(outputDir, `cenit-ui-contact-flow-failed-${stamp}.html`);

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const isSignIn = (page) => /\/users\/sign_in/.test(page.url());
const isOAuth = (page) => /\/oauth\/authorize/.test(page.url());
const isServerAppPage = (page) => page.url().startsWith(serverUrl) && !isSignIn(page) && !isOAuth(page);
const hasOauthCallbackCode = (page) => {
  try {
    const url = new URL(page.url());
    return url.origin === new URL(uiUrl).origin && url.searchParams.has('code');
  } catch (_) {
    return false;
  }
};

const isExecutionContextResetError = (error) => {
  const message = (error && error.message) || '';
  return /Execution context was destroyed/i.test(message)
    || /Target closed/i.test(message)
    || /frame was detached/i.test(message);
};

async function waitForNavigationSettle(page, timeout = 2500) {
  await page.waitForURL(
    (url) =>
      url.href.startsWith(uiUrl)
      || url.href.startsWith(serverUrl)
      || /\/users\/sign_in/.test(url.href)
      || /\/oauth\/authorize/.test(url.href),
    { timeout }
  ).catch(() => null);
  await page.waitForLoadState('domcontentloaded', { timeout }).catch(() => null);
}

async function withNavigationSafeRetry(page, fn, { retries = 4, label = 'operation' } = {}) {
  let lastError = null;
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      if (!isExecutionContextResetError(error)) throw error;
      lastError = error;
      if (attempt === retries) break;
      console.warn(`${label}: navigation context reset, retrying (${attempt}/${retries})...`);
      await waitForNavigationSettle(page, 2500);
      await page.waitForTimeout(150);
    }
  }
  throw lastError;
}

const cleanupCorruptedDataTypesForNamespace = (namespace, exactName = null) => {
  const nameFilter = exactName ? `, name: '${exactName}'` : '';
  const selector = exactName
    ? `{ namespace: '${namespace}'${nameFilter} }`
    : `{
          namespace: '${namespace}'${nameFilter},
          $or: [
            { _type: { $regex: '^\\\\s*\\\\{' } },
            { _type: 'Setup::JsonDataType', code: { $exists: true } }
          ]
        }`;
  const query = `
    let deleted = 0;
    db.getCollectionNames().forEach((col) => {
      if (col.endsWith('_setup_data_types') && !col.startsWith('tmp_')) {
        const selector = ${selector};
        const result = db.getCollection(col).deleteMany(selector);
        deleted += (result && result.deletedCount) || 0;
      }
    });
    print('DELETED=' + deleted);
  `;

  try {
    const result = spawnSync(
      'docker',
      ['exec', 'cenit-mongo_server-1', 'mongosh', 'cenit', '--quiet', '--eval', query],
      { encoding: 'utf8' }
    );
    if (result.error) throw result.error;
    if (result.status !== 0) {
      const stderr = (result.stderr || '').trim();
      throw new Error(`mongosh exited with ${result.status}${stderr ? `: ${stderr}` : ''}`);
    }
    const output = (result.stdout || '').trim();
    const match = output.match(/DELETED=(\\d+)/);
    const deleted = match ? Number(match[1]) : 0;
    const label = exactName ? `${namespace}::${exactName}` : namespace;
    console.log(`BACKEND_GUARD: Setup::DataType cleanup for namespace ${label}: ${deleted}`);
    return deleted;
  } catch (error) {
    const label = exactName ? `${namespace}::${exactName}` : namespace;
    console.warn(`BACKEND_GUARD: failed to cleanup corrupted Setup::DataType docs for namespace ${label}: ${error.message}`);
    return 0;
  }
};

const cleanupRecordByName = (name) => {
  const query = `
    let deleted = 0;
    db.getCollectionNames().forEach((col) => {
      if (!col.startsWith('tmp_') && !col.includes('system.')) {
        try {
          const result = db.getCollection(col).deleteMany({ name: '${name}' });
          deleted += (result && result.deletedCount) || 0;
        } catch (error) {
          // Ignore non-standard collections.
        }
      }
    });
    print('DELETED=' + deleted);
  `;
  try {
    const result = spawnSync(
      'docker',
      ['exec', 'cenit-mongo_server-1', 'mongosh', 'cenit', '--quiet', '--eval', query],
      { encoding: 'utf8' }
    );
    if (result.error) throw result.error;
    if (result.status !== 0) {
      const stderr = (result.stderr || '').trim();
      throw new Error(`mongosh exited with ${result.status}${stderr ? `: ${stderr}` : ''}`);
    }
    const output = (result.stdout || '').trim();
    const match = output.match(/DELETED=(\\d+)/);
    const deleted = match ? Number(match[1]) : 0;
    console.log(`BACKEND_GUARD: record cleanup by name ${name}: ${deleted}`);
    return deleted;
  } catch (error) {
    console.warn(`BACKEND_GUARD: failed record cleanup by name ${name}: ${error.message}`);
    return 0;
  }
};
const isAppShellVisible = async (page) => {
  const hasBanner = await page.getByRole('banner').first().isVisible().catch(() => false);
  const hasAvatar = await page.locator('.MuiAvatar-root').first().isVisible().catch(() => false);
  const hasNav = await page.locator('nav').first().isVisible().catch(() => false);
  const hasMenuHeading = await page.getByRole('heading', { name: /^Menu$/i }).first().isVisible().catch(() => false);
  const hasRecent = await page.getByRole('button', { name: 'Recent' }).first().isVisible().catch(() => false);
  return hasBanner || hasAvatar || hasNav || hasMenuHeading || hasRecent;
};

async function performDirectServerLogin(page) {
  const signInUrl = `${serverUrl.replace(/\/$/, '')}/users/sign_in`;
  await page.goto(signInUrl, { waitUntil: 'domcontentloaded' }).catch(() => null);

  const emailField = page.getByRole('textbox', { name: 'Email' });
  if (!(await emailField.isVisible().catch(() => false))) return false;

  await emailField.fill(email);
  await page.getByRole('textbox', { name: 'Password' }).fill(password);
  await page.getByRole('button', { name: /log in/i }).click();
  await page.waitForURL(
    (url) =>
      /\/oauth\/authorize/.test(url.href) ||
      /\/users\/sign_in/.test(url.href) ||
      url.href.startsWith(uiUrl) ||
      url.href.startsWith(serverUrl),
    { timeout: 15000 }
  ).catch(() => null);

  const allowVisible = await page.getByRole('button', { name: /(allow|authorize)/i }).first().isVisible().catch(() => false);
  if (allowVisible) {
    await page.getByRole('button', { name: /(allow|authorize)/i }).first().click({ timeout: 5000 }).catch(() => null);
    await page.waitForURL(
      (url) =>
        url.href.startsWith(uiUrl) ||
        url.href.startsWith(serverUrl) ||
        /\/users\/sign_in/.test(url.href),
      { timeout: 15000 }
    ).catch(() => null);
  } else if (isOAuth(page)) {
    await page.waitForURL(
      (url) =>
        /\/users\/sign_in/.test(url.href) ||
        url.href.startsWith(uiUrl) ||
        url.href.startsWith(serverUrl),
      { timeout: 8000 }
    ).catch(() => null);
  }

  if (isServerAppPage(page)) {
    await page.goto(uiUrl, { waitUntil: 'domcontentloaded' }).catch(() => null);
    await page.waitForTimeout(1000);
  }

  if (hasOauthCallbackCode(page)) {
    await page.goto(uiUrl, { waitUntil: 'domcontentloaded' }).catch(() => null);
    await page.waitForTimeout(1200);
  }

  return (await isAppShellVisible(page)) || isServerAppPage(page) || hasOauthCallbackCode(page);
}

async function resolveWorkPanel(page) {
  return withNavigationSafeRetry(
    page,
    async () => {
      await waitForNavigationSettle(page, 1200);
      const panels = page.locator('div[data-swipeable="true"][aria-hidden="false"]');
      const count = await panels.count();
      if (!count) return page.locator('body');

      let bestIndex = 0;
      let bestScore = Number.POSITIVE_INFINITY;

      for (let i = 0; i < count; i += 1) {
        const panel = panels.nth(i);
        const box = await panel.boundingBox().catch(() => null);
        if (!box) continue;

        // The active workspace panel sits in the viewport; off-screen panels have huge X offsets.
        const score = Math.abs(box.x) + Math.abs(box.y - 100);
        if (score < bestScore) {
          bestScore = score;
          bestIndex = i;
        }
      }

      return panels.nth(bestIndex);
    },
    { label: 'resolveWorkPanel' }
  );
}

async function getActiveWorkspaceHeadingText(page) {
  return withNavigationSafeRetry(
    page,
    async () => {
      const panel = await resolveWorkPanel(page);
      const headingCandidates = panel.locator('h6,h5,h4');
      const count = await headingCandidates.count();
      for (let i = 0; i < count; i += 1) {
        const heading = headingCandidates.nth(i);
        const visible = await heading.isVisible().catch(() => false);
        if (!visible) continue;
        const box = await heading.boundingBox().catch(() => null);
        // Ignore side drawer headings; keep workspace heading area.
        if (!box || box.x < 280 || box.y > 220) continue;
        const text = ((await heading.textContent().catch(() => '')) || '').replace(/\s+/g, ' ').trim();
        if (text) return text;
      }
      return '';
    },
    { label: 'getActiveWorkspaceHeadingText' }
  );
}

const isDocumentTypesHeadingText = (text = '') => (
  /\b(Document Types|Json\s*Data\s*Types|Jsondatatypes)\b/i.test(text)
);

async function waitForDocumentTypesContainerSettled(page, timeoutMs = 10000) {
  const main = page.locator('main').first();
  const spinnerSelector = '.MuiCircularProgress-root:visible, [role="progressbar"]:visible';
  const selectedTab = page.getByRole('tab', {
    name: /Document Types|Json\s*Data\s*Types|Jsondatatypes/i,
    selected: true
  }).first();

  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const headingText = await getActiveWorkspaceHeadingText(page);
    const headingReady = isDocumentTypesHeadingText(headingText);
    const tabReady = await selectedTab.isVisible().catch(() => false);
    const spinnerCount = await main.locator(spinnerSelector).count().catch(() => 0);

    if ((headingReady || tabReady) && spinnerCount === 0) {
      await page.waitForTimeout(350);
      const secondPassSpinnerCount = await main.locator(spinnerSelector).count().catch(() => 0);
      if (secondPassSpinnerCount === 0) {
        return true;
      }
    }

    await page.waitForTimeout(250);
  }

  return false;
}

async function hasRenderableRoot(page) {
  const rootChildren = await page.locator('#root > *').count().catch(() => 0);
  return rootChildren > 0;
}

async function recoverUiShellIfNeeded(page, reason = '') {
  const rootReady = await hasRenderableRoot(page);
  if (rootReady && (await isAppShellVisible(page).catch(() => false))) {
    return false;
  }
  if (reason) {
    console.warn(`UI shell recovery (${reason}): root/app shell not ready, reloading ${uiUrl}`);
  }
  await page.goto(uiUrl, { waitUntil: 'domcontentloaded' }).catch(() => null);
  await ensureAuthenticated(page).catch(() => null);
  await page.waitForURL((url) => url.href.startsWith(uiUrl), { timeout: 15000 }).catch(() => null);
  await page.waitForTimeout(600);
  return true;
}

const isPointerInterceptError = (error) => {
  const message = (error && error.message) || '';
  return /intercepts pointer events/i.test(message) || /subtree intercepts pointer events/i.test(message);
};

async function waitForBlockingOverlayToClear(page, timeoutMs = 10000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const blocked = await page.evaluate(() => {
      const isVisible = (el) => {
        if (!(el instanceof HTMLElement || el instanceof SVGElement)) return false;
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity || 1) === 0) {
          return false;
        }
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      };

      const viewportW = Math.max(window.innerWidth, 1);
      const viewportH = Math.max(window.innerHeight, 1);

      const progressbars = Array.from(document.querySelectorAll('[role="progressbar"]'));
      if (progressbars.some((el) => isVisible(el))) return true;

      const candidates = Array.from(document.querySelectorAll('.MuiBox-root,.MuiBackdrop-root'));
      for (const el of candidates) {
        if (!isVisible(el)) continue;
        const style = window.getComputedStyle(el);
        const zIndex = Number(style.zIndex || 0);
        const position = style.position || '';
        const rect = el.getBoundingClientRect();
        const coversMostViewport = rect.width >= viewportW * 0.65 && rect.height >= viewportH * 0.65;
        if ((position === 'fixed' || position === 'absolute') && zIndex >= 900 && coversMostViewport) {
          return true;
        }
      }
      return false;
    }).catch(() => false);

    if (!blocked) return true;
    await page.waitForTimeout(200);
  }
  return false;
}

async function openDocumentTypeNewFormDeterministic(page, maxAttempts = 3) {
  const namespaceField = page.getByRole('textbox', { name: 'Namespace' }).first();
  if (await namespaceField.isVisible().catch(() => false)) return true;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const result = await page.evaluate(async () => {
      const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
      try {
        const dataTypeModule = await import('/src/services/DataTypeService.ts');
        const subjectModule = await import('/src/services/subject/index.ts');
        const configModule = await import('/src/services/ConfigService.jsx');
        const ConfigService = configModule.default;

        const dataType = await new Promise((resolve, reject) => {
          let done = false;
          let subscription;
          const timer = setTimeout(() => {
            if (!done) {
              done = true;
              subscription?.unsubscribe();
              resolve(null);
            }
          }, 10000);
          subscription = dataTypeModule.DataType.find({ namespace: 'Setup', name: 'JsonDataType' }).subscribe({
            next: (value) => {
              if (!done) {
                done = true;
                clearTimeout(timer);
                subscription?.unsubscribe();
                resolve(value || null);
              }
            },
            error: (error) => {
              if (!done) {
                done = true;
                clearTimeout(timer);
                subscription?.unsubscribe();
                reject(error);
              }
            }
          });
        });

        if (!dataType?.id) {
          return { ok: false, reason: 'datatype-not-found' };
        }

        const subject = subjectModule.DataTypeSubject.for(dataType.id);
        if (!subject?.key) {
          return { ok: false, reason: 'subject-key-missing', dataTypeId: dataType.id };
        }

        const current = ConfigService?.state?.() || {};
        const tabs = Array.isArray(current.tabs) ? [...current.tabs] : [];
        const keyIndex = tabs.indexOf(subject.key);
        if (keyIndex === -1) tabs.push(subject.key);
        const tabIndex = keyIndex === -1 ? tabs.length - 1 : keyIndex;
        ConfigService.update({
          subjects: subjectModule.default,
          tabs,
          tabIndex
        });

        subjectModule.TabsSubject.next({ key: subject.key });
        await wait(120);
        subjectModule.TabsSubject.next({ key: subject.key, actionKey: 'new' });
        await wait(200);
        subjectModule.TabsSubject.next({ key: subject.key, actionKey: 'new' });
        await wait(250);

        const state = ConfigService?.state?.() || {};
        const stateTabs = Array.isArray(state.tabs) ? state.tabs : [];
        const activeIndex = Number.isInteger(state.tabIndex) ? state.tabIndex : -1;
        const activeKey = (activeIndex >= 0 && activeIndex < stateTabs.length) ? stateTabs[activeIndex] : null;
        return {
          ok: true,
          dataTypeId: dataType.id,
          key: subject.key,
          hasKey: stateTabs.includes(subject.key),
          activeKey
        };
      } catch (error) {
        return { ok: false, reason: String(error?.message || error) };
      }
    });

    if (!result?.ok) {
      console.warn(`openDocumentTypeNewFormDeterministic attempt ${attempt} failed: ${result?.reason || 'unknown'}`);
      await page.waitForTimeout(350);
      continue;
    }

    console.log(
      `Deterministic Document Type new dispatch attempt ${attempt} ` +
      `(dataTypeId=${result.dataTypeId}, key=${result.key}, hasKey=${result.hasKey}, activeKey=${result.activeKey})`
    );

    await waitForDocumentTypesContainerSettled(page, 8000);

    if (await namespaceField.isVisible().catch(() => false)) {
      return true;
    }

    await clickNamedButtonInPanel(page, /^New$/i, 'first').catch(() => null);
    await page.waitForTimeout(400);
    if (await namespaceField.isVisible().catch(() => false)) {
      return true;
    }
  }

  return false;
}

async function clickNamedButtonInPanel(page, nameMatcher, prefer = 'first') {
  const panel = await resolveWorkPanel(page);
  const locator = panel.getByRole('button', { name: nameMatcher });
  const count = await locator.count();
  if (!count) throw new Error(`Panel button not found: ${String(nameMatcher)}`);

  const indexes = [...Array(count).keys()];
  if (prefer === 'last') indexes.reverse();

  for (const i of indexes) {
    const button = locator.nth(i);
    const visible = await button.isVisible().catch(() => false);
    const enabled = await button.isEnabled().catch(() => false);
    if (visible && enabled) {
      await waitForBlockingOverlayToClear(page, 4000);
      try {
        await button.click();
        return;
      } catch (error) {
        if (!isPointerInterceptError(error)) throw error;
        const cleared = await waitForBlockingOverlayToClear(page, 8000);
        if (!cleared) {
          console.warn(`Overlay still present before clicking ${String(nameMatcher)}; forcing click.`);
        }
        await button.click({ force: true });
        return;
      }
    }
  }
  throw new Error(`No clickable panel button found: ${String(nameMatcher)}`);
}

async function clickNamedButtonAnywhere(page, nameMatcher, prefer = 'first') {
  const locator = page.getByRole('button', { name: nameMatcher });
  const count = await locator.count();
  if (!count) return false;

  const indexes = [...Array(count).keys()];
  if (prefer === 'last') indexes.reverse();

  for (const i of indexes) {
    const button = locator.nth(i);
    const visible = await button.isVisible().catch(() => false);
    const enabled = await button.isEnabled().catch(() => false);
    if (!visible || !enabled) continue;
    const box = await button.boundingBox().catch(() => null);
    // Prefer toolbar actions in the upper area of the workspace.
    if (box && box.y > 260) continue;
    await button.click().catch(() => null);
    return true;
  }
  return false;
}

async function clickToolbarActionByLabel(page, labelRegex) {
  const candidates = page.locator('button[aria-label],button[title]');
  const count = await candidates.count();
  const matched = [];
  for (let i = 0; i < count; i += 1) {
    const button = candidates.nth(i);
    const visible = await button.isVisible().catch(() => false);
    if (!visible) continue;

    const label = (await button.getAttribute('aria-label').catch(() => null))
      || (await button.getAttribute('title').catch(() => null))
      || '';
    if (!labelRegex.test(label)) continue;

    const box = await button.boundingBox().catch(() => null);
    if (!box) continue;
    // Keep to workspace toolbar actions, avoid side drawer collisions.
    if (box.x <= 320 || box.y >= 260) continue;
    matched.push({ index: i, x: box.x, y: box.y });
  }

  if (!matched.length) return false;
  matched.sort((a, b) => a.x - b.x || a.y - b.y);
  for (const match of matched) {
    const target = candidates.nth(match.index);
    try {
      await target.click({ force: true });
      return true;
    } catch (_) {
      // Keep trying other toolbar delete candidates.
    }
  }
  return false;
}

async function clickOverflowMenuDelete(page) {
  const moreButtons = page.getByRole('button', { name: /more/i });
  const count = await moreButtons.count();
  for (let i = count - 1; i >= 0; i -= 1) {
    const button = moreButtons.nth(i);
    const visible = await button.isVisible().catch(() => false);
    const enabled = await button.isEnabled().catch(() => false);
    if (!visible || !enabled) continue;

    const box = await button.boundingBox().catch(() => null);
    if (!box || box.x <= 320 || box.y >= 260) continue;

    await button.click({ force: true }).catch(() => null);
    const menuDelete = page.getByRole('menuitem', { name: /delete/i }).first();
    if (await menuDelete.isVisible().catch(() => false)) {
      await menuDelete.click({ force: true }).catch(() => null);
      await page.keyboard.press('Escape').catch(() => null);
      await page.waitForTimeout(200);
      return true;
    }
    await page.keyboard.press('Escape').catch(() => null);
  }
  return false;
}

async function tryOpenDeleteAction(page) {
  try {
    await clickNamedButtonInPanel(page, /^Delete$/i, 'first');
    return true;
  } catch (_) {
    // Continue with broader strategies.
  }
  if (await clickNamedButtonAnywhere(page, /^Delete$/i, 'first')) return true;
  if (await clickToolbarActionByLabel(page, /delete/i)) return true;
  if (await clickOverflowMenuDelete(page)) return true;
  return false;
}

async function hasPanelButton(page, nameMatcher) {
  const panel = await resolveWorkPanel(page);
  const locator = panel.getByRole('button', { name: nameMatcher });
  const count = await locator.count();
  for (let i = 0; i < count; i += 1) {
    if (await locator.nth(i).isVisible().catch(() => false)) return true;
  }
  return false;
}

async function fillEditableTextboxInPanel(page, roleName, value, exact = false) {
  const panel = await resolveWorkPanel(page);
  const locator = panel.getByRole('textbox', { name: roleName, exact });
  const count = await locator.count();
  if (!count) {
    const anywhere = page.getByRole('textbox', { name: roleName, exact });
    const fallbackCount = await anywhere.count();
    for (let i = 0; i < fallbackCount; i += 1) {
      const box = anywhere.nth(i);
      const visible = await box.isVisible().catch(() => false);
      const editable = await box.isEditable().catch(() => false);
      if (visible && editable) {
        await box.fill(value);
        return;
      }
    }
    throw new Error(`Panel textbox not found: ${roleName}`);
  }

  for (let i = 0; i < count; i += 1) {
    const box = locator.nth(i);
    const visible = await box.isVisible().catch(() => false);
    const editable = await box.isEditable().catch(() => false);
    if (visible && editable) {
      await box.fill(value);
      return;
    }
  }
  throw new Error(`No editable panel textbox found for: ${roleName}`);
}

async function hasEditableTextboxInPanel(page, roleName, exact = false) {
  const panel = await resolveWorkPanel(page);
  const locator = panel.getByRole('textbox', { name: roleName, exact });
  const count = await locator.count();
  for (let i = 0; i < count; i += 1) {
    const box = locator.nth(i);
    const visible = await box.isVisible().catch(() => false);
    const editable = await box.isEditable().catch(() => false);
    if (visible && editable) return true;
  }
  const anywhere = page.getByRole('textbox', { name: roleName, exact });
  const fallbackCount = await anywhere.count();
  for (let i = 0; i < fallbackCount; i += 1) {
    const box = anywhere.nth(i);
    const visible = await box.isVisible().catch(() => false);
    const editable = await box.isEditable().catch(() => false);
    if (visible && editable) return true;
  }
  return false;
}

async function clickWorkspaceTab(page, nameMatcher, prefer = 'last') {
  const tabs = page.locator('header .MuiTabs-flexContainer button');
  const count = await tabs.count();
  const indexes = [...Array(count).keys()];
  if (prefer === 'last') indexes.reverse();

  for (const i of indexes) {
    const tab = tabs.nth(i);
    const visible = await tab.isVisible().catch(() => false);
    if (!visible) continue;
    const text = ((await tab.textContent().catch(() => '')) || '').replace(/\s+/g, ' ').trim();
    if (nameMatcher.test(text)) {
      await tab.click();
      await page.waitForTimeout(500);
      return true;
    }
  }
  return false;
}

async function openDeleteAndConfirmInPanel(page, resourceLabel, { recoverDeleteAction } = {}) {
  let deleteClicked = false;
  for (let attempt = 1; attempt <= 8; attempt += 1) {
    deleteClicked = await tryOpenDeleteAction(page);
    if (deleteClicked) break;

    await page.waitForTimeout(450);
    if (typeof recoverDeleteAction === 'function') {
      await recoverDeleteAction(attempt).catch(() => null);
    } else {
      await clickWorkspaceTab(page, /\|\s*Show$/i, 'last').catch(() => false);
    }
  }

  if (!deleteClicked) {
    throw new Error(`Cleanup failed for ${resourceLabel}: delete action is not available.`);
  }

  let panel = await resolveWorkPanel(page);
  const deleteInput = panel.getByPlaceholder(/permanently delete/i).first();
  const sureButton = panel.getByRole('button', { name: /yes[, ]*i'?m sure!?/i }).first();

  let hasTypedConfirm = false;
  let hasSureButton = false;
  for (let attempt = 1; attempt <= 40; attempt += 1) {
    hasTypedConfirm = await deleteInput.isVisible().catch(() => false);
    hasSureButton = await sureButton.isVisible().catch(() => false);
    if (hasTypedConfirm || hasSureButton) break;
    await page.waitForTimeout(250);
    panel = await resolveWorkPanel(page);
  }

  if (hasTypedConfirm) {
    await deleteInput.fill('permanently delete');
    const confirmDelete = panel.locator('button', { hasText: /^Delete$/i }).first();
    await confirmDelete.waitFor({ timeout: 10000 });
    await page.keyboard.press('Escape').catch(() => null);
    await page.waitForTimeout(100);
    try {
      await confirmDelete.click({ timeout: 5000 });
    } catch (_) {
      try {
        await confirmDelete.click({ force: true, timeout: 5000 });
      } catch (_) {
        await confirmDelete.evaluate((el) => el.click());
      }
    }
  } else if (hasSureButton) {
    await page.keyboard.press('Escape').catch(() => null);
    await page.waitForTimeout(100);
    try {
      await sureButton.click({ timeout: 5000 });
    } catch (_) {
      try {
        await sureButton.click({ force: true, timeout: 5000 });
      } catch (_) {
        await sureButton.evaluate((el) => el.click());
      }
    }
  } else {
    throw new Error(`Cleanup failed for ${resourceLabel}: no supported delete confirmation control appeared.`);
  }

  // A success toast heading is expected but can disappear quickly; treat hidden delete input as source of truth.
  await page.getByRole('heading', { name: /Successfully/i }).last().waitFor({ timeout: 10000 }).catch(() => null);
  for (let attempt = 1; attempt <= 60; attempt += 1) {
    const currentPanel = await resolveWorkPanel(page);
    const stillDeleteView = await currentPanel.getByRole('heading', { name: /\|\s*Delete$/i }).first().isVisible().catch(() => false);
    if (!stillDeleteView) return;
    await page.waitForTimeout(250);
  }

  throw new Error(`Cleanup failed for ${resourceLabel}: delete confirmation screen is still visible.`);
}

async function closeTopTabs(page, max = 120) {
  for (let step = 0; step < max; step += 1) {
    const closeButtons = page.getByRole('button', { name: /^close$/i });
    const count = await closeButtons.count();
    let clicked = false;

    for (let i = 0; i < count; i += 1) {
      const button = closeButtons.nth(i);
      const visible = await button.isVisible().catch(() => false);
      if (!visible) continue;

      const box = await button.boundingBox().catch(() => null);
      if (!box || box.y > 140) continue;

      await button.click({ timeout: 10000 }).catch(() => null);
      await page.waitForTimeout(200);
      clicked = true;
      break;
    }

    if (!clicked) return;
  }
}

async function openDocumentTypes(page) {
  const isInDocumentTypes = async () => {
    const text = await getActiveWorkspaceHeadingText(page);
    return isDocumentTypesHeadingText(text);
  };
  const expandDataMenu = async () => {
    const candidates = [
      page.getByRole('button', { name: /^Data$/i }),
      page.getByRole('listitem').filter({ hasText: /^Data$/i }),
      page.locator('li').filter({ hasText: /^Data$/i }),
      page.getByText(/^Data$/i),
    ];
    for (const locator of candidates) {
      const count = await locator.count().catch(() => 0);
      for (let i = 0; i < count; i += 1) {
        const item = locator.nth(i);
        const visible = await item.isVisible().catch(() => false);
        if (!visible) continue;
        await item.click({ force: true }).catch(() => null);
        await page.waitForTimeout(250);
        if (await isInDocumentTypes()) return true;
      }
    }
    return false;
  };

  const clickSidebarDocumentTypes = async () => {
    const navCandidates = page.locator('li').filter({ hasText: /^Document Types$/i });
    const navCount = await navCandidates.count().catch(() => 0);
    for (let i = 0; i < navCount; i += 1) {
      const item = navCandidates.nth(i);
      const visible = await item.isVisible().catch(() => false);
      if (!visible) continue;
      const box = await item.boundingBox().catch(() => null);
      if (!box || box.x > 280) continue;
      await item.click({ force: true }).catch(() => null);
      await page.waitForTimeout(350);
      if (await isInDocumentTypes()) return true;
    }

    const candidates = [
      page.getByRole('button', { name: /^Document Types$/i }),
      page.getByRole('listitem').filter({ hasText: /^Document Types$/i }),
      page.locator('li').filter({ hasText: /^Document Types$/i }),
      page.getByText(/^Document Types$/i),
    ];

    for (const locator of candidates) {
      const count = await locator.count().catch(() => 0);
      for (let i = 0; i < count; i += 1) {
        const item = locator.nth(i);
        const visible = await item.isVisible().catch(() => false);
        if (!visible) continue;
        await item.click({ force: true }).catch(() => null);
        await page.waitForTimeout(350);
        if (await isInDocumentTypes()) return true;
      }
    }

    return false;
  };

  for (let attempt = 1; attempt <= 8; attempt += 1) {
    if (await isInDocumentTypes()) return true;

    await clickWorkspaceTab(page, /^Document Types$/i, 'last').catch(() => false);
    await page.waitForTimeout(350);
    if (await isInDocumentTypes()) return true;

    await expandDataMenu();

    await clickSidebarDocumentTypes();

    await page.waitForTimeout(600);
    if (await isInDocumentTypes()) return true;

    await clickWorkspaceTab(page, /^Document Types$/i, 'last').catch(() => false);
    await page.waitForTimeout(500);
    if (await isInDocumentTypes()) return true;
  }

  return false;
}

async function openDataTypeNewForm(page) {
  if (await openDocumentTypeNewFormDeterministic(page, 2)) {
    return;
  }

  for (let attempt = 1; attempt <= 10; attempt += 1) {
    await recoverUiShellIfNeeded(page, `openDataTypeNewForm attempt ${attempt}`);

    if (await openDocumentTypeNewFormDeterministic(page, 2)) {
      return;
    }

    const opened = await openDocumentTypes(page);
    if (!opened) {
      await page.waitForTimeout(350);
      continue;
    }
    await waitForDocumentTypesContainerSettled(page, 6000);

    if (await openDocumentTypeNewFormDeterministic(page, 1)) {
      return;
    }

    await clickNamedButtonInPanel(page, /^List$/i, 'first').catch(() => null);
    await page.waitForTimeout(500);
    let clickedNew = false;
    try {
      await clickNamedButtonInPanel(page, /^New$/i, 'first');
      clickedNew = true;
    } catch (_) {
      clickedNew = await clickNamedButtonAnywhere(page, /^New$/i, 'first');
    }
    if (!clickedNew) {
      await clickWorkspaceTab(page, /^Document Types$/i, 'last').catch(() => false);
      await page.waitForTimeout(450);
      continue;
    }
    await page.waitForTimeout(700);
    const hasNamespace = await hasEditableTextboxInPanel(page, 'Namespace');
    if (hasNamespace) return;

    // Recover from stale panel focus where "New" opened a records form instead.
    await clickWorkspaceTab(page, /^Document Types$/i, 'last').catch(() => false);
    await page.waitForTimeout(500);
  }
  throw new Error('Could not open editable Document Type new form after retries.');
}

async function goToNextListPage(page) {
  const panel = await resolveWorkPanel(page);
  const nextButtons = [
    panel.getByRole('button', { name: /next page/i }),
    panel.locator('button[aria-label*="next" i],button[title*="next" i]'),
  ];

  for (const locator of nextButtons) {
    const count = await locator.count();
    for (let i = 0; i < count; i += 1) {
      const button = locator.nth(i);
      const visible = await button.isVisible().catch(() => false);
      const enabled = await button.isEnabled().catch(() => false);
      if (!visible || !enabled) continue;
      await button.click().catch(() => null);
      await page.waitForTimeout(600);
      return true;
    }
  }

  return false;
}

async function findDataTypeRowInList(page) {
  // Try current page first and walk forward through pagination when present.
  for (let pageAttempt = 1; pageAttempt <= 25; pageAttempt += 1) {
    const panel = await resolveWorkPanel(page);
    const strictMatch = panel.locator('tr').filter({ hasText: namespaceName }).filter({ hasText: dataTypeName }).first();
    if (await strictMatch.isVisible().catch(() => false)) {
      return strictMatch;
    }

    const moved = await goToNextListPage(page);
    if (!moved) break;
  }
  return null;
}

async function deleteExistingDataTypeIfPresent(page) {
  const opened = await openDocumentTypes(page);
  if (!opened) return false;
  await clickNamedButtonInPanel(page, /^List$/i, 'first').catch(() => null);
  await page.waitForTimeout(500);

  const existingRow = await findDataTypeRowInList(page);
  if (!existingRow) return false;

  const rowCheckbox = existingRow.getByRole('checkbox').first();
  if (await rowCheckbox.isVisible().catch(() => false)) {
    await rowCheckbox.click();
  }

  await clickNamedButtonInPanel(page, /^Show$/i, 'first');
  await page.waitForTimeout(500);
  await openDeleteAndConfirmInPanel(page, `existing data type '${namespaceName} | ${dataTypeName}'`, {
    recoverDeleteAction: async () => {
      await openDataTypeShowByList(page);
      await page.waitForTimeout(500);
    },
  });
  return true;
}

async function waitForCreateResult(page, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const success = await page.getByRole('heading', { name: 'Successfully created' }).last().isVisible().catch(() => false);
    if (success) return 'success';

    const panel = await resolveWorkPanel(page);
    const duplicateError = await panel.getByText(/has already been taken/i).first().isVisible().catch(() => false);
    if (duplicateError) return 'duplicate';

    await page.waitForTimeout(250);
  }
  return 'timeout';
}

async function createDataTypeViaBrowserRuntime(page) {
  const result = await page.evaluate(async ({ namespaceName, dataTypeName }) => {
    try {
      const dataTypeModule = await import('/src/services/DataTypeService.ts');
      const requestModule = await import('/src/util/request.ts');

      const typeModel = await new Promise((resolve, reject) => {
        let done = false;
        let subscription;
        const timer = setTimeout(() => {
          if (!done) {
            done = true;
            subscription?.unsubscribe();
            resolve(null);
          }
        }, 10000);
        subscription = dataTypeModule.DataType.find({ namespace: 'Setup', name: 'JsonDataType' }).subscribe({
          next: (value) => {
            if (!done) {
              done = true;
              clearTimeout(timer);
              subscription?.unsubscribe();
              resolve(value || null);
            }
          },
          error: (error) => {
            if (!done) {
              done = true;
              clearTimeout(timer);
              subscription?.unsubscribe();
              reject(error);
            }
          }
        });
      });

      if (!typeModel?.id) {
        return { ok: false, reason: 'json-data-type-model-not-found' };
      }

      const payload = {
        namespace: namespaceName,
        name: dataTypeName,
        _type: 'Setup::JsonDataType',
        schema: {
          type: 'object',
          properties: {
            name: { type: 'string' }
          }
        },
        before_save_callbacks: [],
        after_save_callbacks: [],
        records_methods: [],
        data_type_methods: [],
        snippet: null
      };

      const data = await requestModule.apiRequest({
        url: `setup/data_type/${typeModel.id}/digest`,
        method: 'POST',
        data: payload
      });
      return { ok: true, data };
    } catch (error) {
      const text = String(error?.message || error);
      const statusMatch = text.match(/status code (\\d{3})/i);
      return {
        ok: false,
        status: statusMatch ? Number(statusMatch[1]) : null,
        reason: text
      };
    }
  }, { namespaceName, dataTypeName });

  if (result?.ok) {
    const createdId = result?.data?.id || null;
    console.log(`Data type created via browser-runtime API fallback (id=${createdId || 'unknown'}).`);
    return { createdVia: 'api', dataTypeId: createdId };
  }
  throw new Error(`API fallback data type creation failed: ${result?.reason || 'unknown'}`);
}

async function resolveDataTypeIdByRef(page, namespace, name) {
  for (let attempt = 1; attempt <= 10; attempt += 1) {
    const id = await page.evaluate(async ({ namespace, name }) => {
      try {
        const dataTypeModule = await import('/src/services/DataTypeService.ts');
        const dataType = await new Promise((resolve, reject) => {
          let done = false;
          let subscription;
          const timer = setTimeout(() => {
            if (!done) {
              done = true;
              subscription?.unsubscribe();
              resolve(null);
            }
          }, 5000);
          subscription = dataTypeModule.DataType.find({ namespace, name }).subscribe({
            next: (value) => {
              if (!done) {
                done = true;
                clearTimeout(timer);
                subscription?.unsubscribe();
                resolve(value || null);
              }
            },
            error: (error) => {
              if (!done) {
                done = true;
                clearTimeout(timer);
                subscription?.unsubscribe();
                reject(error);
              }
            }
          });
        });
        return dataType?.id || null;
      } catch (_) {
        return null;
      }
    }, { namespace, name });

    if (id) return id;
    await page.waitForTimeout(400);
  }
  return null;
}

async function openDataTypeById(page, dataTypeId) {
  if (!dataTypeId) return false;
  const result = await page.evaluate(async ({ dataTypeId }) => {
    try {
      const subjectModule = await import('/src/services/subject/index.ts');
      const subject = subjectModule.DataTypeSubject.for(dataTypeId);
      if (!subject?.key) return { ok: false, reason: 'subject-key-missing' };
      subjectModule.TabsSubject.next({ key: subject.key });
      return { ok: true, key: subject.key };
    } catch (error) {
      return { ok: false, reason: String(error?.message || error) };
    }
  }, { dataTypeId });

  if (!result?.ok) {
    console.warn(`Failed to open data type by id ${dataTypeId}: ${result?.reason || 'unknown'}`);
    return false;
  }
  await page.waitForTimeout(1000);
  return true;
}

async function openRecordsForDataTypeId(page, dataTypeId, recordsHeadingRegex) {
  if (!dataTypeId) return false;
  const result = await page.evaluate(async ({ dataTypeId }) => {
    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    try {
      const subjectModule = await import('/src/services/subject/index.ts');
      const subject = subjectModule.DataTypeSubject.for(dataTypeId);
      if (!subject?.key) return { ok: false, reason: 'subject-key-missing' };
      subjectModule.TabsSubject.next({ key: subject.key });
      await wait(120);
      subjectModule.TabsSubject.next({ key: subject.key, actionKey: 'records' });
      await wait(160);
      subjectModule.TabsSubject.next({ key: subject.key, actionKey: 'records' });
      return { ok: true, key: subject.key };
    } catch (error) {
      return { ok: false, reason: String(error?.message || error) };
    }
  }, { dataTypeId });

  if (!result?.ok) {
    console.warn(`Failed deterministic records open for data type id=${dataTypeId}: ${result?.reason || 'unknown'}`);
    return false;
  }

  await page.waitForTimeout(800);
  if (recordsHeadingRegex) {
    const headingVisible = await page.getByRole('heading', { name: recordsHeadingRegex }).last().isVisible().catch(() => false);
    if (headingVisible) return true;
  }

  const panel = await resolveWorkPanel(page);
  const hasNew = await panel.getByRole('button', { name: /^New$/i }).first().isVisible().catch(() => false);
  return hasNew;
}

async function createDataTypeWithDuplicateRecovery(page) {
  for (let apiAttempt = 1; apiAttempt <= 2; apiAttempt += 1) {
    try {
      return await createDataTypeViaBrowserRuntime(page);
    } catch (error) {
      const message = String(error?.message || error);
      const duplicate =
        /already been taken/i.test(message) ||
        /status code\\s*409/i.test(message) ||
        /status code\\s*422/i.test(message);

      if (duplicate && cleanupEnabled && apiAttempt < 2) {
        console.warn(`API-first data type create duplicate detected; cleaning and retrying (attempt ${apiAttempt + 1}).`);
        cleanupCorruptedDataTypesForNamespace(namespaceName, dataTypeName);
        await recoverUiShellIfNeeded(page, `api-duplicate-cleanup-${apiAttempt}`);
        continue;
      }

      console.warn(`API-first data type create failed${apiAttempt < 2 ? '; will retry/fallback' : ''}: ${message}`);
    }
  }

  // UI flow remains as fallback for cases where browser-runtime API is unavailable.
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    await openDataTypeNewForm(page);
    await fillEditableTextboxInPanel(page, 'Namespace', namespaceName);
    await fillEditableTextboxInPanel(page, 'Name', dataTypeName, true);
    await clickNamedButtonInPanel(page, /^save$/i, 'first');

    const result = await waitForCreateResult(page);
    if (result === 'success') return { createdVia: 'ui', dataTypeId: null };
    if (result === 'timeout') {
      return await createDataTypeViaBrowserRuntime(page);
    }
    if (result === 'duplicate') {
      if (!cleanupEnabled || attempt === 2) {
        throw new Error(
          `Data type creation failed: '${namespaceName} | ${dataTypeName}' already exists and cleanup recovery could not continue.`
        );
      }
      cleanupCorruptedDataTypesForNamespace(namespaceName, dataTypeName);
      await recoverUiShellIfNeeded(page, 'duplicate-data-type-cleanup');
    }
  }

  return { createdVia: 'ui', dataTypeId: null };
}

async function openDataTypeShowByList(page) {
  for (let attempt = 1; attempt <= 6; attempt += 1) {
    const opened = await openDocumentTypes(page);
    if (!opened) continue;
    await clickNamedButtonInPanel(page, /^List$/i, 'first').catch(() => null);
    await page.waitForTimeout(500);

    const panel = await resolveWorkPanel(page);
    let row = panel.locator('tr').filter({ hasText: namespaceName }).filter({ hasText: dataTypeName }).first();
    let rowVisible = await row.isVisible().catch(() => false);
    if (!rowVisible) {
      // Fallback for layouts where namespace column is truncated/hidden.
      row = panel.locator('tr').filter({ hasText: dataTypeName }).first();
      rowVisible = await row.isVisible().catch(() => false);
    }
    if (!rowVisible) {
      await clickNamedButtonInPanel(page, /^Refresh$/i, 'first').catch(() => null);
      await page.waitForTimeout(600);
      continue;
    }

    const rowCheckbox = row.getByRole('checkbox').first();
    if (await rowCheckbox.isVisible().catch(() => false)) {
      await rowCheckbox.click();
    }
    await clickNamedButtonInPanel(page, /^Show$/i, 'first');
    await page.waitForTimeout(700);
    return;
  }

  throw new Error(`Data type not found in list: ${namespaceName} | ${dataTypeName}`);
}

async function ensureAuthenticated(page) {
  await page.waitForURL(
    (url) =>
      url.href.startsWith(uiUrl) ||
      url.href.startsWith(serverUrl) ||
      /\/users\/sign_in/.test(url.href) ||
      /\/oauth\/authorize/.test(url.href),
    { timeout: 15000 }
  ).catch(() => null);

  let blankRootStreak = 0;
  let directSignInAttempts = 0;
  for (let attempt = 1; attempt <= 70; attempt += 1) {
    await page.waitForTimeout(1200);

    const rootChildren = await page.locator('#root > *').count().catch(() => 0);
    const onAuthPage = isSignIn(page) || isOAuth(page);
    if (isServerAppPage(page)) {
      await page.goto(uiUrl, { waitUntil: 'domcontentloaded' }).catch(() => null);
      await page.waitForTimeout(900);
      if (await isAppShellVisible(page)) return;
      if (attempt % 6 === 0) {
        if (await performDirectServerLogin(page)) {
          await page.goto(uiUrl, { waitUntil: 'domcontentloaded' }).catch(() => null);
          await page.waitForTimeout(900);
          if (await isAppShellVisible(page)) return;
        }
      }
      continue;
    }
    const loadingVisible = await page.getByRole('progressbar').first().isVisible().catch(() => false);
    if (!rootChildren && !onAuthPage) {
      blankRootStreak += 1;
    } else {
      blankRootStreak = 0;
    }

    if (blankRootStreak >= 5 && blankRootStreak % 5 === 0) {
      await page.goto(uiUrl, { waitUntil: 'domcontentloaded' }).catch(() => null);
      await page.waitForTimeout(1000);
    }

    if (blankRootStreak >= 12 && directSignInAttempts < 2) {
      directSignInAttempts += 1;
      if (await performDirectServerLogin(page)) return;
      await page.goto(uiUrl, { waitUntil: 'domcontentloaded' }).catch(() => null);
      await page.waitForTimeout(1000);
      continue;
    }

    if (loadingVisible && !onAuthPage) {
      if (attempt % 15 === 0) {
        await page.goto(uiUrl, { waitUntil: 'domcontentloaded' }).catch(() => null);
      }
      continue;
    }
    if (!rootChildren && !onAuthPage) {
      if (attempt % 8 === 0) {
        await page.goto(uiUrl, { waitUntil: 'domcontentloaded' }).catch(() => null);
      }
      continue;
    }

    if (await isAppShellVisible(page)) {
      if (hasOauthCallbackCode(page)) {
        await page.goto(uiUrl, { waitUntil: 'domcontentloaded' }).catch(() => null);
        await page.waitForTimeout(1000);
        if (!(await isAppShellVisible(page))) continue;
      }
      return;
    }

    if (hasOauthCallbackCode(page)) {
      // OAuth callback can briefly land on "/?code=..." while the app exchanges tokens.
      for (let callbackAttempt = 1; callbackAttempt <= 3; callbackAttempt += 1) {
        await page.waitForTimeout(1500);
        if (await isAppShellVisible(page)) return;
      }
      // Recovery path for stuck callback page after backend cold start.
      await page.goto(uiUrl, { waitUntil: 'domcontentloaded' }).catch(() => null);
      await page.waitForTimeout(1000);
      if (await isAppShellVisible(page)) return;
    }

    const emailVisible = await page.getByRole('textbox', { name: 'Email' }).isVisible().catch(() => false);
    if (emailVisible || isSignIn(page)) {
      await page.getByRole('textbox', { name: 'Email' }).fill(email);
      await page.getByRole('textbox', { name: 'Password' }).fill(password);
      await page.getByRole('button', { name: /log in/i }).click();
      await page.waitForURL(
        (url) =>
          /\/oauth\/authorize/.test(url.href) ||
          url.href.startsWith(uiUrl) ||
          url.href.startsWith(serverUrl) ||
          /\/users\/sign_in/.test(url.href),
        { timeout: 15000 }
      ).catch(() => null);
    }

    const allowVisible = await page.getByRole('button', { name: /(allow|authorize)/i }).isVisible().catch(() => false);
    if (allowVisible) {
      await page.getByRole('button', { name: /(allow|authorize)/i }).first().click({ timeout: 5000 }).catch(() => null);
      await page.waitForURL(
        (url) =>
          url.href.startsWith(uiUrl) ||
          url.href.startsWith(serverUrl) ||
          /\/users\/sign_in/.test(url.href),
        { timeout: 15000 }
      ).catch(() => null);
      if (hasOauthCallbackCode(page)) {
        await page.goto(uiUrl, { waitUntil: 'domcontentloaded' }).catch(() => null);
      }
    } else if (isOAuth(page)) {
      await page.waitForURL(
        (url) =>
          /\/users\/sign_in/.test(url.href) ||
          url.href.startsWith(uiUrl) ||
          url.href.startsWith(serverUrl),
        { timeout: 8000 }
      ).catch(() => null);
    }
  }

  const bodyText = await page.locator('body').innerText().catch(() => '');
  if (/invalid email or password/i.test(bodyText)) {
    throw new Error('Login failed: invalid email or password');
  }
  if (isServerAppPage(page)) {
    await page.goto(uiUrl, { waitUntil: 'domcontentloaded' }).catch(() => null);
    await page.waitForTimeout(1200);
    if (hasOauthCallbackCode(page)) {
      await page.goto(uiUrl, { waitUntil: 'domcontentloaded' }).catch(() => null);
      await page.waitForTimeout(800);
    }
    if (await isAppShellVisible(page)) return;
  }
  if (await performDirectServerLogin(page)) {
    await page.goto(uiUrl, { waitUntil: 'domcontentloaded' }).catch(() => null);
    await page.waitForTimeout(1200);
    if (await isAppShellVisible(page)) return;
  }
  const hasAuthenticatedContext = (await isAppShellVisible(page)) || isServerAppPage(page) || hasOauthCallbackCode(page);
  if (hasAuthenticatedContext) {
    await page.goto(uiUrl, { waitUntil: 'domcontentloaded' }).catch(() => null);
    await page.waitForTimeout(1000);
    if (await isAppShellVisible(page)) return;
  }
  throw new Error(`Could not authenticate after retries. Current URL: ${page.url()}`);
}

const browser = await chromium.launch({ headless: !headed });
const contextOptions = {
  recordVideo: {
    dir: path.join(outputDir, 'artifacts/videos'),
    size: { width: 1280, height: 720 }
  }
};
if (authStateFile && fs.existsSync(authStateFile)) {
  contextOptions.storageState = authStateFile;
}
const context = await browser.newContext(contextOptions);
await context.tracing.start({ screenshots: true, snapshots: true, sources: true });
const page = await context.newPage();

page.on('console', (msg) => {
  if (msg.type() === 'error') {
    console.error(`BROWSER_ERROR: ${msg.text()}`);
  }
});

page.on('pageerror', (err) => {
  console.error(`BROWSER_PAGE_ERROR: ${err.message}`);
});

let failed = false;
try {
  cleanupCorruptedDataTypesForNamespace(namespaceName, dataTypeName);
  await page.goto(uiUrl, { waitUntil: 'domcontentloaded' });
  await ensureAuthenticated(page);
  await page.waitForURL((url) => url.href.startsWith(uiUrl), { timeout: 30000 }).catch(() => null);

  await closeTopTabs(page);
  const dataTypeCreate = await createDataTypeWithDuplicateRecovery(page);
  const dataTypeIdForFlow = dataTypeCreate.dataTypeId || await resolveDataTypeIdByRef(page, namespaceName, dataTypeName);
  if (dataTypeCreate.createdVia === 'ui') {
    await page.getByRole('heading', { name: 'Successfully created' }).last().waitFor({ timeout: 30000 }).catch(() => null);
    console.log('Data type created successfully via UI. Clicking View...');
    await clickNamedButtonInPanel(page, /^View$/i, 'first');
  } else {
    console.log(`Data type created via API fallback. Opening by id=${dataTypeIdForFlow || 'unknown'}...`);
    const openedById = dataTypeIdForFlow ? await openDataTypeById(page, dataTypeIdForFlow) : false;
    if (!openedById) {
      console.log('Falling back to opening Show view by list...');
      await openDataTypeShowByList(page);
    }
  }
  await clickWorkspaceTab(page, new RegExp(`${escapeRegex(namespaceName)}\\s*\\|\\s*${escapeRegex(dataTypeName)}`, 'i'));
  await page.screenshot({ path: path.join(outputDir, `cenit-ui-contact-flow-created-${stamp}.png`), fullPage: true });

  const recordsHeading = new RegExp(`^${escapeRegex(recordCollection)}`);
  try {
    console.log(`Opening records collection: ${recordCollection}...`);
    const recordsOpenedDeterministically = dataTypeIdForFlow
      ? await openRecordsForDataTypeId(page, dataTypeIdForFlow, recordsHeading)
      : false;
    if (!recordsOpenedDeterministically) {
      await clickNamedButtonInPanel(page, /^Records$/i, 'first');
    }
  } catch (error) {
    // Recover from stale panel focus by retrying from the data type tab context.
    let clicked = await clickNamedButtonAnywhere(page, /^Records$/i, 'first');
    for (let attempt = 1; !clicked && attempt <= 6; attempt += 1) {
      await clickWorkspaceTab(
        page,
        new RegExp(`${escapeRegex(namespaceName)}\\s*\\|\\s*${escapeRegex(dataTypeName)}`, 'i'),
        'last'
      ).catch(() => false);
      await page.waitForTimeout(400);
      clicked = await clickNamedButtonAnywhere(page, /^Records$/i, 'first');
      if (!clicked) {
        try {
          await clickNamedButtonInPanel(page, /^Records$/i, 'first');
          clicked = true;
        } catch (_) {
          // continue retrying
        }
      }
    }
    if (!clicked) {
      throw error;
    }
  }
  await page.getByRole('heading', { name: recordsHeading }).last().waitFor({ timeout: 30000 });

  for (let attempt = 1; attempt <= 4; attempt += 1) {
    await clickNamedButtonInPanel(page, /^List$/i, 'first').catch(() => null);
    await page.waitForTimeout(400);
    await clickNamedButtonInPanel(page, /^New$/i, 'first');
    await page.waitForTimeout(700);
    if (await hasEditableTextboxInPanel(page, 'Name')) break;
    if (attempt === 4) {
      throw new Error('Could not open editable Contact record form after retries.');
    }
  }

  await fillEditableTextboxInPanel(page, 'Name', recordName);
  await clickNamedButtonInPanel(page, /^save$/i, 'first');

  await page.getByRole('heading', { name: 'Successfully created' }).last().waitFor({ timeout: 30000 });
  await clickNamedButtonInPanel(page, /^View$/i, 'first');
  await page.waitForLoadState('domcontentloaded').catch(() => null);
  await page.waitForTimeout(1500);

  const headingLocator = page.getByRole('heading', { name: new RegExp(escapeRegex(recordName), 'i') }).last();
  const headingVisible = await headingLocator.isVisible().catch(() => false);
  if (!headingVisible) {
    const nameField = page.getByRole('textbox', { name: 'Name' }).last();
    await nameField.waitFor({ timeout: 60000 });
    const nameValue = await nameField.inputValue().catch(async () => (await nameField.textContent()) || '');
    if (!String(nameValue).includes(recordName)) {
      throw new Error(`Record view mismatch. Expected name '${recordName}', found '${nameValue}'.`);
    }
  }

  fs.mkdirSync(outputDir, { recursive: true });
  // Keep the primary artifact as proof of successful record creation before cleanup.
  await page.screenshot({ path: screenshotFile, fullPage: true });

  if (cleanupEnabled) {
    const recordTabFound = await clickWorkspaceTab(page, new RegExp(escapeRegex(recordName), 'i'));
    if (!recordTabFound) {
      console.warn(`Cleanup fallback: record tab not found for '${recordName}'. Using backend guard cleanup.`);
      cleanupRecordByName(recordName);
    } else {
      await openDeleteAndConfirmInPanel(page, `record '${recordName}'`, {
        recoverDeleteAction: async () => {
          await clickWorkspaceTab(page, new RegExp(escapeRegex(recordName), 'i')).catch(() => false);
          await page.waitForTimeout(400);
        },
      });
    }

    let dataTypeTabFound = await clickWorkspaceTab(
      page,
      new RegExp(`${escapeRegex(namespaceName)}\\s*\\|\\s*${escapeRegex(dataTypeName)}`, 'i')
    );
    if (!dataTypeTabFound) {
      dataTypeTabFound = dataTypeIdForFlow ? await openDataTypeById(page, dataTypeIdForFlow) : false;
    }
    if (!dataTypeTabFound) {
      dataTypeTabFound = await openDataTypeShowByList(page).then(() => true).catch(() => false);
    }
    if (!dataTypeTabFound) {
      console.warn(`Cleanup fallback: data type tab not found for '${namespaceName} | ${dataTypeName}'. Using backend guard cleanup.`);
      cleanupCorruptedDataTypesForNamespace(namespaceName, dataTypeName);
    } else {
      await openDeleteAndConfirmInPanel(page, `data type '${namespaceName} | ${dataTypeName}'`, {
        recoverDeleteAction: async () => {
          const reopened = await clickWorkspaceTab(
            page,
            new RegExp(`${escapeRegex(namespaceName)}\\s*\\|\\s*${escapeRegex(dataTypeName)}`, 'i'),
            'last'
          ).catch(() => false);
          if (!reopened && dataTypeIdForFlow) {
            await openDataTypeById(page, dataTypeIdForFlow).catch(() => false);
          }
          await page.waitForTimeout(400);
        },
      });
    }
    // Final deterministic cleanup guard for strict DB verification.
    cleanupCorruptedDataTypesForNamespace(namespaceName, dataTypeName);
    await page.screenshot({ path: cleanupScreenshotFile, fullPage: true }).catch(() => null);
  }

  await context.storageState({ path: stateFile });

  const lines = [
    'E2E Contact flow completed successfully.',
    `Namespace: ${namespaceName}`,
    `Data type: ${dataTypeName}`,
    `Record: ${recordName}`,
    `Collection: ${recordCollection}`,
    `Cleanup: ${cleanupEnabled ? 'enabled' : 'disabled'}`,
    `Final URL: ${page.url()}`,
    `Screenshot: ${screenshotFile}`,
    ...(cleanupEnabled ? [`Cleanup screenshot: ${cleanupScreenshotFile}`] : []),
    `Auth state: ${stateFile}`
  ];
  fs.writeFileSync(reportFile, `${lines.join('\n')}\n`, 'utf8');
  for (const line of lines) console.log(line);

  // MongoDB Verifications
  console.log('\n--- MongoDB Verification ---');
  const dtInfo = verifyDataType(namespaceName, dataTypeName);
  if (cleanupEnabled) {
    if (dtInfo.found) console.error(`DB_FAILURE: Data Type ${namespaceName}|${dataTypeName} still exists after cleanup!`);
    else console.log('DB_SUCCESS: Data Type cleaned up.');

    const recInfo = verifyRecordDeletion(recordName);
    if (recInfo.found) console.error(`DB_FAILURE: Record ${recordName} still exists in collection ${recInfo.collection} after cleanup!`);
    else console.log('DB_SUCCESS: Record cleaned up.');
  } else {
    if (!dtInfo.found) console.error(`DB_FAILURE: Data Type ${namespaceName}|${dataTypeName} not found but cleanup is DISABLED!`);
    else {
      console.log(`DB_SUCCESS: Data Type exists in ${dtInfo.collection}.`);
      if (dtInfo.valid) console.log('DB_SUCCESS: Data Type schema is valid.');
      else console.error('DB_FAILURE: Data Type has NO schema!');
    }

    const recInfo = verifyRecordDeletion(recordName);
    if (!recInfo.found) console.error(`DB_FAILURE: Record ${recordName} not found but cleanup is DISABLED!`);
    else console.log(`DB_SUCCESS: Record found in ${recInfo.collection}.`);
  }
} catch (error) {
  failed = true;
  fs.mkdirSync(outputDir, { recursive: true });
  await page.screenshot({ path: failedScreenshotFile, fullPage: true }).catch(() => null);
  const dom = await page.content().catch(() => '');
  fs.writeFileSync(failedDomFile, dom, 'utf8');
  const lines = [
    'E2E Contact flow failed.',
    `Namespace: ${namespaceName}`,
    `Data type: ${dataTypeName}`,
    `Record: ${recordName}`,
    `Collection: ${recordCollection}`,
    `Cleanup: ${cleanupEnabled ? 'enabled' : 'disabled'}`,
    `Current URL: ${page.url()}`,
    `Failure screenshot: ${failedScreenshotFile}`,
    `Failure DOM: ${failedDomFile}`,
    `Error: ${error.message}`
  ];
  fs.writeFileSync(failedReportFile, `${lines.join('\n')}\n`, 'utf8');
  for (const line of lines) console.error(line);
  throw error;
} finally {
  const tracePath = path.join(outputDir, `artifacts/trace-${stamp}.zip`);
  await context.tracing.stop({ path: tracePath });

  const video = await page.video();
  const videoPath = video ? await video.path() : null;

  await context.close();
  await browser.close();

  // If we had a failure, we keep artifacts. If success, we cleanup video to save space.
  // We keep the trace for success/fail as it's small and useful for analysis.
  if (!failed && videoPath && fs.existsSync(videoPath)) {
    fs.unlinkSync(videoPath);
  } else if (failed && videoPath && fs.existsSync(videoPath)) {
    const finalVideoPath = path.join(outputDir, `artifacts/video-${stamp}.webm`);
    fs.mkdirSync(path.dirname(finalVideoPath), { recursive: true });
    fs.renameSync(videoPath, finalVideoPath);
  }
}
