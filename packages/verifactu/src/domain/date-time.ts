import { invalid, ok, type Result } from "../contracts/results.js";

declare const dateBrand: unique symbol;
declare const instantBrand: unique symbol;
export type FiscalDate = string & { readonly [dateBrand]: true };
export type FiscalInstant = string & { readonly [instantBrand]: true };
export function createFiscalDate(value: string): Result<FiscalDate> {
  if (typeof value !== "string") return invalid("DIAG-DATE-LEXICAL", "domain");
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(value))
    return invalid("DIAG-DATE-LEXICAL", "domain");
  const [year, month, day] = value.split("-").map(Number) as [
    number,
    number,
    number,
  ];
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
    day > monthDays[month - 1]!
  )
    return invalid("DIAG-DATE-IMPOSSIBLE", "domain");
  return ok(value as FiscalDate);
}
export function createFiscalInstant(value: string): Result<FiscalInstant> {
  if (typeof value !== "string")
    return invalid("DIAG-INSTANT-INVALID", "domain");
  const match =
    /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,9})?(Z|[+-]\d{2}:(\d{2}))$/u.exec(
      value,
    );
  if (
    value.length > 35 ||
    !match ||
    createFiscalDate(match[1]!).status !== "ok"
  )
    return invalid("DIAG-INSTANT-INVALID", "domain");
  const hour = Number(match[2]!);
  const minute = Number(match[3]!);
  const second = Number(match[4]!);
  const timezone = match[5]!;
  const offset = timezone === "Z" ? "00:00" : timezone.slice(1);
  const [offsetHour, offsetMinute] = offset.split(":").map(Number) as [
    number,
    number,
  ];
  if (hour > 23) return invalid("DIAG-INSTANT-INVALID", "domain");
  if (minute > 59) return invalid("DIAG-INSTANT-INVALID", "domain");
  if (second > 59) return invalid("DIAG-INSTANT-INVALID", "domain");
  if (
    offsetHour > 14 ||
    offsetMinute > 59 ||
    (offsetHour === 14 && offsetMinute !== 0) ||
    !Number.isFinite(Date.parse(value))
  )
    return invalid("DIAG-INSTANT-INVALID", "domain");
  return ok(value as FiscalInstant);
}
