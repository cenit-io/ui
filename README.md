![cenit_io](https://user-images.githubusercontent.com/4213488/150586701-53545c9b-b4f9-497f-9782-ef6a19715ecd.svg)

[![Code Climate](https://codeclimate.com/github/openjaf/cenit/badges/gpa.svg)](https://codeclimate.com/github/openjaf/cenit)
[![codebeat](https://codebeat.co/badges/1b596784-b6c1-4ce7-b739-c91b873e4b5d)](https://codebeat.co/projects/github-com-cenit-io-cenit)
[![license](https://img.shields.io/packagist/l/doctrine/orm.svg)]()

[![OpenAPIs in collection][numApis-image]][apisDir-link]
[![OpenAPI specs][numSpecs-image]][apisDir-link]
[![Endpoints][endpoints-image]][apisDir-link]

[![Follow on Twitter][twitterFollow-image]][twitterFollow-link]


* [Join our Slack][join-slack-link]
[(cenitio.slack.com)][join-slack-link]
* [docs](https://docs.cenit.io/)
* [Shared Collections](https://cenit.io/setup~shared_collection)
* support@cenit.io

# [Cenit](https://web.cenit.io)

Is a 100% open integration-platform-as-a-service (iPaaS) that's modern, powerful, yet hackable to the core, ready to [use in the cloud](https://web.cenit.io) or on-premises. It is designed to solve unique integrations needs, orchestrate data flows that may involve types of protocols and data formats, and provide API management capabilities. All of which can support a wide range of integration use cases. It is particularly valuable to embrace a pervasive integration approach.

To install and learn more about the platform check the [documentation](https://docs.cenit.io/)

# Cenit IO Admin App

This is a React application for the administration of a Cenit IO integration Platform (iPaaS).

## Configuring the Admin App 

1. **Configure the Cenit listening port.** In the example bellow the Admin App runs is listening to the port `3000` therefore the local
instance of Cenit IO server should run listening to a different one, in the example the port `3001`. 

Set the docker runtime environment variables to the right values:

- `REACT_APP_APP_ID=admin`
- `REACT_APP_CENIT_HOST=http://127.0.0.1:3001`
- `REACT_APP_OAUTH_CLIENT_ID=***********`
- `REACT_APP_OAUTH_CLIENT_SECRET=***********`

Your can get the REACT_APP_OAUTH_XXX vars running `rake cenit:admin:app:credentials` in cenit-backend root directory.

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
    --name cenit-ui ghcr.io/cenit-io/ui:latest
```
Navigate to http://localhost:3000/ in your browser to view the app.

## Contributing

Cenit IO is an open-source project and we encourage contributions.

In the spirit of [free software](http://www.fsf.org/licensing/essays/free-sw.html), **everyone** is encouraged to help
improve this project.

Here are some ways **you** can contribute:

* by using prerelease master branch
* by reporting [bugs](https://github.com/cenit-io/cenit/issues/new)
* by writing or editing [documentation](https://github.com/cenit-io/cenit-docs)
* by writing [needed code](https://github.com/cenit-io/cenit/labels/feature_request) or [finishing code](https://github.com/cenit-io/cenit/labels/address_feedback)
* by [refactoring code](https://github.com/cenit-io/cenit/labels/address_feedback)
* by reviewing [pull requests](https://github.com/cenit-io/cenit/pulls)

## To the Community

Since the challenge is great, we have to build the solution in the community. We believe that a successful open source project provides confidence, facilitates creating a broad community, where everyone can share answers to questions, suggestions, and improvements to the platform.

We encourage the community to join the initiative and contribute to the dissemination of the project, sharing integration experiences, collaborating in the detection and resolution of errors, or contributing to the development of the project. We hope that those who join us enjoy the collaborative work and the challenge of achieving something innovative and useful that can potentially serve many others.

## Screenshots

![menu](https://user-images.githubusercontent.com/81880890/138016967-c57c2dfb-7f1a-49e2-a266-24cb3312acd1.png)

![tenants](https://user-images.githubusercontent.com/81880890/138016971-58acec6d-7397-4f16-85bc-6aa995fb2021.png)

![cenit_type](https://user-images.githubusercontent.com/81880890/138016964-a537ce74-892a-4583-a7da-deb762876b86.png)

![mobile_view](https://user-images.githubusercontent.com/81880890/148653137-d3459280-425b-449f-b206-cb8da0d73e1f.png)

[numApis-image]: https://api.apis.guru/badges/apis_in_collection.svg
[numSpecs-image]: https://api.apis.guru/badges/openapi_specs.svg
[endpoints-image]: https://api.apis.guru/badges/endpoints.svg
[apisDir-link]: https://github.com/APIs-guru/openapi-directory/tree/master/APIs
[twitterFollow-image]: https://img.shields.io/twitter/follow/cenit_io.svg?style=social
[twitterFollow-link]: https://twitter.com/intent/follow?screen_name=cenit_io
[join-slack-link]:
https://join.slack.com/t/cenitio/shared_invite/zt-1cq3uab52-Jv93F8R2BJ9MHr00SbCqjw
