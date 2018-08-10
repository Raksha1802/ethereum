FROM node:slim

WORKDIR /docker
ADD . /docker
RUN apt-get update \
  && apt-get install -y python2.7 make g++ git --no-install-recommends \
  && npm config set python /usr/bin/python2.7
RUN npm install
RUN npm install -g ganache-cli

CMD /bin/bash /docker/run.sh