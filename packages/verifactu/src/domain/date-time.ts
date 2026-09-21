import {
  failed,
  succeeded,
  type OperationResult,
} from "../contracts/results.js";
import { diagnostic } from "./diagnostics.js";

declare const dateBrand: unique symbol;
declare const instantBrand: unique symbol;
export type FiscalDate = string & { readonly [dateBrand]: true };
export type FiscalInstant = string & { readonly [instantBrand]: true };

const DATE = /^(\d{4})-(\d{2})-(\d{2})$/u;
const INSTANT =
  /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2}):(\d{2})(Z|[+-]\d{2}:\d{2})$/u;

function leap(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

export function parseFiscalDate(value: string): OperationResult<FiscalDate> {
  const match = DATE.exec(value);
  const year = Number(match?.[1]);
  const month = Number(match?.[2]);
  const day = Number(match?.[3]);
  const days = [
    31,
    leap(year) ? 29 : 28,
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
    match === null ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > (days[month - 1] ?? 0)
  ) {
    return failed("invalid", [
      diagnostic("DIAG-DATE-INVALID", "input", "domain", "/date"),
    ]);
  }
  return succeeded(value as FiscalDate);
}

export function parseFiscalInstant(
  value: string,
): OperationResult<FiscalInstant> {
  const match = INSTANT.exec(value);
  if (
    match === null ||
    parseFiscalDate(match[1] ?? "").status !== "succeeded"
  ) {
    return failed("invalid", [
      diagnostic("DIAG-INSTANT-INVALID", "input", "domain", "/instant"),
    ]);
  }
  const hour = Number(match[2]);
  const minute = Number(match[3]);
  const second = Number(match[4]);
  const offset = match[5] ?? "";
  const offsetHour = offset === "Z" ? 0 : Number(offset.slice(1, 3));
  const offsetMinute = offset === "Z" ? 0 : Number(offset.slice(4, 6));
  if (
    hour > 23 ||
    minute > 59 ||
    second > 59 ||
    offsetHour > 14 ||
    offsetMinute > 59 ||
    (offsetHour === 14 && offsetMinute !== 0)
  ) {
    return failed("invalid", [
      diagnostic("DIAG-INSTANT-INVALID", "input", "domain", "/instant"),
    ]);
  }
  return succeeded(value as FiscalInstant);
}

function daysFromCivil(year: number, month: number, day: number): bigint {
  const adjustedYear = year - (month <= 2 ? 1 : 0);
  const era = Math.floor(adjustedYear / 400);
  const yearOfEra = adjustedYear - era * 400;
  const adjustedMonth = month + (month > 2 ? -3 : 9);
  const dayOfYear = Math.floor((153 * adjustedMonth + 2) / 5) + day - 1;
  const dayOfEra =
    yearOfEra * 365 +
    Math.floor(yearOfEra / 4) -
    Math.floor(yearOfEra / 100) +
    dayOfYear;
  return BigInt(era * 146097 + dayOfEra);
}

function instantSeconds(value: FiscalInstant): bigint {
  const match = INSTANT.exec(value)!;
  const date = DATE.exec(match[1] ?? "")!;
  const offset = match[5] ?? "Z";
  const direction = offset.startsWith("-") ? -1 : 1;
  const offsetSeconds =
    offset === "Z"
      ? 0
      : direction *
        (Number(offset.slice(1, 3)) * 3600 + Number(offset.slice(4, 6)) * 60);
  return (
    daysFromCivil(Number(date[1]), Number(date[2]), Number(date[3])) * 86_400n +
    BigInt(
      Number(match[2]) * 3600 +
        Number(match[3]) * 60 +
        Number(match[4]) -
        offsetSeconds,
    )
  );
}

export function compareFiscalInstants(
  left: FiscalInstant,
  right: FiscalInstant,
): number {
  const leftSeconds = instantSeconds(left);
  const rightSeconds = instantSeconds(right);
  return leftSeconds < rightSeconds ? -1 : leftSeconds > rightSeconds ? 1 : 0;
}
