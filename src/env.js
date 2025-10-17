export const REDIS_HOST = process.env.REDIS_HOST
export const REDIS_PORT = process.env.REDIS_PORT
export const REDIS_PASSWORD = process.env.REDIS_PASSWORD
export const REDIS_DB = process.env.REDIS_DB
export const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'
export const FETCHMAIL_PATH = process.env.FETCHMAIL_PATH || '/usr/bin/fetchmail'
export const TEMP_DIR = process.env.TEMP_DIR || '/tmp'
export const FETCHMAIL_SMTP_ADDRESS = process.env.FETCHMAIL_SMTP_ADDRESS?.replace(/:/g, '/') || (() => {
  throw new Error('FETCHMAIL_SMTP_ADDRESS environment variable is required')
})()
export const DEBUG = process.env.DEBUG
