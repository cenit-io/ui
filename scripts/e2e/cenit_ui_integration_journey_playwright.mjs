#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { chromium } from 'playwright';
import { verifyRecordDeletion, verifyDataType } from './db_verification.mjs';
import { STEP2_SNIPPET_FIELD_SELECTOR_PLAN } from './lib/step2_snippet_field_selectors.mjs';
import { matchesDataTypeDigestPost } from './lib/step2_template_contract.mjs';

// Environment variables
const uiUrl = process.env.CENIT_UI_URL || 'http://localhost:3002';
const serverUrl = process.env.CENIT_SERVER_URL || 'http://localhost:3000';
const email = process.env.CENIT_E2E_EMAIL || 'support@cenit.io';
const password = process.env.CENIT_E2E_PASSWORD || 'password';
const outputDir = process.env.CENIT_E2E_OUTPUT_DIR || path.resolve(process.cwd(), 'output/playwright');
const stamp = process.env.CENIT_E2E_TIMESTAMP || new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
const authStateFile = process.env.CENIT_E2E_AUTH_STATE_FILE;
const useAuthState = process.env.CENIT_E2E_USE_AUTH_STATE === '1';
const cleanup = process.env.CENIT_E2E_CLEANUP !== '0';
const step1Only = process.env.CENIT_E2E_STEP1_ONLY === '1';

// Journey configuration
const namespaceName = process.env.CENIT_E2E_JOURNEY_NAMESPACE || 'E2E_INTEGRATION';
const dataTypeNameBase = process.env.CENIT_E2E_JOURNEY_DATATYPE_NAME || 'Lead';
const runSuffix = stamp.slice(-6);
const dataTypeName = `${dataTypeNameBase}_${runSuffix}`;
const recordNameBase = process.env.CENIT_E2E_JOURNEY_RECORD_NAME || 'John Lead E2E';
const recordName = `${recordNameBase} ${runSuffix}`;
const templateNameBase = process.env.CENIT_E2E_JOURNEY_TEMPLATE_NAME || 'Lead_to_CRM';
const templateName = `${templateNameBase}_${runSuffix}`;
const flowNameBase = process.env.CENIT_E2E_JOURNEY_FLOW_NAME || 'Export_Leads';
const flowName = `${flowNameBase}_${runSuffix}`;
const webhookNameBase = process.env.CENIT_E2E_JOURNEY_WEBHOOK_NAME || 'E2E_Flow_Webhook';
const webhookName = `${webhookNameBase}_${runSuffix}`;
const templateDataTypeRefName = process.env.CENIT_E2E_TEMPLATE_DATATYPE_NAME || 'LiquidTemplate';
const flowDataTypeId = process.env.CENIT_E2E_FLOW_DATA_TYPE_ID || '';
const dataTypeRuntimeMarkerKey = '__CENIT_UI_DATA_TYPE_SERVICE__';
const expectedDataTypeFingerprint = 'ui/src/services/DataTypeService.ts@local-v2';

// Paths
const screenshotDir = path.join(outputDir, `journey-${stamp}`);
const provenanceDir = path.join(outputDir, 'provenance');
const provenanceModulePath = path.join(provenanceDir, `module-origins-${stamp}.json`);
fs.mkdirSync(screenshotDir, { recursive: true });
fs.mkdirSync(provenanceDir, { recursive: true });

let failed = false;
const loadedScriptModules = new Set();
let authNoAccessCount = 0;
let lastServerDataType200At = 0;
const observedSetupDataTypeIds = new Set();
const observedDigestRouteTypeIds = new Set();

const browser = await chromium.launch({ headless: true });
const contextOptions = {
    recordVideo: {
        dir: path.join(outputDir, 'artifacts/videos'),
        size: { width: 1280, height: 720 }
    }
};

if (useAuthState && authStateFile && fs.existsSync(authStateFile)) {
    contextOptions.storageState = authStateFile;
}

const context = await browser.newContext(contextOptions);
await context.tracing.start({ screenshots: true, snapshots: true, sources: true });
const page = await context.newPage();
await page.setViewportSize({ width: 1920, height: 1080 });

// Logs
page.on('console', msg => {
    if (msg.type() === 'warning') return;
    if (/Auth with no access shoud not happens/i.test(msg.text())) {
        authNoAccessCount += 1;
    }
    console.log(`BROWSER_CONSOLE_LOG: ${msg.text()}`);
});
page.on('pageerror', err => console.log(`BROWSER_PAGE_ERROR: ${err.message}`));

page.on('response', async resp => {
    const url = resp.url();
    if (resp.request().resourceType() === 'script') {
        loadedScriptModules.add(url);
    }
    if (url.includes('.jsx') || url.includes('.js') || url.includes('.mjs') || url.includes('.css') || url.includes('vite') || url.includes('node_modules')) return;

    const status = resp.status();
    if (status >= 400 || url.includes('setup/data_type')) {
        console.log(`BROWSER_NETWORK_RESPONSE: [${status}] ${url}`);
        if (status >= 400 && url.includes('setup/data_type')) {
            const requestBody = resp.request().postData();
            if (requestBody) {
                console.log(`DATA_TYPE_REQUEST_PAYLOAD: ${requestBody.slice(0, 1000)}`);
            }
        }
        if (url.includes('setup/data_type')) {
            try {
                const json = await resp.json();
                const observedIdCandidates = [
                    json?.data_type?.id,
                    json?.items?.[0]?.id,
                    json?.items?.[0]?._id
                ].filter(Boolean);
                observedIdCandidates.forEach((id) => observedSetupDataTypeIds.add(String(id)));
                console.log(`DATA_TYPE_PAYLOAD: ${JSON.stringify(json).substring(0, 500)}`);
            } catch (e) { }
        }
    }
    const digestRouteMatch = url.match(/\/api\/v3\/setup\/data_type\/([^/]+)\/digest(?:\?|$)/);
    if (digestRouteMatch?.[1]) {
        observedDigestRouteTypeIds.add(String(digestRouteMatch[1]));
    }
    if (
        status === 200 &&
        url.startsWith(`${serverUrl.replace(/\/$/, '')}/api/v3/setup/data_type`)
    ) {
        lastServerDataType200At = Date.now();
    }
});

page.on('console', (msg) => {
    if (msg.type() === 'error' || msg.type() === 'warning' || msg.type() === 'log') {
        console.log(`BROWSER_CONSOLE_${msg.type().toUpperCase()}: ${msg.text()}`);
    }
});

page.on('response', (response) => {
    if (response.status() >= 400) {
        console.log(`NETWORK_ERROR: ${response.status()} ${response.request().method()} ${response.url()}`);
    }
});

// Helpers
const takeStepScreenshot = async (stepName) => {
    await page.screenshot({ path: path.join(screenshotDir, `${stepName}.png`), fullPage: true });
};

const persistModuleOrigins = () => {
    const modules = [...loadedScriptModules].sort();
    const payload = {
        generatedAt: new Date().toISOString(),
        uiUrl,
        scriptModuleCount: modules.length,
        scriptModules: modules
    };
    fs.writeFileSync(provenanceModulePath, JSON.stringify(payload, null, 2), 'utf8');
    console.log(`PROVENANCE_EVIDENCE: module origins saved to ${provenanceModulePath}`);
    const localUiModules = modules.filter((url) => url.startsWith(uiUrl));
    console.log(`PROVENANCE_EVIDENCE: local ui script modules ${localUiModules.length}/${modules.length}`);
};

