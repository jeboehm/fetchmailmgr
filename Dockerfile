# Stage 1
FROM node:lts-alpine@sha256:10962e8568729b0cfd506170c5a2d1918a2c10ac08c0e6900180b4bac061adc9 AS build
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm install

COPY src ./src

# Stage 2
FROM node:lts-alpine@sha256:10962e8568729b0cfd506170c5a2d1918a2c10ac08c0e6900180b4bac061adc9 AS app

ENV NODE_ENV=production \
    REDIS_URL=redis://localhost:6379 \
    TEMP_DIR=/run/fetchmailmgr \
    MTA_HOST=mta \
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
