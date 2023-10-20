import { NATS_EP, STORE_ID } from 'config'
import { PrinterController } from 'controller'
import { getLogger } from 'helper'
import { MsgBus } from 'lib/msg-bus'
import { receiptPrintRequest, stampPrintRequest } from 'schema'
import { HttpServer } from 'server'
import { z } from 'zod'
const actionBuilder = (
  schema: z.ZodObject<any>,
  action: (data: any) => Promise<any> | any
) => {
  return (data: any) => {
    try {
      const payload = schema.parse(data)
      return action(payload)
    } catch (e) {
      throw e
    }
  }
}

;(async function () {
  const logger = getLogger('main')
  PrinterController.Instance
  const server = new HttpServer()
  await server.init()
  await server.start()
  if (STORE_ID && NATS_EP) {
    await MsgBus.Instance.init()
    const receiptPrintAction = MsgBus.Instance.subcribe(
      `print-receipt.${STORE_ID}`,
      actionBuilder(
        receiptPrintRequest,
        PrinterController.Instance.printReceipt
      )
    )
    receiptPrintAction.action()
    const stampPrintAction = MsgBus.Instance.subcribe(
      `print-stamp.${STORE_ID}`,
      actionBuilder(stampPrintRequest, PrinterController.Instance.printStamp)
    )
    stampPrintAction.action()
  }
})()
