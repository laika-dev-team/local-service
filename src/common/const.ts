export enum StoreLocalServiceAction {
  STAMP = 'stamp',
  RECEIPT = 'receipt',
}

export type StoreLocalServiceExecutePayload<T> = {
  action: StoreLocalServiceAction
  data: T
}