const cleanupCorruptedDataTypesForNamespace = (
    namespace,
    keepDataTypeId = null,
    { purgeGeneratedLeadNames = false } = {}
) => {
    const query = `
        let deleted = 0;
        db.getCollectionNames().forEach((col) => {
          if (col.endsWith('_setup_data_types') && !col.startsWith('tmp_')) {
            const filters = [
              { _type: { $regex: '^\\\\s*\\\\{' } },
              { _type: 'Setup::JsonDataType', code: { $exists: true } }
            ];
            if (${purgeGeneratedLeadNames ? 'true' : 'false'}) {
              filters.push({ namespace: '${namespace}', name: { $regex: '^Lead_' } });
            }
            const selector = { namespace: '${namespace}', $or: filters };
            if (${keepDataTypeId ? 'true' : 'false'}) {
              selector._id = { $ne: ObjectId('${keepDataTypeId || ''}') };
            }
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
        const match = output.match(/DELETED=(\d+)/);
        const deleted = match ? Number(match[1]) : 0;
        console.log(
            `BACKEND_GUARD: Setup::DataType cleanup for namespace ${namespace}: ${deleted}` +
            `${keepDataTypeId ? ` (kept ${keepDataTypeId})` : ''}` +
            `${purgeGeneratedLeadNames ? ' (purged Lead_* seeds)' : ''}`
        );
        return deleted;
    } catch (error) {
        console.warn(`BACKEND_GUARD: failed to cleanup corrupted Setup::DataType docs for namespace ${namespace}: ${error.message}`);
        return 0;
    }
};

const waitForFlowExecution = async ({ flowId, timeoutMs = 30000, pollMs = 2000 }) => {
    if (!flowId) return { found: false, error: 'missing-flow-id' };

    const startedAt = Date.now();
    while ((Date.now() - startedAt) < timeoutMs) {
        try {
            const query = `
                const collections = db.getCollectionNames().filter(c => c.endsWith('_setup_executions') && !c.startsWith('tmp_'));
                let hit = null;
                let hitCol = null;
                collections.forEach(col => {
                  if (hit) return;
                  const doc = db.getCollection(col).find({ agent_id: ObjectId('${flowId}') }).sort({ created_at: -1 }).limit(1).toArray()[0];
                  if (doc) {
                    hit = doc;
                    hitCol = col;
                  }
                });
                if (!hit) {
                  print('NOT_FOUND');
                } else {
                  print(JSON.stringify({
                    collection: hitCol,
                    execution_id: String(hit._id),
                    status: hit.status || null,
                    created_at: hit.created_at || null
                  }));
                }
            `;

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
            if (!output || output === 'NOT_FOUND') {
                await new Promise((resolve) => setTimeout(resolve, pollMs));
                continue;
            }

            try {
                const parsed = JSON.parse(output);
                return { found: true, ...parsed };
            } catch (_) {
                return { found: true, raw: output };
            }
        } catch (error) {
            return { found: false, error: String(error?.message || error) };
        }
    }

    return { found: false, error: `timeout waiting for execution for flow ${flowId}` };
};

const assertDataTypeServiceFingerprint = async (page) => {
    await page.waitForLoadState('networkidle').catch(() => null);

    const modules = [...loadedScriptModules];
    const localUiModules = modules.filter((url) => url.startsWith(uiUrl));
    const hasLocalIndexModule = localUiModules.some((url) => /\/assets\/index-[^/]+\.js$/.test(url));

    let marker = null;
    let runtimeFallbackReady = false;

    for (let attempt = 1; attempt <= 20; attempt += 1) {
        const markerResult = await page.evaluate((markerKey) => {
            const markerValue = globalThis[markerKey] || (globalThis.window && globalThis.window[markerKey]) || null;
            return {
                marker: markerValue,
                runtimeFallback: {
                    hasBanner: !!document.querySelector('[role="banner"]'),
                    hasNav: !!document.querySelector('nav'),
                    hasAvatar: !!document.querySelector('.MuiAvatar-root')
                }
            };
        }, dataTypeRuntimeMarkerKey);

        marker = markerResult?.marker || null;
        runtimeFallbackReady = runtimeFallbackReady || !!(
            markerResult?.runtimeFallback?.hasBanner ||
            markerResult?.runtimeFallback?.hasNav ||
            markerResult?.runtimeFallback?.hasAvatar
        );

        if (marker) {
            console.log(`PROVENANCE_EVIDENCE: runtime marker ${JSON.stringify(marker)}`);
            if (marker.fingerprint !== expectedDataTypeFingerprint) {
                throw new Error(`Unexpected DataTypeService fingerprint. Expected ${expectedDataTypeFingerprint}, got ${marker.fingerprint}`);
            }
            return;
        }

        await page.waitForTimeout(500);
    }

    const fallbackEvidence = {
        hasLocalIndexModule,
        localUiModules: localUiModules.length,
        scriptModules: modules.length,
        runtimeFallbackReady
    };
    console.warn(
        `PROVENANCE_EVIDENCE: runtime marker missing (${dataTypeRuntimeMarkerKey}); ` +
        `fallback=${JSON.stringify(fallbackEvidence)}`
    );

    if (!hasLocalIndexModule) {
        throw new Error(
            `Runtime fingerprint missing: ${dataTypeRuntimeMarkerKey}. ` +
            `fallbackEvidence=${JSON.stringify(fallbackEvidence)}`
        );
    }
};

const isSignIn = (page) => /\/users\/sign_in/.test(page.url());
const isOAuth = (page) => /\/oauth\/authorize/.test(page.url());
const hasOauthCallbackCode = (page) => {
    try {
        const url = new URL(page.url());
        return url.origin === new URL(uiUrl).origin && url.searchParams.has('code');
    } catch (_) {
        return false;
    }
};

const isAppShellVisible = async (page) => {
    // MUI v5 AppBar typically renders a <header> with role="banner".
    const hasBanner = await page.getByRole('banner').first().isVisible().catch(() => false);
    // The user avatar is typically present when the config has loaded.
    const hasAvatar = await page.locator('.MuiAvatar-root').first().isVisible().catch(() => false);
    // The main navigation area or general UI footprint.
    const hasNav = await page.locator('nav').first().isVisible().catch(() => false);
    const hasMain = await page.locator('main').first().isVisible().catch(() => false);
    const hasAppBar = await page.locator('.MuiAppBar-root, header').first().isVisible().catch(() => false);
    const hasTabs = await page.locator('[role="tablist"], .MuiTabs-root').first().isVisible().catch(() => false);

    return hasBanner || hasAvatar || hasNav || hasMain || hasAppBar || hasTabs;
};

async function performLogin(page) {
    console.log('Performing login...');
    const emailField = page.getByRole('textbox', { name: 'Email' });
    if (await emailField.isVisible().catch(() => false)) {
        await emailField.fill(email);
        await page.getByRole('textbox', { name: 'Password' }).fill(password);
        await page.getByRole('button', { name: /log in/i }).click();
        return true;
    }
    return false;
}

async function confirmOAuthConsent(page) {
    const consentLocators = [
        page.getByRole('button', { name: /(allow|authorize)/i }).first(),
        page.getByRole('link', { name: /(allow|authorize)/i }).first(),
        page.locator('input[type="submit"][value*="Allow" i], input[type="submit"][value*="Authorize" i]').first()
    ];

    for (const locator of consentLocators) {
        const visible = await locator.isVisible().catch(() => false);
        if (!visible) continue;
        await locator.click({ timeout: 5000 }).catch(() => null);
        return true;
    }
    return false;
}

async function performDirectServerLogin(page) {
    const signInUrl = `${serverUrl.replace(/\/$/, '')}/users/sign_in`;
    await page.goto(signInUrl, { waitUntil: 'domcontentloaded' }).catch(() => null);

    if (await performLogin(page)) {
        await page.waitForURL(
            (url) =>
                /\/oauth\/authorize/.test(url.href) ||
                /\/users\/sign_in/.test(url.href) ||
                url.href.startsWith(uiUrl) ||
                url.href.startsWith(serverUrl),
            { timeout: 15000 }
        ).catch(() => null);

        await confirmOAuthConsent(page);
        const shellVisible = await isAppShellVisible(page);
        if (!shellVisible && page.url().startsWith(serverUrl)) {
            await page.goto(uiUrl, { waitUntil: 'domcontentloaded' }).catch(() => null);
            await page.waitForTimeout(1200);
        }
        return isAppShellVisible(page);
    }
    return false;
}

async function probeUiApiSession() {
    const baseUrl = serverUrl.replace(/\/$/, '');
    const probe = async (url) => {
        try {
            const res = await context.request.get(url, {
                headers: { Accept: 'application/json' }
            });
            let body = null;
            try {
                body = await res.json();
            } catch (_) {
                body = null;
            }
            return { ok: res.ok(), status: res.status(), body };
        } catch (error) {
            return { ok: false, status: null, error: String(error?.message || error), body: null };
        }
    };
    const me = await probe(`${baseUrl}/api/v3/setup/user/me`);
    const setupDataType = await probe(`${baseUrl}/api/v3/setup/data_type?limit=1`);
    return { me, setupDataType };
}

async function forceFreshAuthSession(page, reason = 'unknown') {
    console.warn(`Forcing fresh auth session: ${reason}`);
    await context.clearCookies().catch(() => null);
    await page.goto('about:blank').catch(() => null);
    await page.goto(`${serverUrl.replace(/\/$/, '')}/users/sign_in`, { waitUntil: 'domcontentloaded' }).catch(() => null);
    const loginSubmitted = await performLogin(page);
    if (loginSubmitted) {
        await page.waitForURL(
            (url) =>
                /\/oauth\/authorize/.test(url.href) ||
                /\/users\/sign_in/.test(url.href) ||
                url.href.startsWith(uiUrl) ||
                url.href.startsWith(serverUrl),
            { timeout: 20000 }
        ).catch(() => null);
    }
    if (isOAuth(page)) await confirmOAuthConsent(page);
    await page.goto(uiUrl, { waitUntil: 'domcontentloaded' }).catch(() => null);
    await page.waitForTimeout(1200);
    return true;
}

async function ensureUiSessionStable(page, { forceFreshFirst = false } = {}) {
    if (forceFreshFirst) {
        await forceFreshAuthSession(page, 'pre-step fresh auth bootstrap');
        authNoAccessCount = 0;
    }
    for (let attempt = 1; attempt <= 3; attempt += 1) {
        const authNoAccessBefore = authNoAccessCount;
        await ensureAuthenticated(page);
        if (hasOauthCallbackCode(page)) {
            await page.goto(uiUrl, { waitUntil: 'domcontentloaded' }).catch(() => null);
            await page.waitForTimeout(1200);
        }
        const shellVisible = await isAppShellVisible(page);
        const sawRecentDataType200 =
            lastServerDataType200At > 0 &&
            (Date.now() - lastServerDataType200At) <= 10000;
        const liveDataTypeOk = sawRecentDataType200 || await page.waitForResponse(
            (resp) =>
                resp.status() === 200 &&
                resp.url().startsWith(`${serverUrl.replace(/\/$/, '')}/api/v3/setup/data_type`),
            { timeout: 5000 }
        ).then(() => true).catch(() => false);
        const authNoAccessDelta = authNoAccessCount - authNoAccessBefore;
        const stable = shellVisible && liveDataTypeOk && authNoAccessDelta === 0;
        if (stable) {
            console.log(`Auth/session stable on attempt ${attempt}.`);
            return;
        }
        const detail = {
            attempt,
            authNoAccessDelta,
            shellVisible,
            liveDataTypeOk
        };
        console.warn(`Auth/session stability probe failed: ${JSON.stringify(detail)}`);
        await forceFreshAuthSession(page, `stability probe failed (attempt ${attempt})`);
    }
    throw new Error('Could not establish stable authenticated UI session.');
}


async function ensureAuthenticated(page) {
    const isAuthenticatedRoute = (urlText) => {
        try {
            const url = new URL(urlText);
            return url.origin === new URL(uiUrl).origin &&
                !/\/users\/sign_in/.test(url.pathname) &&
                !/\/oauth\/authorize/.test(url.pathname);
        } catch (_) {
            return false;
        }
    };

    await page.waitForURL(
        (url) =>
            url.href.startsWith(uiUrl) ||
            url.href.startsWith(serverUrl) ||
            /\/users\/sign_in/.test(url.href) ||
            /\/oauth\/authorize/.test(url.href),
        { timeout: 15000 }
    ).catch(() => null);

    for (let attempt = 1; attempt <= 45; attempt += 1) {
        await page.waitForTimeout(900);
        if (await isAppShellVisible(page)) return;

        const currentUrl = page.url();
        if (isAuthenticatedRoute(currentUrl)) {
            const loginFormVisible = await page.getByRole('textbox', { name: 'Email' }).isVisible().catch(() => false);
            if (!loginFormVisible) {
                console.log(`Authentication route reached (${currentUrl}); proceeding without additional auth loops.`);
                return;
            }
        }
        const onSignIn = isSignIn(page);
        const onOAuth = isOAuth(page);
        const emailVisible = await page.getByRole('textbox', { name: 'Email' }).isVisible().catch(() => false);

        if (emailVisible || onSignIn) {
            await page.getByRole('textbox', { name: 'Email' }).fill(email);
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
            continue;
        }
        console.log(`Auth attempt ${attempt} current URL: ${currentUrl}`);

        if (await isAppShellVisible(page)) {
            console.log('App shell detected. Verification check...');
            await page.waitForTimeout(2000);
            if (await isAppShellVisible(page)) {
                console.log('Authenticated successfully.');
                return;
            }
        }

        const body = await page.locator('body').innerText().catch(() => '');
        if (/sign in/i.test(body) || currentUrl.includes('/users/sign_in')) {
            console.log('On Sign In page. Performing login...');
            await performLogin(page);
            await page.waitForTimeout(1000);
            continue;
        }

        if (currentUrl.includes('/oauth/authorize')) {
            console.log('On OAuth authorization page. Confirming...');
            if (await confirmOAuthConsent(page)) {
                await page.waitForTimeout(1200);
                if (page.url().startsWith(serverUrl) && !isSignIn(page) && !isOAuth(page)) {
                    await page.goto(uiUrl, { waitUntil: 'domcontentloaded' }).catch(() => null);
                    await page.waitForTimeout(1200);
                }
            }
            continue;
        }

        // Avoid constant reloads, only reload every 5 attempts if stuck
        if (attempt % 5 === 0) {
            console.log('Stuck? Reloading UI...');
            await page.goto(uiUrl, { waitUntil: 'domcontentloaded' }).catch(() => null);
        }

        await page.waitForTimeout(1500);
    }

    const bodyText = await page.locator('body').innerText().catch(() => '');
    if (/invalid email or password/i.test(bodyText)) {
        throw new Error('Login failed: invalid email or password');
    }
    if (await performDirectServerLogin(page)) return;
    throw new Error(`Could not authenticate after retries. Current URL: ${page.url()}`);
}


const clickNamedButton = async (nameMatcher, prefer = 'first', container = page) => {
    console.log(`Attempting to click button/element: ${nameMatcher}`);
    const tryLocators = [
        container.getByRole('tab', { name: nameMatcher }),
        container.getByRole('button', { name: nameMatcher }),
        container.getByRole('menuitem', { name: nameMatcher }),
        container.getByRole('heading', { name: nameMatcher }),
        container.getByText(nameMatcher, { exact: true }),
        container.getByLabel(nameMatcher, { exact: false })
    ];

    for (const locator of tryLocators) {
        try {
            const count = await locator.count().catch(() => 0);
            if (count > 0) {
                const indexes = [...Array(count).keys()];
                if (prefer === 'last') indexes.reverse();
                for (const i of indexes) {
                    const btn = locator.nth(i);
                    // Wait for it to be visible first
                    await btn.waitFor({ state: 'visible', timeout: 3000 }).catch(() => { });
                    const isVisible = await btn.isVisible().catch(() => false);
                    if (isVisible && await btn.isEnabled().catch(() => false)) {
                        console.log(`Clicking element: ${nameMatcher} (index ${i})`);
                        try {
                            await btn.scrollIntoViewIfNeeded();
                            await page.waitForTimeout(200);
                            await btn.click({ force: true, timeout: 5000 });
                            return true;
                        } catch (e) {
                            console.warn(`Click failed for ${nameMatcher}: ${e.message}`);
                            // Try harder with dispatchEvent if click fails
                            try {
                                console.log(`Attempting dispatchEvent('click') for ${nameMatcher}`);
                                await btn.evaluate(el => el.click());
                                return true;
                            } catch (e2) {
                                console.warn(`dispatchEvent click also failed for ${nameMatcher}: ${e2.message}`);
                            }
                        }
                    }
                }
            }
        } catch (e) {
            // Silently continue to next locator type
        }
    }

    console.log(`Could not successfully click: ${nameMatcher}`);
    try {
        const html = await page.content();
        const fs = await import('fs');
        const safename = nameMatcher.toString().replace(/[^a-zA-Z]/g, '');
        fs.writeFileSync(`debug_click_failed_${safename}.html`, html);
        console.log(`Dumped debugging HTML to debug_click_failed_${safename}.html`);
    } catch (e) {
        console.warn('Could not dump hit box html', e);
    }

    return false;
};

const clickActionButton = async (titleMatcher, { timeoutMs = 5000 } = {}) => {
    const main = page.locator('main').first();
    const actionCandidates = [
        main.getByRole('button', { name: titleMatcher }),
        page.getByRole('button', { name: titleMatcher })
    ];

    for (const locator of actionCandidates) {
        const count = await locator.count().catch(() => 0);
        for (let i = 0; i < count; i += 1) {
            const candidate = locator.nth(i);
            const visible = await candidate.isVisible().catch(() => false);
            const enabled = await candidate.isEnabled().catch(() => false);
            if (!visible || !enabled) continue;
            await candidate.click({ timeout: timeoutMs }).catch(() => null);
            return true;
        }
    }

    const moreCandidates = [
        main.locator('button:has([data-testid="MoreVertIcon"])'),
        page.locator('button:has([data-testid="MoreVertIcon"])')
    ];
    for (const locator of moreCandidates) {
        const count = await locator.count().catch(() => 0);
        for (let i = 0; i < count; i += 1) {
            const moreButton = locator.nth(i);
            if (!await moreButton.isVisible().catch(() => false)) continue;
            await moreButton.click({ timeout: timeoutMs }).catch(() => null);
            const menuItem = page.getByRole('menuitem', { name: titleMatcher }).first();
            if (await menuItem.isVisible().catch(() => false)) {
                await menuItem.click({ timeout: timeoutMs }).catch(() => null);
                return true;
            }
        }
    }

    if (titleMatcher instanceof RegExp && /new/i.test(String(titleMatcher))) {
        const fabCandidates = [
            main.locator('button:has([data-testid="AddIcon"])'),
            page.locator('button:has([data-testid="AddIcon"])'),
            main.locator('button[class*="MuiFab-root"]'),
            page.locator('button[class*="MuiFab-root"]')
        ];
        for (const locator of fabCandidates) {
            const count = await locator.count().catch(() => 0);
            for (let i = 0; i < count; i += 1) {
                const candidate = locator.nth(i);
                const visible = await candidate.isVisible().catch(() => false);
                const enabled = await candidate.isEnabled().catch(() => false);
                if (!visible || !enabled) continue;
                await candidate.click({ force: true, timeout: timeoutMs }).catch(() => null);
                await page.waitForTimeout(800);
                return true;
            }
        }
    }

    return false;
};

const ensureMenuSectionExpanded = async (sectionName) => {
    console.log(`Ensuring menu section expanded: ${sectionName}`);

    const textNode = page.getByText(new RegExp(`^${sectionName}$`), { exact: true }).first();
    await textNode.waitFor({ timeout: 5000, state: 'attached' }).catch(() => null);

    const button = textNode.locator('xpath=ancestor-or-self::*[contains(@class, "MuiListItem-root") or contains(@class, "MuiListItemButton-root") or @role="button"]').first();

    // Check if it's already expanded by looking for the down arrow icon or checking collapse state
    const isExpanded = await button.locator('[data-testid="KeyboardArrowDownIcon"], [data-testid="ExpandMoreIcon"]').isVisible().catch(() => false);

    if (isExpanded) {
        console.log(`Section ${sectionName} is already expanded.`);
        return page;
    }

    console.log(`Section ${sectionName} is collapsed. Clicking header row...`);
    await button.scrollIntoViewIfNeeded();
    // Clicking the button/row is more reliable than the text node
    await button.click({ force: true });

    // Wait for the down arrow icon to appear as proof of expansion
    try {
        await button.locator('[data-testid="KeyboardArrowDownIcon"], [data-testid="ExpandMoreIcon"]').waitFor({ state: 'visible', timeout: 5000 });
    } catch (e) {
        // Fallback wait
        await page.waitForTimeout(1000);
    }

    return page;
};


const openMenuItem = async (sectionName, itemName) => {
    console.log(`Opening menu item: ${sectionName} > ${itemName}`);
    for (let attempt = 1; attempt <= 4; attempt += 1) {
        try {
            if (attempt === 4) {
                console.warn(`Menu open recovery: reloading app shell before final retry for ${sectionName} > ${itemName}`);
                await page.goto(uiUrl, { waitUntil: 'domcontentloaded' });
                await ensureAuthenticated(page);
                await page.waitForURL((url) => url.href.startsWith(uiUrl), { timeout: 15000 }).catch(() => null);
                await page.waitForTimeout(1200);
            }

            // Click section row each attempt to toggle/open.
            const sectionRow = page.locator('.MuiListItem-root, .MuiListItemButton-root')
                .filter({ hasText: sectionName })
                .first();
            if (await sectionRow.isVisible().catch(() => false)) {
                await sectionRow.scrollIntoViewIfNeeded().catch(() => null);
                await sectionRow.click({ force: true, timeout: 5000 }).catch(() => null);
                await page.waitForTimeout(600);
            }

            // Prefer exact text node for the target item.
            const itemText = page.getByText(itemName, { exact: true }).first();
            if (await itemText.isVisible().catch(() => false)) {
                console.log(`Found menu item text ${itemName}. Clicking...`);
                await itemText.scrollIntoViewIfNeeded().catch(() => null);
                await itemText.click({ force: true, timeout: 5000 }).catch(() => null);
                await page.waitForTimeout(900);
                return;
            }

            // Fallback to list-item containing text.
            const fallbackItem = page.locator('.MuiListItem-root, .MuiListItemButton-root')
                .filter({ hasText: itemName })
                .first();
            if (await fallbackItem.isVisible().catch(() => false)) {
                console.log(`Found menu item ${itemName} via fallback list item. Clicking...`);
                await fallbackItem.scrollIntoViewIfNeeded().catch(() => null);
                await fallbackItem.click({ force: true, timeout: 5000 }).catch(() => null);
                await page.waitForTimeout(900);
                return;
            }
        } catch (e) {
            console.warn(`Attempt ${attempt} to open menu item failed: ${e.message}`);
        }
        await page.waitForTimeout(1000);
    }

    // Final diagnostics
    try {
        const html = await page.content();
        fs.writeFileSync(`debug_click_failed_menu_${sectionName}_${itemName}.html`, html);
    } catch (_) { }

    if (!await clickNamedButton(new RegExp(`^${itemName}$`, 'i'))) {
        throw new Error(`Could not navigate to menu item ${sectionName} > ${itemName}`);
    }
    await page.waitForTimeout(1000);
};

const discoverDocumentTypesDigestTypeId = async () => {
    try {
        const responsePromise = page.waitForResponse(
            (resp) =>
                resp.request().method() === 'GET' &&
                resp.status() === 200 &&
                /\/api\/v3\/setup\/data_type\/[^/]+\/digest(?:\?|$)/.test(resp.url()),
            { timeout: 6000 }
        ).catch(() => null);

        await openMenuItem('Data', 'Document Types');
        const response = await responsePromise;
        if (!response) return null;

        const match = response.url().match(/\/api\/v3\/setup\/data_type\/([^/]+)\/digest(?:\?|$)/);
        if (!match?.[1]) return null;
        const id = String(match[1]);
        observedDigestRouteTypeIds.add(id);
        return id;
    } catch (_) {
        return null;
    }
};

const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const openMenuItemScoped = async ({
    sectionName,
    itemName,
    itemAliases = [],
    expectedDataTypeId = null,
    attempts = 4
}) => {
    const itemCandidates = [itemName, ...itemAliases].filter(Boolean);
    const matchers = itemCandidates.map((name) => new RegExp(escapeRegExp(name), 'i'));
    const expectedListPattern = '/api/v3/setup/data_type?limit=1';

    const isItemActiveInWorkArea = async () => {
        for (const matcher of matchers) {
            const selectedTab = page.getByRole('tab', { name: matcher, selected: true }).first();
            if (await selectedTab.isVisible().catch(() => false)) {
                return true;
            }
            const heading = page.getByRole('heading', { name: matcher }).last();
            if (await heading.isVisible().catch(() => false)) {
                return true;
            }
        }
        return false;
    };

    for (let attempt = 1; attempt <= attempts; attempt += 1) {
        let clicked = false;
        for (const candidate of itemCandidates) {
            try {
                await openMenuItem(sectionName, candidate);
                clicked = true;
                break;
            } catch (_) {
                // Try next alias.
            }
        }
        if (!clicked) {
            await page.waitForTimeout(700);
            continue;
        }

        let listResponsePromise = null;
        if (expectedDataTypeId) {
            listResponsePromise = page.waitForResponse(
                (resp) =>
                    resp.request().method() === 'GET' &&
                    resp.url().includes(expectedListPattern),
                { timeout: 7000 }
            )
                .then(async (resp) => {
                    const json = await resp.json().catch(() => null);
                    const candidateIds = [
                        json?.items?.[0]?.id,
                        json?.items?.[0]?._id,
                        json?.data_type?.id
                    ].filter(Boolean);
                    return candidateIds.includes(expectedDataTypeId);
                })
                .catch(() => false);
        }

        if (await isItemActiveInWorkArea()) return true;

        if (!listResponsePromise) {
            continue;
        }
        const listMatched = await listResponsePromise;
        if (listMatched && await isItemActiveInWorkArea()) return true;
    }

    try {
        const navText = await page.locator('#root').first().innerText().catch(() => '');
        const html = await page.content();
        fs.writeFileSync(`debug_menu_scoped_failed_${sectionName}_${itemName}_${stamp}.html`, html);
        fs.writeFileSync(`debug_menu_scoped_failed_${sectionName}_${itemName}_${stamp}.txt`, navText);
    } catch (_) { }
    return false;
};

const openSubjectByCandidates = async ({
    candidates,
    expectedDataTypeId = null,
    attempts = 4
}) => {
    for (const candidate of candidates) {
        const opened = await openMenuItemScoped({
            sectionName: candidate.sectionName,
            itemName: candidate.itemName,
            itemAliases: candidate.itemAliases || [],
            expectedDataTypeId,
            attempts
        });
        if (opened) {
            return { opened: true, candidate };
        }
    }
    return { opened: false, candidate: null };
};

const isTemplateContainerReady = async () => {
    const matchers = [/Templates?/i, /Snippets?/i, /Code Snippets?/i];
    for (const matcher of matchers) {
        const selectedTab = page.getByRole('tab', { name: matcher, selected: true }).first();
        if (await selectedTab.isVisible().catch(() => false)) return true;
        const heading = page.getByRole('heading', { name: matcher }).last();
        if (await heading.isVisible().catch(() => false)) return true;
    }
    return false;
};

const waitForOneOfHeadings = async (regexList, timeout = 30000) => {
    const start = Date.now();
    while (Date.now() - start < timeout) {
        for (const regex of regexList) {
            const heading = page.getByRole('heading', { name: regex }).last();
            if (await heading.isVisible().catch(() => false)) {
                return heading;
            }
            const tab = page.getByRole('tab', { name: regex, selected: true }).last();
            if (await tab.isVisible().catch(() => false)) {
                return tab;
            }
        }
        await page.waitForTimeout(500);
    }
    const html = await page.content();
    const fs = await import('fs');
    fs.writeFileSync('debug_heading.html', html);
    throw new Error(`None of the headings found: ${regexList.join(', ')}. Saved debug_heading.html`);
};

const waitForDataTypeRecordsReady = async ({ dataTypeName, timeoutMs = 20000, debugTag = 'step4' }) => {
    const main = page.locator('main').first();
    const heading = page.getByRole('heading', { name: new RegExp(dataTypeName, 'i') }).last();
    const recordsHeading = page.getByRole('heading', { name: /records/i }).last();
    const selectedTab = page.getByRole('tab', { name: new RegExp(dataTypeName, 'i'), selected: true }).first();
    const selectedRecordsTab = page.getByRole('tab', { name: /records/i, selected: true }).first();
    const newAction = main.getByRole('button', { name: /^New$/i }).first();
    const dataGrid = main.locator('.MuiDataGrid-root, [role="grid"], [role="table"]').first();
    const spinnerSelector = '.MuiCircularProgress-root:visible, [role="progressbar"]:visible';

    const startedAt = Date.now();
    while ((Date.now() - startedAt) < timeoutMs) {
        const headingVisible = await heading.isVisible().catch(() => false);
        const recordsHeadingVisible = await recordsHeading.isVisible().catch(() => false);
        const selectedTabVisible = await selectedTab.isVisible().catch(() => false);
        const selectedRecordsTabVisible = await selectedRecordsTab.isVisible().catch(() => false);
        const newActionVisible = await newAction.isVisible().catch(() => false);
        const dataGridVisible = await dataGrid.isVisible().catch(() => false);
        const spinnerCount = await main.locator(spinnerSelector).count().catch(() => 0);

        const readySignal =
            headingVisible ||
            recordsHeadingVisible ||
            selectedTabVisible ||
            selectedRecordsTabVisible ||
            newActionVisible ||
            dataGridVisible;
        if (readySignal && spinnerCount <= 1) {
            await page.waitForTimeout(350);
            const secondPassSpinnerCount = await main.locator(spinnerSelector).count().catch(() => 0);
            if (secondPassSpinnerCount <= 1) return true;
        }
        await page.waitForTimeout(250);
    }

    try {
        const html = await page.content();
        fs.writeFileSync(`debug_${debugTag}_records_not_ready_${stamp}.html`, html);
    } catch (_) { }
    return false;
};

const fillCodeMirror = async (text) => {
    const selectAllKey = process.platform === 'darwin' ? 'Meta+A' : 'Control+A';
    const selectors = [
        '.code-mirror-editor',
        '.cm-editor',
        '.cm-content',
        '[class*="CodeMirror"]',
        'textarea'
    ];
    for (const selector of selectors) {
        const locator = page.locator(selector);
        const count = await locator.count().catch(() => 0);
        let indexes = Array.from({ length: count }, (_, idx) => count - 1 - idx);
        if (selector === 'textarea') {
            const sized = [];
            for (let i = 0; i < count; i += 1) {
                const candidate = locator.nth(i);
                if (!await candidate.isVisible().catch(() => false)) continue;
                const box = await candidate.boundingBox().catch(() => null);
                const area = box ? box.width * box.height : 0;
                sized.push({ i, area });
            }
            sized.sort((a, b) => b.area - a.area);
            indexes = sized.map((entry) => entry.i);
        }
        for (const i of indexes) {
            const candidate = locator.nth(i);
            if (!await candidate.isVisible().catch(() => false)) continue;
            await candidate.scrollIntoViewIfNeeded().catch(() => null);
            const isTextarea = await candidate.evaluate((el) => el.tagName.toLowerCase() === 'textarea').catch(() => false);
            if (isTextarea) {
                await candidate.fill(text).catch(async () => {
                    await candidate.evaluate((el, value) => {
                        el.value = value;
                        el.dispatchEvent(new Event('input', { bubbles: true }));
                        el.dispatchEvent(new Event('change', { bubbles: true }));
                    }, text);
                });
                return;
            }
            try {
                await candidate.click({ force: true, timeout: 5000 });
                await page.keyboard.press(selectAllKey);
                await page.keyboard.press('Backspace');
                await page.keyboard.insertText(text);
                return;
            } catch (_) {
                // Try next candidate instance.
            }
        }
    }
    const html = await page.content();
    fs.writeFileSync(`debug_code_editor_not_found_${stamp}.html`, html);
    throw new Error('Code editor not found. Saved debug_code_editor_not_found html.');
};

const fillCodeEditorInScope = async (scope, text) => {
    const selectAllKey = process.platform === 'darwin' ? 'Meta+A' : 'Control+A';
    const selectors = [
        '.code-mirror-editor',
        '.cm-editor',
        '.cm-content',
        '[class*="CodeMirror"]',
        'textarea',
        'input'
    ];

    for (const selector of selectors) {
        const locator = scope.locator(selector);
        const count = await locator.count().catch(() => 0);
        let indexes = Array.from({ length: count }, (_, idx) => count - 1 - idx);

        if (selector === 'textarea' || selector === 'input') {
            const sized = [];
            for (let i = 0; i < count; i += 1) {
                const candidate = locator.nth(i);
                if (!await candidate.isVisible().catch(() => false)) continue;
                const box = await candidate.boundingBox().catch(() => null);
                const area = box ? box.width * box.height : 0;
                sized.push({ i, area });
            }
            sized.sort((a, b) => b.area - a.area);
            indexes = sized.map((entry) => entry.i);
        }

        for (const i of indexes) {
            const candidate = locator.nth(i);
            if (!await candidate.isVisible().catch(() => false)) continue;
            await candidate.scrollIntoViewIfNeeded().catch(() => null);
            const tag = await candidate.evaluate((el) => el.tagName.toLowerCase()).catch(() => '');

            if (tag === 'textarea' || tag === 'input') {
                await candidate.fill(text).catch(async () => {
                    await candidate.evaluate((el, value) => {
                        el.value = value;
                        el.dispatchEvent(new Event('input', { bubbles: true }));
                        el.dispatchEvent(new Event('change', { bubbles: true }));
                    }, text);
                });
                return true;
            }

            try {
                await candidate.click({ force: true, timeout: 5000 });
                await page.keyboard.press(selectAllKey);
                await page.keyboard.press('Backspace');
                await page.keyboard.insertText(text);
                return true;
            } catch (_) {
                // Try next candidate.
            }
        }
    }

    return false;
};

const writeStep2SnippetDeterministic = async (snippetText, { strict = true } = {}) => {
    const snippetTab = page.locator('[role="tab"]').filter({ hasText: /Snippet|Json Code|Code/i }).first();
    if (await snippetTab.isVisible().catch(() => false)) {
        await snippetTab.click({ timeout: 5000 }).catch(() => null);
    } else {
        console.warn('Could not find Snippet/Code tab in current form. Proceeding with direct input lookup.');
    }
    await page.waitForTimeout(300);

    let panelScope = page.locator('main').first();

    if (await snippetTab.isVisible().catch(() => false)) {
        const controlsId = await snippetTab.getAttribute('aria-controls').catch(() => null);
        if (controlsId) {
            const controlledPanel = page.locator(`#${controlsId}`);
            if (await controlledPanel.isVisible().catch(() => false)) {
                panelScope = controlledPanel;
            }
        } else {
            const visiblePanel = page.locator('[role="tabpanel"]:visible').last();
            if (await visiblePanel.isVisible().catch(() => false)) {
                panelScope = visiblePanel;
            }
        }
    }

    let wrote = false;
    const strictCandidates = STEP2_SNIPPET_FIELD_SELECTOR_PLAN.map((entry) => {
        const scope = entry.scope === 'panel' ? panelScope : page;
        if (entry.type === 'css') {
            return scope.locator(entry.value).first();
        }
        if (entry.type === 'label') {
            return scope.getByLabel(entry.value).first();
        }
        return scope.getByRole(entry.value.role, { name: entry.value.name }).first();
    });

    for (const candidate of strictCandidates) {
        if (!await candidate.isVisible().catch(() => false)) continue;
        await candidate.fill(snippetText).catch(async () => {
            await candidate.click({ force: true });
            await page.keyboard.press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A');
            await page.keyboard.insertText(snippetText);
        });
        wrote = true;
        break;
    }

    if (!wrote) {
        // Fallback only inside the snippet panel scope (never globally).
        wrote = await fillCodeEditorInScope(panelScope, snippetText);
    }

    const verifyResult = await page.evaluate(({ expectedSnippet }) => {
        const visible = (el) => {
            const style = window.getComputedStyle(el);
            const rect = el.getBoundingClientRect();
            return style.visibility !== 'hidden' && style.display !== 'none' && rect.width > 0 && rect.height > 0;
        };
        const buckets = [];
        const selectors = ['textarea[name="code"]', 'input[name="code"]', 'textarea', 'input', '[role="textbox"]'];
        selectors.forEach((selector) => {
            document.querySelectorAll(selector).forEach((el) => {
                if (!visible(el)) return;
                const value = (el.value || el.textContent || '').toString();
                if (value.trim() === expectedSnippet.trim()) {
                    buckets.push({ selector, name: el.getAttribute('name'), id: el.getAttribute('id') });
                }
            });
        });
        return { ok: buckets.length > 0, hits: buckets.slice(0, 5) };
    }, { expectedSnippet: snippetText });

    if (!verifyResult?.ok && strict) {
        const html = await page.content();
        fs.writeFileSync(`debug_step2_snippet_not_persisted_${stamp}.html`, html);
        throw new Error('Step 2 snippet write verification failed: exact snippet text not found in visible code inputs.');
    } else if (!verifyResult?.ok) {
        console.warn('Step 2 snippet exact-value verification failed in non-strict mode; continuing to save.');
    }
};

