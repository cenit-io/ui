FROM node:20-alpine as builder
WORKDIR /app
ENV PATH /app/node_modules/.bin:$PATH
COPY package.json .
COPY package-lock.json .
RUN npm install -g npm@latest
RUN npm ci --legacy-peer-deps
RUN npm install react-scripts --production -g --silent
COPY env.sh .
COPY src src/
COPY public public/
COPY conf conf/

# Ensure Webpack uses legacy OpenSSL provider on Node 20
ENV NODE_OPTIONS=--openssl-legacy-provider
RUN npm run build

FROM nginx:stable-alpine
RUN rm -rf /etc/nginx/conf.d
COPY conf /etc/nginx

# 1) Copy your built React “ /build ” into /usr/share/nginx/html
COPY --from=builder /app/build /usr/share/nginx/html/

EXPOSE 80
WORKDIR /usr/share/nginx/html

# 2) Copy env.sh and .env.docker next to index.html
COPY ./env.sh .
COPY .env.docker .env
RUN chmod +x env.sh

# 3) At container start, overwrite/create config.js and then launch nginx
CMD ["/bin/sh", "-c", "/usr/share/nginx/html/env.sh && nginx -g \"daemon off;\""]
