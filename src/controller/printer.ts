import { ErrorCode, SystemError, printErrorMessage } from 'common/error'
import { JOB_INTERVAL_MS, NATS_EP, PRINTERS, STAMP_PRINTERS } from 'config'
import { getLogger } from 'helper'
import { JobQueue, executePrinter, executeRawPrinter } from 'lib'
import { ThermalPrinter } from 'node-thermal-printer'
import { receiptPrintRequest, stampPrintRequest } from 'schema'
import { printReceipt } from 'template/receipt'
import { z } from 'zod'
import * as url from 'url'
import dayjs from 'dayjs'
import { currencyToString, removeVietnameseTones } from 'helper/string'
import { MsgBus } from 'lib/msg-bus'

export enum PrinterTemplate {
  RECEIPT = 'receipt',
}

export enum StoreLocalServiceJobStatus {
  prepare = 'prepare',
  in_queue = 'in_queue',
  done = 'done',
  error = 'error',
}

export class LocalJobDelegate {
  private static _instance: LocalJobDelegate | null
  static get Instance(): LocalJobDelegate {
    if (!this._instance) {
      this._instance = new LocalJobDelegate()
    }

    return this._instance
  }

  sendJobResult = (
    id: number,
    status: StoreLocalServiceJobStatus,
    error?: string
  ) => {
    if (!NATS_EP) return

    MsgBus.Instance.publish('local-service.job', {
      id,
      status,
      error,
    })
  }
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
    const { id, printerUri, receipData } = input
    const printer = this._queuesMap.get(printerUri)
    if (!printer) {
      throw new SystemError(
        ErrorCode.VALIDATION_ERROR,
        printErrorMessage.NOT_FOUND_PRINTER
      )
    }
    printer.append({
      id,
      uri: printer.name,
      template: PrinterTemplate.RECEIPT,
      payload: receipData,
    })
    if (id) {
      LocalJobDelegate.Instance.sendJobResult(
        id,
        StoreLocalServiceJobStatus.in_queue
      )
    }
    return true
  }

  printStamp = (input: z.infer<typeof stampPrintRequest>) => {
    const { id, printerUri, stampData } = input
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
            toppings: i.toppings,
            name: i.name,
            price: i.unitPrice,
            note: i.note,
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
    id: number
    uri: string
    template: PrinterTemplate
    payload: any
  }): Promise<void> => {
    const { id, uri, template, payload } = data
    try {
      const templateFunc = this._printerTemplateMap.get(template)
      if (!templateFunc) {
        throw new SystemError(
          ErrorCode.INTERNAL_SYS_ERROR,
          printErrorMessage.UNSUPPORTED_TEMPLATE
        )
      }

      await executePrinter(uri, payload as any, templateFunc)
      LocalJobDelegate.Instance.sendJobResult(
        id,
        StoreLocalServiceJobStatus.done
      )
    } catch (e) {
      LocalJobDelegate.Instance.sendJobResult(
        id,
        StoreLocalServiceJobStatus.error,
        (e as Error).message
      )
    }
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
    note?: string
    toppings?:
      | {
          name: string
          quantity: number
          unitPrice: number
        }[]
      | undefined
  }): string[] => {
    console.log(data)
    const { name, price, toppings, storeName, table, zone, time, note } = data
    const x = 20
    const cmds = [
      'SIZE 40 mm, 30mm',
      'GAP 5 mm, 0',
      'DIRECTION 1',
      'CLS',
      `TEXT ${x},60,"1",0,1,1,"${removeVietnameseTones(storeName)}"`,
      `TEXT ${x},80,"2",0,1,1,"The       ${table} ${removeVietnameseTones(
        zone
      )}"`,
      `TEXT ${x},110,"1",0,1,1,"Ngay gio  ${time.format('DD/MM/YY HH:mm')}"`,
      `TEXT ${x},140,"3",0,1,1,"${removeVietnameseTones(name)}"`,
    ]
    let y = 140
    if (toppings) {
      toppings.forEach((t) => {
        y += 30
        cmds.push(
          `TEXT ${x},${y},"1",0,1,1,"  + ${removeVietnameseTones(t.name)}"`
        )
      })
    }
    if (note) {
      y += 30
      cmds.push(
        `TEXT ${x},${y},"1",0,1,1,"  > Note: ${removeVietnameseTones(note)}"`
      )
    }
    y += (toppings && toppings.length > 0) || note ? 30 : 50
    cmds.push(
      `TEXT ${x},${y},"2",0,1,1,"Tong      ${currencyToString(price)}"`,
      `PRINT 1,1`,
      `END`
    )
    return cmds
  }
}