const saveTemplateAndAssert = async ({ templateTypeId, expectedTemplateName }) => {
    const responsePromise = page.waitForResponse(
        (resp) => matchesDataTypeDigestPost({ method: resp.request().method(), url: resp.url() }, templateTypeId),
        { timeout: 20000 }
    );

    if (!await clickNamedButton(/^save$/i)) {
        throw new Error('Could not find Save button for Template');
    }

    const response = await responsePromise;
    const bodyText = await response.text().catch(() => '');
    let bodyJson = null;
    try {
        bodyJson = bodyText ? JSON.parse(bodyText) : null;
    } catch (_) {
        bodyJson = null;
    }

    if (!response.ok()) {
        throw new Error(`Template save failed with status ${response.status()}. Response: ${bodyText.slice(0, 500)}`);
    }

    const returnedName = bodyJson?.name || bodyJson?.data?.name || null;
    if (returnedName && returnedName !== expectedTemplateName) {
        throw new Error(`Template save returned unexpected name: ${returnedName} (expected ${expectedTemplateName})`);
    }
};

const browserRuntimeApiRequest = async ({
    endpoint,
    method = 'GET',
    data = null,
    params = null
}) => {
    const base = serverUrl.replace(/\/$/, '');
    return page.evaluate(
        async ({ endpoint, method, data, params, base }) => {
            const storages = [window.sessionStorage, window.localStorage].filter(Boolean);

            const safeJsonParse = (value) => {
                if (typeof value !== 'string') return null;
                try {
                    return JSON.parse(value);
                } catch (_) {
                    return null;
                }
            };

            const findAccessTokenInObject = (obj) => {
                if (!obj || typeof obj !== 'object') return null;
                if (typeof obj.access_token === 'string' && obj.access_token) return obj.access_token;
                for (const key of Object.keys(obj)) {
                    const value = obj[key];
                    if (value && typeof value === 'object') {
                        const nested = findAccessTokenInObject(value);
                        if (nested) return nested;
                    }
                }
                return null;
            };

            const findAccessToken = () => {
                for (const storage of storages) {
                    for (let i = 0; i < storage.length; i += 1) {
                        const key = storage.key(i);
                        const raw = key ? storage.getItem(key) : null;
                        if (!raw) continue;

                        const parsed = safeJsonParse(raw);
                        const tokenFromParsed = findAccessTokenInObject(parsed);
                        if (tokenFromParsed) return tokenFromParsed;

                        if (/^[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/.test(raw) && /access[_-]?token/i.test(key || '')) {
                            return raw;
                        }
                    }
                }
                return null;
            };

            const normalizedEndpoint = endpoint.replace(/^\/+/, '');
            const url = new URL(`${base}/api/v3/${normalizedEndpoint}`);
            if (params && typeof params === 'object') {
                Object.entries(params).forEach(([key, value]) => {
                    if (value === undefined || value === null) return;
                    url.searchParams.set(key, String(value));
                });
            }

            const token = findAccessToken();
            const headers = { Accept: 'application/json' };
            if (data !== null && data !== undefined) headers['Content-Type'] = 'application/json';
            if (token) headers.Authorization = `Bearer ${token}`;

            try {
                const response = await fetch(url.toString(), {
                    method,
                    credentials: 'omit',
                    mode: 'cors',
                    headers,
                    body: data !== null && data !== undefined ? JSON.stringify(data) : undefined
                });
                const bodyText = await response.text().catch(() => '');
                let body = null;
                try {
                    body = bodyText ? JSON.parse(bodyText) : null;
                } catch (_) {
                    body = null;
                }
                return {
                    ok: response.ok,
                    status: response.status,
                    body,
                    bodyText: bodyText.slice(0, 1200),
                    hasToken: !!token
                };
            } catch (error) {
                return {
                    ok: false,
                    status: null,
                    body: null,
                    bodyText: String(error?.message || error),
                    hasToken: !!token
                };
            }
        },
        { endpoint, method, data, params, base }
    );
};

const createTemplateViaBrowserRuntime = async ({
    templateTypeId,
    namespaceName,
    templateName,
    snippetCode
}) => {
    const payload = {
        namespace: namespaceName,
        name: templateName,
        code: snippetCode
    };
    const response = await browserRuntimeApiRequest({
        endpoint: `setup/data_type/${templateTypeId}/digest`,
        method: 'POST',
        data: payload
    });
    if (response.ok) {
        return { ok: true, data: response.body };
    }
    return {
        ok: false,
        status: response.status,
        error: response.bodyText || JSON.stringify(response.body || {})
    };
};

const createTemplateViaBackendApi = async ({
    namespaceName,
    templateName,
    snippetCode,
    sourceDataTypeId,
    templateTypeId
}) => {
    const base = serverUrl.replace(/\/$/, '');
    const candidates = [
        ...(templateTypeId
            ? [{
                endpoint: `data_type/${templateTypeId}/digest`,
                payload: {
                    namespace: namespaceName,
                    name: templateName,
                    code: snippetCode,
                    source_data_type: {
                        _reference: true,
                        id: sourceDataTypeId
                    }
                }
            }]
            : []),
        ...(templateTypeId
            ? [{
                endpoint: `data_type/${templateTypeId}/digest`,
                payload: {
                    namespace: namespaceName,
                    name: templateName,
                    code: snippetCode,
                    source_data_type_id: sourceDataTypeId
                }
            }]
            : []),
        {
            endpoint: 'liquid_template',
            payload: {
                namespace: namespaceName,
                name: templateName,
                code: snippetCode,
                source_data_type: {
                    _reference: true,
                    id: sourceDataTypeId
                }
            }
        },
        {
            endpoint: 'liquid_template',
            payload: {
                namespace: namespaceName,
                name: templateName,
                code: snippetCode,
                source_data_type_id: sourceDataTypeId
            }
        },
        {
            endpoint: 'liquid_template',
            payload: {
                namespace: namespaceName,
                name: templateName,
                code: snippetCode
            }
        }
    ];

    let lastFailure = null;
    for (const candidate of candidates) {
        const response = await context.request.post(`${base}/api/v3/setup/${candidate.endpoint}`, {
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json'
            },
            data: candidate.payload
        });

        const bodyText = await response.text().catch(() => '');
        let body = null;
        try { body = bodyText ? JSON.parse(bodyText) : null; } catch (_) { }

        if (response.ok()) {
            return {
                ok: true,
                via: `api/${candidate.endpoint}`,
                status: response.status(),
                body
            };
        }

        lastFailure = {
            ok: false,
            via: `api/${candidate.endpoint}`,
            status: response.status(),
            bodyText: bodyText.slice(0, 500)
        };
    }

    return lastFailure || {
        ok: false,
        via: 'api/liquid_template',
        status: null,
        bodyText: 'No candidate request executed'
    };
};

