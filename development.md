# Cenit UI Development

This React app is the admin UI for a local Cenit backend.

## Local Flow (Migration Baseline)

- Backend URL: `http://localhost:3000`
- UI URL: `http://localhost:3002` (Docker and Vite dev server)

For Docker-based local development, run the stack from the backend repo:

```bash
cd /path/to/cenit
docker compose up -d --build
```

## Runtime Variables

When running with runtime config injection (`config.js`), use:

```env
REACT_APP_USE_ENVIRONMENT_CONFIG=true
REACT_APP_APP_ID=admin
REACT_APP_LOCALHOST=http://localhost:3002
REACT_APP_CENIT_HOST=http://localhost:3000
```

## Available Scripts

In this repository:

```bash
npm start
npm test
npm run build
```

`npm start` serves the UI on `http://localhost:3002` (Vite behavior in this repo).

## Docker (UI image only)

```bash
docker build . -t cenit-ui
docker run -dti \
  -e REACT_APP_LOCALHOST=http://127.0.0.1:3002 \
  -e REACT_APP_CENIT_HOST=http://127.0.0.1:3000 \
  -p 3002:80 \
  --name cenit-ui \
  cenit-ui:latest
```
