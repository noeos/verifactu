import { createHash } from "node:crypto";
import type { FiscalContext } from "../domain/context.js";
import { createFiscalContext, sameContext } from "../domain/context.js";
import { isSafeStoreToken } from "../persistence/model.js";
import type { AeatEditionProfile, AeatOperationId } from "./edition-profile.js";
import {
  operationProfile,
  verifyAeatEditionProfile,
} from "./edition-profile.js";

export interface ConsultationPage {
  readonly context: FiscalContext;
  readonly editionDigest: string;
  readonly queryDigest: string;
  readonly snapshotId: string;
  readonly cursor: string | null;
  readonly nextCursor: string | null;
  readonly complete: boolean;
  readonly responseBytes: Uint8Array;
  readonly records: readonly {
    readonly identity: readonly string[];
    readonly payloadDigest: string;
  }[];
}

export interface ConsultationPagePort {
  fetch(input: {
    readonly profile: AeatEditionProfile;
    readonly operationId: AeatOperationId;
    readonly context: FiscalContext;
    readonly cursor: string | null;
    readonly snapshotId: string | null;
  }): Promise<ConsultationPage>;
}

export interface ConsultationRetentionPort {
  retain(input: {
    readonly context: FiscalContext;
    readonly queryDigest: string;
    readonly pageNumber: number;
    readonly page: ConsultationPage;
    readonly pageDigest: string;
  }): Promise<boolean>;
}

export interface ConsultationResult {
  readonly status: "complete" | "indeterminate";
  readonly queryDigest: string;
  readonly snapshotId: string | null;
  readonly pageCount: number;
  readonly records: readonly ConsultationPage["records"][number][];
  readonly pageDigests: readonly string[];
  readonly diagnostic: string | null;
}

const sha256 = (bytes: Uint8Array): string =>
  `sha256:${createHash("sha256").update(bytes).digest("hex")}`;

