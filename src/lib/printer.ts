import {
  BreakLine,
  CharacterSet,
  PrinterTypes,
  ThermalPrinter,
} from 'node-thermal-printer'

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
  await printTemplate(printer, data)
  return printer.execute()
}
