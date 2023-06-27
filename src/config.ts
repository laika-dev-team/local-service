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
export const PRINTER_URI = process.env.PRINTER_URI || 'tcp://127.0.0.2:9100'
