import Decimal from "decimal.js-light";

export function d(v: string | number | Decimal | null | undefined): Decimal {
  if (v === null || v === undefined) return new Decimal(0);
  // В light-версии надёжнее использовать instanceof
  if (v instanceof Decimal) return v;
  return new Decimal(v);
}

export function toFixedStr(v: Decimal | string | number, dp = 6): string {
  const x = v instanceof Decimal ? v : new Decimal(v as string | number);
  return x.toFixed(dp);
}
