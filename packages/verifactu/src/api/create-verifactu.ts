// SPDX-License-Identifier: Apache-2.0
import { createHash } from "node:crypto";
import { evaluateApplicability as evaluate } from "../domain/applicability.js";
import { createDiagnostic } from "../diagnostics/diagnostic.js";
import {
  failure,
  success,
  valid,
  invalid,
  indeterminate,
  type Result,
  type ValidationResult,
} from "../diagnostics/result.js";
import { editionInfo } from "../generated/edition.js";
import { calculateRrsifFingerprint, verifyRrsifFingerprint } from "../fingerprint/rrsif.js";
import { validateFingerprintInput, type EventFingerprintInput } from "../fingerprint/rrsif.js";
import { validateBillingRecord } from "../validation/record.js";
import { serializeBillingRecord } from "../xml/records.js";
import { serializeXml, type XmlElement, type XmlNode } from "../xml/codec.js";
import {
  createInternalRecordEvidence,
  encodeInternalEvidenceSubject,
} from "../evidence/record-profile.js";
import { buildQrPayload, renderQr, type QrCode, type QrInvoiceData } from "../qr/index.js";
import { buildSubmissionBatch, type SubmissionHeader } from "../submissions/batch-builder.js";
import { resolveAeatEndpoint, type AeatEndpointId } from "../transport/endpoints.js";
import type { SubmissionBatch } from "../submissions/model.js";
import { parseAeatResponse, type AeatSubmissionResponse } from "../transport/response.js";
import { commitSecuredRecord, processQueueOnce } from "../application/index.js";
import type { SequenceHead, StoredRecord } from "../state/model.js";
import type {
  BuildSubmissionInput,
  CommittedArtifact,
  ExportInput,
  InspectResponseInput,
  ProcessQueueInput,
  ProcessReport,
  PreparedArtifact,
  ReconcileInput,
  ReconciliationReport,
  VerifyRecordInput,
  Verifactu,
  VerifactuConfig,
  AltaInput,
  AnulacionInput,
  EventInput,
  VerifyChainInput,
} from "./types.js";

export function createVerifactu(config: VerifactuConfig): Result<Verifactu> {
  if (!isConfig(config))
    return failure("INVALID_INPUT", [
      createDiagnostic({ code: "VF_INPUT_VALUE_INVALID", severity: "error", phase: "input" }),
    ]);
  if (config.edition !== undefined && config.edition !== editionInfo.edition)
    return failure("UNSUPPORTED_EDITION", [
      createDiagnostic({ code: "VF_EDITION_UNKNOWN", severity: "error", phase: "compatibility" }),
    ]);
  const frozen = Object.freeze({
    ...config,
    ...(config.limits === undefined ? {} : { limits: Object.freeze({ ...config.limits }) }),
  });
  return success(new VerifactuImpl(frozen));
}

class VerifactuImpl implements Verifactu {
  readonly edition = editionInfo;
  constructor(private readonly config: VerifactuConfig) {
    Object.freeze(this);
  }

  evaluateApplicability(
    input: Parameters<Verifactu["evaluateApplicability"]>[0],
  ): Result<
    Parameters<Verifactu["evaluateApplicability"]>[0] extends never
      ? never
      : ReturnType<typeof evaluate> extends ValidationResult<infer T>
        ? T
        : never
  > {
    const result = evaluate(input);
    return result.status === "valid"
      ? success(result.value, result.diagnostics)
      : failure("INVALID_INPUT", result.diagnostics);
  }

  async prepareAlta(input: AltaInput, signal?: AbortSignal): Promise<Result<PreparedArtifact>> {
    return this.prepare(input.recordId, "alta", input.record, signal);
  }
  async prepareAnulacion(
    input: AnulacionInput,
    signal?: AbortSignal,
  ): Promise<Result<PreparedArtifact>> {
    return this.prepare(input.recordId, "anulacion", input.record, signal);
  }
  async prepareEvent(input: EventInput, signal?: AbortSignal): Promise<Result<PreparedArtifact>> {
    return this.prepare(input.recordId, "event", input.event, signal);
  }

