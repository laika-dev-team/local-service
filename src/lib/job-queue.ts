import assert from 'assert'
import { getLogger } from 'helper'

export type JobQueueConfig = {
  jobIntervalMs?: number
  maxRetry?: number
}

export class JobQueue<T> {
  private _queue: (T & { id: number; retry?: number })[] = []
  private _dlQueue: (T & { id: number; retry?: number })[] = []
  private _logger
  private _timerId: NodeJS.Timeout | undefined
  private _isStop = false
  constructor(
    private _name: string,
    private _action: (data: T) => Promise<void>,
    private _config?: JobQueueConfig
  ) {
    this._logger = getLogger(`job-queue-${this._name}`)
  }

  get name() {
    return this._name
  }

  append = (data: Omit<T, 'id'>) => {
    // this._logger.info(data, 'append job to queue')
    this._queue.push({ ...data, id: Date.now(), retry: undefined } as any)
    this.intervalExecute()
  }

  start = () => {
    this._isStop = false
    this.intervalExecute()
  }

  stop = () => {
    if (this._timerId) {
      clearTimeout(this._timerId)
    }
    this._isStop = true
  }

  private execute = async () => {
    if (this._queue.length === 0) {
      this._timerId = undefined
      this.intervalExecute()
      return
    }
    const data = this._queue.shift()
    try {
      assert(data, 'data must exist')
      // this._logger.debug(data, 'execute job')
      await this._action(data)
    } catch (e) {
      this._logger.error(e, 'process error ')
      assert(data, 'data must exist')
      this.onJobFailed(data)
    } finally {
      this._timerId = undefined
      this.intervalExecute()
    }
  }

  private intervalExecute = () => {
    // this._logger.debug('interval execute ', this._isStop)
    if (this._isStop) {
      return
    }
    // this._logger.debug(this._timerId, 'interval execute queue')
    if (!this._timerId) {
      const interval =
        this._config && this._config.jobIntervalMs
          ? this._config.jobIntervalMs
          : 50
      this._timerId = setTimeout(this.execute, interval)
    }
  }

  private onJobFailed = (data: T & { id: number; retry?: number }) => {
    if (!this._config) {
      this._dlQueue.push(data)
      return
    }
    if (!this._config.maxRetry) {
      this._dlQueue.push(data)
      return
    }
    if (this._config.maxRetry < 1) {
      this._dlQueue.push(data)
      return
    }

    if (!data.retry || data.retry >= this._config.maxRetry) {
      this._dlQueue.push(data)
      return
    }

    const job: T & { id: number; retry?: number } = {
      ...data,
      retry: data.retry ? data.retry + 1 : 1,
    }
    return this._queue.push(job)
  }
}
