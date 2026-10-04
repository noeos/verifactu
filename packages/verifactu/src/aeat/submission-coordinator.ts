import type { FiscalContext } from "../domain/context.js";
import { sameContext } from "../domain/context.js";
import { createFiscalInstant } from "../domain/date-time.js";
import { createFiscalContext } from "../domain/context.js";
import { createFiscalDate } from "../domain/date-time.js";
import { createIdentity } from "../domain/identities.js";
import { createHash } from "node:crypto";
import type { StoreResult } from "../persistence/model.js";
import { isSafeStoreToken } from "../persistence/model.js";
import type { CertificateAuthorization } from "./certificate-authorization.js";
import type { AeatBatchPlan } from "./batch-planner.js";
import { correlateAeatResponse } from "./correlation.js";
import type { AeatEditionProfile } from "./edition-profile.js";
import {
  operationProfile,
  resolveAeatEndpoint,
  verifyAeatEditionProfile,
} from "./edition-profile.js";
import { parseAeatResponse } from "./response-parser.js";
import { observeAeatOnce } from "./transport.js";
import type { AeatTransportPort, TransportLimits } from "./transport.js";

export interface DurableAttemptStart {
  readonly attemptId: string;
  readonly context: FiscalContext;
  readonly batchId: string;
  readonly operationId: AeatBatchPlan["operationId"];
  readonly environment: AeatBatchPlan["environment"];
  readonly editionId: string;
  readonly editionDigest: string;
  readonly endpointId: string;
  readonly requestDigest: string;
  readonly requestBytes: Uint8Array;
  readonly recordIds: readonly string[];
  readonly startedAt: string;
  readonly state: "attempt-started";
}

export interface DurableAttemptResult {
  readonly attemptId: string;
  readonly observationId: string;
  readonly context: FiscalContext;
  readonly requestDigest: string;
  readonly observation: import("./transport.js").TransportObservation;
  readonly responseDigest: string | null;
  readonly outcome:
    | "accepted"
    | "accepted-with-errors"
    | "rejected"
    | "indeterminate";
  readonly resultDigest: string;
  readonly completedAt: string;
}

export interface AeatAttemptPersistencePort {
  readonly contractVersion: 1;
  begin(
    input: DurableAttemptStart,
  ): Promise<StoreResult<"created" | "replayed">>;
  finish(
    input: DurableAttemptResult,
  ): Promise<StoreResult<"created" | "replayed">>;
}

export type SubmissionResult =
  | {
      readonly status: "complete";
      readonly attemptId: string;
      readonly outcome: "accepted" | "accepted-with-errors" | "rejected";
      readonly responseDigest: string;
      readonly resultDigest: string;
    }
  | {
      readonly status: "indeterminate";
      readonly attemptId: string;
      readonly diagnostic: string;
    }
  | { readonly status: "blocked"; readonly diagnostic: string };

