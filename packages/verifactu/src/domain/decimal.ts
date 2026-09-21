import {
  failed,
  succeeded,
  type OperationResult,
} from "../contracts/results.js";
import { diagnostic } from "./diagnostics.js";

export interface ExactDecimal {
  readonly lexical: string;
  readonly coefficient: bigint;
  readonly scale: number;
}

const DECIMAL = /^(-?)(0|[1-9]\d*)(?:\.(\d+))?$/u;

export function parseDecimal(
  lexical: string,
  maximumScale = 12,
  maximumPrecision = 18,
): OperationResult<ExactDecimal> {
  const match = DECIMAL.exec(lexical);
  if (match === null) {
    return decimalFailure(maximumScale, maximumPrecision);
  }
  const fraction = match[3] ?? "";
  if (
    lexical === "-0" ||
    /^-0\.0+$/u.test(lexical) ||
    fraction.length > maximumScale ||
    `${match[2]}${fraction}`.length > maximumPrecision
  ) {
    return decimalFailure(maximumScale, maximumPrecision);
  }
  const coefficient = BigInt(`${match[1]}${match[2]}${fraction}`);
  return succeeded(
    Object.freeze({ lexical, coefficient, scale: fraction.length }),
  );
}

function decimalFailure(
  maximumScale: number,
  maximumPrecision: number,
): OperationResult<ExactDecimal> {
  return failed("invalid", [
    diagnostic("DIAG-DECIMAL-INVALID", "input", "domain", "/decimal", {
      maximumScale,
      maximumPrecision,
    }),
  ]);
}

export function decimalFromUnknown(
  value: unknown,
): OperationResult<ExactDecimal> {
  return typeof value === "string"
    ? parseDecimal(value)
    : failed("invalid", [
        diagnostic("DIAG-DECIMAL-UNSAFE-NUMBER", "input", "domain", "/decimal"),
      ]);
}

export function formatDecimal(decimal: ExactDecimal): string {
  return decimal.lexical;
}

export function compareDecimal(
  left: ExactDecimal,
  right: ExactDecimal,
): number {
  const scale = Math.max(left.scale, right.scale);
  const leftValue = left.coefficient * 10n ** BigInt(scale - left.scale);
  const rightValue = right.coefficient * 10n ** BigInt(scale - right.scale);
  return leftValue < rightValue ? -1 : leftValue > rightValue ? 1 : 0;
}

export function addDecimals(values: readonly ExactDecimal[]): ExactDecimal {
  const scale = values.reduce(
    (maximum, value) => Math.max(maximum, value.scale),
    0,
  );
  const coefficient = values.reduce(
    (sum, value) =>
      sum + value.coefficient * 10n ** BigInt(scale - value.scale),
    0n,
  );
  return decimalFromParts(coefficient, scale);
}

export function subtractDecimals(
  left: ExactDecimal,
  right: ExactDecimal,
): ExactDecimal {
  const scale = Math.max(left.scale, right.scale);
  const coefficient =
    left.coefficient * 10n ** BigInt(scale - left.scale) -
    right.coefficient * 10n ** BigInt(scale - right.scale);
  return decimalFromParts(coefficient, scale);
}

export function decimalFromParts(
  coefficient: bigint,
  scale: number,
): ExactDecimal {
  if (!Number.isSafeInteger(scale) || scale < 0) {
    throw new RangeError("decimal scale must be a non-negative safe integer");
  }
  const negative = coefficient < 0n;
  const digits = (negative ? -coefficient : coefficient)
    .toString()
    .padStart(scale + 1, "0");
  const lexical =
    scale === 0
      ? `${negative ? "-" : ""}${digits}`
      : `${negative ? "-" : ""}${digits.slice(0, -scale)}.${digits.slice(-scale)}`;
  return Object.freeze({ lexical, coefficient, scale });
}