/** Reads and retains a bounded, stable snapshot. A partial result is never reported as complete. */
export async function collectAeatConsultation(input: {
  readonly profile: AeatEditionProfile;
  readonly operationId: AeatOperationId;
  readonly context: FiscalContext;
  readonly query: Readonly<Record<string, string | number | boolean>>;
  readonly pagePort: ConsultationPagePort;
  readonly retention: ConsultationRetentionPort;
  readonly maximumPages: number;
  readonly maximumRecords: number;
  readonly maximumPageBytes: number;
}): Promise<ConsultationResult> {
  const operation = input?.profile
    ? operationProfile(input.profile, input.operationId)
    : null;
  const queryDigest = `sha256:${createHash("sha256")
    .update(JSON.stringify(canonical(input?.query ?? null)))
    .digest("hex")}`;
  const empty = (
    diagnostic: string,
    snapshotId: string | null = null,
    pageCount = 0,
    records: ConsultationPage["records"][number][] = [],
    pageDigests: string[] = [],
  ): ConsultationResult =>
    Object.freeze({
      status: "indeterminate",
      queryDigest,
      snapshotId,
      pageCount,
      records: Object.freeze(records),
      pageDigests: Object.freeze(pageDigests),
      diagnostic,
    });
  if (
    !input ||
    !operation ||
    operation.id !== "consultation" ||
    !verifyAeatEditionProfile(input.profile) ||
    createFiscalContext(input.context).status !== "ok" ||
    !input.query ||
    Object.keys(input.query).length > 32 ||
    Object.entries(input.query).some(
      ([key, value]) =>
        !/^[A-Za-z][A-Za-z0-9]{0,63}$/u.test(key) ||
        !["string", "number", "boolean"].includes(typeof value) ||
        (typeof value === "string" &&
          (value.length > 256 || /[\u0000-\u001f\u007f]/u.test(value))),
    ) ||
    !input.pagePort ||
    typeof input.pagePort.fetch !== "function" ||
    !input.retention ||
    typeof input.retention.retain !== "function" ||
    !Number.isSafeInteger(input.maximumPages) ||
    input.maximumPages < 1 ||
    input.maximumPages > 500 ||
    !Number.isSafeInteger(input.maximumRecords) ||
    input.maximumRecords < 1 ||
    input.maximumRecords > 100_000 ||
    !Number.isSafeInteger(input.maximumPageBytes) ||
    input.maximumPageBytes < 1 ||
    input.maximumPageBytes > operation.binding.maxResponseBytes
  )
    return empty("DIAG-AEAT-CONSULTATION-INPUT");
  const records: ConsultationPage["records"][number][] = [];
  const pageDigests: string[] = [];
  const cursors = new Set<string>();
  let cursor: string | null = null;
  let snapshotId: string | null = null;
  for (let pageNumber = 1; pageNumber <= input.maximumPages; pageNumber += 1) {
    let page: ConsultationPage;
    try {
      page = await input.pagePort.fetch({
        profile: input.profile,
        operationId: input.operationId,
        context: input.context,
        cursor,
        snapshotId,
      });
    } catch {
      return empty(
        "DIAG-AEAT-CONSULTATION-FETCH",
        snapshotId,
        pageNumber - 1,
        records,
        pageDigests,
      );
    }
    if (
      !page ||
      createFiscalContext(page.context).status !== "ok" ||
      !sameContext(page.context, input.context) ||
      page.editionDigest !== input.profile.digest ||
      page.queryDigest !== queryDigest ||
      !isSafeStoreToken(page.snapshotId) ||
      !(page.responseBytes instanceof Uint8Array) ||
      page.responseBytes.byteLength > input.maximumPageBytes ||
      !Array.isArray(page.records) ||
      page.records.length > input.maximumRecords - records.length ||
      (snapshotId !== null && page.snapshotId !== snapshotId) ||
      page.cursor !== cursor ||
      (page.nextCursor !== null &&
        (!isSafeStoreToken(page.nextCursor) || cursors.has(page.nextCursor))) ||
      typeof page.complete !== "boolean" ||
      (page.complete && page.nextCursor !== null) ||
      (!page.complete && page.nextCursor === null)
    )
      return empty(
        "DIAG-AEAT-CONSULTATION-PAGE",
        snapshotId,
        pageNumber - 1,
        records,
        pageDigests,
      );
    snapshotId ??= page.snapshotId;
    if (page.nextCursor) cursors.add(page.nextCursor);
    const safeRecords: ConsultationPage["records"][number][] = [];
    for (const item of page.records) {
      if (
        !item ||
        !Array.isArray(item.identity) ||
        item.identity.length === 0 ||
        item.identity.length > 8 ||
        (item.identity as readonly unknown[]).some(
          (part: unknown) => !isSafeStoreToken(part, 256),
        ) ||
        !/^sha256:[0-9a-f]{64}$/u.test(item.payloadDigest)
      )
        return empty(
          "DIAG-AEAT-CONSULTATION-RECORD",
          snapshotId,
          pageNumber - 1,
          records,
          pageDigests,
        );
      safeRecords.push(
        Object.freeze({
          identity: Object.freeze([...item.identity]),
          payloadDigest: item.payloadDigest,
        }),
      );
    }
    const exactPage: ConsultationPage = Object.freeze({
      ...page,
      context: Object.freeze({ ...page.context }),
      responseBytes: page.responseBytes.slice(),
      records: Object.freeze(safeRecords),
    });
    const pageDigest = sha256(exactPage.responseBytes);
    let retained = false;
    try {
      retained = await input.retention.retain({
        context: input.context,
        queryDigest,
        pageNumber,
        page: exactPage,
        pageDigest,
      });
    } catch {
      retained = false;
    }
    if (!retained)
      return empty(
        "DIAG-AEAT-CONSULTATION-RETENTION",
        snapshotId,
        pageNumber - 1,
        records,
        pageDigests,
      );
    pageDigests.push(pageDigest);
    records.push(...safeRecords);
    if (page.complete)
      return Object.freeze({
        status: "complete",
        queryDigest,
        snapshotId,
        pageCount: pageNumber,
        records: Object.freeze(records),
        pageDigests: Object.freeze(pageDigests),
        diagnostic: null,
      });
    cursor = page.nextCursor;
  }
  return empty(
    "DIAG-AEAT-CONSULTATION-PAGE-LIMIT",
    snapshotId,
    input.maximumPages,
    records,
    pageDigests,
  );
}

function canonical(value: unknown): unknown {
  return Array.isArray(value)
    ? value.map(canonical)
    : value && typeof value === "object"
      ? Object.fromEntries(
          Object.keys(value)
            .sort()
            .map((key) => [
              key,
              canonical((value as Record<string, unknown>)[key]),
            ]),
        )
      : value;
}
