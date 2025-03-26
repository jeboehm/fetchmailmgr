import { createClient } from 'redis';

const buildDsn = (config) => {
  const { host, port, password, db } = config;

  let dsn = `redis://${host}:${port}`;

  if (password) {
    dsn = `redis://:${password}@${host}:${port}`;
  }

  if (db) {
    dsn = `${dsn}/${db}`;
  }

  return dsn;
};

let redisUrl;

if (process.env.REDIS_HOST && process.env.REDIS_PORT) {
  redisUrl = buildDsn({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
    db: process.env.REDIS_DB,
  });
} else {
  redisUrl = process.env.REDIS_URL;
}

const client = createClient({
  url: redisUrl,
});

client.on('error', (error) => {
  console.error(`Error in redis connection: ${error}`);

  throw error;
});

const connect = async () => {
  try {
    return client.connect();
  } catch (error) {
    console.error(`Error in redis connection: ${error}`);

    throw error;
  }
};

export { client, connect };
