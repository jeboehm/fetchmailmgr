import { getAccounts } from './accounts.js';
import { sync as syncConfig } from './config.js';
import { startProcess } from './runtime.js';

const maxProcessEndWait = 10;

export const state = {
  processesRunning: 0,
  ready: false,
  healthy: false,
};

export const loop = async () => {
  const accounts = await getAccounts();
  state.ready = true;

  if (accounts === false) {
    console.info('No accounts found in redis, sleeping...');
    return;
  }

  console.info('Starting fetchmail for all accounts...');

  accounts.forEach((account) => {
    console.debug(`[${account.id}]: starting fetchmail...`);

    syncConfig(account);
    startProcess(account);
  });
};

export const exit = (withError = false, tries = 1) => {
  state.ready = false;
  state.healthy = false;

  if (state.processesRunning === 0) {
    console.info('Exiting...');
    process.exit(withError ? 1 : 0);
  } else {
    console.info(
      `Waiting for processes to finish... (tries: ${tries}/${maxProcessEndWait})`,
    );
    tries++;

    if (tries > maxProcessEndWait) {
      console.error('Processes did not finish in time');
      process.exit(1);
    }

    setTimeout(() => {
      exit(withError, tries);
    }, 1000);
  }
};
