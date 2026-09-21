import {
  failed,
  succeeded,
  type OperationResult,
} from "../contracts/results.js";
import { diagnostic } from "./diagnostics.js";
import type { RecordId } from "./identities.js";
import type { FiscalRecord } from "./records.js";

declare const digestBrand: unique symbol;
export type RecordDigest = string & { readonly [digestBrand]: true };

export type ChainPredecessor =
  | { readonly kind: "genesis" }
  | {
      readonly kind: "link";
      readonly recordId: RecordId;
      readonly digest: RecordDigest;
    };

export interface ChainEntry {
  readonly position: number;
  readonly record: FiscalRecord;
  readonly predecessor: ChainPredecessor;
  readonly currentDigest: RecordDigest;
}

export interface ChainVerification {
  readonly entries: readonly ChainEntry[];
  readonly head: ChainEntry | null;
}

export type RecordDigester = (
  record: FiscalRecord,
  predecessorDigest: RecordDigest | null,
) => RecordDigest;

export function recordDigest(value: string): OperationResult<RecordDigest> {
  if (!/^[0-9A-Fa-f]{64}$/u.test(value)) {
    return failed("invalid", [
      diagnostic("DIAG-DIGEST-INVALID", "input", "domain", "/digest"),
    ]);
  }
  return succeeded(value.toLowerCase() as RecordDigest);
}

export function buildChain(
  records: readonly FiscalRecord[],
  digest: RecordDigester,
): readonly ChainEntry[] {
  const entries: ChainEntry[] = [];
  for (const record of records) {
    const previous = entries.at(-1);
    const predecessor: ChainPredecessor =
      previous === undefined
        ? Object.freeze({ kind: "genesis" })
        : Object.freeze({
            kind: "link",
            recordId: previous.record.id,
            digest: previous.currentDigest,
          });
    entries.push(
      Object.freeze({
        position: entries.length + 1,
        record,
        predecessor,
        currentDigest: digest(
          record,
          predecessor.kind === "genesis" ? null : predecessor.digest,
        ),
      }),
    );
  }
  return Object.freeze(entries);
}

export function verifyChain(
  entries: readonly ChainEntry[],
  digest: RecordDigester,
  expectedHeadDigest?: RecordDigest,
): OperationResult<ChainVerification> {
  const recordIds = new Set<RecordId>();
  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index];
    const previous = entries[index - 1];
    if (entry === undefined || entry.position !== index + 1) {
      return chainFailure("DIAG-CHAIN-GAP", index);
    }
    if (recordIds.has(entry.record.id)) {
      return chainFailure("DIAG-CHAIN-DUPLICATE", index);
    }
    recordIds.add(entry.record.id);
    if (
      (index === 0 && entry.predecessor.kind !== "genesis") ||
      (index > 0 &&
        (entry.predecessor.kind !== "link" ||
          previous === undefined ||
          entry.predecessor.recordId !== previous.record.id ||
          entry.predecessor.digest !== previous.currentDigest))
    ) {
      return chainFailure("DIAG-CHAIN-PREDECESSOR", index);
    }
    const expected = digest(
      entry.record,
      entry.predecessor.kind === "genesis" ? null : entry.predecessor.digest,
    );
    if (expected !== entry.currentDigest) {
      return chainFailure("DIAG-CHAIN-DIGEST", index);
    }
  }
  if (
    expectedHeadDigest !== undefined &&
    entries.at(-1)?.currentDigest !== expectedHeadDigest
  ) {
    return chainFailure("DIAG-CHAIN-HEAD", entries.length - 1);
  }
  return succeeded(
    Object.freeze({
      entries: Object.freeze([...entries]),
      head: entries.at(-1) ?? null,
    }),
  );
}

function chainFailure(
  code: `DIAG-CHAIN-${string}`,
  index: number,
): OperationResult<ChainVerification> {
  return failed("conflict", [
    diagnostic(code, "integrity", "chain", "/chain", { index }),
  ]);
}