  async commit(
    prepared: PreparedArtifact,
    expectedHead: SequenceHead,
    signal?: AbortSignal,
  ): Promise<Result<CommittedArtifact>> {
    if (signal?.aborted === true) return abortedResult();
    if (this.config.recordStore === undefined) return unsupported("recordStore");
    let storedBytes = prepared.bytes;
    if (this.config.mode === "no-verifactu") {
      if (this.config.signer === undefined) return unsupported("signer");
      const signed = await this.config.signer.sign(
        prepared.bytes,
        prepared.recordId,
        "xades-epes",
        signal,
      );
      if (!signed.ok) return signed;
      storedBytes = new Uint8Array(signed.value.xml);
    }
    const now = this.config.clock?.now().toISOString() ?? new Date(0).toISOString();
    const recordDigest = createHash("sha256").update(storedBytes).digest("hex").toUpperCase();
    const stored: Omit<StoredRecord, "position" | "state" | "attempt" | "updatedAt"> = {
      recordId: prepared.recordId,
      contextId: this.config.taxpayerScopeId,
      sequenceId: this.config.sequenceId,
      edition: prepared.edition,
      bytes: new Uint8Array(storedBytes),
      recordDigest,
      linkDigest: prepared.fingerprint,
      createdAt: now,
    };
    const commitInput = {
      record: stored,
      expectedHead,
      evidence:
        prepared.internalEvidence === undefined
          ? []
          : [
              encodeInternalEvidenceSubject({
                edition: "aeat-rrsif-1.0@2026-09-03",
                taxpayerScopeId: this.config.taxpayerScopeId,
                installationId: this.config.installationId,
                sequenceId: this.config.sequenceId,
                recordClass: prepared.kind,
                recordId: prepared.recordId,
                officialFingerprint: prepared.fingerprint,
                officialBytes: storedBytes,
              }),
            ],
      outbox: [],
      now,
      ...(signal === undefined ? {} : { signal }),
    };
    const result = await commitSecuredRecord(this.config.recordStore, commitInput);
    if (!result.ok) return result;
    return success(
      Object.freeze({ record: result.value.record, head: result.value.head, artifact: prepared }),
    );
  }

  async verifyRecord(
    input: VerifyRecordInput,
    signal?: AbortSignal,
  ): Promise<
    ValidationResult<{
      status: "valid" | "invalid" | "indeterminate" | "aborted";
      recordId?: string;
    }>
  > {
    await Promise.resolve();
    if (signal?.aborted === true)
      return {
        status: "aborted",
        diagnostics: [
          createDiagnostic({ code: "VF_INPUT_ABORTED", severity: "error", phase: "input" }),
        ],
      };
    if (!isRecord(input))
      return invalid([
        createDiagnostic({ code: "VF_INPUT_VALUE_INVALID", severity: "error", phase: "input" }),
      ]);
    const artifact = input.artifact;
    if (isPreparedArtifact(artifact)) {
      const expected = input.expectedFingerprint ?? artifact.fingerprint;
      const validated = artifact.validated;
      if (!isRecord(validated))
        return indeterminate([
          createDiagnostic({ code: "VF_AEAT_INDETERMINATE", severity: "warning", phase: "chain" }),
        ]);
      const fingerprintInput = validateFingerprintInput(validated["fingerprint"]);
      if (fingerprintInput.status !== "valid") return invalid(fingerprintInput.diagnostics);
      const verified = verifyRrsifFingerprint(fingerprintInput.value, expected);
      return verified.status === "valid"
        ? valid(
            Object.freeze({ status: "valid" as const, recordId: artifact.recordId }),
            verified.diagnostics,
          )
        : invalid(verified.diagnostics);
    }
    if (!(artifact instanceof Uint8Array))
      return invalid([
        createDiagnostic({ code: "VF_INPUT_VALUE_INVALID", severity: "error", phase: "input" }),
      ]);
    return indeterminate([
      createDiagnostic({ code: "VF_AEAT_INDETERMINATE", severity: "warning", phase: "chain" }),
    ]);
  }

  async *verifyChain(
    input: VerifyChainInput,
    signal?: AbortSignal,
  ): AsyncIterable<{
    status: "valid" | "invalid" | "indeterminate" | "aborted";
    recordId?: string;
  }> {
    if (this.config.recordStore === undefined) return;
    let count = 0;
    for await (const record of this.config.recordStore.scan(
      {
        contextId: input.contextId ?? this.config.taxpayerScopeId,
        sequenceId: input.sequenceId ?? this.config.sequenceId,
        limit: input.limit,
      },
      signal,
    )) {
      if (signal?.aborted === true) {
        yield Object.freeze({ status: "aborted" });
        return;
      }
      if (++count > input.limit) return;
      const digest = createHash("sha256").update(record.bytes).digest("hex").toUpperCase();
      yield Object.freeze(
        digest === record.recordDigest
          ? { status: "valid" as const, recordId: record.recordId }
          : { status: "invalid" as const, recordId: record.recordId },
      );
    }
  }

  buildQr(input: QrInvoiceData): Result<QrCode> {
    return renderQr(input);
  }

  verifyQr(input: { readonly payload: string; readonly expected: QrInvoiceData }): Result<true> {
    const expected = buildQrPayload(input.expected);
    return expected.ok && expected.value === input.payload
      ? success(true)
      : failure("INVALID_INPUT", [
          createDiagnostic({ code: "VF_QR_INPUT_INVALID", severity: "error", phase: "input" }),
        ]);
  }

