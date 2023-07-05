export function typeOf(obj: any): string | undefined {
  return Object.prototype.toString.call(obj).slice(8, -1)
}
