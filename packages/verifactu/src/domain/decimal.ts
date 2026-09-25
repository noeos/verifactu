import { invalid, ok, type Result } from "../contracts/results.js";

declare const decimalBrand: unique symbol;
export interface Decimal {
  readonly text: string;
  readonly coefficient: bigint;
  readonly scale: number;
  readonly [decimalBrand]: true;
}
export interface DecimalPolicy {
  readonly maxIntegerDigits: number;
  readonly maxScale: number;
  readonly allowNegative?: boolean;
}
export function createDecimal(
  value: string,
  policy: DecimalPolicy,
): Result<Decimal> {
  if (
    !Number.isSafeInteger(policy.maxIntegerDigits) ||
    policy.maxIntegerDigits < 1 ||
    policy.maxIntegerDigits > 64 ||
    !Number.isSafeInteger(policy.maxScale) ||
    policy.maxScale < 0 ||
    policy.maxScale > 18
  )
    return invalid("DIAG-DECIMAL-POLICY", "domain");
  if (typeof value !== "string" || !/^-?(?:0|[1-9]\d*)(?:\.\d+)?$/u.test(value))
    return invalid("DIAG-DECIMAL-LEXICAL", "domain");
  const negative = value.startsWith("-");
  const unsigned = negative ? value.slice(1) : value;
  const [whole = "", fraction = ""] = unsigned.split(".");
  if (
    (negative && policy.allowNegative !== true) ||
    whole.length > policy.maxIntegerDigits ||
    fraction.length > policy.maxScale
  )
    return invalid("DIAG-DECIMAL-RANGE", "domain");
  const coefficient = BigInt(`${negative ? "-" : ""}${whole}${fraction}`);
  if (negative && coefficient === 0n)
    return invalid("DIAG-DECIMAL-RANGE", "domain");
  return ok(
    Object.freeze({
      text: value,
      coefficient,
      scale: fraction.length,
    }) as Decimal,
  );
}
export function decimalFromNumber(
  value: number,
  policy: DecimalPolicy,
): Result<Decimal> {
  if (!Number.isSafeInteger(value) || Object.is(value, -0))
    return invalid("DIAG-DECIMAL-UNSAFE-NUMBER", "domain");
  return createDecimal(String(value), policy);
}
