# Stage 1
FROM node:lts-alpine@sha256:cb3143549582cc5f74f26f0992cdef4a422b22128cb517f94173a5f910fa4ee7 AS build
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm install

COPY src ./src

# Stage 2
FROM node:lts-alpine@sha256:cb3143549582cc5f74f26f0992cdef4a422b22128cb517f94173a5f910fa4ee7 AS app

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
