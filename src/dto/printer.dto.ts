export enum OrderPayTypeEnum {
  CASH = 'cash',
  BANK_TRANSFER = 'bank_transfer',
  PAYMENT_GATEWAYS = 'payment_gateways',
  ELECTRONIC_WALLET = 'electronic_wallet',
}

export function orderPayToText(type: OrderPayTypeEnum) {
  switch (type) {
    case OrderPayTypeEnum.CASH:
      return 'Tiền mặt'
    case OrderPayTypeEnum.BANK_TRANSFER:
      return 'Chuyển khoản'
    case OrderPayTypeEnum.PAYMENT_GATEWAYS:
      return 'Cổng thanh toán'
    case OrderPayTypeEnum.ELECTRONIC_WALLET:
      return 'Ví điện tử'
  }
}

export type ReceiptTemplateData = {
  store: {
    address: string
    hotline: string
  }
  receiptId?: string
  items: {
    name: string
    quantity: number
    unitPrice: number
    price: number
    toppings?: { name: string; quantity: number; unitPrice: number }[]
    discount?: number
  }[]
  rawPrice: number
  totalPrice: number
  discount?: number
  vat?: number
  pay: {
    type: OrderPayTypeEnum
    receive: number
    giveBack?: number
  }
  staff: string
  orderTime: number
  zone: string
  table: string
}

export type DailyTemplateData = {
  shiftDate: string
  address: string
  employeeName: string
  totalRevenue: number
  totalDiscount: number
}
