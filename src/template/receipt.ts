import dayjs from 'dayjs'
import { ThermalPrinter } from 'node-thermal-printer'
import { removeVietnameseTones } from 'helper/string'

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
  receiptId: string
  items: { name: string; quantity: number; unitPrice: number; price: number }[]
  totalPrice: number
  pay: {
    type: OrderPayTypeEnum
    receive: number
    give_back?: number
  }
  staff: string
  orderTime: number
  zone: string
  table: string
}

export async function printReceipt(
  printer: ThermalPrinter,
  data: ReceiptTemplateData
) {
  const time = dayjs(data.orderTime)
  printer.alignCenter()
  printer.bold(true)
  printer.println(removeVietnameseTones('Hoá đơn thanh toán'))
  printer.bold(false)
  printer.leftRight(
    removeVietnameseTones(`Số HD: ${data.receiptId}`),
    removeVietnameseTones(`TN: ${data.staff}`)
  )
  printer.leftRight(
    removeVietnameseTones(`Bàn: ${data.zone} - ${data.table}`),
    removeVietnameseTones(`Ngày: ${time.format('DD/MM/YYYY')}`)
  )
  printer.leftRight(
    removeVietnameseTones(`Giờ vào: ${time.format('hh:mm')}`),
    removeVietnameseTones(`Giờ ra:  ${time.format('hh:mm')}`)
  )
  printer.drawLine()
  printer.tableCustom([
    { align: 'CENTER', width: 0.1, text: removeVietnameseTones('TT') },
    { align: 'CENTER', width: 0.4, text: removeVietnameseTones('Tên món') },
    { align: 'CENTER', width: 0.1, text: removeVietnameseTones('SL') },
    { align: 'CENTER', width: 0.2, text: removeVietnameseTones('Đ.Giá') },
    { align: 'RIGHT', width: 0.2, text: removeVietnameseTones('T.Tiền') },
  ])
  printer.drawLine()
  data.items.forEach((t, i) => {
    printer.tableCustom([
      { align: 'CENTER', width: 0.1, text: `${i + 1}` },
      { align: 'CENTER', width: 0.4, text: removeVietnameseTones(`${t.name}`) },
      { align: 'CENTER', width: 0.1, text: `${t.quantity}` },
      { align: 'CENTER', width: 0.2, text: `${t.unitPrice}` },
      { align: 'RIGHT', width: 0.2, text: `${t.price}` },
    ])
  })
  printer.drawLine()
  printer.tableCustom([
    {
      align: 'LEFT',
      width: 0.5,
      text: removeVietnameseTones('Thành tiền'),
      bold: true,
    },
    {
      align: 'RIGHT',
      width: 0.5,
      text: removeVietnameseTones(`${data.totalPrice}`),
      bold: true,
    },
  ])
  printer.drawLine()
  printer.tableCustom([
    {
      align: 'LEFT',
      width: 0.5,
      text: removeVietnameseTones('Thành tiền'),
      bold: true,
    },
    { align: 'RIGHT', width: 0.5, text: `${data.totalPrice}`, bold: true },
  ])
  printer.tableCustom([
    {
      align: 'LEFT',
      width: 0.5,
      text: `+ ${removeVietnameseTones(orderPayToText(data.pay.type))}`,
    },
    { align: 'RIGHT', width: 0.5, text: `${data.totalPrice}` },
  ])
  printer.tableCustom([
    {
      align: 'LEFT',
      width: 0.5,
      bold: true,
      text: removeVietnameseTones(`Tiền đưa ${data.pay.receive}`),
    },
    {
      align: 'LEFT',
      width: 0.5,
      bold: true,
      text: removeVietnameseTones(`Tiền thừa ${data.pay.give_back || 0}`),
    },
  ])
  printer.drawLine()
  printer.alignCenter()
  printer.bold(true)
  printer.println(removeVietnameseTones('Cảm ơn quý khách và hẹn gặp lại'))
  printer.bold(false)
  printer.println(removeVietnameseTones('Rất hân hạnh được phục vụ quý khách'))
  printer.cut()
}
