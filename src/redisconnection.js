import { createClient } from 'redis'
import { REDIS_DB, REDIS_HOST, REDIS_PASSWORD, REDIS_PORT, REDIS_URL } from './env.js'

const buildDsn = (config) => {
  const { host, port, password, db } = config

  let dsn = `redis://${host}:${port}`

  if (password) {
    dsn = `redis://:${password}@${host}:${port}`
  }

  if (db) {
    dsn = `${dsn}/${db}`
  }

  return dsn
}

let redisUrl

if (REDIS_HOST && REDIS_PORT) {
  redisUrl = buildDsn({
    host: REDIS_HOST,
    port: REDIS_PORT,
    password: REDIS_PASSWORD,
    db: REDIS_DB
  })
} else {
  redisUrl = REDIS_URL
}

const client = createClient({
  url: redisUrl
})

client.on('error', (error) => {
  console.error(`Error in redis connection: ${error}`)

  throw error
})

const connect = async () => {
  try {
    return client.connect()
  } catch (error) {
    console.error(`Error in redis connection: ${error}`)

    throw error
  }
}

export { client, connect }
