import { exec } from 'node:child_process';
import { client } from './redisconnection.js';
import { getConfigPath, getPath } from './config.js';
import { state } from './app.js';

const FETCHMAIL_PATH = process.env.FETCHMAIL_PATH || '/usr/bin/fetchmail';
const FETCHMAIL_ARGS = ['-N', '--nosyslog'];
const PROCESS_TIMEOUT = 600000;

const saveFetchmailResult = async (accountId, lastRun, lastLog, isSuccess) => {
  const key = `fetchmail_accounts_runtime_${accountId}`;
  const value = JSON.stringify({
    lastRun,
    lastLog,
    isSuccess,
  });

  await client.set(key, value);
};

const saveFetchmailRunning = async (accountId, isRunning) => {
  const key = `fetchmail_accounts_running_${accountId}`;

  if (!isRunning) {
    await client.del(key);

    return;
  }

  await client.set(key, isRunning ? '1' : '0', {
    EX: PROCESS_TIMEOUT / 1000,
  });
};

export const startProcess = async (account) => {
  const fetchmailHome = getPath(account.id);
  let stdout = '';
  let stderr = '';
  state.processesRunning++;
  await saveFetchmailRunning(account.id, true);

  try {
    const process = exec(
      `"${FETCHMAIL_PATH}" ${FETCHMAIL_ARGS.join(' ')} --fetchmailrc "${getConfigPath(account.id)}"`,
      {
        env: {
          HOME: fetchmailHome,
          FETCHMAILHOME: fetchmailHome,
        },
        timeout: PROCESS_TIMEOUT,
      },
    );

    process.stdout.on('data', (data) => {
      stdout += data;
    });

    process.stderr.on('data', (data) => {
      stderr += data;
    });

    process.on('close', async (code) => {
      let hasError = code > 1;

      ['debug', 'error'].map((level) => {
        if (level === 'debug' || hasError) {
          console[level](
            `[${account.id}] Process for account ${account.id} ended with code ${code}`,
          );
          console[level](`[${account.id}] stdout:`, stdout);
          console[level](`[${account.id}] stderr:`, stderr);
        }
      });

      await saveFetchmailResult(
        account.id,
        new Date().toISOString(),
        stdout + stderr,
        !hasError,
      );
    });
  } catch (err) {
    console.error(`[${account.id}] Error starting process:`, err);

    await saveFetchmailResult(
      account.id,
      new Date().toISOString(),
      err.message,
      false,
    );
  }

  state.processesRunning--;
  await saveFetchmailRunning(account.id, false);
};
