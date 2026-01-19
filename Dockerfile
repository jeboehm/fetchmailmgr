# Stage 1
FROM node:lts-alpine@sha256:931d7d57f8c1fd0e2179dbff7cc7da4c9dd100998bc2b32afc85142d8efbc213 AS build
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm install

COPY src ./src

# Stage 2
FROM node:lts-alpine@sha256:931d7d57f8c1fd0e2179dbff7cc7da4c9dd100998bc2b32afc85142d8efbc213 AS app

ENV NODE_ENV=production \
    REDIS_URL=redis://localhost:6379 \
    TEMP_DIR=/run/fetchmailmgr \
    FETCHMAIL_SMTP_ADDRESS=mta \
    FETCHMAIL_PATH=/usr/bin/fetchmail

RUN apk add --no-cache fetchmail

RUN mkdir -p "${TEMP_DIR}" && \
    chown nobody:nogroup "${TEMP_DIR}"

WORKDIR /app
COPY --from=build /app /app

USER nobody
VOLUME /run/fetchmailmgr
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget -qO- http://0.0.0.0:3000/healthz || exit 1
ENTRYPOINT ["node", "src/index.js"]
CMD []
