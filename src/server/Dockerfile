FROM node:16-bullseye-slim

RUN set -ex \
    && deps=" \
    procps=2:3.3* \
    " \
    && apt-get update && apt-get install -yq $deps --no-install-recommends

RUN mkdir -p /home/node/app/node_modules
WORKDIR /home/node/app

COPY package.json /home/node/app
COPY package-lock.json /home/node/app
RUN chown node:node package.json package-lock.json node_modules

USER node
RUN set -ex \
    && npm install

COPY . /home/node/app

ENTRYPOINT ["npm"]
CMD ["run", "start:prod"]
