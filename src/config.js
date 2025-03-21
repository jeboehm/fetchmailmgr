import fs from 'fs';

const tempDir = process.env.TEMP_DIR || '/tmp';
const mtaHost = process.env.MTA_HOST || 'localhost';

const getPath = (accountId) => {
    return `${tempDir}/${accountId}`;
}

const read = async (accountId) => {
    const path = getPath(accountId);
    return fs.readFile(path, {
        encoding: 'utf-8'
    });
}

const write = async (accountId, data) => {
    const path = getPath(accountId);

    await fs.writeFile(path, data);

    console.debug('Wrote config for account', accountId, path);
}

const template = (account) => {
    const options = [];

    if (account.ssl) {
        options.push('ssl');
    }

    if (account.verifySsl) {
        options.push('sslcertck');
    }

    if (account.keep) {
        options.push('keep');
    }

    return `
    poll ${account.host} with proto ${account.protocol} port ${account.port}
      user ${account.username} there with password "${account.password}" is fetchmail here ${options.join(' ')}
      smtphost ${mtaHost}
      smtpname ${account.user}
    `;
};

const sync = (accounts) => {
    accounts.forEach(account => {
        fs.readFile(getPath(account.id), (err, data) => {
            if (data === template(account)) {
                return;
            }

            return fs.writeFile(getPath(account.id), template(account), (err) => {
                if (err) {
                    console.error('Error writing config for account', account.id, err);
                    throw err;
                }

                fs.chmod(getPath(account.id), 0o600, (err) => {
                    if (err) {
                        console.error('Error setting permissions on config for account', account.id, err);
                        throw err;
                    }
                });

                console.debug('Wrote config for account', account.id);
            });
        });
    })
};

export {
    sync
}
