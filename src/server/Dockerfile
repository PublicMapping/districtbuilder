FROM node:12-slim

RUN mkdir -p /home/node/app/server
WORKDIR /home/node/app/server

COPY package.json /home/node/app/server
COPY yarn.lock /home/node/app/server
RUN set -ex \
    && deps=" \
    procps \
    " \
    && apt-get update && apt-get install -y $deps --no-install-recommends \
    && yarn install

COPY ormconfig.js dist* /home/node/app/server/

CMD ["node", \
"dist/server/src/main"]
