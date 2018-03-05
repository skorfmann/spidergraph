FROM node:8.9-alpine

# Installs latest Chromium (63) package.
RUN apk update && apk upgrade && \
  echo @edge http://nl.alpinelinux.org/alpine/edge/community >> /etc/apk/repositories && \
  echo @edge http://nl.alpinelinux.org/alpine/edge/main >> /etc/apk/repositories && \
  apk add --no-cache \
  chromium@edge \
  nss@edge \
  python \
  build-base \
  ca-certificates \
  nss-tools \
  bash


# Tell Puppeteer to skip installing Chrome. We'll be using the installed package.
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true

RUN mkdir /app
WORKDIR /app

COPY ./package.json /app
RUN npm install
COPY . /app

RUN mkdir /usr/share/ca-certificates/extra
COPY ./root-ca/mitmproxy.crt /usr/local/share/ca-certificates/extra/mitmproxy.crt
RUN update-ca-certificates

# Unfortunately, Chromium has a bug, where the option "ignoreHTTPSErrors" is ignored
# when request interception is turned on (which we use for adblocking).
# Chromium is using nssdb on top of its own certificates, but ignores
# system certificates.
# So, we really need that root ca here to make testing with the proxy work properly

RUN mkdir -p /root/.pki/nssdb && \
    certutil -d $HOME/.pki/nssdb -N --empty-password && \
    certutil -A -n "mitmproxy" -d sql:/root/.pki/nssdb -t C,, -a -i /usr/local/share/ca-certificates/extra/mitmproxy.crt

CMD ["npm", "run", "dev"];
