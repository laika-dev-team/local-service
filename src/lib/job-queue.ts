import assert from 'assert'
import { getLogger } from 'helper'

export type JobQueueConfig = {
  jobIntervalMs?: number
  maxRetry?: number
}

export class JobQueue<T extends { id: number; retry?: number }> {
  private _queue: T[] = []
  private _dlQueue: T[] = []
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

  append = (data: Omit<T, 'id'>) => {
    this._queue.push({ ...data, id: Date.now(), retry: undefined } as any)
    this.intervalExecute()
  }

  start = () => {
    this._isStop = true
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
      this.intervalExecute()
    }
    const data = this._queue.shift()
    try {
      assert(data, 'data must exist')
      await this._action(data)
    } catch (e) {
      this._logger.error(e, 'process error ')
      assert(data, 'data must exist')
      this.onJobFailed(data)
    } finally {
      this.intervalExecute()
    }
  }

  private intervalExecute = () => {
    if (this._isStop) {
      return
    }
    if (!this._timerId) {
      const interval =
        this._config && this._config.jobIntervalMs
          ? this._config.jobIntervalMs
          : 50
      this._timerId = setTimeout(this.execute, interval)
    }
  }

  private onJobFailed = (data: T) => {
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

    const job: T = { ...data, retry: data.retry ? data.retry + 1 : 1 }
    return this._queue.push(job)
  }
}
