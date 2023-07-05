import { PrinterController } from 'controller'
import { HttpServer } from 'server'
;(async function () {
  PrinterController.Instance
  const server = new HttpServer()
  await server.init()
  await server.start()
})()