  async buildSubmission(input: BuildSubmissionInput): Promise<Result<SubmissionBatch>> {
    await Promise.resolve();
    const header = input.header;
    if (header === undefined) return unsupported("header");
    if (!isAeatEndpointId(input.endpointId)) return unsupported("endpointId");
    if (!isSubmissionHeader(header)) return unsupported("header");
    const endpoint = resolveAeatEndpoint(input.environment, input.endpointId);
    if (!endpoint.ok) return endpoint;
    return buildSubmissionBatch({
      ...input,
      endpointId: endpoint.value.id,
      header,
    });
  }

  inspectResponse(input: InspectResponseInput): Result<AeatSubmissionResponse> {
    return parseAeatResponse(input.bytes);
  }

  async processQueue(
    input: ProcessQueueInput,
    signal?: AbortSignal,
  ): Promise<Result<ProcessReport>> {
    if (
      this.config.outboxStore === undefined ||
      this.config.transport === undefined ||
      this.config.clock === undefined
    )
      return unsupported("queue-capabilities");
    return processQueueOnce({
      owner: input.owner,
      limit: input.limit,
      leaseSeconds: input.leaseSeconds,
      clock: this.config.clock,
      outbox: this.config.outboxStore,
      transport: this.config.transport,
      ...(this.config.recordStore === undefined ? {} : { recordStore: this.config.recordStore }),
      ...(this.config.observer === undefined ? {} : { observer: this.config.observer }),
      ...(this.config.retryPolicy === undefined ? {} : { retryPolicy: this.config.retryPolicy }),
      ...(signal === undefined ? {} : { signal }),
    });
  }

  async reconcile(
    input: ReconcileInput,
    signal?: AbortSignal,
  ): Promise<Result<ReconciliationReport>> {
    if (signal?.aborted === true) return abortedResult();
    if (this.config.outboxStore === undefined) return unsupported("outboxStore");
    const inspected = await this.config.outboxStore.inspect(input.workId, signal);
    if (!inspected.ok) return inspected;
    const work = inspected.value;
    if (work === undefined)
      return success(Object.freeze({ workId: input.workId, status: "indeterminate" as const }));
    if (work.state === "completed" && work.responseBytes !== undefined) {
      const response = parseAeatResponse(work.responseBytes);
      return response.ok
        ? success(
            Object.freeze({
              workId: input.workId,
              status: "resolved" as const,
              response: response.value,
            }),
          )
        : success(Object.freeze({ workId: input.workId, status: "indeterminate" as const }));
    }
    return success(Object.freeze({ workId: input.workId, status: "indeterminate" as const }));
  }

  async *export(input: ExportInput, signal?: AbortSignal): AsyncIterable<Uint8Array> {
    if (this.config.recordStore === undefined) return;
    for await (const record of this.config.recordStore.scan(
      { contextId: input.contextId, sequenceId: input.sequenceId, limit: input.limit },
      signal,
    )) {
      if (signal?.aborted === true) return;
      yield new TextEncoder().encode(
        `${JSON.stringify({ recordId: record.recordId, state: record.state, position: record.position, bytes: Buffer.from(record.bytes).toString("base64") })}\n`,
      );
    }
  }

  private async prepare(
    recordId: string,
    kind: PreparedArtifact["kind"],
    value: unknown,
    signal?: AbortSignal,
  ): Promise<Result<PreparedArtifact>> {
    await Promise.resolve();
    if (signal?.aborted === true) return abortedResult();
    if (typeof recordId !== "string" || recordId.length === 0)
      return failure("INVALID_INPUT", [
        createDiagnostic({
          code: "VF_INPUT_VALUE_INVALID",
          severity: "error",
          phase: "input",
          path: "/recordId",
        }),
      ]);
    const validation = kind === "event" ? undefined : validateBillingRecord(value, signal);
    if (validation !== undefined && validation.status !== "valid")
      return failure("INVALID_INPUT", validation.diagnostics);
    const validated = validation?.value;
    const eventValidation = kind === "event" ? validateFingerprintInput(value) : undefined;
    if (
      eventValidation !== undefined &&
      (eventValidation.status !== "valid" || eventValidation.value.kind !== "event")
    )
      return failure("INVALID_INPUT", eventValidation.diagnostics);
    const eventInput =
      eventValidation?.status === "valid" && eventValidation.value.kind === "event"
        ? eventValidation.value
        : undefined;
    const bytesResult =
      eventInput !== undefined
        ? success(new TextEncoder().encode(serializeXml(eventXml(eventInput))))
        : validated === undefined
          ? failure<Uint8Array>("INVALID_INPUT", [
              createDiagnostic({
                code: "VF_INPUT_VALUE_INVALID",
                severity: "error",
                phase: "record",
              }),
            ])
          : serializeBillingRecord(validated, signal);
    if (!bytesResult.ok) return bytesResult;
    const fingerprint =
      eventInput !== undefined
        ? calculateRrsifFingerprint(eventInput).fingerprint.value
        : validated === undefined
          ? ""
          : calculateRrsifFingerprint(validated.fingerprint).fingerprint.value;
    const evidence =
      fingerprint === ""
        ? undefined
        : createInternalRecordEvidence({
            edition: "aeat-rrsif-1.0@2026-09-03",
            taxpayerScopeId: this.config.taxpayerScopeId,
            installationId: this.config.installationId,
            sequenceId: this.config.sequenceId,
            recordClass: kind,
            recordId,
            officialFingerprint: fingerprint,
            officialBytes: bytesResult.value,
          });
    if (evidence !== undefined && !evidence.ok) return evidence;
    return success(
      Object.freeze({
        recordId,
        kind,
        edition: editionInfo.edition,
        mode: this.config.mode,
        bytes: new Uint8Array(bytesResult.value),
        fingerprint,
        ...(evidence?.ok ? { internalEvidence: evidence.value } : {}),
        validated: validated ?? eventInput ?? Object.freeze({}),
      }),
    );
  }
}

