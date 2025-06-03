
![cenit_io](https://user-images.githubusercontent.com/4213488/150586701-53545c9b-b4f9-497f-9782-ef6a19715ecd.svg)

[![codebeat](https://codebeat.co/badges/1b596784-b6c1-4ce7-b739-c91b873e4b5d)](https://codebeat.co/projects/github-com-cenit-io-cenit)
[![license](https://img.shields.io/packagist/l/doctrine/orm.svg)]()

# Cenit IO Admin App (UI)

This is a React‐based administration interface for the Cenit IO integration platform (iPaaS).

- **cenit-server (GitHub “cenit” repo)**:  
  https://github.com/cenit-io/cenit

- **cenit-ui (GitHub “ui” repo)**:  
  https://github.com/cenit-io/ui

---

## Installation

For a complete, Docker‐based installation of both the backend (`cenit-server`) and this UI, see the [Docker Installation Guide](Docker-instalation.md).  
(The guide includes links to the relevant `docker-compose.yml` and Dockerfiles.)

---

## Configuration

If you need to customize the Admin App (outside of Docker), set the following environment variables:

- `REACT_APP_USE_ENVIRONMENT_CONFIG=true`
- `REACT_APP_APP_ID=admin`
- `REACT_APP_LOCALHOST=http://localhost:3002`
- `REACT_APP_CENIT_HOST=http://<YOUR_CENIT_SERVER_HOST>:<PORT>`

These values will be injected at runtime into `config.js`.

---

## Run with Docker

To pull and run the latest UI image:

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

Navigate to [http://localhost:3002](http://localhost:3002) in your browser to access the Admin App.

---

## Contributing

Cenit IO is an open‐source project and we welcome contributions. Here are some ways to get involved:

- Report bugs or request features: [Issues](https://github.com/cenit-io/cenit/issues/new)
- Improve documentation:

  - Platform docs: [https://github.com/cenit-io/cenit-docs](https://github.com/cenit-io/cenit-docs)
  - UI docs: [https://github.com/cenit-io/ui](https://github.com/cenit-io/ui)

- Submit code changes:

  - Feature requests: [https://github.com/cenit-io/cenit/labels/feature_request](https://github.com/cenit-io/cenit/labels/feature_request)
  - Feedback/bug fixes: [https://github.com/cenit-io/cenit/labels/address_feedback](https://github.com/cenit-io/cenit/labels/address_feedback)

- Review and merge pull requests


