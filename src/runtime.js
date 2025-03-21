import {exec} from "node:child_process";
import {client} from "./redisconnection.js";

const fetchmailPath = process.env.FETCHMAIL_PATH || '/usr/bin/fetchmail';
const args = ['-N', '--nosyslog', '--fetchmailrc',];

const writeRuntimeInfo = async (accountId, lastRun, lastLog, isSuccess) => {
    const key = `fetchmail_accounts_runtime_${accountId}`;
    const value = JSON.stringify({
        lastRun,
        lastLog,
        isSuccess,
    });

    await client.set(key, value);
}

export const startProcess = async (account) => {
    const cmdline = [
        fetchmailPath,
        ...args,
        account.id,
    ]

    const process = exec(
        cmdline.join(' '),
        {
            env: {},
            timeout: 600000,
        }
    );

    let stdout = '';
    let stderr = '';

    process.stdout.on('data', (data) => {
        stdout += data;
    });

    process.stderr.on('data', (data) => {
        stderr += data;
    });

    process.on('close', (code) => {
        console.debug(`Process for account ${account.id} ended with code ${code}`);
        console.debug('stdout:', stdout);
        console.debug('stderr:', stderr);


        writeRuntimeInfo(account.id, new Date().toISOString(), stdout + stderr, code === 0);
    });
}
