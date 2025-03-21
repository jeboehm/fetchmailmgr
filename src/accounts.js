import { client } from './redisconnection.js';

export const getAccounts = async () => {
    // read from redis 'fetchmail_accounts' key, json deserialize and return.
    // return false if the key is not found.
    const accounts = await client.get('fetchmail_accounts');
    if (!accounts) {
        return false;
    }

    return JSON.parse(accounts);
}