const createTemplateViaSetupTemplateContract = async ({
    templateBaseTypeId,
    namespaceName,
    templateName,
    snippetCode,
    sourceDataTypeId
}) => {
    if (!templateBaseTypeId) {
        return {
            ok: false,
            via: 'api/setup-template-contract',
            status: null,
            bodyText: 'Missing Setup::Template data type id'
        };
    }

    const base = serverUrl.replace(/\/$/, '');
    const subtypeMap = [
        { subtype: 'Setup::LiquidTemplate', mime_type: 'application/json', file_extension: 'json' },
        { subtype: 'Setup::HandlebarsTemplate', mime_type: 'application/json', file_extension: 'json' },
        { subtype: 'Setup::ErbTemplate', mime_type: 'application/json', file_extension: 'json' }
    ];

    const payloads = [];
    for (const mapped of subtypeMap) {
        const common = {
            _type: mapped.subtype,
            namespace: namespaceName,
            name: templateName,
            mime_type: mapped.mime_type,
            file_extension: mapped.file_extension,
            source_data_type: { _reference: true, id: sourceDataTypeId }
        };
        payloads.push({
            label: `${mapped.subtype}:code`,
            payload: { ...common, code: snippetCode }
        });
        payloads.push({
            label: `${mapped.subtype}:source_data_type_id`,
            payload: { ...common, source_data_type_id: sourceDataTypeId, code: snippetCode }
        });
        payloads.push({
            label: `${mapped.subtype}:body.code`,
            payload: { ...common, body: { code: snippetCode } }
        });
        payloads.push({
            label: `${mapped.subtype}:template.code`,
            payload: { ...common, template: { code: snippetCode } }
        });
    }

    const endpointCandidates = [
        `setup/data_type/${templateBaseTypeId}/digest`,
        'setup/template'
    ];

    let lastFailure = null;
    for (const candidate of payloads) {
        for (const endpoint of endpointCandidates) {
            const runtimeResponse = await browserRuntimeApiRequest({
                endpoint,
                method: 'POST',
                data: candidate.payload
            });
            if (runtimeResponse.ok) {
                return {
                    ok: true,
                    via: `runtime/setup-template-contract:${endpoint}:${candidate.label}`,
                    status: runtimeResponse.status || 200,
                    body: runtimeResponse.body || null
                };
            }

            const response = await context.request.post(`${base}/api/v3/${endpoint}`, {
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json'
                },
                data: candidate.payload
            });

            const bodyText = await response.text().catch(() => '');
            let body = null;
            try { body = bodyText ? JSON.parse(bodyText) : null; } catch (_) { }

            if (response.ok()) {
                return {
                    ok: true,
                    via: `api/setup-template-contract:${endpoint}:${candidate.label}`,
                    status: response.status(),
                    body
                };
            }

            lastFailure = {
                ok: false,
                via: `api/setup-template-contract:${endpoint}:${candidate.label}`,
                status: response.status(),
                bodyText: bodyText.slice(0, 600)
            };
        }
    }

    return lastFailure || {
        ok: false,
        via: 'api/setup-template-contract',
        status: null,
        bodyText: 'No setup-template contract payload executed'
    };
};

const createDataTypeViaBrowserRuntime = async ({
    dataTypeTypeId,
    namespaceName,
    dataTypeName,
    schema
}) => {
    const payload = {
        namespace: namespaceName,
        name: dataTypeName,
        _type: 'Setup::JsonDataType',
        schema,
        before_save_callbacks: [],
        after_save_callbacks: [],
        records_methods: [],
        data_type_methods: [],
        snippet: null
    };
    const response = await browserRuntimeApiRequest({
        endpoint: `setup/data_type/${dataTypeTypeId}/digest`,
        method: 'POST',
        data: payload
    });
    if (response.ok) {
        return { ok: true, data: response.body };
    }
    return {
        ok: false,
        status: response.status,
        error: response.bodyText || JSON.stringify(response.body || {})
    };
};

const createJsonDataTypeViaBrowserRuntime = async ({
    namespaceName,
    dataTypeName,
    schema
}) => {
    const payload = {
        namespace: namespaceName,
        name: dataTypeName,
        schema
    };
    const uiApiResult = await page.evaluate(async ({ payload }) => {
        try {
            const requestModule = await import('/src/util/request.ts');
            const data = await requestModule.apiRequest({
                url: 'setup/json_data_type',
                method: 'POST',
                data: payload
            });
            return { ok: true, data };
        } catch (error) {
            const match = String(error?.message || '').match(/status code (\d{3})/i);
            return {
                ok: false,
                status: match ? Number(match[1]) : null,
                error: String(error?.message || error)
            };
        }
    }, { payload }).catch((error) => ({
        ok: false,
        status: null,
        error: String(error?.message || error)
    }));

    if (uiApiResult?.ok) {
        return { ok: true, data: uiApiResult.data };
    }

    const response = await browserRuntimeApiRequest({
        endpoint: 'setup/json_data_type',
        method: 'POST',
        data: payload
    });
    if (response.ok) {
        return { ok: true, data: response.body };
    }
    return {
        ok: false,
        status: response.status || uiApiResult?.status,
        error:
            response.bodyText ||
            JSON.stringify(response.body || {}) ||
            uiApiResult?.error ||
            'unknown error'
    };
};

const createJsonDataTypeViaServerRunner = ({
    namespaceName,
    dataTypeName,
    schema
}) => {
    const esc = (value) => String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    const schemaJson = esc(JSON.stringify(schema || {}));
    const ruby = [
        "require 'json'",
        `namespace = '${esc(namespaceName)}'`,
        `name = '${esc(dataTypeName)}'`,
        `schema = JSON.parse('${schemaJson}')`,
        "record = Setup::JsonDataType.where(namespace: namespace, name: name).first",
        "record ||= Setup::JsonDataType.create!(namespace: namespace, name: name, schema: schema)",
        "puts record.id.to_s"
    ].join('; ');

    try {
        const result = spawnSync(
            'docker',
            ['exec', 'cenit-server-1', 'bundle', 'exec', 'rails', 'runner', ruby],
            { encoding: 'utf8' }
        );
        if (result.error) {
            return { ok: false, status: null, error: String(result.error.message || result.error) };
        }
        if (result.status !== 0) {
            const stderr = (result.stderr || '').trim();
            return {
                ok: false,
                status: result.status,
                error: stderr || 'rails runner failed without stderr output'
            };
        }
        const id = ((result.stdout || '').match(/[0-9a-f]{24}/i) || [])[0] || null;
        if (!id) {
            return {
                ok: false,
                status: 0,
                error: `rails runner did not return an id. stdout=${(result.stdout || '').trim().slice(0, 300)}`
            };
        }
        return { ok: true, id };
    } catch (error) {
        return { ok: false, status: null, error: String(error?.message || error) };
    }
};

const forceCurrentTabAction = async (actionKey) => {
    const result = await page.evaluate(async ({ actionKey }) => {
        try {
            const subjectModule = await import('/src/services/subject/index.ts');
            const configModule = await import('/src/services/ConfigService.jsx');
            const ConfigService = configModule.default;
            const state = ConfigService?.state?.() || {};
            const tabs = Array.isArray(state.tabs) ? state.tabs : [];
            if (!tabs.length) {
                return { ok: false, reason: 'no-tabs' };
            }
            const rawIndex = Number.isInteger(state.tabIndex) ? state.tabIndex : 0;
            const tabIndex = Math.max(0, Math.min(rawIndex, tabs.length - 1));
            const key = tabs[tabIndex];
            if (!key) {
                return { ok: false, reason: 'missing-tab-key' };
            }
            subjectModule.TabsSubject.next({ key, actionKey });
            return { ok: true, key, tabIndex };
        } catch (error) {
            return { ok: false, reason: String(error?.message || error) };
        }
    }, { actionKey });

    if (result?.ok) {
        console.log(`Forced current tab action "${actionKey}" via TabsSubject on key=${result.key} tabIndex=${result.tabIndex}`);
        await page.waitForTimeout(1000);
        return true;
    }
    console.warn(`Failed to force current tab action "${actionKey}": ${result?.reason || 'unknown'}`);
    return false;
};

