import { INTERNAL_ACECSS_KEY, POS_WS_URI, STORE_ID } from 'config'
import { PrinterController } from 'controller'
import { getLogger } from 'helper'
import { WsAgent } from 'lib'
import { HttpServer } from 'server'
;(async function () {
  const logger = getLogger('main')
  PrinterController.Instance
  const server = new HttpServer()
  await server.init()
  await server.start()

  if (INTERNAL_ACECSS_KEY && POS_WS_URI) {
    logger.info('service running in cluster mode...')
    const agent = new WsAgent(POS_WS_URI, STORE_ID, INTERNAL_ACECSS_KEY)
    agent.start()
  }
})()
