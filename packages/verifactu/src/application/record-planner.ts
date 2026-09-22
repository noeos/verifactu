import type { EditionPolicy } from "../contracts/configuration.js";
import { failed, type OperationResult } from "../contracts/results.js";
import { compareFiscalInstants } from "../domain/date-time.js";
import { diagnostic } from "../domain/diagnostics.js";
import type { ArtifactId } from "../domain/identities.js";
import type { DigestComputer } from "./fingerprint.js";
import {
  defineOperationPlan,
  type OperationEffect,
  type OperationPlan,
} from "./operation-plan.js";

export interface RecordPlanInput
  extends Omit<OperationPlan, "version" | "effects" | "binding"> {
  readonly editionPolicy: EditionPolicy;
  readonly fingerprint: string;
  readonly semanticInputDigest: string;
  readonly configurationDigest: string;
}

export function planRecord(
  input: RecordPlanInput,
  digest: DigestComputer,
): OperationResult<OperationPlan> {
  if (input.editionPolicy.edition !== input.editionId)
    return planningFailure("DIAG-PLAN-EDITION");
  if (!input.editionPolicy.creationAllowed)
    return failed("indeterminate", [
      diagnostic(
        "DIAG-EDITION-CREATION-DISABLED",
        "availability",
        "edition",
        "/editionId",
      ),
    ]);
  if (
    !/^[a-f0-9]{64}$/u.test(input.semanticInputDigest) ||
    !/^[a-f0-9]{64}$/u.test(input.configurationDigest)
  )
    return planningFailure("DIAG-PLAN-BINDING-INPUT");
  if (compareFiscalInstants(input.preparedAt, input.expiresAt) >= 0)
    return planningFailure("DIAG-PLAN-EXPIRY");
  let tokenBytes: Uint8Array;
  try {
    tokenBytes = digest(
      "SHA-256",
      new globalThis.TextEncoder().encode(bindingMaterial(input)),
    );
  } catch {
    return bindingFailure();
  }
  if (tokenBytes.length !== 32) return bindingFailure();
  const effects: OperationEffect[] = [
    ...input.artifactIds.map((artifactId: ArtifactId) => ({
      kind: "store-artifact" as const,
      artifactId,
    })),
    { kind: "append-record", recordId: input.recordId },
    {
      kind: "compare-and-set-head",
      scope: input.observedHead.scope,
      expectedVersion: input.observedHead.version,
      recordId: input.recordId,
      fingerprint: input.fingerprint,
    },
  ];
  return defineOperationPlan({
    version: 1,
    planId: input.planId,
    commandId: input.commandId,
    idempotencyKey: input.idempotencyKey,
    contextId: input.contextId,
    editionId: input.editionId,
    configurationId: input.configurationId,
    preparedAt: input.preparedAt,
    expiresAt: input.expiresAt,
    observedHead: input.observedHead,
    binding: {
      semanticInputDigest: input.semanticInputDigest,
      configurationDigest: input.configurationDigest,
      contextId: input.contextId,
      editionId: input.editionId,
      headVersion: input.observedHead.version,
      expiresAt: input.expiresAt,
      token: hex(tokenBytes),
    },
    recordId: input.recordId,
    artifactIds: input.artifactIds,
    effects,
  });
}

function bindingMaterial(input: RecordPlanInput): string {
  return [
    input.commandId,
    input.idempotencyKey,
    input.contextId,
    input.editionId,
    input.configurationId,
    input.semanticInputDigest,
    input.configurationDigest,
    input.observedHead.scope,
    input.observedHead.version,
    input.expiresAt,
  ].join("\n");
}

function hex(bytes: Uint8Array): string {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function bindingFailure(): OperationResult<never> {
  return failed("defect", [
    diagnostic(
      "DIAG-PLAN-BINDING-COMPUTATION",
      "internal",
      "domain",
      "/binding",
    ),
  ]);
}

function planningFailure(code: `DIAG-${string}`): OperationResult<never> {
  return failed("invalid", [
    diagnostic(code, "configuration", "edition", "/editionId"),
  ]);
}
