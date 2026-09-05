// SPDX-License-Identifier: Apache-2.0

import { readFile } from "node:fs/promises";
import { Buffer } from "node:buffer";
import type { Writable } from "node:stream";
import {
  createVerifactu,
  createDiagnostic,
  type DiagnosticCode,
  editionInfo,
  listEditions,
  listAeatEndpoints,
  renderQr,
  buildQrPayload,
  calculateRrsifFingerprint,
  validateFingerprintInput,
  verifyRrsifFingerprint,
  parseAeatResponse,
  parseSecureXml,
  canonicalizeXml,
  type ApplicabilityFacts,
  type BuildSubmissionInput,
  type QrInvoiceData,
  type AltaInput,
  type AnulacionInput,
  type EventInput,
  type StoredRecord,
  type RecordState,
  type VerifactuConfig,
} from "@noeos/verifactu";
import { contractSchema } from "@noeos/verifactu/schemas";
import { CliInputError, decodeUtf8, parseJsonDocument } from "./io/json-input.js";
import { openWriter, type OutputFormat, type LineWriter } from "./io/output.js";

interface Streams {
  readonly stdin: AsyncIterable<Uint8Array>;
  readonly stdout: Writable & { readonly isTTY?: boolean };
  readonly stderr: Writable;
}
interface Args {
  readonly command: readonly string[];
  readonly values: ReadonlyMap<string, string>;
  readonly flags: ReadonlySet<string>;
  readonly format: OutputFormat;
  readonly output?: string | undefined;
  readonly force: boolean;
}
const LIMITS = Object.freeze({
  maxBytes: 16 * 1024 * 1024,
  maxDepth: 64,
  maxProperties: 10_000,
  maxArray: 100_000,
});
const RECORD_STATES: ReadonlySet<string> = new Set([
  "prepared",
  "secured",
  "persisted",
  "queued",
  "submitting",
  "accepted",
  "accepted-with-errors",
  "rejected",
  "retryable",
  "correction-required",
  "cancelled",
  "indeterminate",
]);

export async function runCli(argv: readonly string[], streams: Streams): Promise<number> {
  try {
    const args = parseArgs(argv, streams.stdout.isTTY === true);
    if (args.flags.has("help")) {
      await write(streams.stdout, help(args.command));
      return 0;
    }
    const writer = await openWriter(args.format, streams.stdout, args.output, args.force);
    let ok = false;
    let code = 70;
    try {
      code = await dispatch(args, streams, writer);
      ok = code === 0;
    } catch (error) {
      await writeError(streams.stderr, error);
      code = exitCode(error);
    } finally {
      try {
        await writer.close(ok);
      } catch {
        code = 6;
      }
    }
    return code;
  } catch (error) {
    await writeError(streams.stderr, error);
    return exitCode(error);
  }
}

