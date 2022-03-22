FROM node:16-bullseye-slim AS tippecanoe

ENV TIPPECANOE_VERSION="1.36.0"

RUN set -ex \
  && deps=" \
  g++ \
  libsqlite3-dev \
  libz-dev \
  make \
  wget \
  " \
  && apt-get update && apt-get install -yq $deps

WORKDIR /usr/local/src

RUN wget -qO- https://github.com/mapbox/tippecanoe/archive/${TIPPECANOE_VERSION}.tar.gz \
  | tar xvz -C /usr/local/src
RUN make -C /usr/local/src/tippecanoe-${TIPPECANOE_VERSION}
RUN make -C /usr/local/src/tippecanoe-${TIPPECANOE_VERSION} install


FROM node:16-bullseye-slim

RUN mkdir -p /home/node/app/manage
WORKDIR /home/node/app/manage

RUN set -ex \
  && deps=" \
  libsqlite3-dev \
  procps=2:3.3* \
  " \
  && apt-get update && apt-get install -yq $deps --no-install-recommends

COPY package.json /home/node/app/manage
COPY yarn.lock /home/node/app/manage
RUN set -ex \
  && yarn install

COPY --from=tippecanoe /usr/local/bin/tippecanoe /usr/local/bin/tippecanoe
COPY --from=tippecanoe /usr/local/bin/tile-join /usr/local/bin/tile-join

COPY . /home/node/app/manage

CMD ["/home/node/app/manage/bin/run"]
