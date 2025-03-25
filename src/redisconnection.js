import { createClient } from 'redis';

const client = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  password: process.env.REDIS_PASSWORD || undefined,
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
