import path from 'path'
import * as dotenv from 'dotenv'

const envPath = path.join(process.cwd(), '.env')
dotenv.config({
  path: envPath,
  override: true,
})

export const ENV = process.env.ENV || 'develop'
export const NAMESPACE = 'laika-local-printer'
export const LOG_LEVEL = process.env.LOG_LEVEL || 'info'
export const DEBUG = process.env.DEBUG === 'true'
export const PORT = parseInt(process.env.PORT || '5556')
export const SWAGGER_ENDPOINT = process.env.SWAGGER_ENDPOINT
export const PRINTERS = (
  process.env.PRINTERS || 'tcp://192.168.1.234:9100'
).split(';')
export const STAMP_PRINTERS = (
  process.env.STAMP_PRINTERS || 'tcp://192.168.1.100:9100'
).split(';')
export const JOB_INTERVAL_MS = parseInt(process.env.JOB_INTERVAL_MS || '250')
export const STORE_ID = parseInt(process.env.STORE_ID || '0')
export const INTERNAL_ACECSS_KEY = process.env.INTERNAL_ACECSS_KEY
export const POS_WS_URI = process.env.POS_WS_URI || 'ws://localhost:3000/ws'
