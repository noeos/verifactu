import {
  failed,
  succeeded,
  type OperationResult,
} from "../contracts/results.js";
import { diagnostic } from "./diagnostics.js";
import type { ConstructionResult, FiscalRecord } from "./records.js";

export function assertRecordInvariants(
  record: FiscalRecord,
): OperationResult<FiscalRecord> {
  if (
    record.kind === "anulacion" &&
    record.targetRecordId.presence === "present" &&
    record.id === record.targetRecordId.value
  ) {
    return failed("invalid", [
      diagnostic(
        "DIAG-RECORD-SELF-CANCEL",
        "integrity",
        "domain",
        "/record/targetRecordId",
      ),
    ]);
  }
  if (
    record.kind === "alta" &&
    (record.invoice.total.coefficient < 0n ||
      record.invoice.totalTax.coefficient < 0n ||
      record.invoice.taxBreakdown.some(
        (line) => line.base.coefficient < 0n || line.quota.coefficient < 0n,
      ))
  ) {
    return failed("invalid", [
      diagnostic(
        "DIAG-RECORD-NEGATIVE-TOTAL",
        "input",
        "domain",
        "/record/invoice/total",
      ),
    ]);
  }
  if (
    record.kind === "alta" &&
    record.taxpayerId !== record.invoice.identity.issuerTaxpayerId
  ) {
    return failed("rejected", [
      diagnostic(
        "DIAG-RECORD-CONTEXT",
        "security",
        "domain",
        "/record/invoice/identity/issuerTaxpayerId",
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

export function constructionChainEligible<T extends FiscalRecord>(
  result: ConstructionResult<T>,
): OperationResult<T> {
  return result.status === "accepted"
    ? (assertRecordInvariants(result.record) as OperationResult<T>)
    : failed(result.status === "rejected" ? "rejected" : "indeterminate", [
        ...result.diagnostics,
      ]);
}
