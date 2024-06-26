import assert from 'assert'
import { NATS_EP } from 'config'
import { getLogger } from 'helper'
import { connect, NatsConnection, JSONCodec, Events } from 'nats'

export interface IMsgBusSubcriberAction {
  action: () => Promise<void>
  close: () => void
}

export class MsgBus {
  private static _ins: MsgBus | undefined
  public static get Instance(): MsgBus {
    if (!this._ins) {
      this._ins = new MsgBus()
    }
    return this._ins
  }

  private _connection: NatsConnection | undefined
  private _jc = JSONCodec()
  private _logger

  private constructor() {
    this._logger = getLogger('msg-bus')
  }

  init = async () => {
    try {
      this._connection = await connect({
        servers: [NATS_EP],
        maxReconnectAttempts: -1,
        reconnect: true,
      })
      this.statusCheck()
    } catch (e) {
      this._logger.fatal(e, 'error when connect to nats')
      process.exit(-1)
    }
  }

  publish = (channel: string, payload: any) => {
    assert(!!this._connection, 'connection must exist')
    this._connection.publish(channel, this._jc.encode(payload))
  }

  subcribe = <T>(
    channel: string,
    callback: (data: T) => void
  ): IMsgBusSubcriberAction => {
    assert(!!this._connection, 'connection must exist')
    const subscriber = this._connection.subscribe(channel)
    const action = async () => {
      for await (const m of subscriber) {
        const msg: T = this._jc.decode(m.data) as T
        this._logger.debug(msg, `on message `)
        this._logger.warn(msg, `got a msg from ${channel}`)
        try {
          await callback(msg)
        } catch (e) {
          this._logger.error(e, 'handle msg error')
        }
      }
    }

    return {
      action,
      close: () => subscriber.unsubscribe(),
    }
  }

  statusCheck = async () => {
    if (!this._connection) {
      this._logger.fatal('not have nats connection....')
      throw new Error('Not have connection')
    }
    for await (const s of this._connection.status()) {
      switch (s.type) {
        case Events.Disconnect:
          this._logger.info(s.data, 'nats connection is disconnected....')
          break
        case Events.Error:
          this._logger.info(s.data, 'nats connection is errored...')
          break
        case Events.Reconnect:
          this._logger.info(s.data, 'nats is reconnecting')
          break
        default:
          break
      }
    }
  }
}
