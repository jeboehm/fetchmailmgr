import { createClient } from "redis";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

const client = createClient({
  url: redisUrl,
});

client.on("error", (error) => {
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
