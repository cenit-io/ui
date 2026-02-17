# Cenit UI

![Cenit banner](https://user-images.githubusercontent.com/4213488/150586701-53545c9b-b4f9-497f-9782-ef6a19715ecd.svg)

[![GHCR Docker Publish](https://github.com/cenit-io/ui/actions/workflows/docker-publish.yml/badge.svg)](https://github.com/cenit-io/ui/actions/workflows/docker-publish.yml)
[![License](https://img.shields.io/github/license/cenit-io/ui)](LICENSE.md)

React-based administration interface for the [Cenit](https://github.com/cenit-io/cenit) platform.

## Table of contents

- [Repositories](#repositories)
- [Tech Stack](#tech-stack)
- [Quick start (recommended: backend compose)](#quick-start-recommended-backend-compose)
- [Local development](#local-development)
- [Runtime configuration](#runtime-configuration)
- [E2E checks](#e2e-checks)
- [Run UI image standalone](#run-ui-image-standalone)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## Repositories

- Backend: [cenit-io/cenit](https://github.com/cenit-io/cenit)
- UI (this repo): [cenit-io/ui](https://github.com/cenit-io/ui)

## Tech Stack

- React 19
- Vite 7
- MUI 7 (`@mui/material`, `@mui/icons-material`, `@mui/x-date-pickers`)
- Runtime config via `window.appConfig` (`config.js`)

## Quick start (recommended: backend compose)

This UI is usually run by the backend Docker Compose stack.

### Prerequisites

- Docker Desktop (or Docker Engine + Compose v2 plugin)
- `git`
- Node.js 20.x (for local `npm` workflows)

### 1) Clone both repos side by side

```bash
git clone https://github.com/cenit-io/cenit.git
git clone https://github.com/cenit-io/ui.git
```

Expected layout:

```text
cenit-io/
  cenit/
  ui/
```

### 2) Start from backend repo

```bash
cd cenit
docker compose up -d --build
docker compose ps
```

### 3) Open services

- UI: [http://localhost:3002](http://localhost:3002)
- Backend: [http://localhost:3000](http://localhost:3000)
- RabbitMQ: [http://localhost:15672](http://localhost:15672)

If `ui` is not at `../ui`, set:

```bash
export CENIT_UI_CONTEXT=/absolute/path/to/ui
docker compose up -d --build
```

## Local development

Install dependencies and run the Vite dev server:

```bash
npm ci --legacy-peer-deps
npm start
```

Notes:

- UI dev server runs at `http://localhost:3002`.
- Backend is expected at `http://localhost:3000`.
- If `3002` is already in use, stop the running UI container/process first.

Other scripts:

```bash
npm test
npm run build
```

## Runtime configuration

Runtime values are injected through `config.js` (`window.appConfig`), especially in Docker runtime.

Resolution order:

1. `window.appConfig` (runtime `config.js`)
2. `import.meta.env`
3. UI defaults (`admin`, `http://localhost:3000`, `http://localhost:3002`)

Important variables:

```env
REACT_APP_USE_ENVIRONMENT_CONFIG=true
REACT_APP_TIMEOUT_SPAN=300000
REACT_APP_APP_ID=admin
REACT_APP_LOCALHOST=http://localhost:3002
REACT_APP_CENIT_HOST=http://localhost:3000
```

Related backend values (from backend compose):

```env
HOMEPAGE=http://localhost:3000
CENIT_UI=http://localhost:3002
```

## E2E checks

UI E2E scripts in this repo delegate to backend scripts so both repos share one stable contract.

### Login check

```bash
scripts/e2e/cenit_ui_login.sh
# or
npm run e2e:login
```

### Contact flow (idempotent contract)

```bash
scripts/e2e/cenit_ui_contact_flow.sh
# or
npm run e2e:contact-flow
```

Default contract:

- Namespace: `E2E_CONTACT_FLOW`
- Data type: `Contact`
- Record: `John Contact E2E`
- Cleanup enabled by default (`CENIT_E2E_CLEANUP=1`)

Useful overrides:

```bash
# Reuse running backend stack
CENIT_E2E_AUTOSTART=0 scripts/e2e/cenit_ui_contact_flow.sh

# Run headed
CENIT_E2E_HEADED=1 scripts/e2e/cenit_ui_contact_flow.sh

# Use a unique namespace (helps CI and local validation without cleanup collisions)
CENIT_E2E_DATATYPE_NAMESPACE="E2E_UI_$(date +%s)" \
CENIT_E2E_CLEANUP=0 \
scripts/e2e/cenit_ui_contact_flow.sh
```

If backend repo is not a sibling at `../cenit`:

```bash
export CENIT_ROOT=/absolute/path/to/cenit
```

Artifacts are produced by the backend runner at:

- `../cenit/output/playwright`

## CI checks

This repo includes a `UI CI` workflow for `pull_request` to `develop`/`master` and `push` to `develop`:

1. `npm ci --legacy-peer-deps`
2. `npm run build`
3. headless delegated contact-flow E2E (`scripts/e2e/cenit_ui_contact_flow.sh`)

## Run UI image standalone

```bash
docker pull ghcr.io/cenit-io/ui:latest
docker run -dti \
  -e REACT_APP_USE_ENVIRONMENT_CONFIG=true \
  -e REACT_APP_APP_ID=admin \
  -e REACT_APP_LOCALHOST=http://127.0.0.1:3002 \
  -e REACT_APP_CENIT_HOST=http://127.0.0.1:3000 \
  -p 3002:80 \
  --name cenit-ui \
  ghcr.io/cenit-io/ui:latest
```

Then open [http://localhost:3002](http://localhost:3002).

## Troubleshooting

For end-to-end Docker setup details, see:

- [Docker-instalation.md](Docker-instalation.md)
- [development.md](development.md)

## Contributing

Contributions are welcome.

- Report bugs and request features in the backend issue tracker:
  [github.com/cenit-io/cenit/issues](https://github.com/cenit-io/cenit/issues)
- Open UI pull requests here:
  [github.com/cenit-io/ui/pulls](https://github.com/cenit-io/ui/pulls)

## License

See [LICENSE.md](LICENSE.md).
