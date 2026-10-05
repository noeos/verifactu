import { createHash } from "node:crypto";
import type { AeatBatchPlan } from "./batch-planner.js";
import type { ParsedAeatResponse, ParsedAeatLine } from "./response-parser.js";

export type CorrelatedState =
  | "accepted"
  | "accepted-with-errors"
  | "rejected"
  | "indeterminate";

export interface CorrelationResult {
  readonly status: "complete" | "indeterminate";
  readonly outcomes: readonly {
    readonly recordId: string;
    readonly sequence: number;
    readonly state: CorrelatedState;
    readonly responseLineDigest: string | null;
  }[];
  readonly extraResponseLines: number;
  readonly duplicateResponseLines: number;
  readonly missingResponseLines: number;
  readonly responseDigest: string;
  readonly requestDigest: string;
  readonly diagnostics: readonly string[];
}

function lineKey(line: ParsedAeatLine | null | undefined): string | null {
  if (
    !line ||
    !Array.isArray(line.identity) ||
    line.identity.length !== 4 ||
    line.identity.some(
      (value) => typeof value !== "string" || value.length === 0,
    )
  )
    return null;
  return JSON.stringify(line.identity);
}
function expectedKey(record: AeatBatchPlan["orderedRecords"][number]): string {
  return JSON.stringify([
    record.issuer,
    record.series,
    record.number,
    record.issueDate,
  ]);
}

export function correlateAeatResponse(
  batch: AeatBatchPlan,
  response: ParsedAeatResponse,
): CorrelationResult {
  const zeroDigest = `sha256:${"0".repeat(64)}`;
  if (
    !batch ||
    !Array.isArray(batch.orderedRecords) ||
    batch.orderedRecords.length === 0 ||
    Array.from(batch.orderedRecords).some(
      (record) =>
        !record ||
        typeof record.recordId !== "string" ||
        record.recordId.length === 0 ||
        typeof record.issuer !== "string" ||
        typeof record.series !== "string" ||
        typeof record.number !== "string" ||
        typeof record.issueDate !== "string" ||
        !Number.isSafeInteger(record.sequence),
    ) ||
    !(batch.request?.bytes instanceof Uint8Array) ||
    `sha256:${createHash("sha256").update(batch.request.bytes).digest("hex")}` !==
      batch.request.sha256 ||
    !response ||
    !(response.responseArtifact instanceof Uint8Array) ||
    `sha256:${createHash("sha256").update(response.responseArtifact).digest("hex")}` !==
      response.responseDigest ||
    !Array.isArray(response.lines)
  )
    return Object.freeze({
      status: "indeterminate",
      outcomes: Object.freeze([]),
      extraResponseLines: 0,
      duplicateResponseLines: 0,
      missingResponseLines: 0,
      responseDigest: response?.responseDigest ?? zeroDigest,
      requestDigest: batch?.request?.sha256 ?? zeroDigest,
      diagnostics: Object.freeze(["DIAG-AEAT-CORRELATION-INPUT"]),
    });
  const expected = new Map<string, AeatBatchPlan["orderedRecords"][number]>();
  const diagnostics: string[] = [];
  const globalRejectedWithoutLines =
    response.status === "rejected" && response.lines.length === 0;
  for (const record of batch?.orderedRecords ?? []) {
    const key = expectedKey(record);
    if (expected.has(key))
      diagnostics.push("DIAG-AEAT-CORRELATION-EXPECTED-DUPLICATE");
    expected.set(key, record);
  }
  const counts = new Map<string, number>();
  const lineForRecord = new Map<string, ParsedAeatLine>();
  let extraResponseLines = 0;
  let duplicateResponseLines = 0;
  let missingResponseLines = 0;
  for (const line of response?.lines ?? []) {
    const key = lineKey(line);
    if (!key || !expected.has(key)) {
      extraResponseLines += 1;
      continue;
    }
    const count = (counts.get(key) ?? 0) + 1;
    counts.set(key, count);
    if (count > 1) {
      duplicateResponseLines += 1;
      continue;
    }
    lineForRecord.set(key, line);
  }
  for (const key of expected.keys())
    if (!counts.has(key) && !globalRejectedWithoutLines)
      missingResponseLines += 1;
  if (extraResponseLines > 0) diagnostics.push("DIAG-AEAT-CORRELATION-FOREIGN");
  if (duplicateResponseLines > 0)
    diagnostics.push("DIAG-AEAT-CORRELATION-DUPLICATE");
  if (missingResponseLines > 0)
    diagnostics.push("DIAG-AEAT-CORRELATION-MISSING");
  const responseStatus = response?.status ?? "malformed";
  if (
    responseStatus === "malformed" ||
    responseStatus === "unrecognized" ||
    responseStatus === "soap-fault" ||
    responseStatus === "http-error"
  )
    diagnostics.push("DIAG-AEAT-RESPONSE-UNCLASSIFIED");

  const exact =
    extraResponseLines === 0 &&
    duplicateResponseLines === 0 &&
    missingResponseLines === 0 &&
    diagnostics.length === 0;
  const outcomes = (batch?.orderedRecords ?? []).map((record) => {
    const line = lineForRecord.get(expectedKey(record));
    let state: CorrelatedState = "indeterminate";
    if (globalRejectedWithoutLines && response.status === "rejected")
      state = "rejected";
    else if (
      exact &&
      response.status === "accepted" &&
      line?.classification === "accepted"
    )
      state = "accepted";
    else if (exact && response.status === "accepted-with-errors") {
      if (line?.classification === "accepted") state = "accepted";
      else if (line?.classification === "accepted-with-errors")
        state = "accepted-with-errors";
      else if (line?.classification === "rejected") state = "rejected";
    } else if (
      exact &&
      response.status === "rejected" &&
      line?.classification === "rejected"
    )
      state = "rejected";
    return Object.freeze({
      recordId: record.recordId,
      sequence: record.sequence,
      state,
      responseLineDigest: line ? response.responseDigest : null,
    });
  });
  const complete =
    outcomes.length === batch.orderedRecords.length &&
    outcomes.every((item) => item.state !== "indeterminate");
  if (
    !complete &&
    !diagnostics.includes("DIAG-AEAT-CORRELATION-MISSING") &&
    !globalRejectedWithoutLines
  )
    diagnostics.push("DIAG-AEAT-CORRELATION-OUTCOME-INCOMPLETE");
  return Object.freeze({
    status: complete ? "complete" : "indeterminate",
    outcomes: Object.freeze(outcomes),
    extraResponseLines,
    duplicateResponseLines,
    missingResponseLines,
    responseDigest: response.responseDigest,
    requestDigest: batch.request.sha256,
    diagnostics: Object.freeze([...new Set(diagnostics)].sort()),
  });
}
