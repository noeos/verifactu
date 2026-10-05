import { createHash } from "node:crypto";
import { createFiscalInstant } from "../domain/date-time.js";
import { isSafeStoreToken } from "../persistence/model.js";

export type SafeOperationalCategory =
  | "outbox-backlog"
  | "retry-wait"
  | "reconciliation"
  | "transport-phase"
  | "response-size"
  | "unknown-response"
  | "correlation-failure"
  | "lease-conflict"
  | "provider-availability"
  | "certificate-expiry"
  | "clock-anomaly";

export interface SafeOperationalEvent {
  readonly schemaVersion: 1;
  readonly eventId: string;
  readonly category: SafeOperationalCategory;
  readonly code: string;
  readonly occurredAt: string;
  readonly count: number;
  readonly durationMs: number | null;
  readonly bytes: number | null;
}

const categories = new Set<SafeOperationalCategory>([
  "outbox-backlog",
  "retry-wait",
  "reconciliation",
  "transport-phase",
  "response-size",
  "unknown-response",
  "correlation-failure",
  "lease-conflict",
  "provider-availability",
  "certificate-expiry",
  "clock-anomaly",
]);
const codes = new Set([
  "DIAG-OUTBOX-AGE",
  "DIAG-RETRY-QUEUED",
  "DIAG-RECONCILIATION-REQUIRED",
  "DIAG-TRANSPORT-PHASE",
  "DIAG-RESPONSE-SIZE",
  "DIAG-RESPONSE-UNKNOWN",
  "DIAG-CORRELATION-FAILED",
  "DIAG-LEASE-CONFLICT",
  "DIAG-PROVIDER-UNAVAILABLE",
  "DIAG-CERTIFICATE-EXPIRING",
  "DIAG-CLOCK-ANOMALY",
]);

export function createSafeOperationalEvent(input: {
  readonly eventId: string;
  readonly category: SafeOperationalCategory;
  readonly code: string;
  readonly occurredAt: string;
  readonly count?: number;
  readonly durationMs?: number | null;
  readonly bytes?: number | null;
}): SafeOperationalEvent | null {
  if (
    !input ||
    !isSafeStoreToken(input.eventId) ||
    !categories.has(input.category) ||
    !codes.has(input.code) ||
    createFiscalInstant(input.occurredAt).status !== "ok" ||
    !Number.isSafeInteger(input.count ?? 1) ||
    (input.count ?? 1) < 0 ||
    (input.count ?? 1) > 1_000_000_000 ||
    (input.durationMs != null &&
      (!Number.isFinite(input.durationMs) ||
        input.durationMs < 0 ||
        input.durationMs > 86_400_000)) ||
    (input.bytes != null &&
      (!Number.isSafeInteger(input.bytes) ||
        input.bytes < 0 ||
        input.bytes > 1_073_741_824)) ||
    (input.category === "certificate-expiry" &&
      input.code !== "DIAG-CERTIFICATE-EXPIRING") ||
    /taxpayer|invoice|record|certificate|subject|payload|url|endpoint|name|email|phone|token/i.test(
      input.eventId,
    )
  )
    return null;
  return Object.freeze({
    schemaVersion: 1,
    eventId: input.eventId,
    category: input.category,
    code: input.code,
    occurredAt: input.occurredAt,
    count: input.count ?? 1,
    durationMs: input.durationMs ?? null,
    bytes: input.bytes ?? null,
  });
}

export interface SafeTelemetryPort {
  emit(event: SafeOperationalEvent): Promise<boolean>;
}

/** Exporter failures are deliberately non-fatal to fiscal operations. */
export async function emitSafeOperationalEvent(
  port: SafeTelemetryPort,
  event: SafeOperationalEvent,
): Promise<boolean> {
  if (
    !port ||
    typeof port.emit !== "function" ||
    !event ||
    !categories.has(event.category) ||
    !codes.has(event.code)
  )
    return false;
  try {
    return (await port.emit(Object.freeze({ ...event }))) === true;
  } catch {
    return false;
  }
}

export function opaqueIncidentReference(seed: Uint8Array): string {
  return `inc-${createHash("sha256").update(seed).digest("hex").slice(0, 24)}`;
}
