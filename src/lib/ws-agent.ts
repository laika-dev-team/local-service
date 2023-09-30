import {
  StoreLocalServiceAction,
  StoreLocalServiceExecutePayload,
} from 'common'
import { PrinterController } from 'controller'
import { getLogger } from 'helper'
import { receiptPrintRequest, stampPrintRequest } from 'schema'
import { RawData, WebSocket } from 'ws'
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

export class WsAgent {
  private _uri: string
  private _isRunning = false
  private _socket: WebSocket | undefined
  private _logger = getLogger('ws-agent')
  private _pingInterval: NodeJS.Timer | undefined
  private _retry = 0
  private _actionMap: Map<
    StoreLocalServiceAction,
    (data: any) => Promise<any>
  > = new Map()
  constructor(
    private _socketEndpoint: string,
    private _storeId: number,
    private _accessKey: string
  ) {
    this._uri = `${this._socketEndpoint}?storeId=${this._storeId}&token=${this._accessKey}`
    this._actionMap.set(
      StoreLocalServiceAction.RECEIPT,
      actionBuilder(
        receiptPrintRequest,
        PrinterController.Instance.printReceipt
      )
    )
    this._actionMap.set(
      StoreLocalServiceAction.STAMP,
      actionBuilder(stampPrintRequest, PrinterController.Instance.printStamp)
    )
  }

  start = () => {
    this._isRunning = true
    this.init()
  }

  stop = () => {
    this._isRunning = false
    this.terminate()
  }

  private onSocketOpen = () => {
    this._logger.debug('on conenction open')
    this._retry = 0
    this._pingInterval = setInterval(() => {
      this.send('ping')
    }, 50000)
  }

  private onSocketClose = (code: number) => {
    this._logger.info(`on connection close with code ${code}`)
    if (code === 1007) {
      this._isRunning = false
      this._logger.fatal('wrong connect validation')
      this.terminate()
      return
    }

    this.retryConnect()
  }

  private onSocketError = (code: number) => {
    this._logger.info(`on connection error with code ${code}`)
    if (code === 1007) {
      this._isRunning = false
      this._logger.fatal('wrong connect validation')
      this.terminate()
      return
    }

    this.retryConnect()
  }

  private onSocketMsg = (data: RawData) => {
    if (data.toString() === 'pong') return
    try {
      const payload: StoreLocalServiceExecutePayload<any> = JSON.parse(
        data.toString()
      )
      const action = this._actionMap.get(payload.action)
      if (!action) {
        this._logger.error(`action ${payload.action} not found`)
        return
      }
      try {
        return action(payload.data)
      } catch (e) {
        this._logger.debug(payload)
        this._logger.error(e, 'error when action')
        return
      }
    } catch (e) {
      this._logger.error(e, `error when parser msg from ws`)
      this._logger.debug(data.toString(), `msg for parser`)
    }
  }

  private init = () => {
    this._socket = new WebSocket(this._uri)
    this._socket.on('open', this.onSocketOpen)
    this._socket.on('close', this.onSocketClose)
    this._socket.on('error', this.onSocketError)
    this._socket.on('message', this.onSocketMsg)
  }

  private terminate = () => {
    if (this._pingInterval) {
      clearInterval(this._pingInterval)
    }
    if (this._socket) {
      this._socket.off('open', this.onSocketOpen)
      this._socket.off('close', this.onSocketClose)
      this._socket.off('error', this.onSocketError)
      this._socket.off('message', this.onSocketMsg)
      if (this._socket.readyState === WebSocket.OPEN) {
        this._socket.close()
      }
      this._socket = undefined
    }
  }

  private retryConnect = () => {
    if (!this._isRunning) return

    const delayDuration = this.retryDuration(this._retry)
    this._logger.debug(`retry connection after ${delayDuration}`)
    setTimeout(() => {
      this._retry++
      this.init()
    }, delayDuration)
  }

  private retryDuration = (retryCount: number) => {
    const baseRetry = 5000
    return retryCount === 0 ? baseRetry : baseRetry * retryCount
  }

  private send = (data: string) => {
    if (!this._socket) {
      this._logger.warn('[ping] not have socket for send ping')
      return
    }
    if (this._socket.readyState !== WebSocket.OPEN) {
      this._logger.warn('[ping] socket connect is not opened')
      return
    }

    this._socket.send(data)
  }
}
