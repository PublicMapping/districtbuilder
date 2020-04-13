FROM node:12-slim

RUN mkdir -p /home/node/app/manage
WORKDIR /home/node/app/manage

RUN set -ex \
    && deps=" \
    procps=2:3.3* \
    " \
    && apt-get update && apt-get install -yq $deps --no-install-recommends

COPY package.json /home/node/app/manage
COPY yarn.lock /home/node/app/manage
RUN set -ex \
    && yarn install

ENV TIPPECANOE_VERSION="1.35.0"

RUN apt install -y git g++ libsqlite3-dev libz-dev make && \
  cd /root && \
  git clone https://github.com/mapbox/tippecanoe.git tippecanoe && \
  cd tippecanoe && \
  git checkout tags/$TIPPECANOE_VERSION && \
  cd /root/tippecanoe && \
  make && \
  make install && \
  cd /root && \
  rm -rf /root/tippecanoe

CMD ["/home/node/app/manage/bin/run"]
