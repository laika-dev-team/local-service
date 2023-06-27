import { PORT, PRINTER_URI } from 'config'
import * as Express from 'express'
import * as url from 'url'
import * as escpos from 'escpos'
import { parse } from 'html-to-ast'
import { getLogger } from 'helper/log'
const { buildCommand } = require('@posprint/command-builder')

function typeOf(obj: any): string | undefined {
  return Object.prototype.toString.call(obj).slice(8, -1)
}

const html2CmdBuffer = async (html: string) => {
  // const content = parse(html)
  const jsonTree = html
  console.log(jsonTree)
  const cmd = await buildCommand(jsonTree, {
    type: 'esc',
    encoding: 'UTF-8',
    paperSize: [80],
  })

  const buffer = cmd.getBuffer().flush()
  return buffer
}

const receiptPrint = (buffer: Buffer): Promise<void> => {
  return new Promise((resolve, reject) => {
    const endpoint = new url.URL(PRINTER_URI)
    const device = new escpos.Network(endpoint.host, parseInt(endpoint.port))
    device.open((err: any) => {
      if (err) {
        reject(err)
        return
      }
      const options = { encoding: 'GB18030' }
      const printer = new escpos.Printer(device, options)
      console.log(buffer.toString())
      printer.print(buffer)
      printer.close()
      resolve()
    })
  })
}

;(function () {
  const _logger = getLogger('main-service')
  const app = Express.default()
  app.use(Express.json())
  app.use(Express.urlencoded({ extended: true }))
  app.use(require('cors'))
  app.post('/print', async (req, res) => {
    try {
      const html = req.body.html
      if (!html) {
        _logger.error(req.body, 'html property not exist')
        res.status(400).send({ status: false, error: 'HTML_IS_REQUIRED' })
      }
      // if (typeOf(html) !== 'String') {
      //   _logger.error(req.body, 'html property is not a string')
      //   res.status(400).send({ status: false, error: 'HTML_MUST_BE_STRING' })
      // }
      console.log(html)
      const cmdBuf = await html2CmdBuffer(html)
      await receiptPrint(cmdBuf)
      res.status(200).send({ status: true })
    } catch (e) {
      _logger.error(e, 'error when print receipt')
      res.status(500).send({ status: false, error: (e as Error).message })
    }
  })
  app.listen(PORT, '0.0.0.0', () => {
    _logger.info(`server is running in port ${PORT}`)
  })
})()
