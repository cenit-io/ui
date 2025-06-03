# Docker Installation Guide

This document outlines how to run Cenit using Docker Compose, including both the backend server (known as **cenit** on GitHub) and the frontend admin UI (known as **cenit-ui** on GitHub).

- **cenit** repository (backend) is available at: [https://github.com/cenit-io/cenit](https://github.com/cenit-io/cenit)
- **cenit-ui** repository (frontend) is available at: [https://github.com/cenit-io/ui](https://github.com/cenit-io/ui)

## Prerequisites

- Docker
- Docker Compose

## Running with Docker Compose

1. **Clone the repositories**

   ```bash
   git clone https://github.com/cenit-io/cenit.git  # Backend
   git clone https://github.com/cenit-io/ui.git     # Frontend
   ```

2. **Directory structure**

   Ensure your directory layout is as follows:

   ```
   ├── cenit/          # Backend
   │   ├── Dockerfile
   │   ├── docker-compose.yml
   │   └── ...
   └── ui/             # Frontend
       ├── Dockerfile
       ├── env.sh
       ├── .env.docker
       └── ...
   ```

3. **Configure environment variables**

   Update the `docker-compose.yml` in the **cenit** repository. Refer to the full file here: [cenit/docker-compose.yml](https://github.com/cenit-io/cenit/blob/main/docker-compose.yml).

   In summary, set for **ui** service:

   ```yaml
   ui:
     build:
       context: ./ui
       dockerfile: Dockerfile
     ports:
       - "3002:80"
     environment:
       - REACT_APP_USE_ENVIRONMENT_CONFIG=true
       - REACT_APP_TIMEOUT_SPAN=300000
       - REACT_APP_APP_ID=admin
       - REACT_APP_LOCALHOST=http://localhost:3002
       - REACT_APP_CENIT_HOST=http://localhost:3000
   ```

   And for **server** service:

   ```yaml
   server:
     build: .
     ports:
       - "3000:8080"
     environment:
       - MONGODB_URI=mongodb://mongo_server/cenit
       - REDIS_HOST=redis
       - HOMEPAGE=http://localhost:3000
       - CENIT_UI=http://localhost:3002
       - RABBITMQ_BIGWIG_TX_URL=amqp://cenit_rabbit:cenit_rabbit@rabbitmq/cenit_rabbit_vhost
       - SCHEDULER_LOOKUP_INTERVAL=8
       - UNICORN_WORKERS=4
       - MAXIMUM_UNICORN_CONSUMERS=4
     depends_on:
       - mongo_server
       - redis
   ```

   Other services (RabbitMQ, MongoDB, Redis) use defaults. See full compose: [cenit/docker-compose.yml](https://github.com/cenit-io/cenit/blob/main/docker-compose.yml).

4. **Backend (cenit) Dockerfile highlights**

   View the complete Dockerfile here: [cenit/Dockerfile](https://github.com/cenit-io/cenit/blob/main/Dockerfile).

   Key points:

   - Based on `ruby:2.7.4`.
   - Installs system dependencies (Node, Yarn, libraries).
   - Sets up Rails environment and Unicorn server.
   - `env.sh` writes `config/application.yml` with `HOMEPAGE` and `Cenit::Admin:default_uri`.

5. **Frontend (cenit-ui) Dockerfile highlights**

   View the complete UI Dockerfile here: [ui/Dockerfile](https://github.com/cenit-io/ui/blob/main/Dockerfile).

   Key points:

   - Multi-stage build using `node:20-alpine` and `nginx:stable-alpine`.
   - Builds React app, then serves via Nginx.
   - `env.sh` reads `.env.docker` to generate `config.js` at runtime.
   - `.env.docker` contains:

     ```env
     REACT_APP_USE_ENVIRONMENT_CONFIG=true
     REACT_APP_TIMEOUT_SPAN=300000
     REACT_APP_APP_ID=admin
     REACT_APP_LOCALHOST=http://localhost:3002
     REACT_APP_CENIT_HOST=http://localhost:3000
     ```

6. **Build and Start**

   From the **cenit** directory (where `docker-compose.yml` resides):

   ```bash
   docker-compose build
   docker-compose up -d
   ```

   This will launch:

   - **cenit-ui** on port **3002**
   - **cenit-server** on port **3000** (internally listening on 8080)
   - **rabbitmq** (management UI on 15672)
   - **mongo_server** (MongoDB on default 27017)
   - **redis** (Redis on default 6379)

7. **Access the Applications**

   - Admin UI: [http://localhost:3002](http://localhost:3002)
   - Backend Web Console (login page): [http://localhost:3000](http://localhost:3000)
   - RabbitMQ Management: [http://localhost:15672](http://localhost:15672)

That’s it! Your local Cenit instance (both backend and admin UI) should now be up and running via Docker Compose.

---

_For more details, see the GitHub repositories:_

- [https://github.com/cenit-io/cenit](https://github.com/cenit-io/cenit) (backend)
- [https://github.com/cenit-io/ui](https://github.com/cenit-io/ui) (frontend)
