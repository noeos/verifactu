import {
  failed,
  succeeded,
  type OperationResult,
} from "../contracts/results.js";
import type { FiscalDate, FiscalInstant } from "./date-time.js";
import { diagnostic } from "./diagnostics.js";
import type { ExactDecimal } from "./decimal.js";
import type { RecordId, TaxpayerId } from "./identities.js";

export interface RecordCommon {
  readonly id: RecordId;
  readonly taxpayerId: TaxpayerId;
  readonly issuedOn: FiscalDate;
  readonly recordedAt: FiscalInstant;
}

export interface AltaRecord extends RecordCommon {
  readonly kind: "alta";
  readonly invoiceNumber: string;
  readonly total: ExactDecimal;
}

export interface AnulacionRecord extends RecordCommon {
  readonly kind: "anulacion";
  readonly cancelsRecordId: RecordId;
  readonly reason: string;
}

export type FiscalRecord = AltaRecord | AnulacionRecord;

export function defineRecord(
  record: FiscalRecord,
): OperationResult<FiscalRecord> {
  if (
    (record.kind === "alta" && record.invoiceNumber.length === 0) ||
    (record.kind === "anulacion" && record.reason.length === 0)
  ) {
    return failed("invalid", [
      diagnostic("DIAG-RECORD-REQUIRED", "input", "domain", "/record"),
    ]);
  }
  return succeeded(Object.freeze({ ...record }));
}

export function recordReference(record: FiscalRecord): RecordId | null {
  return record.kind === "anulacion" ? record.cancelsRecordId : null;
}
