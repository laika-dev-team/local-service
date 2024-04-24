import { getLogger } from 'helper'
import {
  BreakLine,
  CharacterSet,
  PrinterTypes,
  ThermalPrinter,
} from 'node-thermal-printer'
import * as net from 'net'
import * as url from 'url'

const logger = getLogger('printer')
export async function executePrinter<T>(
  uri: string,
  data: T,
  printTemplate: (printer: ThermalPrinter, data: T) => Promise<void>
) {
  const printer = new ThermalPrinter({
    type: PrinterTypes.EPSON,
    interface: uri,
    characterSet: CharacterSet.WPC1258_VIETNAMESE,
    removeSpecialCharacters: false,
    breakLine: BreakLine.WORD,
    driver: {},
    options: {
      timeout: 5000,
    },
  })
  const isConnected = await printer.isPrinterConnected()
  if (!isConnected) {
    throw new Error('PRINTER_IS_NOT_CONNECTED')
  }
  await printTemplate(printer, data)
  printer.execute()
}

export function executeRawPrinter(
  uri: string,
  cmds: string[]
): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const endpoint = new url.URL(uri)
    const client = new net.Socket()
    client.on('error', (e) => {
      logger.error(e, `connect to printer ${e} error`)
      reject(e)
    })
    client.on('end', () => {
      logger.info(`connection close ${uri}`)
      resolve(true)
    })
    client.connect(parseInt(endpoint.port), endpoint.hostname, () => {
      logger.info(`connected to printer ${uri}`)
      logger.warn(cmds, '[debug] print command')
      client.write(Buffer.from(cmds.join('\r\n')), (e) => {
        // console.log('print result...', e)
        if (e) {
          logger.error(e, 'error when write buffer')
        }
        client.end()
      })
      // console.log('write status', res)
    })
  })
}
