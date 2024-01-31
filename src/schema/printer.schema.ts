import { OrderPayTypeEnum } from 'dto'
import { z } from 'zod'

export const receiptPrintPayload = z.object({
  receiptId: z.string().optional(),
  staff: z.string(),
  orderTime: z.number(),
  zone: z.string(),
  table: z.string(),
  totalPrice: z.number(),
  rawPrice: z.number(),
  discount: z.number().optional(),
  vat: z.number().optional(),
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
      discount: z.number().optional(),
      note: z.string().optional(),
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

export const stampData = z.object({
  storeName: z.string().nonempty(),
  zone: z.string().nonempty(),
  table: z.string().nonempty(),
  orderId: z.number().positive(),
  orderTime: z.number().positive(),
  items: z.array(
    z.object({
      name: z.string().nonempty(),
      quantity: z.number(),
      unitPrice: z.number(),
      price: z.number(),
      discount: z.number().optional(),
      note: z.string().optional(),
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
})

export const dailyReceiptData = z.object({
  address: z.string().nonempty(),
  employeeName: z.string().nonempty(),
  totalRevenue: z.number().positive(),
  totalDiscount: z.number().nonnegative(),
})

export const receiptPrintRequest = z.object({
  id: z.number().optional(),
  printerUri: z.string().nonempty(),
  receipData: receiptPrintPayload,
})

export const stampPrintRequest = z.object({
  id: z.number().optional(),
  printerUri: z.string().nonempty(),
  stampData: stampData,
})

export const dailyReceiptPrintRequest = z.object({
  id: z.number().optional(),
  printerUri: z.string().nonempty(),
  receipData: dailyReceiptData,
})
