import { invalid, ok, type Result } from "../contracts/results.js";
import type { FiscalContext } from "./context.js";
import { sameContext } from "./context.js";
import type { Decimal } from "./decimal.js";
import type { FiscalDate, FiscalInstant } from "./date-time.js";
import type { Identity, FiscalDocumentIdentity } from "./identities.js";
import {
  createFiscalDocumentIdentity,
  isIdentity,
  sameIdentity,
} from "./identities.js";
import { createFiscalDate, createFiscalInstant } from "./date-time.js";
import { createDecimal } from "./decimal.js";
import { createFiscalContext } from "./context.js";

export interface AltaRecord {
  readonly kind: "alta";
  readonly id: Identity<"record">;
  readonly context: FiscalContext;
  readonly document: FiscalDocumentIdentity;
  readonly issueDate: FiscalDate;
  readonly generatedAt: FiscalInstant;
  readonly total: Decimal;
  readonly predecessorId: Identity<"record"> | null;
  readonly editionId: Identity<"edition">;
}
export interface AnulacionRecord {
  readonly kind: "anulacion";
  readonly id: Identity<"record">;
  readonly context: FiscalContext;
  readonly target: FiscalDocumentIdentity;
  readonly cause: string;
  readonly generatedAt: FiscalInstant;
  readonly predecessorId: Identity<"record"> | null;
  readonly editionId: Identity<"edition">;
}
export type BillingRecord = AltaRecord | AnulacionRecord;

function isValidDecimal(value: Decimal): boolean {
  if (!value || typeof value !== "object" || typeof value.text !== "string")
    return false;
  const parsed = createDecimal(value.text, {
    maxIntegerDigits: 64,
    maxScale: 18,
    allowNegative: true,
  });
  return (
    parsed.status === "ok" &&
    parsed.value.coefficient === value.coefficient &&
    parsed.value.scale === value.scale
  );
}

export function createAltaRecord(input: AltaRecord): Result<AltaRecord> {
  const context = input.context ? createFiscalContext(input.context) : null;
  const document = input.document
    ? createFiscalDocumentIdentity(input.document)
    : null;
  if (
    input.kind !== "alta" ||
    !input.id ||
    !input.context ||
    !input.document ||
    !input.total ||
    !input.generatedAt ||
    !input.editionId ||
    !isIdentity(input.id, "record") ||
    !isIdentity(input.editionId, "edition") ||
    (input.predecessorId !== null &&
      !isIdentity(input.predecessorId, "record")) ||
    context?.status !== "ok" ||
    document?.status !== "ok" ||
    createFiscalDate(input.issueDate).status !== "ok" ||
    input.issueDate !== input.document.issueDate ||
    createFiscalInstant(input.generatedAt).status !== "ok" ||
    !isValidDecimal(input.total) ||
    (input.predecessorId !== null &&
      sameIdentity(input.id, input.predecessorId)) ||
    !sameIdentity(input.context.editionId, input.editionId) ||
    !sameIdentity(input.document.issuer, input.context.taxpayerId)
  )
    return invalid("DIAG-ALTA-REQUIRED", "domain");
  return ok(
    Object.freeze({
      ...input,
      context: context.value,
      document: document.value,
      total: Object.freeze({ ...input.total }),
    }),
  );
}
export function createAnulacionRecord(
  input: AnulacionRecord,
): Result<AnulacionRecord> {
  const context = input.context ? createFiscalContext(input.context) : null;
  const target = input.target
    ? createFiscalDocumentIdentity(input.target)
    : null;
  if (
    input.kind !== "anulacion" ||
    !input.id ||
    !input.context ||
    !input.target ||
    !input.cause ||
    input.cause.length > 256 ||
    !input.generatedAt ||
    !input.editionId ||
    !isIdentity(input.id, "record") ||
    !isIdentity(input.editionId, "edition") ||
    (input.predecessorId !== null &&
      !isIdentity(input.predecessorId, "record")) ||
    (input.predecessorId !== null &&
      sameIdentity(input.id, input.predecessorId)) ||
    context?.status !== "ok" ||
    target?.status !== "ok" ||
    createFiscalInstant(input.generatedAt).status !== "ok" ||
    !sameIdentity(input.context.editionId, input.editionId) ||
    !sameIdentity(input.target.issuer, input.context.taxpayerId)
  )
    return invalid("DIAG-ANULACION-REQUIRED", "domain");
  return ok(
    Object.freeze({
      ...input,
      context: context.value,
      target: target.value,
    }),
  );
}
export function recordsShareContext(
  a: BillingRecord,
  b: BillingRecord,
): boolean {
  return sameContext(a.context, b.context);
}