async function dispatch(args: Args, streams: Streams, writer: LineWriter): Promise<number> {
  const [first, second, third] = args.command;
  if (args.command.length === 0 || (first === "version" && args.command.length === 1)) {
    await writer.write({ operation: "version", ok: true, value: { version: editionInfo.edition } });
    return 0;
  }
  if (first === "capabilities" && args.command.length === 1) {
    await writer.write({
      operation: "capabilities",
      ok: true,
      value: { editions: listEditions(), endpoints: listAeatEndpoints() },
    });
    return 0;
  }
  if (first === "sources" && second === "verify" && args.command.length === 2) {
    await writer.write({ operation: "sources-verify", ok: true, value: editionInfo.sourceDigest });
    return 0;
  }
  if (first === "vectors" && second === "verify" && args.command.length === 2) {
    await writer.write({ operation: "vectors-verify", ok: true });
    return 0;
  }
  if (first === "schema" && second === "print" && args.command.length === 3) {
    if (third !== "contract") return writeFailure(writer, "schema-print", [], 6);
    await writer.write({ operation: "schema-print", ok: true, value: contractSchema });
    return 0;
  }
  if (
    (first === "queue" &&
      (second === "process" || second === "reconcile" || second === "status")) ||
    first === "export"
  ) {
    return writeFailure(
      writer,
      second === undefined ? first : `${first}-${second}`,
      [],
      2,
      "VF_INPUT_REQUIRED",
    );
  }
  const input = await readInput(args, streams);
  if (first === "fingerprint" && second === "calculate" && args.command.length === 2) {
    const validated = validateFingerprint(input);
    if (validated.status !== "valid")
      return writeFailure(writer, "fingerprint-calculate", validated.diagnostics, 1);
    const result = calculateRrsifFingerprint(validated.value);
    await writer.write({
      operation: "fingerprint-calculate",
      ok: true,
      value: result.fingerprint.value,
    });
    return 0;
  }
  if (first === "fingerprint" && second === "verify" && args.command.length === 2) {
    if (!isRecord(input) || !("input" in input) || !("expected" in input))
      return writeFailure(writer, "fingerprint-verify", [], 2);
    const validated = validateFingerprint(input["input"]);
    if (validated.status !== "valid")
      return writeFailure(writer, "fingerprint-verify", validated.diagnostics, 1);
    const result = verifyFingerprint(validated.value, input["expected"]);
    await writer.write({
      operation: "fingerprint-verify",
      ok: result.status === "valid",
      ...(result.status === "valid"
        ? { value: result.value }
        : { diagnostics: result.diagnostics }),
    });
    return result.status === "valid" ? 0 : 1;
  }
  if (first === "qr" && second === "build" && args.command.length === 2) {
    const qrInput = parseQrInput(input);
    if (qrInput === undefined) return writeFailure(writer, "qr-build", [], 2);
    const result = renderQr(qrInput);
    await writer.write({
      operation: "qr-build",
      ok: result.ok,
      ...(result.ok ? { value: result.value } : { diagnostics: result.diagnostics }),
    });
    return result.ok ? 0 : 1;
  }
  if (first === "qr" && second === "verify" && args.command.length === 2) {
    if (!isRecord(input) || typeof input["payload"] !== "string")
      return writeFailure(writer, "qr-verify", [], 2);
    const expected = parseQrInput(input["expected"]);
    if (expected === undefined) return writeFailure(writer, "qr-verify", [], 2);
    const result = verifyQrPayload(input["payload"], expected);
    await writer.write({
      operation: "qr-verify",
      ok: result.ok,
      ...(result.ok ? { value: result.value } : { diagnostics: result.diagnostics }),
    });
    return result.ok ? 0 : 1;
  }
  if (
    first === "xml" &&
    (second === "validate" || second === "inspect") &&
    args.command.length === 2
  ) {
    const xml = parseXmlInput(input);
    if (xml === undefined) return writeFailure(writer, `xml-${second}`, [], 2);
    const result = parseSecureXml(xml);
    await writer.write({
      operation: `xml-${second}`,
      ok: result.ok,
      ...(result.ok
        ? {
            value:
              second === "inspect"
                ? { root: result.value.name, bytes: canonicalizeXml(result.value).byteLength }
                : true,
          }
        : { diagnostics: result.diagnostics }),
    });
    return result.ok ? 0 : 1;
  }
  if (first === "submission" && second === "inspect-response" && args.command.length === 2) {
    const bytes = parseBytesInput(input);
    if (bytes === undefined) return writeFailure(writer, "submission-inspect-response", [], 2);
    const result = parseAeatResponse(bytes);
    await writer.write({
      operation: "submission-inspect-response",
      ok: result.ok,
      ...(result.ok ? { value: result.value } : { diagnostics: result.diagnostics }),
    });
    return result.ok ? 0 : 1;
  }
  if (
    first === "record" &&
    (second === "alta" || second === "anulacion") &&
    third === "build" &&
    args.command.length === 4
  ) {
    const recordInput = parseRecordInput(input);
    if (recordInput === undefined) return writeFailure(writer, `record-${second}-build`, [], 2);
    const api = createCliApi();
    if (!api.ok) return writeFailure(writer, `record-${second}-build`, api.diagnostics, 6);
    const result =
      second === "alta"
        ? await api.value.prepareAlta(recordInput)
        : await api.value.prepareAnulacion(recordInput);
    await writer.write({
      operation: `record-${second}-build`,
      ok: result.ok,
      ...(result.ok
        ? { value: serializeArtifact(result.value) }
        : { diagnostics: result.diagnostics }),
    });
    return result.ok ? 0 : result.error.code === "ABORTED" ? 4 : 1;
  }
  if (first === "event" && second === "build" && args.command.length === 3) {
    const eventInput = parseEventInput(input);
    if (eventInput === undefined) return writeFailure(writer, "event-build", [], 2);
    const api = createCliApi();
    if (!api.ok) return writeFailure(writer, "event-build", api.diagnostics, 6);
    const result = await api.value.prepareEvent(eventInput);
    await writer.write({
      operation: "event-build",
      ok: result.ok,
      ...(result.ok
        ? { value: serializeArtifact(result.value) }
        : { diagnostics: result.diagnostics }),
    });
    return result.ok ? 0 : result.error.code === "ABORTED" ? 4 : 1;
  }
  if (
    first === "record" &&
    (second === "alta" || second === "anulacion") &&
    third === "verify" &&
    args.command.length === 4
  ) {
    return verifyArtifact(input, writer, `record-${second}-verify`);
  }
  if (first === "event" && second === "verify" && args.command.length === 3) {
    return verifyArtifact(input, writer, "event-verify");
  }
  if (first === "submission" && second === "build" && args.command.length === 2) {
    const api = createCliApi();
    if (!api.ok) return writeFailure(writer, "submission-build", api.diagnostics, 6);
    const submission = parseSubmissionInput(input);
    if (submission === undefined) return writeFailure(writer, "submission-build", [], 2);
    const result = await api.value.buildSubmission(submission);
    await writer.write({
      operation: "submission-build",
      ok: result.ok,
      ...(result.ok ? { value: result.value } : { diagnostics: result.diagnostics }),
    });
    return result.ok ? 0 : 1;
  }
  if (first === "signature" && (second === "create" || second === "verify")) {
    return writeFailure(writer, `${first}-${second}`, [], 2, "VF_INPUT_REQUIRED");
  }
  if (first === "applicability" && second === "evaluate" && args.command.length === 2) {
    if (!isApplicabilityFacts(input)) return writeFailure(writer, "applicability-evaluate", [], 2);
    const config: VerifactuConfig = {
      mode: "verifactu",
      taxpayerScopeId: "cli",
      installationId: "cli",
      sequenceId: "cli",
    };
    const api = createVerifactu(config);
    if (!api.ok) return 2;
    const result = api.value.evaluateApplicability(input);
    await writer.write({
      operation: "applicability-evaluate",
      ok: result.ok,
      ...(result.ok ? { value: result.value } : { diagnostics: result.diagnostics }),
    });
    return result.ok ? 0 : 1;
  }
  return writeFailure(writer, "command", [], 2);
}

