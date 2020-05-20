FROM node:12-slim

RUN mkdir -p /home/node/app/server
WORKDIR /home/node/app/server

RUN set -ex \
    && deps=" \
    procps=2:3.3* \
    " \
    && apt-get update && apt-get install -yq $deps --no-install-recommends

COPY package.json /home/node/app/server
COPY yarn.lock /home/node/app/server
RUN set -ex \
    && yarn install

COPY ormconfig.js /home/node/app/server
COPY dist /home/node/app/server/dist

CMD ["node", "dist/server/src/main"]
