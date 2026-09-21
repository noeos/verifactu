import {
  failed,
  succeeded,
  type OperationResult,
} from "../contracts/results.js";
import type { FiscalInstant } from "./date-time.js";
import { diagnostic } from "./diagnostics.js";
import type { PrincipalId, RecordId } from "./identities.js";

export interface CorrectionEntry {
  readonly sequence: number;
  readonly recordId: RecordId;
  readonly correctedAt: FiscalInstant;
  readonly correctedBy: PrincipalId;
  readonly reason: string;
}

export type CorrectionHistory = readonly CorrectionEntry[];

export function appendCorrection(
  history: CorrectionHistory,
  entry: CorrectionEntry,
): OperationResult<CorrectionHistory> {
  if (entry.sequence !== history.length + 1 || entry.reason.length === 0) {
    return failed("conflict", [
      diagnostic(
        "DIAG-CORRECTION-SEQUENCE",
        "conflict",
        "state",
        "/corrections",
        {
          expected: history.length + 1,
          actual: entry.sequence,
        },
      ),
    ]);
  }
  return succeeded(Object.freeze([...history, Object.freeze({ ...entry })]));
}