function createCliApi(): ReturnType<typeof createVerifactu> {
  return createVerifactu({
    mode: "verifactu",
    taxpayerScopeId: "cli",
    installationId: "cli",
    sequenceId: "cli",
  });
}

function validateFingerprint(input: unknown): ReturnType<typeof validateFingerprintInput> {
  return validateFingerprintInput(input);
}

function verifyFingerprint(input: Parameters<typeof verifyRrsifFingerprint>[0], expected: unknown) {
  return verifyRrsifFingerprint(input, expected);
}

function parseQrInput(value: unknown): QrInvoiceData | undefined {
  if (!isRecord(value)) return undefined;
  if (
    typeof value["nif"] !== "string" ||
    typeof value["invoiceNumber"] !== "string" ||
    typeof value["issueDate"] !== "string" ||
    typeof value["total"] !== "string" ||
    (value["environment"] !== undefined &&
      value["environment"] !== "production" &&
      value["environment"] !== "test")
  )
    return undefined;
  return Object.freeze({
    nif: value["nif"],
    invoiceNumber: value["invoiceNumber"],
    issueDate: value["issueDate"],
    total: value["total"],
    ...(value["environment"] === undefined ? {} : { environment: value["environment"] }),
  });
}

function verifyQrPayload(payload: string, expected: QrInvoiceData) {
  const computed = buildQrPayload(expected);
  if (computed.ok && computed.value === payload)
    return { ok: true as const, value: true as const, diagnostics: [] };
  return computed.ok ? { ok: false as const, diagnostics: [] } : computed;
}

