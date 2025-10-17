import fs from 'fs'
import path from 'path'
import { FETCHMAIL_SMTP_ADDRESS, FETCHMAIL_USE_LMTP, TEMP_DIR } from './env.js'

export const getPath = (accountId) => {
  return path.join(TEMP_DIR, accountId.toString())
}

export const getConfigPath = (accountId) => {
  return path.join(TEMP_DIR, accountId.toString(), '.fetchmailrc')
}

const template = (account) => {
  const options = []

  if (account.ssl) {
    options.push('ssl')
  }

  if (account.verifySsl) {
    options.push('sslcertck')
  } else {
    options.push('no sslcertck')
  }

  if (FETCHMAIL_USE_LMTP) {
    options.push('lmtp')
  }

  return `
    set no softbounce
    set no bouncemail
    poll ${account.host} with protocol ${account.protocol.toUpperCase()} port ${account.port}
      user ${account.username} there with password "${account.password}" is fetchmail here options ${options.join(' ')}
      smtphost ${FETCHMAIL_SMTP_ADDRESS}
      smtpname ${account.user}
    `
}

const readFile = (account) => {
  const path = getConfigPath(account.id)

  if (fs.existsSync(path)) {
    return fs.readFileSync(path, 'utf8')
  }

  return null
}

const writeFile = (account, data) => {
  const folder = getPath(account.id)

  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true })
  }

  const path = getConfigPath(account.id)

  fs.writeFileSync(path, data, (err) => {
    if (err) {
      console.error(`[${account.id}] Error writing config for account`, err)
      throw err
    }

    console.debug(`[${account.id}] Successfully wrote config for account`)
  })

  try {
    fs.chmodSync(path, 0o600)
  } catch (err) {
    console.error(
      `[${account.id}] Error changing permissions for config`,
      path,
      err
    )
    throw err
  }
}

export const sync = (account) => {
  const currentData = readFile(account)
  const newData = template(account)

  if (currentData === newData) {
    return
  }

  writeFile(account, newData)
}
