import { ErrorCode, SystemError, printErrorMessage } from 'common/error'
import { JOB_INTERVAL_MS, PRINTERS } from 'config'
import { getLogger } from 'helper'
import { JobQueue, executePrinter } from 'lib'
import { ThermalPrinter } from 'node-thermal-printer'
import { receiptPrintRequest } from 'schema'
import { printReceipt } from 'template/receipt'
import { z } from 'zod'
import * as url from 'url'

export enum PrinterTemplate {
  RECEIPT = 'receipt',
}

export class PrinterController {
  private static _ins: PrinterController | undefined
  public static get Instance(): PrinterController {
    if (!this._ins) {
      this._ins = new PrinterController()
    }
    return this._ins
  }

  private _logger
  private _queuesMap: Map<
    string,
    JobQueue<{
      uri: string
      template: PrinterTemplate
      payload: any
    }>
  >
  private _printerTemplateMap: Map<
    PrinterTemplate,
    (printer: ThermalPrinter, data: any) => Promise<void>
  >
  private constructor() {
    this._logger = getLogger('printer-controller')
    this._queuesMap = new Map()
    this._printerTemplateMap = new Map()
    PRINTERS.forEach((p) => {
      const endpoint = new url.URL(p)
      const queue = new JobQueue(p, this.executePrint, {
        jobIntervalMs: JOB_INTERVAL_MS,
      })
      this._queuesMap.set(endpoint.hostname, queue)
      queue.start()
    })
    this._printerTemplateMap.set(PrinterTemplate.RECEIPT, printReceipt)
  }

  printReceipt = (input: z.infer<typeof receiptPrintRequest>) => {
    const { printerUri, receipData } = input
    const printer = this._queuesMap.get(printerUri)
    if (!printer) {
      throw new SystemError(
        ErrorCode.VALIDATION_ERROR,
        printErrorMessage.NOT_FOUND_PRINTER
      )
    }
    printer.append({
      uri: printer.name,
      template: PrinterTemplate.RECEIPT,
      payload: receipData,
    })
    return true
  }

  private executePrint = async (data: {
    uri: string
    template: PrinterTemplate
    payload: any
  }): Promise<void> => {
    const { uri, template, payload } = data
    const templateFunc = this._printerTemplateMap.get(template)
    if (!templateFunc) {
      throw new SystemError(
        ErrorCode.INTERNAL_SYS_ERROR,
        printErrorMessage.UNSUPPORTED_TEMPLATE
      )
    }

    return executePrinter(uri, payload as any, templateFunc)
  }
}
