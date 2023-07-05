import { getLogger } from 'helper'
import {
  BreakLine,
  CharacterSet,
  PrinterTypes,
  ThermalPrinter,
} from 'node-thermal-printer'

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
    throw new Error('PRINTER_IS_NOT_CONNECTEd')
  }
  await printTemplate(printer, data)
  await printer.execute()
}
