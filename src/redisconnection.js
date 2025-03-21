import {createClient} from "redis";

const redisHost = process.env.REDIS_HOST;
const redisPort = process.env.REDIS_PORT;
const redisPassword = process.env.REDIS_PASSWORD;

const client = createClient({
    host: redisHost, port: redisPort, password: redisPassword,
});

client.on("error", (error) => {
    console.error(`Error in redis connection: ${error}`);

    process.exit(1);
});

const connect = async () => {
    try {
        return client.connect();
    } catch (error) {
        console.error(`Error in redis connection: ${error}`);

        process.exit(1);
    }
}

export {
    client, connect,
}
