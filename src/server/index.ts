import { ErrorCode2StatusCode, SystemError } from 'common/error'
import { PORT, SWAGGER_ENDPOINT } from 'config'
import fastify from 'fastify'
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod'
import { getLogger } from 'helper'
import { ZodError } from 'zod'

const qs = require('qs')

export class HttpServer {
  private _logger
  private _app
  constructor() {
    this._logger = getLogger('http-gateway')
    this._app = fastify({
      querystringParser: (str) => qs.parse(str),
    })
  }

  init = async (): Promise<void> => {
    this._app.setValidatorCompiler(validatorCompiler)
    this._app.setSerializerCompiler(serializerCompiler)
    this._app.setErrorHandler((error, request, reply) => {
      this._logger.error(error, `api ${request.routerPath} error`)
      switch (error.constructor.name) {
        case 'ZodError': {
          const tmp = error as any as ZodError
          reply.status(400).send({
            code: 'VALIDATION_ERROR',
            msg: JSON.stringify(tmp.issues),
          })
          break
        }
        case 'SystemError': {
          const tmp = error as SystemError
          const code = (ErrorCode2StatusCode as any)[tmp.code]
          reply.status(code || 500).send({
            code: tmp.code,
            msg: tmp.msg,
          })
          break
        }
        default: {
          reply.status(500).send({
            code: 'UNKNOW_ERROR',
            msg: error.message,
          })
          break
        }
      }
    })
    await this._app.register(require('@fastify/cors'))
    await this._app.register(require('@fastify/swagger'), {
      openapi: {
        info: {
          title: 'Laika local service API',
          description: 'Sample backend service',
          version: '0.0.1',
        },
        servers: SWAGGER_ENDPOINT,
        components: {
          securitySchemes: {},
        },
      },
      transform: jsonSchemaTransform,
    })
    await this._app.register(require('@fastify/swagger-ui'), {
      routePrefix: '/documentation',
    })
    this._app.register(require('./routes'), {
      prefix: '/api',
      preValidation: [],
      preSerialization: [],
    })
  }

  start = (): Promise<void> => {
    return new Promise((resolve) => {
      this._app.listen(
        {
          host: '0.0.0.0',
          port: PORT,
        },
        (err) => {
          if (err) {
            this._logger.fatal(err, `server started failed... `)
            process.exit(-1)
          }
          this._logger.info(`server is running in port ${PORT}`)
          resolve()
        }
      )
    })
  }
}
