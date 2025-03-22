# Stage 1
FROM node:lts AS build
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm install

COPY src/ .

# Stage 2
FROM node:lts AS app

ENV NODE_ENV=production \
    REDIS_HOST=redis \
    REDIS_PORT=6379 \
    REDIS_PASSWORD="" \
    TEMP_DIR=/run/fetchmailmgr \
    MTA_HOST=mta \
    FETCHMAIL_PATH=/usr/bin/fetchmail

RUN apt-get update && \
    apt-get install -y fetchmail && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

RUN mkdir -p "${TEMP_DIR}" && \
    chown nobody:nogroup "${TEMP_DIR}"

WORKDIR /app
COPY --from=build /app /app

USER nobody
VOLUME /run/fetchmailmgr

ENTRYPOINT ["node", "index.js"]
CMD []
