import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import { DailyTemplateData } from 'dto'
import { removeVietnameseTones } from 'helper/string'
import { ThermalPrinter } from 'node-thermal-printer'
import { dailyReceiptData } from 'schema'
dayjs.extend(timezone)

export async function printDailyReceipt(
  printer: ThermalPrinter,
  payload: DailyTemplateData
) {
  const data = dailyReceiptData.parse(payload)
  // logger.info(data, 'receipt will print')
  const time = dayjs(Date.now()).tz('Asia/Saigon')
  printer.alignCenter()
  printer.bold(true)
  printer.println(removeVietnameseTones('Tổng kết ca'))
  printer.bold(false)
  printer.tableCustom([
    {
      align: 'LEFT',
      width: 0.5,
      text: removeVietnameseTones('Ca:'),
      bold: true,
    },
    {
      align: 'RIGHT',
      width: 0.5,
      text: removeVietnameseTones(`${data.shiftDate}`),
      bold: true,
    },
  ])
  printer.tableCustom([
    {
      align: 'LEFT',
      width: 0.5,
      text: removeVietnameseTones('Địa chỉ:'),
      bold: true,
    },
    {
      align: 'RIGHT',
      width: 0.5,
      text: removeVietnameseTones(`${data.address}`),
      bold: true,
    },
  ])
  printer.tableCustom([
    {
      align: 'LEFT',
      width: 0.5,
      text: removeVietnameseTones('Người in:'),
      bold: true,
    },
    {
      align: 'RIGHT',
      width: 0.5,
      text: removeVietnameseTones(`${data.employeeName}`),
      bold: true,
    },
  ])
  printer.tableCustom([
    {
      align: 'LEFT',
      width: 0.5,
      text: removeVietnameseTones('Thời gian in:'),
      bold: true,
    },
    {
      align: 'RIGHT',
      width: 0.5,
      text: removeVietnameseTones(`${time.format('DD/MM/YYYY HH:mm:ss')}`),
      bold: true,
    },
  ])
  printer.tableCustom([
    {
      align: 'LEFT',
      width: 0.5,
      text: removeVietnameseTones('Tổng tiền:'),
      bold: true,
    },
    {
      align: 'RIGHT',
      width: 0.5,
      text: removeVietnameseTones(`${data.totalRevenue}`),
      bold: true,
    },
  ])
  printer.tableCustom([
    {
      align: 'LEFT',
      width: 0.5,
      text: removeVietnameseTones('Tổng CK'),
      bold: true,
    },
    {
      align: 'RIGHT',
      width: 0.5,
      text: removeVietnameseTones(`${data.totalRevenue}`),
      bold: true,
    },
  ])
  printer.cut()
}