function eventXml(event: EventFingerprintInput): XmlElement {
  const previous = event.previous.kind === "genesis" ? "" : event.previous.fingerprint.value;
  return Object.freeze({
    name: "RegistroEvento",
    attributes: Object.freeze({}),
    children: Object.freeze([
      element("NIF", [event.producer.kind === "nif" ? event.producer.nif.value : ""]),
      element("ID", [event.producer.kind === "other" ? event.producer.id.value : ""]),
      element("IdSistemaInformatico", [event.systemId.value]),
      element("Version", [event.version.value]),
      element("NumeroInstalacion", [event.installationNumber.value]),
      element("NIFObligado", [event.taxpayerNif.value]),
      element("TipoEvento", [event.eventType]),
      element("HuellaEvento", [previous]),
      element("FechaHoraHusoGenEvento", [event.generatedAt.value]),
    ]),
  });
}
function element(name: string, children: readonly XmlNode[]): XmlElement {
  return Object.freeze({ name, attributes: Object.freeze({}), children: Object.freeze(children) });
}

function isConfig(value: unknown): value is VerifactuConfig {
  if (!isRecord(value) || (value["mode"] !== "verifactu" && value["mode"] !== "no-verifactu"))
    return false;
  return (
    typeof value["taxpayerScopeId"] === "string" &&
    value["taxpayerScopeId"].length > 0 &&
    typeof value["installationId"] === "string" &&
    value["installationId"].length > 0 &&
    typeof value["sequenceId"] === "string" &&
    value["sequenceId"].length > 0
  );
}
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function isPreparedArtifact(value: unknown): value is PreparedArtifact {
  return (
    isRecord(value) &&
    typeof value["recordId"] === "string" &&
    (value["kind"] === "alta" || value["kind"] === "anulacion" || value["kind"] === "event") &&
    value["bytes"] instanceof Uint8Array &&
    typeof value["fingerprint"] === "string"
  );
}
function isAeatEndpointId(value: string): value is AeatEndpointId {
  return (
    value === "verifactu" ||
    value === "requerimiento" ||
    value === "verifactu-sello" ||
    value === "requerimiento-sello"
  );
}
function isSubmissionHeader(value: unknown): value is SubmissionHeader {
  if (!isRecord(value)) return false;
  const required = [
    "obligadoNif",
    "idVersion",
    "nombreSistemaInformatico",
    "idSistemaInformatico",
    "version",
    "numeroInstalacion",
    "tipoUsoPosibleMultiOT",
    "tipoUsoPosibleSoloVerifactu",
  ] as const;
  return (
    required.every((key) => typeof value[key] === "string") &&
    (value["tipoUsoPosibleMultiOT"] === "S" || value["tipoUsoPosibleMultiOT"] === "N") &&
    (value["tipoUsoPosibleSoloVerifactu"] === "S" || value["tipoUsoPosibleSoloVerifactu"] === "N")
  );
}
function unsupported(path: string): Result<never> {
  return failure("INVALID_INPUT", [
    createDiagnostic({
      code: "VF_INPUT_REQUIRED",
      severity: "error",
      phase: "compatibility",
      path,
    }),
  ]);
}
function abortedResult(): Result<never> {
  return failure("ABORTED", [
    createDiagnostic({ code: "VF_INPUT_ABORTED", severity: "error", phase: "input" }),
  ]);
}
