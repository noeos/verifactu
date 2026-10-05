import { sameContext } from "../domain/context.js";
import type { FiscalContext } from "../domain/context.js";
import { createFiscalContext } from "../domain/context.js";
import { createFiscalInstant } from "../domain/date-time.js";
import { isIdentity } from "../domain/identities.js";
import type { ImmutableRecord, SequenceHead, StoreResult } from "./model.js";
import { isSafeStoreToken, storeFailure } from "./model.js";
import type { PersistencePorts, TransactionToken } from "./ports.js";

export function genesisHead(
  context: FiscalContext,
  chainId: string,
): SequenceHead | null {
  if (
    !context ||
    createFiscalContext(context).status !== "ok" ||
    !isSafeStoreToken(chainId, 128)
  )
    return null;
  return Object.freeze({
    id: Object.freeze({ kind: "chain", value: chainId }) as SequenceHead["id"],
    context: Object.freeze({ ...context }),
    schemaVersion: 1,
    generation: 0,
    lastRecordId: null,
    officialFingerprint: null,
    generatedAt: null,
    commitId: null,
  });
}

export function validateHeadAdvance(
  expected: SequenceHead,
  next: SequenceHead,
  record: ImmutableRecord,
): StoreResult<true> {
  if (
    !expected ||
    !next ||
    !record ||
    expected.schemaVersion !== 1 ||
    next.schemaVersion !== 1 ||
    !sameContext(expected.context, next.context) ||
    !sameContext(expected.context, record.context) ||
    createFiscalContext(expected.context).status !== "ok" ||
    !isIdentity(expected.id, "chain") ||
    !isIdentity(next.id, "chain") ||
    !isIdentity(record.id, "record") ||
    expected.id.value !== next.id.value ||
    expected.id.kind !== next.id.kind ||
    !Number.isSafeInteger(expected.generation) ||
    expected.generation < 0 ||
    next.generation !== expected.generation + 1 ||
    record.sequence !== next.generation ||
    next.lastRecordId?.value !== record.id.value ||
    next.lastRecordId?.kind !== "record" ||
    next.officialFingerprint !== record.semanticDigest ||
    !next.generatedAt ||
    createFiscalInstant(next.generatedAt).status !== "ok" ||
    (expected.generation > 0 &&
      (!expected.generatedAt ||
        createFiscalInstant(expected.generatedAt).status !== "ok" ||
        !/^sha256:[0-9a-f]{64}$/u.test(expected.officialFingerprint ?? ""))) ||
    (expected.generation === 0 &&
      (expected.lastRecordId !== null ||
        expected.officialFingerprint !== null ||
        expected.commitId !== null)) ||
    (expected.generation === 0 &&
      (expected.generatedAt !== null || record.predecessorId !== null)) ||
    (expected.generation > 0 &&
      (!expected.lastRecordId ||
        !expected.officialFingerprint ||
        !expected.commitId ||
        record.predecessorId?.value !== expected.lastRecordId.value ||
        record.predecessorId?.kind !== "record")) ||
    !isSafeStoreToken(next.commitId, 256)
  )
    return storeFailure("invalid", "invalid-input");
  return { status: "ok", value: true };
}

export async function compareAndAppendHead(
  ports: PersistencePorts,
  token: TransactionToken,
  expected: SequenceHead,
  next: SequenceHead,
  record: ImmutableRecord,
): Promise<StoreResult<"advanced">> {
  if (
    token.capabilityLevel !== "atomic-host" ||
    token.adapterId !== ports.adapterId ||
    validateHeadAdvance(expected, next, record).status !== "ok" ||
    !sameContext(token.context, expected.context)
  )
    return storeFailure("invalid", "context-mismatch");
  return ports.heads.compareAndAppend(token, expected, next, record);
}

export async function readHeadOrGenesis(
  ports: PersistencePorts,
  context: FiscalContext,
  chainId: string,
): Promise<StoreResult<SequenceHead>> {
  const initial = genesisHead(context, chainId);
  if (!initial) return storeFailure("invalid", "invalid-input");
  const result = await ports.heads.read(context, chainId);
  if (result.status === "unavailable" && result.code === "not-found")
    return { status: "ok", value: initial };
  if (result.status !== "ok") return result;
  if (
    !sameContext(result.value.context, context) ||
    result.value.id.value !== chainId
  )
    return storeFailure("indeterminate", "corruption");
  return result;
}
