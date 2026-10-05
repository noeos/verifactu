import { createHash } from "node:crypto";
import { invalid, ok, type Result } from "../contracts/results.js";
import { sameContext } from "../domain/context.js";
import { createFiscalContext } from "../domain/context.js";
import type { FiscalContext } from "../domain/context.js";
import { createFiscalInstant } from "../domain/date-time.js";
import type { FiscalDocumentIdentity, Identity } from "../domain/identities.js";
import {
  createFiscalDocumentIdentity,
  isIdentity,
} from "../domain/identities.js";
import type {
  AeatEnvironment,
  AeatEditionProfile,
  AeatOperationId,
} from "./edition-profile.js";
import { operationProfile } from "./edition-profile.js";
import type {
  CommittedRecordArtifact,
  FiscalSystemHeader,
  SoapRequestArtifact,
} from "./soap-wire.js";
import { buildSoapRequest } from "./soap-wire.js";

export interface BatchCandidate {
  readonly artifact: CommittedRecordArtifact;
  readonly document: FiscalDocumentIdentity;
  readonly operationId: AeatOperationId;
  readonly environment: AeatEnvironment;
  readonly committed: boolean;
  readonly requiredClaimsComplete: boolean;
  readonly submissionState: string;
  readonly priorAttemptState:
    | "none"
    | "proved-not-applied"
    | "ambiguous"
    | "terminal";
  readonly eligibleAt: string;
}

export interface CorrelationIdentity {
  readonly recordId: string;
  readonly issuer: string;
  readonly series: string;
  readonly number: string;
  readonly issueDate: string;
  readonly sequence: number;
}

export interface AeatBatchPlan {
  readonly batchId: string;
  readonly context: FiscalContext;
  readonly operationId: AeatOperationId;
  readonly environment: AeatEnvironment;
  readonly endpointId: string;
  readonly editionId: string;
  readonly orderedRecords: readonly CorrelationIdentity[];
  readonly request: SoapRequestArtifact;
  readonly manifestDigest: string;
  readonly eligibleAt: string;
}

export interface BatchPlanningResult {
  readonly batches: readonly AeatBatchPlan[];
  readonly excluded: readonly {
    readonly recordId: string;
    readonly reason: string;
  }[];
}

function digest(value: unknown): string {
  const canonicalize = (item: unknown): unknown =>
    Array.isArray(item)
      ? item.map(canonicalize)
      : item && typeof item === "object"
        ? Object.fromEntries(
            Object.keys(item)
              .sort()
              .map((key) => [
                key,
                canonicalize((item as Record<string, unknown>)[key]),
              ]),
          )
        : item;
  return `sha256:${createHash("sha256")
    .update(JSON.stringify(canonicalize(value)))
    .digest("hex")}`;
}

