import {connect as connectRedis} from './redisconnection.js';
import {getAccounts} from './accounts.js';
import {sync as syncConfig} from './config.js';
import {startProcess} from "./runtime.js";
import * as commander from 'commander';

const loop = async () => {
    const accounts = await getAccounts();

    if (accounts === false) {
        console.info("No accounts found in redis, sleeping...");
        return;
    }

    accounts.forEach(account => {
        console.info(`Account ${account.id} found`);
        syncConfig(account);

        startProcess(account);
    });
}

const main = async () => {
    setInterval(loop, 60000);

    await loop();
}

process.on('SIGINT', function () {
    console.log("Caught interrupt signal");

    process.exit();
});


const program = new commander.Command();
program.version('1.0.0');

program.description('fetchmailmgr is a bridge between fetchmail and docker-mailserver');
program.parse(process.argv);
process.signal

try {
    console.info('Starting fetchmailmgr');

    await connectRedis();
    await main();
} catch (err) {
    console.error('Error in main loop', err);
    process.exit(1);
}
