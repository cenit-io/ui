
# Cenit IO Admin App

This is a React application for the administration of a Cenit Platform instance, that is currently under development.
Follow these instructions to configure a local instance of Cenit and connect it as a backend for the app.

## Configuring the Admin App

Update public/config.js

```
window.appConfig = {
    USE_ENVIRONMENT_CONFIG: "true",
    REACT_APP_LOCALHOST: "http://127.0.0.1:3000",
    REACT_APP_CENIT_HOST: "http://127.0.0.1:3001",
    TIMEOUT_SPAN: "300000",
    REACT_APP_APP_ID: "admin",
}
```

## Configuring the Backend

1. Make sure the Cenit **local repository is up to date with the remote**. The developed branch of Cenit
to support the Admin Backed is `admin_backend`.

2. The `admin_backend` development branch includes features that are not yet synced with the `develop` and `master`
branches (for example the support of built-in apps). For this reason is strongly recommended to **use a dedicated
database.** To define a custom database just include in the `config/application.yml` file an entry
`DB_DEV: custom_db_name`.    

2. **Configure the Cenit listening port.** By default the Admin App runs listening to the port `3000` therefore the local
instance of Cenit should run listening to a different one. By default the App expect Cenit to be listening to the port
`3001`, so launch Cenit listening to the port `3001`.

3. **Configure the Cenit HOMEPAGE URL.** Make sure that Cenit HOMEPAGE URL is synced with the listening port by including
in the `config/application.yml` file the entry `HOMEPAGE: http://127.0.0.1:3001`.

4. **Configure the default URI for the admin app.** By default the Admin App runs listening to the port `3000`.
Include in the `config/application.yml` file the entry `'Cenit::Admin:default_uri': http://localhost:3000`.

And that's all!

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.<br>
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br>
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.<br>
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.<br>
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.<br>
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

## Docker

### Build Docker image

`docker build . -t cenit-ui`

### Run with Docker

```
docker run -dti -e REACT_APP_LOCALHOST=http://127.0.0.1:3001 \
    -e REACT_APP_CENIT_HOST=http://127.0.0.1:3000 \
    -p 3000:80 \
    --t cenit-ui:latest
```
Navigate to http://localhost:3000/ in your browser to view the app.
