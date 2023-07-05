export enum ErrorCode {
  UNKNOW_ERROR = 'UNKNOW_ERROR',
  ENTITY_NOT_FOUND = 'ENTITY_NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  PERMISSION_DENNIED = 'PERMISSION_DENNIED',
  INTERNAL_SYS_ERROR = 'INTERNAL_SYS_ERROR',
}

export enum ErrorCode2StatusCode {
  UNKNOW_ERROR = 500,
  ENTITY_NOT_FOUND = 404,
  VALIDATION_ERROR = 400,
  UNAUTHORIZED = 401,
  PERMISSION_DENNIED = 403,
  INTERNAL_SYS_ERROR = 502,
}

export class SystemError {
  constructor(public code: string, public msg?: string) {}
}

export const printErrorMessage = {
  UNSUPPORTED_TEMPLATE: 'Không hỗ trợ mẫu in này',
  NOT_FOUND_PRINTER: 'Không tìm thấy máy in',
}