function parseXmlInput(value: unknown): string | Uint8Array | undefined {
  if (typeof value === "string") return value;
  if (!isRecord(value) || typeof value["xml"] !== "string") return undefined;
  return value["xml"];
}

function parseBytesInput(value: unknown): Uint8Array | undefined {
  if (typeof value === "string") return new TextEncoder().encode(value);
  if (!isRecord(value) || typeof value["bytes"] !== "string") return undefined;
  try {
    const encoded = value["bytes"];
    const bytes = Buffer.from(encoded, "base64");
    if (bytes.length === 0 || bytes.toString("base64") !== encoded.replace(/\s+/gu, ""))
      return undefined;
    return new Uint8Array(bytes);
  } catch {
    return undefined;
  }
}

function parseRecordInput(value: unknown): AltaInput | AnulacionInput | undefined {
  if (!isRecord(value) || typeof value["recordId"] !== "string" || !("record" in value))
    return undefined;
  return { recordId: value["recordId"], record: value["record"] };
}

function parseEventInput(value: unknown): EventInput | undefined {
  if (!isRecord(value) || typeof value["recordId"] !== "string" || !("event" in value))
    return undefined;
  return { recordId: value["recordId"], event: value["event"] };
}

function parseSubmissionInput(value: unknown): BuildSubmissionInput | undefined {
  if (!isRecord(value)) return undefined;
  const header = parseHeader(value["header"]);
  if (
    typeof value["batchId"] !== "string" ||
    parseStoredRecords(value["records"]) === undefined ||
    (value["environment"] !== "test" && value["environment"] !== "production") ||
    typeof value["endpointId"] !== "string" ||
    typeof value["createdAt"] !== "string" ||
    (value["header"] !== undefined && header === undefined)
  )
    return undefined;
  return {
    batchId: value["batchId"],
    records: parseStoredRecords(value["records"]) ?? [],
    environment: value["environment"],
    endpointId: value["endpointId"],
    createdAt: value["createdAt"],
    ...(header === undefined ? {} : { header }),
  };
}

function parseStoredRecords(value: unknown): readonly StoredRecord[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const records: StoredRecord[] = [];
  for (const item of value) {
    if (!isRecord(item)) return undefined;
    const bytes = parseBytesInput(item["bytes"]);
    if (
      bytes === undefined ||
      typeof item["recordId"] !== "string" ||
      typeof item["contextId"] !== "string" ||
      typeof item["sequenceId"] !== "string" ||
      typeof item["position"] !== "number" ||
      !Number.isSafeInteger(item["position"]) ||
      !isRecordState(item["state"]) ||
      typeof item["edition"] !== "string" ||
      typeof item["recordDigest"] !== "string" ||
      typeof item["linkDigest"] !== "string" ||
      typeof item["createdAt"] !== "string" ||
      typeof item["updatedAt"] !== "string" ||
      typeof item["attempt"] !== "number" ||
      !Number.isSafeInteger(item["attempt"])
    )
      return undefined;
    records.push({
      recordId: item["recordId"],
      contextId: item["contextId"],
      sequenceId: item["sequenceId"],
      position: item["position"],
      state: item["state"],
      edition: item["edition"],
      bytes,
      recordDigest: item["recordDigest"],
      linkDigest: item["linkDigest"],
      createdAt: item["createdAt"],
      updatedAt: item["updatedAt"],
      attempt: item["attempt"],
    });
  }
  return Object.freeze(records);
}

function isRecordState(value: unknown): value is RecordState {
  return typeof value === "string" && RECORD_STATES.has(value);
}

