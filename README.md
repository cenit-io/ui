![cenit_io](https://user-images.githubusercontent.com/4213488/150586701-53545c9b-b4f9-497f-9782-ef6a19715ecd.svg)

[![codebeat](https://codebeat.co/badges/1b596784-b6c1-4ce7-b739-c91b873e4b5d)](https://codebeat.co/projects/github-com-cenit-io-cenit)
[![license](https://img.shields.io/packagist/l/doctrine/orm.svg)]()

# Cenit IO Admin App (UI)

React-based administration interface for the Cenit platform.

## Repositories

- Backend (`cenit`): https://github.com/cenit-io/cenit
- Frontend (`ui`): https://github.com/cenit-io/ui

## Run Locally with Docker Compose

This UI is started by the Docker Compose stack in the backend repository.

1. Clone both repositories side by side:

```bash
git clone https://github.com/cenit-io/cenit.git
git clone https://github.com/cenit-io/ui.git
```

2. Start from the backend repository:

```bash
cd cenit
docker compose up -d --build
docker compose ps
```

3. Open the apps:

- UI: http://localhost:3002
- Backend: http://localhost:3000
- RabbitMQ: http://localhost:15672

If the UI repository is not at `../ui`, set:

```bash
export CENIT_UI_CONTEXT=/absolute/path/to/ui
docker compose up -d --build
```

## Runtime Configuration

Runtime values are injected through `config.js` and `window.appConfig`.

- `REACT_APP_USE_ENVIRONMENT_CONFIG=true`
- `REACT_APP_APP_ID=admin`
- `REACT_APP_LOCALHOST=http://localhost:3002`
- `REACT_APP_CENIT_HOST=http://localhost:3000`

## Run UI Image Standalone

```bash
docker pull ghcr.io/cenit-io/ui:latest
docker run -dti \
  -e REACT_APP_USE_ENVIRONMENT_CONFIG=true \
  -e REACT_APP_APP_ID=admin \
  -e REACT_APP_LOCALHOST=http://127.0.0.1:3002 \
  -e REACT_APP_CENIT_HOST=http://127.0.0.1:3000 \
  -p 3002:80 \
  --name cenit-ui ghcr.io/cenit-io/ui:latest
```

Then open http://localhost:3002.

## Validate Login Flow

From the backend repository:

```bash
/Users/sanchojaf/Documents/cenit-io/cenit/scripts/e2e/cenit_ui_login.sh
```

## Docker Guide

For end-to-end setup details, see [Docker-instalation.md](Docker-instalation.md).

## Contributing

- Report bugs or request features: https://github.com/cenit-io/cenit/issues/new
- Improve docs: https://github.com/cenit-io/cenit-docs
- Submit UI changes: https://github.com/cenit-io/ui
