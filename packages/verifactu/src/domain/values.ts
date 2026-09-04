// SPDX-License-Identifier: Apache-2.0

import { isValidUnicode } from "../validation/object-inspection.js";

const AEAT_DATE = /^(\d{2})-(\d{2})-(\d{4})$/u;
const AEAT_DATE_TIME = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(Z|[+-]\d{2}:\d{2})$/u;
const DECIMAL = /^-?(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/u;
const FINGERPRINT = /^[0-9A-F]{64}$/u;
const OPAQUE_ID = /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$/u;

export class Nif {
  private constructor(readonly value: string) {
    Object.freeze(this);
  }

  static parse(input: unknown): Nif | undefined {
    return typeof input === "string" && /^[A-Z0-9]{9}$/u.test(input) ? new Nif(input) : undefined;
  }
}

export class AeatDate {
  private constructor(
    readonly value: string,
    readonly year: number,
    readonly month: number,
    readonly day: number,
  ) {
    Object.freeze(this);
  }

  static parse(input: unknown): AeatDate | undefined {
    if (typeof input !== "string") return undefined;
    const match = AEAT_DATE.exec(input);
    if (match === null) return undefined;
    const dayText = match[1];
    const monthText = match[2];
    const yearText = match[3];
    if (dayText === undefined || monthText === undefined || yearText === undefined)
      return undefined;
    const day = Number(dayText);
    const month = Number(monthText);
    const year = Number(yearText);
    if (!isCalendarDate(year, month, day)) return undefined;
    return new AeatDate(input, year, month, day);
  }

  compare(other: AeatDate): number {
    const left = this.year * 10_000 + this.month * 100 + this.day;
    const right = other.year * 10_000 + other.month * 100 + other.day;
    return left < right ? -1 : left > right ? 1 : 0;
  }
}

export class AeatDateTime {
  private constructor(readonly value: string) {
    Object.freeze(this);
  }

  static parse(input: unknown): AeatDateTime | undefined {
    if (typeof input !== "string") return undefined;
    const match = AEAT_DATE_TIME.exec(input);
    if (match === null) return undefined;
    const year = numberPart(match[1]);
    const month = numberPart(match[2]);
    const day = numberPart(match[3]);
    const hour = numberPart(match[4]);
    const minute = numberPart(match[5]);
    const second = numberPart(match[6]);
    const zone = match[7];
    if (
      year === undefined ||
      month === undefined ||
      day === undefined ||
      hour === undefined ||
      minute === undefined ||
      second === undefined ||
      zone === undefined ||
      !isCalendarDate(year, month, day) ||
      hour > 23 ||
      minute > 59 ||
      second > 59 ||
      !validZone(zone)
    ) {
      return undefined;
    }
    return new AeatDateTime(input);
  }
}

export class DecimalLexeme {
  private constructor(
    readonly value: string,
    readonly coefficient: bigint,
    readonly scale: 0 | 1 | 2,
  ) {
    Object.freeze(this);
  }

  static parse(input: unknown): DecimalLexeme | undefined {
    if (typeof input !== "string" || !DECIMAL.test(input)) return undefined;
    const negative = input.startsWith("-");
    const unsigned = negative ? input.slice(1) : input;
    const [integer = "", fraction = ""] = unsigned.split(".");
    const scale = fraction.length;
    if (scale !== 0 && scale !== 1 && scale !== 2) return undefined;
    const digits = `${integer}${fraction}`;
    const coefficient = BigInt(`${negative ? "-" : ""}${digits}`);
    return new DecimalLexeme(input, coefficient, scale);
  }

  compareAbsoluteInteger(value: bigint): number {
    const minor = absolute(this.toMinorUnits());
    return minor < value ? -1 : minor > value ? 1 : 0;
  }

  toMinorUnits(): bigint {
    return this.coefficient * 10n ** BigInt(2 - this.scale);
  }
}

export class RrsifFingerprint {
  private constructor(readonly value: string) {
    Object.freeze(this);
  }

  static parse(input: unknown): RrsifFingerprint | undefined {
    return typeof input === "string" && FINGERPRINT.test(input)
      ? new RrsifFingerprint(input)
      : undefined;
  }
}

export class OpaqueId {
  private constructor(readonly value: string) {
    Object.freeze(this);
  }

  static parse(input: unknown): OpaqueId | undefined {
    return typeof input === "string" && OPAQUE_ID.test(input) ? new OpaqueId(input) : undefined;
  }
}

export class OfficialText {
  private constructor(readonly value: string) {
    Object.freeze(this);
  }

  static parse(input: unknown, minimum: number, maximum: number): OfficialText | undefined {
    if (
      typeof input !== "string" ||
      !isValidUnicode(input) ||
      input !== input.trim() ||
      codePointLength(input) < minimum ||
      codePointLength(input) > maximum
    ) {
      return undefined;
    }
    return new OfficialText(input);
  }
}

function numberPart(value: string | undefined): number | undefined {
  return value === undefined ? undefined : Number(value);
}

function codePointLength(value: string): number {
  let length = 0;
  for (const ignored of value) {
    void ignored;
    length += 1;
  }
  return length;
}

function validZone(value: string): boolean {
  if (value === "Z") return true;
  const hour = Number(value.slice(1, 3));
  const minute = Number(value.slice(4, 6));
  return hour <= 14 && minute <= 59 && (hour !== 14 || minute === 0);
}

function isCalendarDate(year: number, month: number, day: number): boolean {
  if (year < 1 || month < 1 || month > 12 || day < 1) return false;
  const monthDays = [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const maximum = monthDays[month - 1];
  return maximum !== undefined && day <= maximum;
}

function isLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function absolute(value: bigint): bigint {
  return value < 0n ? -value : value;
}
