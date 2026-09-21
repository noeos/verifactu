import {
  failed,
  succeeded,
  type OperationResult,
} from "../contracts/results.js";
import { diagnostic } from "./diagnostics.js";
import type { FiscalRecord } from "./records.js";

export function assertRecordInvariants(
  record: FiscalRecord,
): OperationResult<FiscalRecord> {
  if (record.kind === "anulacion" && record.id === record.cancelsRecordId) {
    return failed("invalid", [
      diagnostic(
        "DIAG-RECORD-SELF-CANCEL",
        "integrity",
        "domain",
        "/record/cancelsRecordId",
      ),
    ]);
  }
  if (record.kind === "alta" && record.total.coefficient < 0n) {
    return failed("invalid", [
      diagnostic(
        "DIAG-RECORD-NEGATIVE-TOTAL",
        "input",
        "domain",
        "/record/total",
      ),
    ]);
  }
  return succeeded(record);
}

export function chainEligibleRecord(
  result: OperationResult<FiscalRecord>,
): OperationResult<FiscalRecord> {
  return result.status === "succeeded"
    ? assertRecordInvariants(result.value)
    : result;
}
