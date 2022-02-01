FROM node:16-alpine as build

ARG REACT_APP_LOCALHOST
ENV REACT_APP_LOCALHOST=${REACT_APP_LOCALHOST}

ARG REACT_APP_CENIT_HOST
ENV REACT_APP_CENIT_HOST=${REACT_APP_CENIT_HOST}

ARG REACT_APP_TIMEOUT_SPAN=300000
ENV REACT_APP_TIMEOUT_SPAN=${REACT_APP_TIMEOUT_SPAN}

ARG REACT_APP_APP_ID=admin
ENV REACT_APP_APP_ID=${REACT_APP_APP_ID}
ENV GENERATE_SOURCEMAP=false

WORKDIR /app
ENV PATH /app/node_modules/.bin:$PATH
COPY package.json ./
COPY package-lock.json ./
RUN npm install -g npm@latest
RUN npm ci --silent
RUN npm install react-scripts --production -g --silent
COPY . .
RUN npm run build

# production environment
FROM nginx:stable-alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
