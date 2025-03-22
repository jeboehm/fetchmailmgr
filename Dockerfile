# Stage 1
FROM node:lts-alpine AS build
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm install

COPY src/ .

# Stage 2
FROM node:lts-alpine AS app

ENV NODE_ENV=production \
    REDIS_HOST=redis \
    REDIS_PORT=6379 \
    REDIS_PASSWORD="" \
    TEMP_DIR=/run/fetchmailmgr \
    MTA_HOST=mta \
    FETCHMAIL_PATH=/usr/bin/fetchmail

RUN apk add --no-cache fetchmail=6.5.1-r0

RUN mkdir -p "${TEMP_DIR}" && \
    chown nobody:nogroup "${TEMP_DIR}"

WORKDIR /app
COPY --from=build /app /app

USER nobody
VOLUME /run/fetchmailmgr

ENTRYPOINT ["node", "index.js"]
CMD []
