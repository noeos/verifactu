import type { FiscalContext } from "../domain/context.js";
import { createFiscalContext, sameContext } from "../domain/context.js";
import type { AeatEditionProfile, AeatOperationId } from "./edition-profile.js";
import {
  operationProfile,
  verifyAeatEditionProfile,
} from "./edition-profile.js";
import type { ParsedAeatResponse } from "./response-parser.js";
import type { CorrelationResult } from "./correlation.js";
import { isSafeStoreToken } from "../persistence/model.js";
import type { ConsultationResult } from "./consultation.js";

export type ReconciliationDisposition =
  | "confirmed-applied"
  | "confirmed-rejected"
  | "confirmed-absent-replay-authorized"
  | "still-unknown"
  | "conflicting-evidence"
  | "operator-escalation";

export interface ReconciliationDecision {
  readonly disposition: ReconciliationDisposition;
  readonly replayAuthorized: boolean;
  readonly matchedRecordIds: readonly string[];
  readonly absentRecordIds: readonly string[];
  readonly evidenceDigest: string;
  readonly absenceProofDigest: string | null;
  readonly replayAuthorizationEvidenceId: string | null;
  readonly diagnostics: readonly string[];
}

export interface AbsenceProofVerifier {
  verify(input: {
    readonly profile: AeatEditionProfile;
    readonly operationId: AeatOperationId;
    readonly context: FiscalContext;
    readonly originalRecordIds: readonly string[];
    readonly response: ParsedAeatResponse;
    readonly correlation: CorrelationResult;
    readonly consultation: ConsultationResult;
    readonly evidenceDigest: string;
  }): Promise<
    | {
        readonly status: "verified";
        readonly proofDigest: string;
        readonly authorizationEvidenceId: string;
      }
    | { readonly status: "denied" | "unavailable" }
  >;
}

function isCompleteConsultation(value: ConsultationResult): boolean {
  return (
    value.status === "complete" &&
    isSafeStoreToken(value.snapshotId) &&
    Number.isSafeInteger(value.pageCount) &&
    value.pageCount > 0 &&
    value.pageCount <= 500 &&
    Array.isArray(value.pageDigests) &&
    value.pageCount === value.pageDigests.length &&
    value.pageDigests.every((digest) =>
      /^sha256:[0-9a-f]{64}$/u.test(digest),
    ) &&
    /^sha256:[0-9a-f]{64}$/u.test(value.queryDigest) &&
    value.diagnostic === null &&
    Array.isArray(value.records) &&
    value.records.every(
      (record) =>
        record &&
        Array.isArray(record.identity) &&
        record.identity.length > 0 &&
        record.identity.length <= 8 &&
        record.identity.every((part: string) => isSafeStoreToken(part, 256)) &&
        /^sha256:[0-9a-f]{64}$/u.test(record.payloadDigest),
    )
  );
}

