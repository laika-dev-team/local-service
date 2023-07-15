import { OrderPayTypeEnum } from 'dto'
import { z } from 'zod'

export const receiptPrintPayload = z.object({
  receiptId: z.string().optional(),
  staff: z.string(),
  orderTime: z.number(),
  zone: z.string(),
  table: z.string(),
  totalPrice: z.number(),
  store: z.object({
    address: z.string().nonempty(),
    hotline: z.string().nonempty(),
  }),
  items: z.array(
    z.object({
      name: z.string().nonempty(),
      quantity: z.number(),
      unitPrice: z.number(),
      price: z.number(),
      toppings: z
        .array(
          z.object({
            name: z.string().nonempty(),
            quantity: z.number(),
            unitPrice: z.number(),
          })
        )
        .optional(),
    })
  ),
  pay: z.object({
    type: z.nativeEnum(OrderPayTypeEnum),
    receive: z.number(),
    giveBack: z.number().optional(),
  }),
})

export const receiptPrintRequest = z.object({
  printerUri: z.string().nonempty(),
  receipData: receiptPrintPayload,
})