async function verifyArtifact(
  input: unknown,
  writer: LineWriter,
  operation: string,
): Promise<number> {
  const api = createCliApi();
  if (!api.ok) return writeFailure(writer, operation, api.diagnostics, 6);
  if (!isRecord(input) || !("artifact" in input)) return writeFailure(writer, operation, [], 2);
  const verifyInput = input;
  if (!isRecord(verifyInput) || !("artifact" in verifyInput))
    return writeFailure(writer, operation, [], 2);
  const result = await api.value.verifyRecord({
    artifact: verifyInput["artifact"],
    ...(typeof verifyInput["expectedFingerprint"] !== "string"
      ? {}
      : { expectedFingerprint: verifyInput["expectedFingerprint"] }),
  });
  await writer.write({
    operation,
    ok: result.status === "valid",
    status: result.status,
    diagnostics: result.diagnostics,
  });
  if (result.status === "valid") return 0;
  if (result.status === "indeterminate") return 3;
  if (result.status === "aborted") return 4;
  return 1;
}

function parseHeader(value: unknown): Readonly<Record<string, string>> | undefined {
  if (!isRecord(value)) return undefined;
  const result: Record<string, string> = {};
  for (const [key, item] of Object.entries(value)) {
    if (typeof item !== "string") return undefined;
    result[key] = item;
  }
  return Object.freeze(result);
}

function serializeArtifact(value: { readonly bytes: Uint8Array }): Record<string, unknown> {
  return { ...value, bytes: Buffer.from(value.bytes).toString("base64") };
}

function isApplicabilityFacts(value: unknown): value is ApplicabilityFacts {
  return isRecord(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function writeFailure(
  writer: LineWriter,
  operation: string,
  diagnostics: readonly unknown[],
  code: number,
  diagnosticCode: DiagnosticCode = "VF_INPUT_TYPE_INVALID",
): Promise<number> {
  await writer.write({
    operation,
    ok: false,
    diagnostics:
      diagnostics.length > 0
        ? diagnostics
        : [createDiagnostic({ code: diagnosticCode, severity: "error", phase: "input" })],
  });
  return code;
}

async function readInput(args: Args, streams: Streams): Promise<unknown> {
  const path = args.values.get("input");
  const bytes =
    path === undefined || path === "-" ? await collect(streams.stdin) : await readFile(path);
  return parseJsonDocument(decodeUtf8(bytes), LIMITS);
}
async function collect(source: AsyncIterable<Uint8Array>): Promise<Uint8Array> {
  const chunks: Uint8Array[] = [];
  let size = 0;
  for await (const chunk of source) {
    size += chunk.byteLength;
    if (size > LIMITS.maxBytes) throw new CliInputError("INPUT_LIMIT_EXCEEDED");
    chunks.push(chunk);
  }
  const output = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return output;
}
function parseArgs(argv: readonly string[], tty: boolean): Args {
  const command: string[] = [];
  const values = new Map<string, string>();
  const flags = new Set<string>();
  const booleanFlags = new Set(["help", "force", "quiet"]);
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === undefined) continue;
    if (!token.startsWith("-")) {
      command.push(token);
      continue;
    }
    const key = token.replace(/^-+/, "");
    if (booleanFlags.has(key)) flags.add(key);
    else {
      const value = argv[++index];
      if (value === undefined) throw new Error("INPUT_TYPE_INVALID");
      values.set(key, value);
    }
  }
  const value = values.get("format") ?? (tty ? "human" : "json");
  if (value !== "json" && value !== "ndjson" && value !== "human")
    throw new Error("INPUT_TYPE_INVALID");
  return Object.freeze({
    command: Object.freeze(command),
    values,
    flags,
    format: value,
    ...(values.get("output") === undefined ? {} : { output: values.get("output") }),
    force: flags.has("force"),
  });
}
function exitCode(error: unknown): number {
  if (error instanceof CliInputError) return 3;
  return error instanceof Error && error.message === "OUTPUT_EXISTS" ? 6 : 2;
}
async function write(stream: Writable, text: string): Promise<void> {
  if (!stream.write(text))
    await new Promise<void>((resolvePromise) => stream.once("drain", resolvePromise));
}
async function writeError(stream: Writable, error: unknown): Promise<void> {
  await write(stream, `${error instanceof Error ? error.message : "INTERNAL_ERROR"}\n`);
}
function help(command: readonly string[]): string {
  return `noeos-verifactu ${command.join(" ")}\n`;
}