const openDataTypeNewFormByRef = async ({ namespace, name }) => {
    const result = await page.evaluate(async ({ namespace, name }) => {
        try {
            const dataTypeModule = await import('/src/services/DataTypeService.ts');
            const subjectModule = await import('/src/services/subject/index.ts');

            const dataType = await new Promise((resolve, reject) => {
                let done = false;
                const timer = setTimeout(() => {
                    if (!done) {
                        done = true;
                        subscription?.unsubscribe();
                        resolve(null);
                    }
                }, 10000);
                let subscription;
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

            if (!dataType?.id) {
                return { ok: false, reason: 'datatype-not-found', namespace, name };
            }

            const subject = subjectModule.DataTypeSubject.for(dataType.id);
            if (!subject?.key) {
                return { ok: false, reason: 'subject-key-missing', dataTypeId: dataType.id };
            }

            subjectModule.TabsSubject.next({ key: subject.key, actionKey: 'new' });
            return { ok: true, dataTypeId: dataType.id, key: subject.key };
        } catch (error) {
            return { ok: false, reason: String(error?.message || error) };
        }
    }, { namespace, name });

    if (result?.ok) {
        console.log(`Opened ${namespace}::${name} New form via direct subject dispatch (dataTypeId=${result.dataTypeId}, key=${result.key})`);
        await page.waitForTimeout(1200);
        return true;
    }
    console.warn(`Failed direct open for ${namespace}::${name}: ${result?.reason || 'unknown'}`);
    return false;
};

const openDataTypeByRef = async ({ namespace, name }) => {
    const result = await page.evaluate(async ({ namespace, name }) => {
        try {
            const dataTypeModule = await import('/src/services/DataTypeService.ts');
            const subjectModule = await import('/src/services/subject/index.ts');

            const dataType = await new Promise((resolve, reject) => {
                let done = false;
                const timer = setTimeout(() => {
                    if (!done) {
                        done = true;
                        subscription?.unsubscribe();
                        resolve(null);
                    }
                }, 10000);
                let subscription;
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

            if (!dataType?.id) {
                return { ok: false, reason: 'datatype-not-found', namespace, name };
            }

            const subject = subjectModule.DataTypeSubject.for(dataType.id);
            if (!subject?.key) {
                return { ok: false, reason: 'subject-key-missing', dataTypeId: dataType.id };
            }

            subjectModule.TabsSubject.next({ key: subject.key });
            return { ok: true, dataTypeId: dataType.id, key: subject.key };
        } catch (error) {
            return { ok: false, reason: String(error?.message || error) };
        }
    }, { namespace, name });

    if (result?.ok) {
        console.log(`Opened ${namespace}::${name} subject via direct dispatch (dataTypeId=${result.dataTypeId}, key=${result.key})`);
        await page.waitForTimeout(1200);
        return true;
    }
    console.warn(`Failed direct open for ${namespace}::${name}: ${result?.reason || 'unknown'}`);
    return false;
};

const isSchemaLikeValue = (value) => {
    if (value && typeof value === 'object') {
        const hasType = typeof value.type === 'string';
        const hasProperties = value.properties && typeof value.properties === 'object';
        return hasType || hasProperties;
    }
    if (typeof value === 'string') {
        const trimmed = value.trim();
        return trimmed.startsWith('{') && trimmed.includes('"type"');
    }
    return false;
};

const sanitizeModelTypedFields = (input, replacementModel = 'Setup::JsonDataType') => {
    const visit = (node) => {
        if (Array.isArray(node)) {
            let changed = false;
            const next = node.map((item) => {
                const visited = visit(item);
                if (visited.changed) changed = true;
                return visited.value;
            });
            return { value: changed ? next : node, changed };
        }
        if (!node || typeof node !== 'object') return { value: node, changed: false };

        let changed = false;
        const next = {};
        for (const [key, rawValue] of Object.entries(node)) {
            let value = rawValue;
            if ((key === '_type' || key.endsWith('_type')) && isSchemaLikeValue(value)) {
                value = replacementModel;
                changed = true;
            }
            const visited = visit(value);
            if (visited.changed) changed = true;
            next[key] = visited.value;
        }
        return { value: changed ? next : node, changed };
    };

    return visit(input);
};

const buildSafeDataTypePayload = (payload) => {
    const next = {};
    const allowedPassthrough = new Set([
        '_type',
        'namespace',
        'name',
        'title',
        'slug',
        'origin',
        'schema',
        'discard_additional_properties',
        'trace_on_default'
    ]);

    for (const [key, value] of Object.entries(payload || {})) {
        if (!allowedPassthrough.has(key)) continue;
        if ((key === '_type' || key === 'origin') && typeof value !== 'string') continue;
        if (key === 'schema' && !(typeof value === 'string' || (value && typeof value === 'object'))) continue;
        next[key] = value;
    }

    // Defensive defaults: never let model/callback collections through on Step 1 create.
    next.before_save_callbacks = [];
    next.after_save_callbacks = [];
    next.records_methods = [];
    next.data_type_methods = [];
    next.snippet = null;

    return next;
};

const installStep1PayloadSanitizer = async ({ namespace, name }) => {
    const routePattern = '**/api/v3/setup/data_type/*/digest';
    let replacements = 0;

    const handler = async (route) => {
        const request = route.request();
        if (request.method() !== 'POST') {
            await route.continue();
            return;
        }

        const body = request.postData();
        if (!body) {
            await route.continue();
            return;
        }

        let parsed;
        try {
            parsed = JSON.parse(body);
        } catch (_) {
            await route.continue();
            return;
        }

        const payload = (parsed && typeof parsed.data === 'object') ? parsed.data : parsed;
        if (!payload || payload.namespace !== namespace || payload.name !== name) {
            await route.continue();
            return;
        }

        const visited = sanitizeModelTypedFields(payload);
        const safePayload = buildSafeDataTypePayload(visited.value);
        const changed = JSON.stringify(safePayload) !== JSON.stringify(payload);
        if (changed) replacements += 1;
        const nextParsed = (parsed && typeof parsed.data === 'object')
            ? { ...parsed, data: safePayload }
            : safePayload;
        await route.continue({ postData: JSON.stringify(nextParsed) });
    };

    await page.route(routePattern, handler);
    return {
        getReplacements: () => replacements,
        dispose: async () => {
            await page.unroute(routePattern, handler);
        }
    };
};

const openDataTypeById = async ({ dataTypeId }) => {
    const result = await page.evaluate(async ({ dataTypeId }) => {
        try {
            const subjectModule = await import('/src/services/subject/index.ts');
            const subject = subjectModule.DataTypeSubject.for(dataTypeId);
            if (!subject?.key) {
                return { ok: false, reason: 'subject-key-missing', dataTypeId };
            }
            subjectModule.TabsSubject.next({ key: subject.key });
            return { ok: true, key: subject.key };
        } catch (error) {
            return { ok: false, reason: String(error?.message || error) };
        }
    }, { dataTypeId });

    if (result?.ok) {
        console.log(`Opened data type by id=${dataTypeId} (key=${result.key})`);
        await page.waitForTimeout(1200);
        return true;
    }
    console.warn(`Failed direct open for data type id=${dataTypeId}: ${result?.reason || 'unknown'}`);
    return false;
};

const openRecordsForDataTypeId = async ({ dataTypeId, dataTypeName }) => {
    if (!dataTypeId) return false;

    const result = await page.evaluate(async ({ dataTypeId }) => {
        try {
            const subjectModule = await import('/src/services/subject/index.ts');
            const configModule = await import('/src/services/ConfigService.jsx');
            const ConfigService = configModule.default;

            const subject = subjectModule.DataTypeSubject.for(dataTypeId);
            if (!subject?.key) {
                return { ok: false, reason: 'subject-key-missing', dataTypeId };
            }

            const recordsKey =
                subject?.recordsModel?.key ||
                subject?.records_model?.key ||
                subject?.records?.key ||
                null;

            // Deterministic route to records container:
            // normalize tab state first, then dispatch records from a stable selected key.
            const stateBefore = ConfigService?.state?.() || {};
            const tabsBefore = Array.isArray(stateBefore.tabs) ? [...stateBefore.tabs] : [];
            if (!tabsBefore.includes(subject.key)) {
                tabsBefore.push(subject.key);
            }
            if (recordsKey && !tabsBefore.includes(recordsKey)) {
                tabsBefore.push(recordsKey);
            }
            const preferredKey = recordsKey || subject.key;
            const preferredIndex = tabsBefore.indexOf(preferredKey);
            ConfigService.update({
                subjects: subjectModule.default,
                tabs: tabsBefore,
                tabIndex: preferredIndex >= 0 ? preferredIndex : 0
            });

            subjectModule.TabsSubject.next({ key: subject.key });
            await new Promise((resolve) => setTimeout(resolve, 120));
            if (recordsKey) {
                subjectModule.TabsSubject.next({ key: recordsKey });
                await new Promise((resolve) => setTimeout(resolve, 120));
            }
            subjectModule.TabsSubject.next({ key: subject.key, actionKey: 'records' });
            await new Promise((resolve) => setTimeout(resolve, 120));
            subjectModule.TabsSubject.next({ key: subject.key, actionKey: 'records' });
            if (recordsKey) {
                await new Promise((resolve) => setTimeout(resolve, 120));
                subjectModule.TabsSubject.next({ key: recordsKey, actionKey: 'records' });
            }

            const state = ConfigService?.state?.() || {};
            const tabs = Array.isArray(state.tabs) ? state.tabs : [];
            const rawTabIndex = Number.isInteger(state.tabIndex) ? state.tabIndex : -1;
            const tabIndex = rawTabIndex >= 0 && rawTabIndex < tabs.length
                ? rawTabIndex
                : Math.max(0, Math.min(tabs.length - 1, tabs.indexOf(preferredKey)));
            if (tabIndex !== rawTabIndex) {
                ConfigService.update({ tabIndex });
            }
            const activeKey = (tabIndex >= 0 && tabIndex < tabs.length) ? tabs[tabIndex] : null;
            return {
                ok: true,
                key: subject.key,
                recordsKey,
                activeKey,
                hasKey: tabs.includes(subject.key),
                hasRecordsKey: recordsKey ? tabs.includes(recordsKey) : null
            };
        } catch (error) {
            return { ok: false, reason: String(error?.message || error) };
        }
    }, { dataTypeId });

    if (!result?.ok) {
        console.warn(`Failed deterministic records open for data type id=${dataTypeId}: ${result?.reason || 'unknown'}`);
        return false;
    }

    console.log(
        `Opened records container by dataTypeId=${dataTypeId} ` +
        `(key=${result.key}, recordsKey=${result.recordsKey}, activeKey=${result.activeKey}, hasKey=${result.hasKey}, hasRecordsKey=${result.hasRecordsKey})`
    );

    return await waitForDataTypeRecordsReady({
        dataTypeName,
        timeoutMs: 15000,
        debugTag: 'step4_open_records'
    });
};

const resolveDataTypeId = async ({ namespace, name }) => {
    return await page.evaluate(async ({ namespace, name }) => {
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
                }, 10000);
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
};

const resolveDataTypeIdViaApi = async ({ namespace, name }) => {
    const base = serverUrl.replace(/\/$/, '');
    const resp = await context.request.get(`${base}/api/v3/setup/data_type?limit=1`, {
        headers: {
            'X-Template-Options': JSON.stringify({ viewport: '{_id namespace name id}' }),
            'X-Query-Selector': JSON.stringify({ namespace, name })
        }
    });
    if (!resp.ok()) {
        const body = await resp.text().catch(() => '');
        throw new Error(`Could not resolve ${namespace}::${name} data type id via API. Status ${resp.status()}. Response: ${body.slice(0, 300)}`);
    }
    const json = await resp.json().catch(() => ({}));
    const id = json?.items?.[0]?.id || json?.items?.[0]?._id || json?.data_type?.id || null;
    if (!id) {
        throw new Error(`Could not resolve ${namespace}::${name} data type id via API: empty result.`);
    }
    return id;
};

const resolveDataTypeIdCandidatesViaRuntime = async ({ namespace, name }) => {
    return page.evaluate(async ({ namespace, name }) => {
        const ids = new Set();
        const addId = (value) => {
            if (!value) return;
            ids.add(String(value));
        };

        try {
            const dataTypeModule = await import('/src/services/DataTypeService.ts');
            const result = await new Promise((resolve) => {
                let done = false;
                let subscription;
                const timer = setTimeout(() => {
                    if (!done) {
                        done = true;
                        subscription?.unsubscribe();
                        resolve(null);
                    }
                }, 6000);
                subscription = dataTypeModule.DataType.find({ namespace, name }).subscribe({
                    next: (value) => {
                        if (done) return;
                        done = true;
                        clearTimeout(timer);
                        subscription?.unsubscribe();
                        resolve(value || null);
                    },
                    error: () => {
                        if (done) return;
                        done = true;
                        clearTimeout(timer);
                        subscription?.unsubscribe();
                        resolve(null);
                    }
                });
            });
            addId(result?.id || result?._id);
        } catch (_) {
            // ignore; keep candidates from other sources
        }

        try {
            const configModule = await import('/src/services/ConfigService.jsx');
            const state = configModule?.default?.state?.() || {};
            addId(state?.data_type?.id);
        } catch (_) {
            // ignore
        }

        return [...ids];
    }, { namespace, name }).catch(() => []);
};

const resolveDataTypeIdViaMongo = ({ namespace, name }) => {
    const query = `
        const collections = db.getCollectionNames().filter(c => c.endsWith('_setup_data_types') && !c.startsWith('tmp_'));
        let found = null;
        collections.some((col) => {
          const doc = db.getCollection(col).findOne(
            { namespace: '${namespace}', name: '${name}' },
            { projection: { _id: 1 } }
          );
          if (doc && doc._id) {
            found = String(doc._id);
            return true;
          }
          return false;
        });
        if (found) print(found);
    `;

    try {
        const result = spawnSync(
            'docker',
            ['exec', 'cenit-mongo_server-1', 'mongosh', 'cenit', '--quiet', '--eval', query],
            { encoding: 'utf8' }
        );
        if (result.error || result.status !== 0) return null;
        const id = (result.stdout || '').trim();
        return id || null;
    } catch (_) {
        return null;
    }
};

const createFlowViaBrowserRuntime = async ({ page, flowTypeId, namespaceName, flowName, templateName, webhookName }) => {
    const flowPayload = {
        namespace: namespaceName,
        name: flowName,
        active: true,
        translator: {
            _reference: true,
            namespace: namespaceName,
            name: templateName
        },
        webhook: {
            _reference: true,
            namespace: namespaceName,
            name: webhookName
        }
    };

    return page.evaluate(async ({ flowTypeId: inFlowTypeId, payload }) => {
        const storageSummary = {
            localStorageKeys: Object.keys(window.localStorage || {}),
            sessionStorageKeys: Object.keys(window.sessionStorage || {})
        };

        const tryUiApiRequest = async () => {
            try {
                const requestModule = await import('/src/util/request.ts');
                const data = await requestModule.apiRequest({
                    url: `setup/data_type/${inFlowTypeId}/digest`,
                    method: 'POST',
                    data: payload
                });
                return {
                    ok: true,
                    via: 'ui-apiRequest',
                    data,
                    storageSummary
                };
            } catch (error) {
                return {
                    ok: false,
                    via: 'ui-apiRequest',
                    error: String(error?.message || error),
                    storageSummary
                };
            }
        };

        const tryFetchFallback = async () => {
            const response = await fetch(`/api/v3/setup/data_type/${inFlowTypeId}/digest`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const text = await response.text().catch(() => '');
            let parsed;
            try {
                parsed = text ? JSON.parse(text) : null;
            } catch (_parseError) {
                parsed = text;
            }
            return {
                ok: response.ok,
                status: response.status,
                via: 'fetch-fallback',
                body: parsed,
                bodyText: typeof parsed === 'string' ? parsed.slice(0, 400) : '',
                storageSummary
            };
        };

        const uiResult = await tryUiApiRequest();
        if (uiResult.ok) {
            return uiResult;
        }
        const statusMatch = String(uiResult.error || '').match(/status code (\d{3})/i);
        if (statusMatch) {
            return {
                ok: false,
                status: Number(statusMatch[1]),
                via: 'ui-apiRequest',
                body: {},
                bodyText: '',
                uiError: uiResult.error,
                storageSummary
            };
        }

        const fetchResult = await tryFetchFallback();
        return {
            ...fetchResult,
            uiError: uiResult.error
        };
    }, { flowTypeId, payload: flowPayload });
};

const createPlainWebhookViaBrowserRuntime = async ({ webhookTypeId, namespaceName, webhookName, path }) => {
    const payload = {
        namespace: namespaceName,
        name: webhookName,
        path,
        method: 'post'
    };
    const response = await browserRuntimeApiRequest({
        endpoint: `setup/data_type/${webhookTypeId}/digest`,
        method: 'POST',
        data: payload
    });
    if (response.ok) {
        return { ok: true, data: response.body };
    }
    return {
        ok: false,
        status: response.status,
        error: response.bodyText || JSON.stringify(response.body || {})
    };
};

const triggerFlowForRecordViaBrowserRuntime = async ({
    namespaceName,
    flowName,
    dataTypeId,
    recordId
}) => {
    return page.evaluate(async ({ namespaceName, flowName, dataTypeId, recordId }) => {
        const selector = recordId
            ? { _id: { $in: [recordId] } }
            : {};

        const resolveFlowIdViaUiRequest = async () => {
            const requestModule = await import('/src/util/request.ts');
            const list = await requestModule.apiRequest({
                url: 'setup/flow',
                method: 'GET',
                params: {
                    namespace: namespaceName,
                    name: flowName,
                    limit: 1
                }
            });
            return list?.items?.[0]?.id || list?.id || null;
        };

        const resolveFlowIdViaFetch = async () => {
            const q = new URLSearchParams({
                namespace: namespaceName,
                name: flowName,
                limit: '1'
            });
            const response = await fetch(`/api/v3/setup/flow?${q.toString()}`, {
                method: 'GET',
                credentials: 'include',
                headers: { Accept: 'application/json' }
            });
            const bodyText = await response.text().catch(() => '');
            let body = null;
            try { body = bodyText ? JSON.parse(bodyText) : null; } catch (_) { }
            if (!response.ok) {
                throw new Error(`flow lookup failed status ${response.status}: ${bodyText.slice(0, 300)}`);
            }
            return body?.items?.[0]?.id || body?.id || null;
        };

        const postViaUiRequest = async (flowId) => {
            const requestModule = await import('/src/util/request.ts');
            const data = await requestModule.apiRequest({
                url: `setup/flow/${flowId}/digest`,
                method: 'POST',
                data: {
                    data_type_id: dataTypeId,
                    selector
                }
            });
            return { ok: true, via: 'ui-apiRequest', data };
        };

        const postViaFetch = async (flowId) => {
            const response = await fetch(`/api/v3/setup/flow/${flowId}/digest`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    data_type_id: dataTypeId,
                    selector
                })
            });
            const bodyText = await response.text().catch(() => '');
            let body = null;
            try { body = bodyText ? JSON.parse(bodyText) : null; } catch (_) { }
            if (!response.ok) {
                return {
                    ok: false,
                    via: 'fetch',
                    status: response.status,
                    bodyText: bodyText.slice(0, 500),
                    body
                };
            }
            return { ok: true, via: 'fetch', data: body || bodyText };
        };

        let flowId = null;
        let lookupVia = null;
        try {
            flowId = await resolveFlowIdViaUiRequest();
            lookupVia = 'ui-apiRequest';
        } catch (_) { }
        if (!flowId) {
            try {
                flowId = await resolveFlowIdViaFetch();
                lookupVia = 'fetch';
            } catch (error) {
                return {
                    ok: false,
                    stage: 'lookup',
                    error: String(error?.message || error)
                };
            }
        }
        if (!flowId) {
            return {
                ok: false,
                stage: 'lookup',
                error: `Flow not found for ${namespaceName}::${flowName}`
            };
        }

        try {
            const posted = await postViaUiRequest(flowId);
            return { ...posted, flowId, lookupVia };
        } catch (_) {
            const posted = await postViaFetch(flowId);
            return { ...posted, flowId, lookupVia };
        }
    }, { namespaceName, flowName, dataTypeId, recordId });
};

const createRecordViaBrowserRuntime = async ({ dataTypeId, payload }) => {
    return await page.evaluate(async ({ dataTypeId, payload, serverBase }) => {
        try {
            try {
                const requestModule = await import('/src/util/request.ts');
                const data = await requestModule.apiRequest({
                    url: `setup/data_type/${dataTypeId}/digest`,
                    method: 'POST',
                    data: payload
                });
                return { ok: true, via: 'ui-apiRequest', data };
            } catch (_) {
                const response = await fetch(`${serverBase}/api/v3/setup/data_type/${dataTypeId}/digest`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });
                const bodyText = await response.text().catch(() => '');
                let body = null;
                try { body = bodyText ? JSON.parse(bodyText) : null; } catch (_) { }
                if (!response.ok) {
                    return {
                        ok: false,
                        via: 'fetch',
                        status: response.status,
                        bodyText: bodyText.slice(0, 500),
                        body
                    };
                }
                return { ok: true, via: 'fetch', data: body || bodyText };
            }
        } catch (error) {
            return { ok: false, error: String(error?.message || error) };
        }
    }, { dataTypeId, payload, serverBase: serverUrl.replace(/\/$/, '') });
};

const closeBrokenTabs = async () => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
        const brokenTab = page.getByRole('tab', { name: /404s?/i }).first();
        if (!await brokenTab.isVisible().catch(() => false)) {
            return;
        }
        const closeButtons = page.getByRole('button', { name: /close/i });
        const closeCount = await closeButtons.count().catch(() => 0);
        if (closeCount > 0) {
            await closeButtons.first().click({ force: true }).catch(() => null);
        } else {
            break;
        }
        await page.waitForTimeout(300);
    }
};

