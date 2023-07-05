import { z } from 'zod'

export const ErrorSchema = z.object({
  code: z.string(),
  msg: z.string().optional(),
})

export const statusResponse = z.object({
  status: z.boolean().default(true),
})

export const ErrorSchemaWithCode = {
  400: ErrorSchema,
  401: ErrorSchema,
  403: ErrorSchema,
  404: ErrorSchema,
  429: ErrorSchema,
  500: ErrorSchema,
  501: ErrorSchema,
  502: ErrorSchema,
}
