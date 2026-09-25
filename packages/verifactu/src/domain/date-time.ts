import { invalid, ok, type Result } from "../contracts/results.js";

declare const dateBrand: unique symbol;
declare const instantBrand: unique symbol;
export type FiscalDate = string & { readonly [dateBrand]: true };
export type FiscalInstant = string & { readonly [instantBrand]: true };
export function createFiscalDate(value: string): Result<FiscalDate> {
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(value))
    return invalid("DIAG-DATE-LEXICAL", "domain");
  const [y, m, d] = value.split("-").map(Number);
  const year = y ?? 0;
  const month = m ?? 0;
  const day = d ?? 0;
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const monthDays = [
    31,
    leap ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];
  if (
    year === 0 ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > (monthDays[month - 1] ?? 0)
  )
    return invalid("DIAG-DATE-IMPOSSIBLE", "domain");
  return ok(value as FiscalDate);
}
export function createFiscalInstant(value: string): Result<FiscalInstant> {
  const match =
    /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,9})?(Z|[+-]\d{2}:(\d{2}))$/u.exec(
      value,
    );
  if (
    value.length > 35 ||
    !match ||
    createFiscalDate(match[1] ?? "").status !== "ok"
  )
    return invalid("DIAG-INSTANT-INVALID", "domain");
  const hour = Number(match[2]);
  const minute = Number(match[3]);
  const second = Number(match[4]);
  const offset = match[5] === "Z" ? "00:00" : (match[5]?.slice(1) ?? "00:00");
  const [offsetHour, offsetMinute] = offset.split(":").map(Number);
  if (
    hour > 23 ||
    minute > 59 ||
    second > 59 ||
    (offsetHour ?? 0) > 14 ||
    (offsetMinute ?? 0) > 59 ||
    (offsetHour === 14 && offsetMinute !== 0) ||
    !Number.isFinite(Date.parse(value))
  )
    return invalid("DIAG-INSTANT-INVALID", "domain");
  return ok(value as FiscalInstant);
}
