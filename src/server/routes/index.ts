import { FastifyInstance } from 'fastify'

module.exports = function (fastify: FastifyInstance, opts: any, done: any) {
  fastify.register(require('./printer'), {
    ...opts,
    prefix: 'printer',
    tags: ['printer'],
  })
  done()
}
