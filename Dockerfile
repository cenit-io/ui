# => Build container
FROM node:16-alpine as builder

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
RUN npm run build

# => Run container
FROM nginx:stable-alpine

RUN rm -rf /etc/nginx/conf.d
COPY conf /etc/nginx
COPY --from=builder /app/build /usr/share/nginx/html/
EXPOSE 80
WORKDIR /usr/share/nginx/html
COPY ./env.sh .
COPY .env.docker .env
RUN chmod +x env.sh
CMD ["/bin/sh", "-c", "/usr/share/nginx/html/env.sh && nginx -g \"daemon off;\""]
