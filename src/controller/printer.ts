import { ErrorCode, SystemError, printErrorMessage } from 'common/error'
import { JOB_INTERVAL_MS, PRINTERS, STAMP_PRINTERS } from 'config'
import { getLogger } from 'helper'
import { JobQueue, executePrinter, executeRawPrinter } from 'lib'
import { ThermalPrinter } from 'node-thermal-printer'
import { receiptPrintRequest, stampPrintRequest } from 'schema'
import { printReceipt } from 'template/receipt'
import { z } from 'zod'
import * as url from 'url'
import dayjs from 'dayjs'
import { removeVietnameseTones } from 'helper/string'

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
  private _queuesMap: Map<string, JobQueue<any>>
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
    STAMP_PRINTERS.forEach((p) => {
      const endpoint = new url.URL(p)
      const queue = new JobQueue(p, this.executeRawPrint, {
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

  printStamp = (input: z.infer<typeof stampPrintRequest>) => {
    const { printerUri, stampData } = input
    const printer = this._queuesMap.get(printerUri)
    if (!printer) {
      throw new SystemError(
        ErrorCode.VALIDATION_ERROR,
        printErrorMessage.NOT_FOUND_PRINTER
      )
    }
    const time = dayjs(stampData.orderTime)
    const cmdList: Array<string[]> = []
    stampData.items.forEach((i) => {
      for (let q = 0; q < i.quantity; q++) {
        cmdList.push(
          this.stampCmdBuilder({
            storeName: stampData.storeName,
            time,
            zone: stampData.zone,
            table: stampData.table,
            name: i.name,
            price: i.unitPrice,
          })
        )
      }
    })
    cmdList.forEach((cmds) => {
      printer.append({
        uri: printer.name,
        cmds,
      })
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

  private executeRawPrint = async (data: {
    uri: string
    cmds: string[]
  }): Promise<void> => {
    const { uri, cmds } = data
    await executeRawPrinter(uri, cmds)
  }

  private stampCmdBuilder = (data: {
    storeName: string
    table: string
    zone: string
    time: dayjs.Dayjs
    name: string
    price: number
    toppings?:
      | {
          name: string
          quantity: number
          unitPrice: number
        }[]
      | undefined
  }): string[] => {
    const { name, price, toppings, storeName, table, zone, time } = data
    const x = 20
    const cmds = [
      'SIZE 40 mm, 30mm',
      'GAP 5 mm, 0',
      'DIRECTION 1',
      'CLS',
      `TEXT ${x},60,"3",0,1,1,"${removeVietnameseTones(storeName)}"`,
      `TEXT ${x},100,"1",0,1,1,"The       ${table} ${removeVietnameseTones(
        zone
      )}"`,
      `TEXT ${x},120,"1",0,1,1,"Ngay gio  ${time.format('DD/MM/YY hh:mm')}"`,
      `TEXT ${x},150,"3",0,1,1,"${removeVietnameseTones(name)}"`,
    ]
    let y = 150
    if (toppings) {
      toppings.forEach((t) => {
        y += 20
        cmds.push(
          `TEXT ${x},${y},"1",0,1,1,"  + ${removeVietnameseTones(t.name)}"`
        )
      })
    }
    y += toppings && toppings.length > 0 ? 20 : 40
    cmds.push(
      `TEXT ${x},${y},"2",0,1,1,"Tong      ${price}"`,
      `PRINT 1,1`,
      `END`
    )
    return cmds
  }
}
