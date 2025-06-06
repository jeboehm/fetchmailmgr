export const REDIS_HOST = process.env.REDIS_HOST
export const REDIS_PORT = process.env.REDIS_PORT
export const REDIS_PASSWORD = process.env.REDIS_PASSWORD
export const REDIS_DB = process.env.REDIS_DB
export const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'
export const FETCHMAIL_PATH = process.env.FETCHMAIL_PATH || '/usr/bin/fetchmail'
export const TEMP_DIR = process.env.TEMP_DIR || '/tmp'
export const MTA_HOST = process.env.MTA_HOST || 'localhost'
export const DEBUG = process.env.DEBUG