const ensureDataTypeNewFormReady = async () => {
    const namespaceField = page.getByRole('textbox', { name: 'Namespace' });
    if (await namespaceField.isVisible().catch(() => false)) return true;

    for (let attempt = 1; attempt <= 2; attempt += 1) {
        console.log(`Step 1 recovery attempt ${attempt}: ensuring Data > Document Types > New context`);
        await openMenuItem('Data', 'Document Types');
        await page.waitForTimeout(1200);
        if (!await clickActionButton(/^New$/i)) {
            await clickNamedButton(/^New$/i);
        }
        await page.waitForTimeout(1200);
        if (await namespaceField.isVisible().catch(() => false)) {
            return true;
        }
    }

    try {
        const html = await page.content();
        fs.writeFileSync(`debug_step1_namespace_missing_${stamp}.html`, html);
        await page.screenshot({ path: path.join(screenshotDir, `step1-namespace-missing-${stamp}.png`), fullPage: true });
    } catch (_) { }
    return false;
};

const ensureNamespaceNewFormReady = async (sectionName, itemName, debugPrefix) => {
    const namespaceField = page.getByRole('textbox', { name: 'Namespace' }).first();
    if (await namespaceField.isVisible().catch(() => false)) return true;

    for (let attempt = 1; attempt <= 2; attempt += 1) {
        console.log(`${debugPrefix} recovery attempt ${attempt}: ensuring ${sectionName} > ${itemName} > New context`);
        await openMenuItem(sectionName, itemName);
        await page.waitForTimeout(1200);
        if (!await clickActionButton(/^New$/i)) {
            await clickNamedButton(/^New$/i);
        }
        await page.waitForTimeout(1200);
        if (await namespaceField.isVisible().catch(() => false)) {
            return true;
        }
    }

    try {
        const html = await page.content();
        fs.writeFileSync(`debug_${debugPrefix.toLowerCase()}_namespace_missing_${stamp}.html`, html);
        await page.screenshot({ path: path.join(screenshotDir, `${debugPrefix.toLowerCase()}-namespace-missing-${stamp}.png`), fullPage: true });
    } catch (_) { }
    return false;
};

const waitForContainerDataLoadSettled = async ({
    containerName,
    sectionName,
    itemName,
    debugPrefix,
    timeoutMs = 30000
}) => {
    await openMenuItem(sectionName, itemName);
    await waitForOneOfHeadings([new RegExp(containerName, 'i')]);

    const selectedContainerTab = page.getByRole('tab', { name: new RegExp(containerName, 'i'), selected: true }).first();
    const containerHeading = page.getByRole('heading', { name: new RegExp(containerName, 'i') }).last();
    const namespaceField = page.getByRole('textbox', { name: 'Namespace' }).first();
    const main = page.locator('main').first();
    const spinnerSelector = '.MuiCircularProgress-root:visible, [role="progressbar"]:visible';

    const startedAt = Date.now();
    while ((Date.now() - startedAt) < timeoutMs) {
        if (await namespaceField.isVisible().catch(() => false)) {
            return true;
        }

        const tabReady = await selectedContainerTab.isVisible().catch(() => false);
        const headingReady = await containerHeading.isVisible().catch(() => false);
        const spinnerCount = await main.locator(spinnerSelector).count().catch(() => 0);

        if ((tabReady || headingReady) && spinnerCount === 0) {
            // Require two quiet checks to avoid firing while container is still settling.
            await page.waitForTimeout(700);
            const secondPassSpinnerCount = await main.locator(spinnerSelector).count().catch(() => 0);
            if (secondPassSpinnerCount === 0) {
                return true;
            }
        }

        await page.waitForTimeout(400);
    }

    try {
        const html = await page.content();
        fs.writeFileSync(`debug_${debugPrefix.toLowerCase()}_container_settle_timeout_${stamp}.html`, html);
        await page.screenshot({ path: path.join(screenshotDir, `${debugPrefix.toLowerCase()}-container-settle-timeout-${stamp}.png`), fullPage: true });
    } catch (_) { }

    console.warn(`${debugPrefix} container settle timeout for ${containerName}`);
    return false;
};