export async function submitAeatBatch(input: {
  readonly profile: AeatEditionProfile;
  readonly batch: AeatBatchPlan;
  readonly context: FiscalContext;
  readonly certificateAuthorization: CertificateAuthorization;
  readonly persistence: AeatAttemptPersistencePort;
  readonly transport: AeatTransportPort;
  readonly attemptId: string;
  readonly observationId: string;
  readonly limits: TransportLimits;
  readonly clock: {
    readonly wallNow: () => string;
    readonly monotonicNow: () => number;
  };
  readonly signal?: AbortSignal;
}): Promise<SubmissionResult> {
  const { profile, batch, context } = input ?? ({} as typeof input);
  const now = (() => {
    try {
      return input?.clock?.wallNow?.() ?? "";
    } catch {
      return "";
    }
  })();
  const operation = profile
    ? operationProfile(profile, batch?.operationId)
    : null;
  if (
    !input ||
    !operation ||
    !verifyAeatEditionProfile(profile) ||
    profile.lifecycle !== "active" ||
    !profile.creationAllowed ||
    createFiscalContext(context).status !== "ok" ||
    !sameContext(context, batch?.context) ||
    !isSafeStoreToken(input.attemptId) ||
    !isSafeStoreToken(input.observationId) ||
    createFiscalInstant(now).status !== "ok" ||
    !input.persistence ||
    input.persistence.contractVersion !== 1 ||
    !input.transport ||
    input.transport.contractVersion !== 1 ||
    !input.certificateAuthorization ||
    input.certificateAuthorization.purpose !== "tls-client-authentication" ||
    !sameContext(input.certificateAuthorization.context, context) ||
    input.certificateAuthorization.environment !== batch.environment ||
    !isBoundBatchPlan(batch, profile.digest, profile.editionId)
  )
    return { status: "blocked", diagnostic: "DIAG-AEAT-SUBMISSION-PREFLIGHT" };
  const endpoint = resolveAeatEndpoint(
    profile,
    batch.operationId,
    batch.environment,
    context,
    context,
  );
  if (
    endpoint.status !== "ok" ||
    endpoint.value.endpointId !== batch.endpointId
  )
    return { status: "blocked", diagnostic: "DIAG-AEAT-SUBMISSION-ENDPOINT" };
  let started: StoreResult<"created" | "replayed">;
  try {
    started = await input.persistence.begin(
      Object.freeze({
        attemptId: input.attemptId,
        context: Object.freeze({ ...context }),
        batchId: batch.batchId,
        operationId: batch.operationId,
        environment: batch.environment,
        editionId: profile.editionId,
        editionDigest: profile.digest,
        endpointId: batch.endpointId,
        requestDigest: batch.request.sha256,
        requestBytes: batch.request.bytes.slice(),
        recordIds: Object.freeze(
          batch.orderedRecords.map((record) => record.recordId),
        ),
        startedAt: now,
        state: "attempt-started" as const,
      }),
    );
  } catch {
    return { status: "blocked", diagnostic: "DIAG-AEAT-ATTEMPT-NOT-DURABLE" };
  }
  if (started.status !== "ok")
    return { status: "blocked", diagnostic: "DIAG-AEAT-ATTEMPT-NOT-DURABLE" };
  if (started.value === "replayed")
    return {
      status: "indeterminate",
      attemptId: input.attemptId,
      diagnostic: "DIAG-AEAT-ATTEMPT-REPLAY-RECONCILE",
    };

  const observation = await observeAeatOnce(input.transport, {
    profile,
    operationId: batch.operationId,
    context,
    endpoint: endpoint.value,
    request: batch.request,
    certificateAuthorization: input.certificateAuthorization,
    limits: input.limits,
    clock: input.clock,
    ...(input.signal ? { signal: input.signal } : {}),
  });
  const parsed =
    observation.statusCode !== null && observation.responseBytes !== null
      ? parseAeatResponse({
          profile,
          operationId: batch.operationId,
          httpStatus: observation.statusCode,
          responseBytes: observation.responseBytes,
        })
      : null;
  const correlation =
    parsed?.status === "ok" ? correlateAeatResponse(batch, parsed.value) : null;
  const terminalOutcome =
    correlation?.status === "complete" && parsed?.status === "ok"
      ? parsed.value.status === "accepted" ||
        parsed.value.status === "accepted-with-errors" ||
        parsed.value.status === "rejected"
        ? parsed.value.status
        : "indeterminate"
      : "indeterminate";
  const resultDigest = digestJson({
    attemptId: input.attemptId,
    requestDigest: batch.request.sha256,
    phase: observation.phase,
    delivery: observation.delivery,
    statusCode: observation.statusCode,
    failureCode: observation.failureCode,
    responseDigest:
      parsed?.status === "ok" ? parsed.value.responseDigest : null,
    diagnostics:
      parsed?.status === "ok"
        ? parsed.value.diagnostics
        : ["DIAG-AEAT-RESPONSE-ABSENT"],
    outcomes: correlation?.outcomes ?? [],
  });
  const completedAt =
    createFiscalInstant(observation.completedAt).status === "ok"
      ? observation.completedAt
      : now;
  let stored: StoreResult<"created" | "replayed">;
  try {
    stored = await input.persistence.finish(
      Object.freeze({
        attemptId: input.attemptId,
        observationId: input.observationId,
        context: Object.freeze({ ...context }),
        requestDigest: batch.request.sha256,
        observation: Object.freeze({
          ...observation,
          responseBytes: observation.responseBytes?.slice() ?? null,
        }),
        responseDigest:
          parsed?.status === "ok" ? parsed.value.responseDigest : null,
        outcome: terminalOutcome,
        resultDigest,
        completedAt,
      }),
    );
  } catch {
    return {
      status: "indeterminate",
      attemptId: input.attemptId,
      diagnostic: "DIAG-AEAT-RESULT-NOT-DURABLE",
    };
  }
  if (stored.status !== "ok")
    return {
      status: "indeterminate",
      attemptId: input.attemptId,
      diagnostic: "DIAG-AEAT-RESULT-NOT-DURABLE",
    };
  if (terminalOutcome === "indeterminate")
    return {
      status: "indeterminate",
      attemptId: input.attemptId,
      diagnostic: "DIAG-AEAT-OUTCOME-UNRESOLVED",
    };
  const parsedResponse = parsed;
  if (!parsedResponse || parsedResponse.status !== "ok")
    return {
      status: "indeterminate",
      attemptId: input.attemptId,
      diagnostic: "DIAG-AEAT-OUTCOME-UNRESOLVED",
    };
  return {
    status: "complete",
    attemptId: input.attemptId,
    outcome: terminalOutcome,
    responseDigest: parsedResponse.value.responseDigest,
    resultDigest,
  };
}