/** Classifies consultation evidence only. It never sends or schedules a submission. */
export async function decideAeatReconciliation(input: {
  readonly profile: AeatEditionProfile;
  readonly operationId: AeatOperationId;
  readonly context: FiscalContext;
  readonly originalRecordIds: readonly string[];
  readonly response: ParsedAeatResponse;
  readonly correlation: CorrelationResult;
  readonly consultation: ConsultationResult;
  readonly absenceProofVerifier?: AbsenceProofVerifier;
  readonly evidenceDigest: string;
}): Promise<ReconciliationDecision> {
  const operation = input?.profile
    ? operationProfile(input.profile, input.operationId)
    : null;
  const malformed = (code: string): ReconciliationDecision =>
    Object.freeze({
      disposition: "still-unknown",
      replayAuthorized: false,
      matchedRecordIds: Object.freeze([]),
      absentRecordIds: Object.freeze([]),
      evidenceDigest: input?.evidenceDigest ?? `sha256:${"0".repeat(64)}`,
      absenceProofDigest: null,
      replayAuthorizationEvidenceId: null,
      diagnostics: Object.freeze([code]),
    });
  if (
    !input ||
    !operation ||
    !verifyAeatEditionProfile(input.profile) ||
    createFiscalContext(input.context).status !== "ok" ||
    !Array.isArray(input.originalRecordIds) ||
    input.originalRecordIds.length === 0 ||
    input.originalRecordIds.length > 500 ||
    input.originalRecordIds.some((id) => !isSafeStoreToken(id)) ||
    new Set(input.originalRecordIds).size !== input.originalRecordIds.length ||
    !input.response ||
    !input.correlation ||
    !input.consultation ||
    !/^sha256:[0-9a-f]{64}$/u.test(input.evidenceDigest)
  )
    return malformed("DIAG-AEAT-RECONCILIATION-INPUT");
  const consultationComplete = isCompleteConsultation(input.consultation);
  const knownOutcomes = input.correlation.outcomes.filter(
    (item) => item.state !== "indeterminate",
  );
  if (
    input.correlation.status === "complete" &&
    input.correlation.outcomes.some((item) => item.state === "indeterminate")
  )
    return malformed("DIAG-AEAT-RECONCILIATION-STATUS");
  if (
    consultationComplete &&
    input.response.status !== "malformed" &&
    input.response.status !== "unrecognized" &&
    input.response.status !== "soap-fault" &&
    input.response.status !== "http-error" &&
    knownOutcomes.length > 0 &&
    input.correlation.missingResponseLines > 0
  )
    return Object.freeze({
      disposition: "conflicting-evidence",
      replayAuthorized: false,
      matchedRecordIds: Object.freeze(
        knownOutcomes.map((item) => item.recordId).sort(),
      ),
      absentRecordIds: Object.freeze([]),
      evidenceDigest: input.evidenceDigest,
      absenceProofDigest: null,
      replayAuthorizationEvidenceId: null,
      diagnostics: Object.freeze(["DIAG-AEAT-RECONCILIATION-PARTIAL"]),
    });
  const isCompleteAbsenceSet =
    input.correlation.status === "indeterminate" &&
    input.correlation.missingResponseLines === input.originalRecordIds.length &&
    input.correlation.extraResponseLines === 0 &&
    input.correlation.duplicateResponseLines === 0;
  if (
    !consultationComplete ||
    input.response.status === "malformed" ||
    input.response.status === "unrecognized" ||
    input.response.status === "soap-fault" ||
    input.response.status === "http-error" ||
    (input.correlation.status !== "complete" && !isCompleteAbsenceSet)
  )
    return malformed("DIAG-AEAT-RECONCILIATION-INCOMPLETE");
  const expected = new Set(input.originalRecordIds);
  const found = new Set(
    input.correlation.outcomes
      .filter((item) => item.state !== "indeterminate")
      .map((item) => item.recordId),
  );
  if ([...found].some((id) => !expected.has(id)))
    return Object.freeze({
      disposition: "conflicting-evidence",
      replayAuthorized: false,
      matchedRecordIds: Object.freeze([...found].sort()),
      absentRecordIds: Object.freeze([]),
      evidenceDigest: input.evidenceDigest,
      absenceProofDigest: null,
      replayAuthorizationEvidenceId: null,
      diagnostics: Object.freeze(["DIAG-AEAT-RECONCILIATION-FOREIGN"]),
    });
  const matched = [...found].sort();
  const absent = [...expected].filter((id) => !found.has(id)).sort();
  if (absent.length === 0) {
    const applied = input.correlation.outcomes.some(
      (item) =>
        item.state === "accepted" || item.state === "accepted-with-errors",
    );
    const rejected = input.correlation.outcomes.every(
      (item) => item.state === "rejected",
    );
    return Object.freeze({
      disposition: applied
        ? "confirmed-applied"
        : rejected
          ? "confirmed-rejected"
          : "still-unknown",
      replayAuthorized: false,
      matchedRecordIds: Object.freeze(matched),
      absentRecordIds: Object.freeze([]),
      evidenceDigest: input.evidenceDigest,
      absenceProofDigest: null,
      replayAuthorizationEvidenceId: null,
      diagnostics: Object.freeze(
        applied || rejected ? [] : ["DIAG-AEAT-RECONCILIATION-STATUS"],
      ),
    });
  }
  let canProveAbsence = false;
  let absenceProofDigest: string | null = null;
  let replayAuthorizationEvidenceId: string | null = null;
  if (
    matched.length === 0 &&
    input.absenceProofVerifier &&
    isCompleteAbsenceSet
  ) {
    try {
      const proof = await input.absenceProofVerifier.verify({
        profile: input.profile,
        operationId: input.operationId,
        context: input.context,
        originalRecordIds: Object.freeze([...input.originalRecordIds]),
        response: input.response,
        correlation: input.correlation,
        consultation: input.consultation,
        evidenceDigest: input.evidenceDigest,
      });
      if (
        proof.status === "verified" &&
        /^sha256:[0-9a-f]{64}$/u.test(proof.proofDigest) &&
        isSafeStoreToken(proof.authorizationEvidenceId)
      ) {
        canProveAbsence = true;
        absenceProofDigest = proof.proofDigest;
        replayAuthorizationEvidenceId = proof.authorizationEvidenceId;
      }
    } catch {
      canProveAbsence = false;
    }
  }
  if (matched.length === 0 && canProveAbsence)
    return Object.freeze({
      disposition: "confirmed-absent-replay-authorized",
      replayAuthorized: true,
      matchedRecordIds: Object.freeze([]),
      absentRecordIds: Object.freeze(absent),
      evidenceDigest: input.evidenceDigest,
      absenceProofDigest,
      replayAuthorizationEvidenceId,
      diagnostics: Object.freeze([]),
    });
  return Object.freeze({
    disposition: matched.length > 0 ? "conflicting-evidence" : "still-unknown",
    replayAuthorized: false,
    matchedRecordIds: Object.freeze(matched),
    absentRecordIds: Object.freeze(absent),
    evidenceDigest: input.evidenceDigest,
    absenceProofDigest: null,
    replayAuthorizationEvidenceId: null,
    diagnostics: Object.freeze([
      matched.length > 0
        ? "DIAG-AEAT-RECONCILIATION-PARTIAL"
        : "DIAG-AEAT-ABSENCE-UNPROVEN",
    ]),
  });
}

export function bindReconciliationContext(input: {
  readonly expected: FiscalContext;
  readonly observed: FiscalContext;
}): boolean {
  return (
    createFiscalContext(input?.expected).status === "ok" &&
    createFiscalContext(input?.observed).status === "ok" &&
    sameContext(input.expected, input.observed)
  );
}
