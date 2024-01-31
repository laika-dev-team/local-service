import { PrinterController } from 'controller'
import { FastifyInstance } from 'fastify'
import {
  ErrorSchemaWithCode,
  dailyReceiptPrintRequest,
  receiptPrintRequest,
  stampPrintRequest,
  statusResponse,
} from 'schema'

module.exports = function (fastify: FastifyInstance, opts: any, done: any) {
  const { tags, ...option } = opts
  fastify.post(
    '/receipt',
    {
      ...option,
      schema: {
        tags,
        body: receiptPrintRequest,
        response: {
          ...ErrorSchemaWithCode,
          200: statusResponse,
        },
      },
    },
    (req, reply) => {
      const data = receiptPrintRequest.parse(req.body)
      PrinterController.Instance.printReceipt(data)
      reply.status(200).send({ status: true })
    }
  )
  fastify.post(
    '/stamp',
    {
      ...option,
      schema: {
        tags,
        body: stampPrintRequest,
        response: {
          ...ErrorSchemaWithCode,
          200: statusResponse,
        },
      },
    },
    (req, reply) => {
      const data = stampPrintRequest.parse(req.body)
      PrinterController.Instance.printStamp(data)
      reply.status(200).send({ status: true })
    }
  )

  fastify.post(
    '/daily-receipt',
    {
      ...option,
      schema: {
        tags,
        body: dailyReceiptPrintRequest,
        response: {
          ...ErrorSchemaWithCode,
          200: statusResponse,
        },
      },
    },
    (req, reply) => {
      const data = dailyReceiptPrintRequest.parse(req.body)
      PrinterController.Instance.printDailyReceipt(data)
      reply.status(200).send({ status: true })
    }
  )
  done()
}
