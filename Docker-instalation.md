# Docker Installation Guide

This guide explains how to run Cenit locally with Docker Compose using:

- Backend repo: [cenit](https://github.com/cenit-io/cenit)
- UI repo: [ui](https://github.com/cenit-io/ui)

## Prerequisites

- Docker Desktop (or Docker Engine + Compose v2)
- Git

## Directory Layout

Default expected structure:

```text
cenit-io/
  cenit/
  ui/
```

The backend compose file (`cenit/docker-compose.yml`) builds the UI from:

```yaml
services:
  ui:
    build:
      context: ${CENIT_UI_CONTEXT:-./../ui}
```

If your UI checkout is elsewhere:

```bash
export CENIT_UI_CONTEXT=/absolute/path/to/ui
```

## Start the Stack

Run from the backend repository:

```bash
cd /path/to/cenit
docker compose up -d --build
docker compose ps
```

## Local URLs

- UI: http://localhost:3002
- Backend: http://localhost:3000
- RabbitMQ: http://localhost:15672

Health check:

```bash
curl -I http://localhost:3000
```

## Key Runtime Variables

UI container defaults:

```env
REACT_APP_USE_ENVIRONMENT_CONFIG=true
REACT_APP_TIMEOUT_SPAN=300000
REACT_APP_APP_ID=admin
REACT_APP_LOCALHOST=http://localhost:3002
REACT_APP_CENIT_HOST=http://localhost:3000
```

Build note:

- UI image now builds with Vite (`npm run build`) and serves static assets from `/usr/share/nginx/html`.

Backend container defaults:

```env
HOMEPAGE=http://localhost:3000
CENIT_UI=http://localhost:3002
```

## Migration Baseline Notes

- Current backend Dockerfile baseline uses Ruby `3.2.2`.
- Current compose baseline uses MongoDB `7.0`.
- Backend is served by Unicorn on container port `8080`, mapped to host `3000`.

## Validate Login Once

Run the scripted UI login flow:

```bash
cd /path/to/ui
scripts/e2e/cenit_ui_login.sh
```

Optional custom credentials:

```bash
CENIT_E2E_EMAIL="support@cenit.io" \
CENIT_E2E_PASSWORD="password" \
CENIT_SERVER_URL="http://localhost:3000" \
CENIT_UI_URL="http://localhost:3002" \
scripts/e2e/cenit_ui_login.sh
```

## Validate Contact Flow (Idempotent)

Run the full scripted flow:

```bash
scripts/e2e/cenit_ui_contact_flow.sh
```

Default resource contract:

- Namespace: `E2E_CONTACT_FLOW`
- Data type: `Contact`
- Record: `John Contact E2E`
- Cleanup enabled (`CENIT_E2E_CLEANUP=1`)
- Artifacts under `../cenit/output/playwright`

Optional:

```bash
CENIT_E2E_AUTOSTART=0 \
CENIT_E2E_DRIVER=node \
CENIT_E2E_CLEANUP=1 \
scripts/e2e/cenit_ui_contact_flow.sh
```

If backend repository is not sibling `../cenit`:

```bash
export CENIT_ROOT=/absolute/path/to/cenit
```
