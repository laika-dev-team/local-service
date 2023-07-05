import { executePrinter } from 'lib'
import {
  OrderPayTypeEnum,
  ReceiptTemplateData,
  printReceipt,
} from 'template/receipt'

const data: ReceiptTemplateData = {
  store: {
    address: '40 Bà Triệu',
    hotline: '0966966886',
  },
  receiptId: '032230',
  staff: 'Thu ngân 1',
  orderTime: Date.now(),
  zone: 'Tầng 1',
  table: 'A06',
  items: [
    { name: 'Set 8 - 3', quantity: 3, unitPrice: 83000, price: 249000 },
    {
      name: 'Xoài dừa đá xay',
      quantity: 1,
      unitPrice: 49000,
      price: 49000,
    },
    {
      name: 'Very bery yogurt',
      quantity: 1,
      unitPrice: 59000,
      price: 59000,
    },
    {
      name: 'Cà phê kem sữa',
      quantity: 1,
      unitPrice: 35000,
      price: 35000,
    },
  ],
  totalPrice: 392000,
  pay: {
    type: OrderPayTypeEnum.CASH,
    receive: 392000,
  },
}

;(async () => {
  try {
    await executePrinter('tcp://192.168.1.234:9100', data, printReceipt)
    // await executePrinter('tcp://192.168.1.234:9100', data, printHtmlReceipt)
  } catch (e) {
    console.log('error when printing', e)
  }
})()