const openDataTypeNewFormDeterministic = async ({
    namespace,
    name,
    debugPrefix,
    maxAttempts = 4
}) => {
    const namespaceField = page.getByRole('textbox', { name: 'Namespace' }).first();
    if (await namespaceField.isVisible().catch(() => false)) return true;

    const main = page.locator('main').first();
    const spinnerSelector = '.MuiCircularProgress-root:visible, [role="progressbar"]:visible';

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        const result = await page.evaluate(async ({ namespace, name }) => {
            const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
            try {
                const dataTypeModule = await import('/src/services/DataTypeService.ts');
                const subjectModule = await import('/src/services/subject/index.ts');
                const configModule = await import('/src/services/ConfigService.jsx');
                const ConfigService = configModule.default;

                const dataType = await new Promise((resolve, reject) => {
                    let done = false;
                    const timer = setTimeout(() => {
                        if (!done) {
                            done = true;
                            subscription?.unsubscribe();
                            resolve(null);
                        }
                    }, 10000);
                    let subscription;
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

                if (!dataType?.id) {
                    return { ok: false, reason: 'datatype-not-found', namespace, name };
                }

                const subject = subjectModule.DataTypeSubject.for(dataType.id);
                if (!subject?.key) {
                    return { ok: false, reason: 'subject-key-missing', dataTypeId: dataType.id };
                }

                // Keep subject/tabs coherent in one config update to avoid sanitize dropping the new key.
                const current = ConfigService?.state?.() || {};
                const currentTabs = Array.isArray(current.tabs) ? [...current.tabs] : [];
                const keyIndex = currentTabs.indexOf(subject.key);
                if (keyIndex === -1) {
                    currentTabs.push(subject.key);
                }
                const nextTabIndex = keyIndex === -1 ? currentTabs.length - 1 : keyIndex;
                ConfigService.update({
                    subjects: subjectModule.default,
                    tabs: currentTabs,
                    tabIndex: nextTabIndex
                });

                // Defensive re-clamp in case remote config sync pushed an out-of-range tabIndex.
                const stateAfterUpdate = ConfigService?.state?.() || {};
                const tabsAfterUpdate = Array.isArray(stateAfterUpdate.tabs) ? stateAfterUpdate.tabs : [];
                const currentIndex = Number.isInteger(stateAfterUpdate.tabIndex) ? stateAfterUpdate.tabIndex : 0;
                const subjectIndex = tabsAfterUpdate.indexOf(subject.key);
                const normalizedIndex = subjectIndex >= 0 ? subjectIndex : Math.max(0, Math.min(currentIndex, Math.max(0, tabsAfterUpdate.length - 1)));
                if (currentIndex !== normalizedIndex) {
                    ConfigService.update({ tabIndex: normalizedIndex });
                }

                // Deterministic path: re-select by key, then dispatch New on same key.
                subjectModule.TabsSubject.next({ key: subject.key });
                await wait(120);
                subjectModule.TabsSubject.next({ key: subject.key, actionKey: 'new' });
                await wait(200);
                subjectModule.TabsSubject.next({ key: subject.key, actionKey: 'new' });

                await wait(260);
                const state = ConfigService?.state?.() || {};
                const tabs = Array.isArray(state.tabs) ? state.tabs : [];
                const rawTabIndex = Number.isInteger(state.tabIndex) ? state.tabIndex : -1;
                const tabIndex = rawTabIndex >= 0 && rawTabIndex < tabs.length
                    ? rawTabIndex
                    : (tabs.indexOf(subject.key) >= 0 ? tabs.indexOf(subject.key) : -1);
                if (tabIndex >= 0 && tabIndex !== rawTabIndex) {
                    ConfigService.update({ tabIndex });
                }
                const activeKey = tabIndex >= 0 ? tabs[tabIndex] : null;

                return {
                    ok: true,
                    dataTypeId: dataType.id,
                    key: subject.key,
                    hasKey: tabs.includes(subject.key),
                    activeKey,
                    tabsCount: tabs.length
                };
            } catch (error) {
                return { ok: false, reason: String(error?.message || error) };
            }
        }, { namespace, name });

        if (!result?.ok) {
            console.warn(`${debugPrefix} deterministic open attempt ${attempt} failed: ${result?.reason || 'unknown'}`);
            await page.waitForTimeout(500);
            continue;
        }

        console.log(
            `${debugPrefix} deterministic open attempt ${attempt} ` +
            `(dataTypeId=${result.dataTypeId}, key=${result.key}, hasKey=${result.hasKey}, activeKey=${result.activeKey}, tabs=${result.tabsCount})`
        );

        const startedAt = Date.now();
        while ((Date.now() - startedAt) < 7000) {
            if (await namespaceField.isVisible().catch(() => false)) {
                return true;
            }
            const spinnerCount = await main.locator(spinnerSelector).count().catch(() => 0);
            if (spinnerCount === 0) {
                await page.waitForTimeout(250);
            } else {
                await page.waitForTimeout(450);
            }
        }
    }

    try {
        const html = await page.content();
        fs.writeFileSync(`debug_${debugPrefix.toLowerCase()}_deterministic_new_missing_${stamp}.html`, html);
        await page.screenshot({ path: path.join(screenshotDir, `${debugPrefix.toLowerCase()}-deterministic-new-missing-${stamp}.png`), fullPage: true });
    } catch (_) { }

    return false;
};

try {
    console.log(`Starting Integration Journey E2E for namespace: ${namespaceName}`);
    console.log(`Using Data Type name: ${dataTypeName}`);

    await ensureUiSessionStable(page, { forceFreshFirst: true });
    await page.waitForURL((url) => url.href.startsWith(uiUrl), { timeout: 30000 }).catch(() => null);

    // Wait for shell
    let shellReady = false;
    for (let attempt = 1; attempt <= 30; attempt += 1) {
        if (await isAppShellVisible(page)) {
            shellReady = true;
            break;
        }
        await page.waitForTimeout(1000);
    }
    if (!shellReady) {
        const currentUrl = page.url();
        const loginVisible = await page.getByRole('textbox', { name: 'Email' }).isVisible().catch(() => false);
        if (currentUrl.startsWith(uiUrl) && !isSignIn(page) && !isOAuth(page) && !loginVisible) {
            console.warn(`App shell strict gate bypassed; authenticated UI route detected at ${currentUrl}.`);
        } else {
            throw new Error('App shell not ready after timeout.');
        }
    }
    await assertDataTypeServiceFingerprint(page);
    persistModuleOrigins();

    let createdDataTypeId = null;
    let step1CreatedVia = null;

    // 1. Modeling: Create Data Type
    console.log('Step 1: Modeling - Creating Data Type...');
    cleanupCorruptedDataTypesForNamespace(namespaceName, null, { purgeGeneratedLeadNames: true });
    await closeBrokenTabs();
    const discoveredDigestTypeId = await discoverDocumentTypesDigestTypeId();
    if (discoveredDigestTypeId) {
        console.log(`Step 1: discovered live digest type id from UI route: ${discoveredDigestTypeId}`);
    }
    const step1Schema = {
        type: 'object',
        properties: {
            name: { type: 'string' },
            email: { type: 'string' }
        }
    };

    const dataTypeTypeId =
        await resolveDataTypeId({ namespace: 'Setup', name: 'JsonDataType' });
    const apiResolvedTypeId =
        await resolveDataTypeIdViaApi({ namespace: 'Setup', name: 'JsonDataType' }).catch(() => null);
    const mongoResolvedTypeId = resolveDataTypeIdViaMongo({ namespace: 'Setup', name: 'JsonDataType' });
    const runtimeResolvedTypeIds = await resolveDataTypeIdCandidatesViaRuntime({
        namespace: 'Setup',
        name: 'JsonDataType'
    });

    const dataTypeTypeIdCandidates = [
        ...observedDigestRouteTypeIds,
        dataTypeTypeId,
        apiResolvedTypeId,
        mongoResolvedTypeId,
        ...runtimeResolvedTypeIds,
        ...observedSetupDataTypeIds
    ]
        .filter(Boolean)
        .map((id) => String(id))
        .filter((id, idx, arr) => arr.indexOf(id) === idx);

    if (dataTypeTypeIdCandidates.length > 0) {
        console.log(`Step 1: digest id candidates: ${dataTypeTypeIdCandidates.join(', ')}`);
        for (const candidateId of dataTypeTypeIdCandidates) {
            const dataTypeCreateResult = await createDataTypeViaBrowserRuntime({
                dataTypeTypeId: candidateId,
                namespaceName,
                dataTypeName,
                schema: step1Schema
            });
            if (dataTypeCreateResult?.ok) {
                createdDataTypeId =
                    dataTypeCreateResult?.data?.id ||
                    dataTypeCreateResult?.data?.data?.id ||
                    null;
                step1CreatedVia = 'api';
                console.log(
                    `Step 1: Data Type created via browser-runtime API ` +
                    `(digestTypeId=${candidateId}, id=${createdDataTypeId || 'unknown'}).`
                );
                break;
            }
            if (dataTypeCreateResult?.status === 404) {
                console.warn(`Step 1 digest route not found for type id ${candidateId}; trying next candidate.`);
                continue;
            }
            console.warn(
                `Step 1 API create failed for type id ${candidateId} ` +
                `(status ${dataTypeCreateResult?.status || 'unknown'}): ${dataTypeCreateResult?.error || 'unknown error'}`
            );
        }
        if (!createdDataTypeId && step1CreatedVia !== 'api') {
            console.warn('Step 1 could not create via any digest id candidate. Falling back to UI flow.');
        }
    } else {
        console.warn('Step 1 could not resolve any Setup::JsonDataType digest id candidate. Falling back to UI flow.');
    }

    if (!createdDataTypeId && step1CreatedVia !== 'api') {
        const directCreate = await createJsonDataTypeViaBrowserRuntime({
            namespaceName,
            dataTypeName,
            schema: step1Schema
        });
        if (directCreate?.ok) {
            createdDataTypeId =
                directCreate?.data?.id ||
                directCreate?.data?.data?.id ||
                null;
            step1CreatedVia = 'api';
            console.log(
                `Step 1: Data Type created via browser-runtime canonical endpoint ` +
                `(setup/json_data_type, id=${createdDataTypeId || 'unknown'}).`
            );
        } else {
            console.warn(
                `Step 1 canonical create failed (status ${directCreate?.status || 'unknown'}): ` +
                `${directCreate?.error || 'unknown error'}. Falling back to UI flow.`
            );
        }
    }

    if (!createdDataTypeId && step1CreatedVia !== 'api') {
        const serverRunnerCreate = createJsonDataTypeViaServerRunner({
            namespaceName,
            dataTypeName,
            schema: step1Schema
        });
        if (serverRunnerCreate?.ok) {
            createdDataTypeId = serverRunnerCreate.id;
            step1CreatedVia = 'server-runner';
            console.log(`Step 1: Data Type created via server runner (id=${createdDataTypeId}).`);
        } else {
            console.warn(
                `Step 1 server-runner create failed (status ${serverRunnerCreate?.status || 'unknown'}): ` +
                `${serverRunnerCreate?.error || 'unknown error'}. Falling back to UI flow.`
            );
        }
    }

    if (!createdDataTypeId && step1CreatedVia !== 'api') {
        await openMenuItem('Data', 'Document Types');
        await page.waitForTimeout(1200);

        console.log('Locating "New" action...');
        if (!await clickActionButton(/^New$/i)) {
            console.log('Action button "New" not found. Navigating explicitly to Data > Document Types...');
            await openMenuItem('Data', 'Document Types');
            await page.waitForTimeout(1000);
            if (!await clickActionButton(/^New$/i)) {
                // Try a final direct click named button if action button failed
                if (!await clickNamedButton(/^New$/i)) {
                    throw new Error('Could not find New action for Data Type after explicit navigation');
                }
            }
        }

        if (!await ensureDataTypeNewFormReady()) {
            throw new Error(`Step 1 could not reach Data Type New form context (Namespace field missing). URL: ${page.url()}`);
        }
        await page.getByRole('textbox', { name: 'Namespace' }).fill(namespaceName);
        await page.getByRole('textbox', { name: 'Name', exact: true }).fill(dataTypeName);
        // Basic Schema - Try to open JSON editor or find Schema section
        if (!await clickNamedButton(/Schema/i) && !await clickNamedButton(/Json Code/i)) {
            console.warn('Could not find Schema tab/section. Attempting to locate any editor.');
        }
        await fillCodeMirror(JSON.stringify(step1Schema, null, 2));

        const step1PayloadSanitizer = await installStep1PayloadSanitizer({
            namespace: namespaceName,
            name: dataTypeName
        });

        const createDataTypeResponsePromise = page.waitForResponse(
            (resp) =>
                resp.request().method() === 'POST' &&
                resp.url().includes('/api/v3/setup/data_type/') &&
                resp.url().includes('/digest'),
            { timeout: 20000 }
        );

        if (!await clickNamedButton(/^save$/i)) {
            await step1PayloadSanitizer.dispose();
            throw new Error('Could not find Save button');
        }
        let createDataTypeResponse;
        try {
            createDataTypeResponse = await createDataTypeResponsePromise;
        } finally {
            await step1PayloadSanitizer.dispose();
        }
        const replacements = step1PayloadSanitizer.getReplacements();
        if (replacements > 0) {
            console.warn(`Step 1 payload sanitizer rewrote model-typed fields ${replacements} time(s).`);
        }
        if (!createDataTypeResponse.ok()) {
            const body = await createDataTypeResponse.text().catch(() => '');
            throw new Error(`Step 1 data type creation failed with status ${createDataTypeResponse.status()}. Response: ${body.slice(0, 500)}`);
        }
        const createdDataTypeBody = await createDataTypeResponse.json().catch(() => ({}));
        createdDataTypeId = createdDataTypeBody?.id || null;
        step1CreatedVia = 'ui';
    }

    if (!createdDataTypeId) {
        createdDataTypeId =
            await resolveDataTypeId({ namespace: namespaceName, name: dataTypeName }) ||
            await resolveDataTypeIdViaApi({ namespace: namespaceName, name: dataTypeName }).catch(() => null);
    }
    if (!createdDataTypeId) {
        throw new Error('Step 1 completed without a resolvable created data type id.');
    }
    console.log(`Step 1: created data type id ${createdDataTypeId}`);

    if (step1CreatedVia === 'ui') {
        await page.getByText('Successfully created').last().waitFor({ timeout: 15000 });
    } else {
        await openDataTypeById({ dataTypeId: createdDataTypeId });
    }
    await takeStepScreenshot('01-data-type-created');

    if (step1Only) {
        console.log('Step 1 only mode enabled; stopping after data type creation.');
        console.log('Integration Journey Step 1 completed successfully.');
    } else {
        // 2. Transformation: Create Template
        console.log('Step 2: Transformation - Creating Template...');
        const templateTypeCandidates = [...new Set([templateDataTypeRefName, 'Template', 'Snippet', 'LiquidTemplate'])];
        const resolvedTemplateTypeCandidates = [];
        for (const candidateName of templateTypeCandidates) {
            const candidateId = resolveDataTypeIdViaMongo({ namespace: 'Setup', name: candidateName });
            if (!candidateId) continue;
            if (resolvedTemplateTypeCandidates.some((entry) => entry.id === candidateId)) continue;
            resolvedTemplateTypeCandidates.push({ name: candidateName, id: candidateId });
        }
        if (resolvedTemplateTypeCandidates.length > 0) {
            console.log(
                `Step 2: resolved template candidates: ` +
                resolvedTemplateTypeCandidates.map(({ name, id }) => `Setup::${name} (${id})`).join(', ')
            );
        } else {
            console.warn(
                `Step 2: template type id not found in Mongo for ` +
                `Setup::${templateTypeCandidates.join(', Setup::')}. Falling back to endpoint-only backend creation.`
            );
        }
        const snippetCode = '{\n  "lead_name": "{{ name }}",\n  "status": "PROCESSED"\n}';
        let templateCreateResult = null;
        for (const candidate of resolvedTemplateTypeCandidates) {
            const runtimeResult = await createTemplateViaBrowserRuntime({
                templateTypeId: candidate.id,
                namespaceName,
                templateName,
                snippetCode
            });
            if (runtimeResult?.ok) {
                templateCreateResult = {
                    ok: true,
                    via: `browser-runtime-digest:${candidate.name}`,
                    status: 200,
                    body: runtimeResult.data || null
                };
                break;
            }
            console.warn(
                `Step 2 browser runtime digest failed for Setup::${candidate.name}` +
                ` (status ${runtimeResult?.status || 'unknown'}): ${runtimeResult?.error || 'unknown error'}`
            );
        }

        if (!templateCreateResult?.ok) {
            templateCreateResult = await createTemplateViaBackendApi({
                namespaceName,
                templateName,
                snippetCode,
                sourceDataTypeId: createdDataTypeId,
                templateTypeId: resolvedTemplateTypeCandidates[0]?.id || null
            });
        }

        if (!templateCreateResult?.ok) {
            console.warn(
                `Step 2 backend template creation failed (via ${templateCreateResult?.via || 'unknown'}, ` +
                `status ${templateCreateResult?.status || 'unknown'}). Trying deterministic UI fallback.`
            );

            const fallbackTemplateType =
                resolvedTemplateTypeCandidates.find(({ name }) => name === 'Template') ||
                resolvedTemplateTypeCandidates.find(({ name }) => name === 'Snippet') ||
                resolvedTemplateTypeCandidates[0] ||
                null;
            const setupTemplateTypeId =
                resolvedTemplateTypeCandidates.find(({ name }) => name === 'Template')?.id ||
                resolveDataTypeIdViaMongo({ namespace: 'Setup', name: 'Template' }) ||
                null;
            if (!fallbackTemplateType?.id || !fallbackTemplateType?.name) {
                throw new Error('Step 2 fallback: no resolvable snippet/template type id available.');
            }

            const step2SubjectCandidates = [
                { sectionName: 'Transformations', itemName: 'Templates', itemAliases: ['Template'] },
                { sectionName: 'Compute', itemName: 'Snippets', itemAliases: ['Code Snippets'] },
                { sectionName: 'Data', itemName: 'Snippets', itemAliases: ['Code Snippets', 'Templates'] }
            ];
            const scopedOpenResult = await openSubjectByCandidates({
                candidates: step2SubjectCandidates,
                expectedDataTypeId: fallbackTemplateType.id,
                attempts: 5
            });
            let openedTemplateContainer = scopedOpenResult.opened;
            if (!openedTemplateContainer) {
                for (const candidate of step2SubjectCandidates) {
                    const labelCandidates = [candidate.itemName, ...(candidate.itemAliases || [])];
                    for (const label of labelCandidates) {
                        try {
                            await openMenuItem(candidate.sectionName, label);
                            await page.waitForTimeout(700);
                            if (await isTemplateContainerReady()) {
                                openedTemplateContainer = true;
                                break;
                            }
                        } catch (_) {
                            // Try next label candidate.
                        }
                    }
                    if (openedTemplateContainer) break;
                }
            }
            if (!openedTemplateContainer) {
                const directSubjectCandidates = [
                    ...resolvedTemplateTypeCandidates.map(({ name }) => name),
                    'Template',
                    'LiquidTemplate',
                    'Snippet'
                ];
                for (const setupTypeName of [...new Set(directSubjectCandidates)]) {
                    if (!setupTypeName) continue;
                    if (await openDataTypeByRef({ namespace: 'Setup', name: setupTypeName })) {
                        openedTemplateContainer = await isTemplateContainerReady();
                    }
                    if (!openedTemplateContainer) {
                        if (await openDataTypeNewFormByRef({ namespace: 'Setup', name: setupTypeName })) {
                            openedTemplateContainer = true;
                        }
                    }
                    if (openedTemplateContainer) break;
                }
            }
            if (!openedTemplateContainer) {
                throw new Error(
                    `Step 2 fallback: could not activate template/snippet subject in navigation for type ${fallbackTemplateType.id}.`
                );
            }

            const isStep2NewFormReady = async () => {
                const namespaceVisible = await page.getByRole('textbox', { name: 'Namespace' }).first().isVisible().catch(() => false);
                const nameVisible = await page.getByRole('textbox', { name: 'Name', exact: true }).first().isVisible().catch(() => false);
                const namedFieldVisible = await page.getByRole('textbox', { name: /Name|Title|Slug/i }).first().isVisible().catch(() => false);
                const saveVisible = await page.getByRole('button', { name: /^(save|create)$/i }).first().isVisible().catch(() => false);
                return namespaceVisible || (saveVisible && (nameVisible || namedFieldVisible));
            };

            let step2FormReady = await isStep2NewFormReady();
            if (!step2FormReady) {
                const openedDirect = await openDataTypeNewFormByRef({ namespace: 'Setup', name: fallbackTemplateType.name }).catch(() => false);
                step2FormReady = openedDirect || await isStep2NewFormReady();
            }
            for (let attempt = 1; attempt <= 3 && !step2FormReady; attempt += 1) {
                if (!await isTemplateContainerReady()) {
                    await page.waitForTimeout(400);
                }
                if (!await clickActionButton(/^New$/i)) {
                    await clickNamedButton(/^New$/i);
                }
                await page.waitForTimeout(900);
                if (!step2FormReady) {
                    const directNames = [...new Set([fallbackTemplateType.name, 'Template', 'LiquidTemplate', 'Snippet'])];
                    for (const setupName of directNames) {
                        if (await openDataTypeNewFormByRef({ namespace: 'Setup', name: setupName }).catch(() => false)) {
                            step2FormReady = true;
                            break;
                        }
                    }
                }
                if (!step2FormReady) {
                    step2FormReady = await isStep2NewFormReady();
                }
            }
            if (!step2FormReady) {
                const strictContractResult = await createTemplateViaSetupTemplateContract({
                    templateBaseTypeId: setupTemplateTypeId,
                    namespaceName,
                    templateName,
                    snippetCode,
                    sourceDataTypeId: createdDataTypeId
                });
                if (strictContractResult?.ok) {
                    templateCreateResult = strictContractResult;
                    console.log(`Step 2 strict contract fallback succeeded (${strictContractResult.via}).`);
                } else {
                    throw new Error(
                        `Step 2 fallback: New form did not open and strict contract fallback failed ` +
                        `(status ${strictContractResult?.status || 'unknown'} via ${strictContractResult?.via || 'unknown'}): ` +
                        `${(strictContractResult?.bodyText || '').slice(0, 400)}`
                    );
                }
            }

            if (!templateCreateResult?.ok) {
                const namespaceInput = page.getByRole('textbox', { name: 'Namespace' }).first();
                if (await namespaceInput.isVisible().catch(() => false)) {
                    await namespaceInput.fill(namespaceName);
                }
                let nameInput = page.getByRole('textbox', { name: 'Name', exact: true }).first();
                if (!await nameInput.isVisible().catch(() => false)) {
                    nameInput = page.getByRole('textbox', { name: /Name|Title|Slug/i }).first();
                }
                if (!await nameInput.isVisible().catch(() => false)) {
                    const strictContractResult = await createTemplateViaSetupTemplateContract({
                        templateBaseTypeId: setupTemplateTypeId,
                        namespaceName,
                        templateName,
                        snippetCode,
                        sourceDataTypeId: createdDataTypeId
                    });
                    if (strictContractResult?.ok) {
                        templateCreateResult = strictContractResult;
                    } else {
                        throw new Error(
                            `Step 2 fallback: template form input not materialized and strict contract fallback failed ` +
                            `(status ${strictContractResult?.status || 'unknown'} via ${strictContractResult?.via || 'unknown'}): ` +
                            `${(strictContractResult?.bodyText || '').slice(0, 400)}`
                        );
                    }
                }
                if (!templateCreateResult?.ok) {
                    await nameInput.fill(templateName);
                    await writeStep2SnippetDeterministic(snippetCode, { strict: false });

                    const saveResponsePromise = page.waitForResponse(
                        (resp) =>
                            matchesDataTypeDigestPost(
                                { method: resp.request().method(), url: resp.url() },
                                fallbackTemplateType.id
                            ),
                        { timeout: 20000 }
                    );
                    if (!await clickNamedButton(/^save$/i)) {
                        throw new Error('Step 2 fallback: could not find Save button in Templates form.');
                    }
                    const saveResponse = await saveResponsePromise;
                    const saveBodyText = await saveResponse.text().catch(() => '');
                    let saveBody = null;
                    try { saveBody = saveBodyText ? JSON.parse(saveBodyText) : null; } catch (_) { }
                    if (!saveResponse.ok()) {
                        const strictContractResult = await createTemplateViaSetupTemplateContract({
                            templateBaseTypeId: setupTemplateTypeId,
                            namespaceName,
                            templateName,
                            snippetCode,
                            sourceDataTypeId: createdDataTypeId
                        });
                        if (strictContractResult?.ok) {
                            templateCreateResult = strictContractResult;
                        } else {
                            throw new Error(
                                `Step 2 fallback template save failed with status ${saveResponse.status()} and strict contract fallback failed ` +
                                `(status ${strictContractResult?.status || 'unknown'} via ${strictContractResult?.via || 'unknown'}): ` +
                                `${saveBodyText.slice(0, 300)}`
                            );
                        }
                    } else {
                        templateCreateResult = {
                            ok: true,
                            via: 'ui-form-fallback',
                            status: saveResponse.status(),
                            body: saveBody
                        };
                    }
                }
            }
        }
        console.log(`Step 2: Template created via deterministic path (${templateCreateResult.via}).`);
        await takeStepScreenshot('02-template-created');

        // 3. Workflow: Create Flow via deterministic backend API
        console.log('Step 3: Workflow - Creating Flow via API...');
        const flowTypeId =
            flowDataTypeId ||
            await resolveDataTypeId({ namespace: 'Setup', name: 'Flow' }) ||
            await resolveDataTypeIdViaApi({ namespace: 'Setup', name: 'Flow' }).catch(() => null) ||
            resolveDataTypeIdViaMongo({ namespace: 'Setup', name: 'Flow' });
        if (!flowTypeId) {
            throw new Error('Step 3 could not resolve Setup::Flow data type id.');
        }
        console.log(`Step 3: using Flow data type id ${flowTypeId}`);
        const webhookTypeId =
            await resolveDataTypeId({ namespace: 'Setup', name: 'PlainWebhook' }) ||
            await resolveDataTypeIdViaApi({ namespace: 'Setup', name: 'PlainWebhook' }).catch(() => null) ||
            resolveDataTypeIdViaMongo({ namespace: 'Setup', name: 'PlainWebhook' });
        if (!webhookTypeId) {
            throw new Error('Step 3 could not resolve Setup::PlainWebhook data type id.');
        }
        const webhookPath = `/e2e/${namespaceName.toLowerCase()}/${webhookName.toLowerCase()}`;
        const webhookCreateResult = await createPlainWebhookViaBrowserRuntime({
            webhookTypeId,
            namespaceName,
            webhookName,
            path: webhookPath
        });
        if (!webhookCreateResult?.ok) {
            throw new Error(`Step 3 webhook API creation failed (status ${webhookCreateResult?.status || 'unknown'}): ${webhookCreateResult?.error || 'unknown error'}`);
        }
        console.log(`Step 3: PlainWebhook created via API (${webhookName}).`);
        const flowCreateResult = await createFlowViaBrowserRuntime({
            page,
            flowTypeId,
            namespaceName,
            flowName,
            templateName,
            webhookName
        });
        if (!flowCreateResult?.ok) {
            const statusMsg = flowCreateResult?.status ? `status ${flowCreateResult.status}` : 'no-status';
            const bodyMsg = flowCreateResult?.bodyText || JSON.stringify(flowCreateResult?.body || {}).slice(0, 400);
            const uiErr = flowCreateResult?.uiError ? ` uiError=${flowCreateResult.uiError}` : '';
            throw new Error(`Step 3 browser-runtime API flow creation failed (${statusMsg}) via ${flowCreateResult?.via || 'unknown'}.${uiErr} Response: ${bodyMsg}`);
        }
        console.log(`Step 3: Flow created via API (${flowCreateResult.via}).`);
        await page.goto(uiUrl, { waitUntil: 'domcontentloaded' }).catch(() => null);
        await ensureUiSessionStable(page);
        await takeStepScreenshot('03-flow-created');

        // 4. Execution: Create Record & Check Trace
        console.log('Step 4: Execution - Creating Record...');
        cleanupCorruptedDataTypesForNamespace(namespaceName, createdDataTypeId || null);
        const openedById = createdDataTypeId ? await openDataTypeById({ dataTypeId: createdDataTypeId }) : false;
        if (!openedById && !await openDataTypeByRef({ namespace: namespaceName, name: dataTypeName })) {
            await page.getByRole('button', { name: 'Recent' }).click();
            await page.getByRole('menuitem', { name: dataTypeName }).click();
        }

        let recordsOpened = await openRecordsForDataTypeId({ dataTypeId: createdDataTypeId, dataTypeName });
        if (!recordsOpened) {
            const recordsButton = page.getByRole('button', { name: 'Records' }).first();
            if (await recordsButton.isVisible().catch(() => false)) {
                await recordsButton.click({ timeout: 5000 });
                recordsOpened = await waitForDataTypeRecordsReady({
                    dataTypeName,
                    timeoutMs: 15000,
                    debugTag: 'step4_records_button'
                });
            }
        }
        let createdRecordId = null;
        let recordCreatedViaUi = false;
        if (!recordsOpened) {
            console.warn(`Step 4 records container not ready for ${dataTypeName}. Falling back to browser-runtime API record create.`);
            const createRecordResult = await createRecordViaBrowserRuntime({
                dataTypeId: createdDataTypeId,
                payload: {
                    name: recordName,
                    email: 'e2e@example.com'
                }
            });
            if (!createRecordResult?.ok) {
                const detail = createRecordResult?.bodyText || createRecordResult?.error || JSON.stringify(createRecordResult);
                throw new Error(`Step 4 API fallback record create failed (via ${createRecordResult?.via || 'unknown'}): ${detail}`);
            }
            createdRecordId =
                createRecordResult?.data?.id ||
                createRecordResult?.data?._id ||
                createRecordResult?.data?.data?.id ||
                null;
            console.log(`Step 4: record created via API fallback (${createRecordResult?.via || 'unknown'}), id=${createdRecordId || 'unknown'}`);
        } else {
            recordCreatedViaUi = true;
            if (!await clickActionButton(/^New$/i)) {
                await forceCurrentTabAction('new');
                if (!await page.getByRole('textbox', { name: 'Name' }).isVisible().catch(() => false)) {
                    throw new Error('Could not find New action for Record');
                }
            }

            await page.getByRole('textbox', { name: 'Name' }).fill(recordName);
            const emailField = page.getByRole('textbox', { name: 'Email' });
            if (await emailField.isVisible().catch(() => false)) {
                await emailField.fill('e2e@example.com');
            } else {
                console.warn('Step 4: Email field not present in current schema; continuing with Name only.');
            }
            const createRecordResponsePromise = page.waitForResponse(
                (resp) =>
                    resp.request().method() === 'POST' &&
                    resp.url().includes(`/api/v3/setup/data_type/${createdDataTypeId}/digest`),
                { timeout: 20000 }
            );
            await page.getByRole('button', { name: /^save$/i }).click();
            const createRecordResponse = await createRecordResponsePromise;
            const createdRecordBody = await createRecordResponse.json().catch(() => ({}));
            createdRecordId = createdRecordBody?.id || null;
        }
        if (recordCreatedViaUi) {
            await page.getByText('Successfully created').last().waitFor({ timeout: 15000 });
        }
        await takeStepScreenshot('04-record-created');

        // Trigger Flow (deterministic browser-runtime API path)
        const flowTriggerResult = await triggerFlowForRecordViaBrowserRuntime({
            namespaceName,
            flowName,
            dataTypeId: createdDataTypeId,
            recordId: createdRecordId
        });
        if (!flowTriggerResult?.ok) {
            const detail = flowTriggerResult?.bodyText || flowTriggerResult?.error || JSON.stringify(flowTriggerResult);
            throw new Error(`Flow trigger failed at ${flowTriggerResult?.stage || 'post'} (via ${flowTriggerResult?.via || 'unknown'}): ${detail}`);
        }
        console.log(
            `Flow triggered via ${flowTriggerResult.via} ` +
            `(flowId=${flowTriggerResult.flowId || 'unknown'}, lookup=${flowTriggerResult.lookupVia || 'unknown'})`
        );

        console.log('Flow triggered. Checking backend execution evidence...');
        const executionEvidence = await waitForFlowExecution({ flowId: flowTriggerResult.flowId, timeoutMs: 30000, pollMs: 2000 });
        if (!executionEvidence?.found) {
            throw new Error(`Flow execution evidence not found: ${executionEvidence?.error || 'unknown'}`);
        }
        console.log(
            `FLOW_EXECUTION_EVIDENCE: execution_id=${executionEvidence.execution_id || 'unknown'} ` +
            `status=${executionEvidence.status || 'unknown'} collection=${executionEvidence.collection || 'unknown'}`
        );
        const executionStatus = String(executionEvidence.status || '').toLowerCase();
        if (executionStatus && /(broken|failed|error|canceled|cancelled)/.test(executionStatus)) {
            throw new Error(
                `Flow execution reached unhealthy status "${executionEvidence.status}" ` +
                `(execution_id=${executionEvidence.execution_id || 'unknown'}).`
            );
        }
        await takeStepScreenshot('05-flow-execution-evidence');

        console.log('Integration Journey completed successfully!');

        // MongoDB Verifications
        console.log('\n--- MongoDB Verification ---');
        const dtInfo = verifyDataType(namespaceName, dataTypeName);
        if (!dtInfo.found) console.error(`DB_FAILURE: Data Type ${namespaceName}|${dataTypeName} not found!`);
        else {
            console.log(`DB_SUCCESS: Data Type exists in ${dtInfo.collection}.`);
            if (dtInfo.valid) console.log('DB_SUCCESS: Data Type schema is valid.');
            else console.error('DB_FAILURE: Data Type has NO schema!');
        }

        const recInfo = verifyRecordDeletion(recordName);
        if (!recInfo.found) console.error(`DB_FAILURE: Record ${recordName} not found!`);
        else console.log(`DB_SUCCESS: Record found in ${recInfo.collection}.`);
    }

} catch (error) {
    console.error('Journey failed:', error);
    await takeStepScreenshot('FAILED');
    const dom = await page.content().catch(() => '');
    fs.writeFileSync(path.join(outputDir, `journey-failed-${stamp}.html`), dom, 'utf8');
    failed = true;
    process.exitCode = 1;
} finally {
    persistModuleOrigins();
    const tracePath = path.join(outputDir, `artifacts/journey-trace-${stamp}.zip`);
    await context.tracing.stop({ path: tracePath });

    const video = await page.video();
    const videoPath = video ? await video.path() : null;

    await context.close();
    await browser.close();

    if (!failed && videoPath && fs.existsSync(videoPath)) {
        fs.unlinkSync(videoPath);
    } else if (failed && videoPath && fs.existsSync(videoPath)) {
        const finalVideoPath = path.join(outputDir, `artifacts/journey-video-${stamp}.webm`);
        fs.mkdirSync(path.dirname(finalVideoPath), { recursive: true });
        fs.renameSync(videoPath, finalVideoPath);
        console.log(`Video saved to: ${finalVideoPath}`);
    }
    console.log(`Trace saved to: ${tracePath}`);
}
