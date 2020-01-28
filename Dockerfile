FROM node:dubnium

RUN mkdir /nest
ADD . /nest
WORKDIR /nest/src/server

RUN yarn install
RUN yarn build

CMD [ "yarn", "start:prod" ]
