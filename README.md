
# Cenit IO Admin App

This is a React application for the administration of a Cenit IO integration Platform (iPaaS).

## Configuring the Admin App 

1. **Configure the Cenit listening port.** In the example bellow the Admin App runs is listening to the port `3000` therefore the local
instance of Cenit IO server should run listening to a different one, in the example the port `3001`. 

Set the docker runtime environment variables to the right values:
- `REACT_APP_LOCALHOST=http://127.0.0.1:3000`
- `REACT_APP_CENIT_HOST=http://127.0.0.1:3001`


## Configuring the Cenit Backend Server


1. **Configure the Cenit HOMEPAGE URL.** Make sure that Cenit HOMEPAGE URL is synced with the listening port by including
in the `config/application.yml` file the entry `HOMEPAGE: http://127.0.0.1:3001`.

2. **Configure the default URI for the admin app.** By default the Admin App runs listening to the port `3000`.
Include in the `config/application.yml` file the entry `'Cenit::Admin:default_uri': http://localhost:3000`.

```
# config/application.yml
HOMEPAGE: http://127.0.0.1:3001
'Cenit::Admin:default_uri': http://localhost:3000
# ...
```

And that's all!
## Run with Docker


`docker pull ghcr.io/cenit-io/ui:latest`

```
docker run -dti -e REACT_APP_LOCALHOST=http://127.0.0.1:3001 \
    -e REACT_APP_CENIT_HOST=http://127.0.0.1:3000 \
    -p 3000:80 \
    --name container_name ghcr.io/cenit-io/ui:latest
```
Navigate to http://localhost:3000/ in your browser to view the app.