function digestJson(value: unknown): string {
  const canonical = (item: unknown): unknown =>
    Array.isArray(item)
      ? item.map(canonical)
      : item && typeof item === "object"
        ? Object.fromEntries(
            Object.keys(item)
              .sort()
              .map((key) => [
                key,
                canonical((item as Record<string, unknown>)[key]),
              ]),
          )
        : item;
  return `sha256:${createHash("sha256")
    .update(JSON.stringify(canonical(value)))
    .digest("hex")}`;
}

function isBoundBatchPlan(
  batch: AeatBatchPlan,
  editionDigest: string,
  editionId: string,
): boolean {
  if (
    !batch ||
    !isSafeStoreToken(batch.batchId) ||
    !isSafeStoreToken(batch.endpointId) ||
    batch.editionId !== editionId ||
    createFiscalInstant(batch.eligibleAt).status !== "ok" ||
    !Array.isArray(batch.orderedRecords) ||
    batch.orderedRecords.length === 0 ||
    batch.orderedRecords.length > 500 ||
    !batch.request ||
    !(batch.request.bytes instanceof Uint8Array) ||
    batch.request.bytes.byteLength === 0 ||
    batch.request.byteLength !== batch.request.bytes.byteLength ||
    !/^sha256:[0-9a-f]{64}$/u.test(batch.request.sha256) ||
    `sha256:${createHash("sha256").update(batch.request.bytes).digest("hex")}` !==
      batch.request.sha256 ||
    batch.request.editionId !== editionId ||
    batch.request.editionDigest !== editionDigest ||
    batch.request.operationId !== batch.operationId ||
    batch.request.endpointId !== batch.endpointId ||
    !Array.isArray(batch.request.orderedRecordIds) ||
    !Array.isArray(batch.request.recordDigests) ||
    batch.request.orderedRecordIds.length !== batch.orderedRecords.length ||
    batch.request.recordDigests.length !== batch.orderedRecords.length ||
    batch.request.recordDigests.some(
      (digest) => !/^sha256:[0-9a-f]{64}$/u.test(digest),
    )
  )
    return false;
  const recordIds = new Set<string>();
  const sequences = new Set<number>();
  let previousSequence = 0;
  for (const [index, record] of batch.orderedRecords.entries()) {
    if (
      !record ||
      !isSafeStoreToken(record.recordId) ||
      !isSafeStoreToken(record.issuer) ||
      createIdentity("taxpayer", record.issuer).status !== "ok" ||
      !isSafeStoreToken(record.series, 60) ||
      !isSafeStoreToken(record.number, 60) ||
      createFiscalDate(record.issueDate).status !== "ok" ||
      !Number.isSafeInteger(record.sequence) ||
      record.sequence < 1 ||
      record.sequence <= previousSequence ||
      recordIds.has(record.recordId) ||
      sequences.has(record.sequence) ||
      batch.request.orderedRecordIds[index] !== record.recordId
    )
      return false;
    recordIds.add(record.recordId);
    sequences.add(record.sequence);
    previousSequence = record.sequence;
  }
  const expectedManifestDigest = digestJson({
    batchId: batch.batchId,
    context: batch.context,
    operationId: batch.operationId,
    environment: batch.environment,
    endpointId: batch.endpointId,
    editionId,
    requestDigest: batch.request.sha256,
    orderedRecords: batch.orderedRecords,
  });
  return batch.manifestDigest === expectedManifestDigest;
}
