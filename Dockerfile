FROM node:12-alpine as build

LABEL version="1.0"
LABEL description="This is the base docker image for Cenit IO -Admin UI"
LABEL maintainer = ["miguel@cenit.io", "macarci@gmail.com"]

RUN apk update && apk upgrade && apk add docker && rm -rf /var/apk/cache/*

ENV LANG C.UTF-8
ENV LC_ALL C.UTF-8

ARG REACT_APP_LOCALHOST
ENV REACT_APP_LOCALHOST=${REACT_APP_LOCALHOST}

ARG REACT_APP_CENIT_HOST
ENV REACT_APP_CENIT_HOST=${REACT_APP_CENIT_HOST}

ARG REACT_APP_TIMEOUT_SPAN=300000
ENV REACT_APP_TIMEOUT_SPAN=${REACT_APP_TIMEOUT_SPAN}

ARG REACT_APP_APP_ID=admin
ENV REACT_APP_APP_ID=${REACT_APP_APP_ID}


WORKDIR /app
ENV PATH /app/node_modules/.bin:$PATH
COPY package.json ./
COPY package-lock.json ./
RUN npm ci --silent
RUN npm install --production -g --silent

COPY . .

RUN npm run build

# production environment
FROM nginx:stable-alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
