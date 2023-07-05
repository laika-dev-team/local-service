import { PORT } from 'config'
import * as Express from 'express'
import { getLogger } from 'helper'
;(function () {
  const _logger = getLogger('main-service')
  const app = Express.default()
  app.use(Express.json())
  app.use(Express.urlencoded({ extended: true }))
  app.use(require('cors')({ origin: '*' }))
  app.listen(PORT, '0.0.0.0', () => {
    _logger.info(`server is running in port ${PORT}`)
  })
})()
