# UI Dependency Upgrade Matrix

Updated: February 18, 2026
Branch: `codex/ui-techdebt-roadmap`

## Baseline Evidence

- `npm ci --legacy-peer-deps`: completed.
- Legacy CRA build required `NODE_OPTIONS=--openssl-legacy-provider`.
- Baseline delegated E2E:
  - Login wrapper: failed at OAuth redirect timeout.
  - Contact flow wrapper (default namespace): failed at pre-existing cleanup state.

## Post-Migration + Tech Debt Verification

- `npm run build` (Vite): pass.
- `npm run typecheck`: pass.
- `npm test` (Vitest): pass with contract tests.
- Docker build (`cenit-ui:migration-check`): pass.
- Build chunk improved after menu/config import split:
  - from `index-CCjQ-347.js` (~1,723 KB) to `index-Dz_DSedl.js` (~1,628 KB).

## Upgrade Matrix

| Area | Previous | Target / Applied | Risk | Owner files |
|---|---|---|---|---|
| Build tool | `react-scripts@4` (CRA) | `vite@7`, `@vitejs/plugin-react`, `vitest` | High (bundler/runtime behavior) | `package.json`, `vite.config.mjs`, `index.html`, `Dockerfile` |
| React | `react@17`, `react-dom@17` | `react@19`, `react-dom@19` | High (render/runtime changes) | `package.json`, `src/main.jsx`, `src/index.jsx` |
| MUI core/icons | `@material-ui/*` v4 | `@mui/material@7`, `@mui/icons-material@7` + `sx`/theme styles | High (import/theme/styling APIs) | `src/**/*` |
| Date pickers | `@material-ui/pickers` + `@date-io/*` | `@mui/x-date-pickers` + `AdapterDateFns` | Medium/High (component API changes) | `src/App.jsx`, `src/components/*Date*` |
| HTTP/Rx/query | `axios@0.27`, `rxjs@6`, `query-string@6` | `axios@1`, `rxjs@7`, `query-string@9` | Medium | `package.json`, `src/services/*`, `src/App.jsx` |
| Date utils | mixed (`date-fns` + `moment`) | `date-fns@4` only | Medium | `package.json`, `src/viewers/*Date*` |
| Type safety | no TypeScript scaffold | `tsconfig.json`, typed contracts, `npm run typecheck` | Medium | `tsconfig.json`, `src/types/*`, `package.json`, `.github/workflows/ci.yml` |
| Service modularity | monolithic `DataTypeService` | extracted helper modules under `src/services/dataType/*` | Medium | `src/services/DataTypeService.jsx`, `src/services/dataType/*` |
| Image widget | `material-ui-image` | internal `ImageWithFallback` | Low/Medium | `src/components/ImageWithFallback.jsx`, `src/components/CollectionsView.jsx` |
| SDK pinning | floating GitHub ref | pinned commit `11f23353162c79bcf84b289b23add41b88230aab` | Medium | `package.json` |

## Hotspot Inventory (Implementation Focus)

- Styling surface migrated from `makeStyles`/`withStyles` to `sx`/theme primitives.
- Date/time controls (`DatePicker` / `DateTimePicker` / `TimePicker` / provider): ~21 call sites.
- JSX-bearing files migrated to `.jsx`: 407 files.
- Legacy markers removed (`@material-ui`, `react-scripts`, `ReactDOM.render`): 0 remaining matches in `src` and `package.json`.

## Known Follow-up Items

- `scripts/e2e/cenit_ui_login.sh` remains flaky in some environments due OAuth redirect timeout.
- Contact flow cleanup can still fail when delete controls render outside viewport in delegated backend runner.
- `@mui/styles` dependency removed from source and package manifest.
- Bundle size is still large; manual chunking can be tuned in a follow-up.
