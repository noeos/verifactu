import {
  failed,
  succeeded,
  type OperationResult,
} from "../contracts/results.js";
import { diagnostic } from "./diagnostics.js";
import { compareFiscalInstants, type FiscalInstant } from "./date-time.js";
import type { InstallationId, RecordId, TaxpayerId } from "./identities.js";

export interface SequencePosition {
  readonly value: number;
}

export function sequencePosition(
  value: number,
): OperationResult<SequencePosition> {
  if (!Number.isSafeInteger(value) || value < 1) {
    return failed("invalid", [
      diagnostic("DIAG-SEQUENCE-POSITION", "input", "domain", "/position", {
        value: Number.isFinite(value) ? value : "non-finite",
      }),
    ]);
  }
  return succeeded(Object.freeze({ value }));
}

export function nextSequencePosition(
  previous: SequencePosition | null,
): SequencePosition {
  return Object.freeze({ value: previous === null ? 1 : previous.value + 1 });
}

export function validateSequence(
  positions: readonly SequencePosition[],
): OperationResult<readonly SequencePosition[]> {
  for (let index = 0; index < positions.length; index += 1) {
    const position = positions[index]!;
    if (position.value !== index + 1) {
      return failed("conflict", [
        diagnostic("DIAG-SEQUENCE-GAP", "integrity", "chain", "/positions", {
          expected: index + 1,
          actual: position.value,
        }),
      ]);
    }
  }
  return succeeded(Object.freeze([...positions]));
}

export interface ScopedSequenceEntry {
  readonly position: SequencePosition;
  readonly recordId: RecordId;
  readonly taxpayerId: TaxpayerId;
  readonly installationId: InstallationId;
  readonly occurredAt: FiscalInstant;
}

export function validateScopedSequence(
  entries: readonly ScopedSequenceEntry[],
): OperationResult<readonly ScopedSequenceEntry[]> {
  const positions = validateSequence(entries.map((entry) => entry.position));
  if (positions.status !== "succeeded") return positions;
  const recordIds = new Set<RecordId>();
  const first = entries[0];
  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index]!;
    const previous = entries[index - 1];
    if (
      recordIds.has(entry.recordId) ||
      (first !== undefined &&
        (entry.taxpayerId !== first.taxpayerId ||
          entry.installationId !== first.installationId)) ||
      (previous !== undefined &&
        compareFiscalInstants(previous.occurredAt, entry.occurredAt) >= 0)
    ) {
      return failed("conflict", [
        diagnostic("DIAG-SEQUENCE-SCOPE", "integrity", "chain", "/sequence", {
          index,
        }),
      ]);
    }
    recordIds.add(entry.recordId);
  }
  return succeeded(Object.freeze([...entries]));
}
