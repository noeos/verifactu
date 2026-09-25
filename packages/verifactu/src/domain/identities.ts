import { invalid, ok, type Result } from "../contracts/results.js";
import { createFiscalDate } from "./date-time.js";

declare const identityBrand: unique symbol;
export type IdentityKind =
  | "tenant"
  | "taxpayer"
  | "installation"
  | "edition"
  | "document"
  | "record"
  | "event"
  | "chain"
  | "operation";
export interface Identity<K extends IdentityKind> {
  readonly kind: K;
  readonly value: string;
  readonly [identityBrand]: K;
}

export function createIdentity<K extends IdentityKind>(
  kind: K,
  value: string,
): Result<Identity<K>> {
  if (
    typeof value !== "string" ||
    value.length < 1 ||
    value.length > 128 ||
    value !== value.trim() ||
    /[\u0000-\u001f\u007f]/u.test(value)
  ) {
    return invalid("DIAG-IDENTITY-INVALID", "domain", `/${kind}`);
  }
  return ok(Object.freeze({ kind, value }) as Identity<K>);
}

export function isIdentity<K extends IdentityKind>(
  value: unknown,
  kind: K,
): value is Identity<K> {
  if (!value || typeof value !== "object") return false;
  const candidate = value as { kind?: unknown; value?: unknown };
  return (
    candidate.kind === kind &&
    typeof candidate.value === "string" &&
    candidate.value.length > 0 &&
    candidate.value.length <= 128 &&
    candidate.value === candidate.value.trim() &&
    !/[\u0000-\u001f\u007f]/u.test(candidate.value)
  );
}

export interface FiscalDocumentIdentity {
  readonly issuer: Identity<"taxpayer">;
  readonly series: string;
  readonly number: string;
  readonly issueDate: string;
}
export function createFiscalDocumentIdentity(
  input: FiscalDocumentIdentity,
): Result<FiscalDocumentIdentity> {
  if (
    !isIdentity(input.issuer, "taxpayer") ||
    !input.series ||
    input.series.length > 60 ||
    !input.number ||
    input.number.length > 60 ||
    createFiscalDate(input.issueDate).status !== "ok"
  )
    return invalid("DIAG-FISCAL-DOCUMENT-IDENTITY", "domain");
  return ok(
    Object.freeze({
      ...input,
      issuer: Object.freeze({ ...input.issuer }),
    }),
  );
}

export function sameIdentity<K extends IdentityKind>(
  left: Identity<K>,
  right: Identity<K>,
): boolean {
  return left.kind === right.kind && left.value === right.value;
}

export function identityKey(
  parts: readonly (Identity<IdentityKind> | string)[],
): string {
  return JSON.stringify(
    parts.map((part) =>
      typeof part === "string" ? ["string", part] : [part.kind, part.value],
    ),
  );
}
