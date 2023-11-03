import dayjs from 'dayjs'
import { ThermalPrinter } from 'node-thermal-printer'
import { currencyToString, removeVietnameseTones } from 'helper/string'
import { receiptPrintPayload } from 'schema'
import { ReceiptTemplateData, orderPayToText } from 'dto'
import { getLogger } from 'helper'

const logger = getLogger('print-receipt')

export async function printReceipt(
  printer: ThermalPrinter,
  payload: ReceiptTemplateData
) {
  const data = receiptPrintPayload.parse(payload)
  // logger.info(data, 'receipt will print')
  const time = dayjs(data.orderTime)
  printer.alignCenter()
  printer.bold(true)
  printer.println(removeVietnameseTones('Hoá đơn thanh toán'))
  printer.println(removeVietnameseTones(`D/c: ${payload.store.address}`))
  printer.println(removeVietnameseTones(`Hotline: ${payload.store.hotline}`))
  printer.bold(false)
  printer.leftRight(
    removeVietnameseTones(`Số HD: ${data.receiptId || ''}`),
    removeVietnameseTones(`TN: ${data.staff}`)
  )
  printer.bold(true)
  printer.leftRight(
    removeVietnameseTones(`Bàn: ${data.zone} - ${data.table}`),
    removeVietnameseTones(`Ngày: ${time.format('DD/MM/YYYY')}`)
  )
  printer.bold(false)
  printer.leftRight(
    removeVietnameseTones(`Giờ vào: ${time.format('HH:mm')}`),
    removeVietnameseTones(`Giờ ra:  ${time.format('HH:mm')}`)
  )
  printer.drawLine()
  printer.tableCustom([
    { align: 'LEFT', width: 0.1, text: removeVietnameseTones('TT') },
    { align: 'LEFT', width: 0.3, text: removeVietnameseTones('Tên món') },
    { align: 'LEFT', width: 0.1, text: removeVietnameseTones('SL') },
    { align: 'LEFT', width: 0.2, text: removeVietnameseTones('Đ.Giá') },
    { align: 'LEFT', width: 0.3, text: removeVietnameseTones('T.Tiền') },
  ])
  printer.drawLine()
  data.items.forEach((t, i) => {
    printer.tableCustom([
      { align: 'LEFT', width: 0.1, text: `${i + 1}` },
      {
        align: 'LEFT',
        width: 0.3,
        text: removeVietnameseTones(`${t.name}`),
      },
      { align: 'LEFT', width: 0.1, text: `${t.quantity}` },
      { align: 'LEFT', width: 0.2, text: `${currencyToString(t.unitPrice)}` },
      { align: 'LEFT', width: 0.3, text: `${currencyToString(t.price)}` },
    ])
    if (t.toppings) {
      t.toppings.forEach((t) => {
        printer.tableCustom([
          // { align: 'RIGHT', width: 0.05, text: ` ` },
          {
            align: 'LEFT',
            width: 0.3,
            text: removeVietnameseTones(`+ ${t.name}`),
          },
          { align: 'LEFT', width: 0.1, text: `${t.quantity}` },
          { align: 'LEFT', width: 0.2, text: `${t.unitPrice}` },
          {
            align: 'LEFT',
            width: 0.1,
            text: `0`,
          },
        ])
      })
    }
    if (t.note) {
      printer.tableCustom([
        { align: 'LEFT', width: 0.7, text: `Note: ${t.note}` },
      ])
    }
  })
  printer.drawLine()
  printer.tableCustom([
    {
      align: 'LEFT',
      width: 0.5,
      text: removeVietnameseTones('Tổng tiền'),
      bold: true,
    },
    {
      align: 'RIGHT',
      width: 0.5,
      text: removeVietnameseTones(`${currencyToString(data.rawPrice)}`),
      bold: true,
    },
  ])
  printer.tableCustom([
    {
      align: 'LEFT',
      width: 0.1,
      text: removeVietnameseTones('+'),
      bold: true,
    },
    {
      align: 'LEFT',
      width: 0.4,
      text: removeVietnameseTones('Chiết khấu'),
      bold: true,
    },
    {
      align: 'RIGHT',
      width: 0.4,
      text: removeVietnameseTones(`${data.discount ? `${data.discount}%` : 0}`),
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
    {
      align: 'RIGHT',
      width: 0.5,
      text: `${currencyToString(data.totalPrice)}`,
      bold: true,
    },
  ])
  printer.tableCustom([
    {
      align: 'LEFT',
      width: 0.5,
      text: `+ ${removeVietnameseTones(orderPayToText(data.pay.type))}`,
    },
    {
      align: 'RIGHT',
      width: 0.5,
      text: `${currencyToString(data.totalPrice)}`,
    },
  ])
  // printer.tableCustom([
  //   {
  //     align: 'LEFT',
  //     width: 0.5,
  //     bold: true,
  //     text: removeVietnameseTones(`Tiền đưa ${data.pay.receive}`),
  //   },
  //   {
  //     align: 'LEFT',
  //     width: 0.5,
  //     bold: true,
  //     text: removeVietnameseTones(`Tiền thừa ${data.pay.giveBack || 0}`),
  //   },
  // ])
  printer.drawLine()
  printer.alignCenter()
  printer.bold(true)
  printer.println(removeVietnameseTones('Cảm ơn quý khách và hẹn gặp lại'))
  printer.bold(false)
  printer.println(removeVietnameseTones('Rất hân hạnh được phục vụ quý khách'))
  printer.cut()
}
