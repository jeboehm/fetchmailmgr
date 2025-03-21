import {connect as connectRedis} from './redisconnection.js';
import {getAccounts} from './accounts.js';
import {sync as syncConfig} from './config.js';
import {startProcess} from "./runtime.js";

const loop = async () => {
    const accounts = await getAccounts();

    if (accounts === false) {
        console.info("No accounts found in redis, sleeping...");
        return;
    }

    syncConfig(accounts);

    for (const account of accounts) {
        startProcess(account).then();
    }
}

const main = async () => {
    setInterval(loop, 60000);

    await loop();
}

try {
    console.info('Starting fetchmailmgr');

    await connectRedis();
    await main();
} catch (err) {
    console.error('Error in main loop', err);
    process.exit(1);
}
