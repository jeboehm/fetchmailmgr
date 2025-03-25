import fs from 'fs';
import path from 'path';

const tempDir = process.env.TEMP_DIR || '/tmp';
const mtaHost = process.env.MTA_HOST || 'localhost';

export const getPath = (accountId) => {
  return path.join(tempDir, accountId.toString());
};

export const getConfigPath = (accountId) => {
  return path.join(tempDir, accountId.toString(), '.fetchmailrc');
};

const template = (account) => {
  const options = [];

  if (account.ssl) {
    options.push('ssl');
  }

  if (account.verifySsl) {
    options.push('sslcertck');
  }

  return `
    set no spambounce
    poll ${account.host} with protocol ${account.protocol.toUpperCase()} port ${account.port}
      user ${account.username} there with password "${account.password}" is fetchmail here options ${options.join(' ')}
      smtphost ${mtaHost}
      smtpname ${account.user}
    `;
};

const readFile = (account) => {
  const path = getConfigPath(account.id);

  if (fs.existsSync(path)) {
    return fs.readFileSync(path, 'utf8');
  }

  return null;
};

const writeFile = (account, data) => {
  const folder = getPath(account.id);

  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
  }

  const path = getConfigPath(account.id);

  fs.writeFileSync(path, data, (err) => {
    if (err) {
      console.error('Error writing config for account', account.id, err);
      throw err;
    }

    console.debug('Wrote config for account', account.id);
  });

  try {
    fs.chmodSync(path, 0o600);
  } catch (err) {
    console.error('Error changing permissions for config', path, err);
    throw err;
  }
};

export const sync = (account) => {
  const currentData = readFile(account);
  const newData = template(account);

  if (currentData === newData) {
    return;
  }

  writeFile(account, newData);
};