export function planAeatBatches(input: {
  readonly profile: AeatEditionProfile;
  readonly operationId: AeatOperationId;
  readonly environment: AeatEnvironment;
  readonly endpointId: string;
  readonly context: FiscalContext;
  readonly header: FiscalSystemHeader;
  readonly candidates: readonly BatchCandidate[];
  readonly now: string;
  readonly nextBatchId: () => string;
}): Result<BatchPlanningResult> {
  const operation = input?.profile
    ? operationProfile(input.profile, input.operationId)
    : null;
  if (
    !input ||
    !operation ||
    !Array.isArray(input.candidates) ||
    input.candidates.length > 10_000 ||
    createFiscalContext(input.context).status !== "ok" ||
    createFiscalInstant(input.now).status !== "ok" ||
    !sameContext(input.context, input.header?.context) ||
    typeof input.nextBatchId !== "function"
  )
    return invalid("DIAG-AEAT-BATCH-INPUT", "domain");
  const eligible: BatchCandidate[] = [];
  const excluded: { recordId: string; reason: string }[] = [];
  const ids = new Set<string>();
  const sequenceCounts = new Map<number, number>();
  for (const candidate of input.candidates) {
    const id = candidate?.artifact?.recordId?.value ?? "invalid-record";
    const reason =
      !candidate ||
      !candidate.artifact ||
      !isIdentity(candidate.artifact.recordId, "record")
        ? "DIAG-AEAT-BATCH-RECORD"
        : !candidate.committed
          ? "DIAG-AEAT-BATCH-NOT-COMMITTED"
          : !candidate.requiredClaimsComplete
            ? "DIAG-AEAT-BATCH-CLAIMS"
            : !isIdentity(candidate.artifact.editionId, "edition") ||
                !sameContext(candidate.artifact.context, input.context) ||
                candidate.artifact.editionId.value !== input.profile.editionId
              ? "DIAG-AEAT-BATCH-CONTEXT"
              : candidate.operationId !== input.operationId ||
                  candidate.environment !== input.environment
                ? "DIAG-AEAT-BATCH-OPERATION"
                : !isIdentity(candidate.document?.issuer, "taxpayer") ||
                    candidate.document.issuer.value !==
                      input.context.taxpayerId.value
                  ? "DIAG-AEAT-BATCH-IDENTITY"
                  : !["pending", "retry-wait"].includes(
                        candidate.submissionState,
                      )
                    ? "DIAG-AEAT-BATCH-STATE"
                    : candidate.priorAttemptState === "ambiguous"
                      ? "DIAG-RECONCILIATION-REQUIRED"
                      : candidate.priorAttemptState === "terminal"
                        ? "DIAG-AEAT-BATCH-TERMINAL"
                        : createFiscalInstant(candidate.eligibleAt).status !==
                            "ok"
                          ? "DIAG-AEAT-BATCH-WAIT"
                          : Date.parse(candidate.eligibleAt) >
                              Date.parse(input.now)
                            ? "DIAG-AEAT-BATCH-WAIT"
                            : !Number.isSafeInteger(
                                  candidate.artifact.sequence,
                                ) || candidate.artifact.sequence < 1
                              ? "DIAG-AEAT-BATCH-SEQUENCE"
                              : !candidate.document ||
                                  createFiscalDocumentIdentity(
                                    candidate.document,
                                  ).status !== "ok"
                                ? "DIAG-AEAT-BATCH-IDENTITY"
                                : null;
    if (reason) {
      excluded.push({ recordId: id, reason });
      continue;
    }
    if (ids.has(id)) {
      excluded.push({ recordId: id, reason: "DIAG-AEAT-BATCH-DUPLICATE" });
      continue;
    }
    ids.add(id);
    sequenceCounts.set(
      candidate.artifact.sequence,
      (sequenceCounts.get(candidate.artifact.sequence) ?? 0) + 1,
    );
    eligible.push(candidate);
  }
  for (const [sequence, count] of sequenceCounts) {
    if (count > 1) {
      for (let index = eligible.length - 1; index >= 0; index -= 1) {
        if (eligible[index]!.artifact.sequence === sequence) {
          excluded.push({
            recordId: eligible[index]!.artifact.recordId.value,
            reason: "DIAG-AEAT-BATCH-SEQUENCE-DUPLICATE",
          });
          eligible.splice(index, 1);
        }
      }
    }
  }
  // Duplicate sequence groups were removed above, so the sequence order is
  // unique and the tie-breaker would be unreachable.
  eligible.sort(
    (left, right) => left.artifact.sequence - right.artifact.sequence,
  );

  const batches: AeatBatchPlan[] = [];
  let group: BatchCandidate[] = [];
  const makeRequest = (records: readonly BatchCandidate[]) =>
    buildSoapRequest({
      profile: input.profile,
      operationId: input.operationId,
      endpointId: input.endpointId,
      header: input.header,
      records: records.map((candidate) => candidate.artifact),
    });
  const flush = (): boolean => {
    if (group.length === 0) return true;
    const request = makeRequest(group);
    if (request.status !== "ok") return false;
    let batchId: string;
    try {
      batchId = input.nextBatchId();
    } catch {
      return false;
    }
    if (
      typeof batchId !== "string" ||
      !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/u.test(batchId) ||
      batches.some((batch) => batch.batchId === batchId)
    )
      return false;
    const orderedRecords = group.map((candidate) =>
      Object.freeze({
        recordId: candidate.artifact.recordId.value,
        issuer: candidate.document.issuer.value,
        series: candidate.document.series,
        number: candidate.document.number,
        issueDate: candidate.document.issueDate,
        sequence: candidate.artifact.sequence,
      }),
    );
    const manifestDigest = digest({
      batchId,
      context: input.context,
      operationId: input.operationId,
      environment: input.environment,
      endpointId: input.endpointId,
      editionId: input.profile.editionId,
      requestDigest: request.value.sha256,
      orderedRecords,
    });
    batches.push(
      Object.freeze({
        batchId,
        context: Object.freeze({ ...input.context }),
        operationId: input.operationId,
        environment: input.environment,
        endpointId: input.endpointId,
        editionId: input.profile.editionId,
        orderedRecords: Object.freeze(orderedRecords),
        request: request.value,
        manifestDigest,
        eligibleAt: group.reduce(
          (latest, candidate) =>
            Date.parse(candidate.eligibleAt) > Date.parse(latest)
              ? candidate.eligibleAt
              : latest,
          group[0]!.eligibleAt,
        ),
      }),
    );
    group = [];
    return true;
  };

  for (const candidate of eligible) {
    const tentative = [...group, candidate];
    const request = makeRequest(tentative);
    if (request.status === "ok") {
      group.push(candidate);
      continue;
    }
    if (group.length > 0) {
      const single = makeRequest([candidate]);
      if (single.status === "ok") {
        if (!flush()) return invalid("DIAG-AEAT-BATCH-BUILD", "domain");
        group.push(candidate);
      } else
        excluded.push({
          recordId: candidate.artifact.recordId.value,
          reason: single.diagnostics[0]?.code ?? "DIAG-AEAT-BATCH-BUILD",
        });
      continue;
    }
    excluded.push({
      recordId: candidate.artifact.recordId.value,
      reason: request.diagnostics[0]?.code ?? "DIAG-AEAT-BATCH-BUILD",
    });
  }
  if (!flush()) return invalid("DIAG-AEAT-BATCH-BUILD", "domain");
  return ok(
    Object.freeze({
      batches: Object.freeze(batches),
      excluded: Object.freeze(
        excluded.sort((a, b) => a.recordId.localeCompare(b.recordId)),
      ),
    }),
  );
}
