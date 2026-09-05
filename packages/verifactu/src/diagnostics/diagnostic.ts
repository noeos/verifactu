// SPDX-License-Identifier: Apache-2.0

export const VERIFACTU_DIAGNOSTIC_SCHEMA = "urn:noeos:verifactu:diagnostic:1" as const;

export type DiagnosticSeverity = "error" | "warning" | "info";
export type DiagnosticPhase =
  | "input"
  | "applicability"
  | "record"
  | "catalog"
  | "fingerprint"
  | "chain"
  | "evidence"
  | "limits"
  | "security"
  | "compatibility"
  | "state"
  | "transport";

export type DiagnosticCode =
  | "VF_INPUT_REQUIRED"
  | "VF_INPUT_TYPE_INVALID"
  | "VF_INPUT_PROPERTY_UNKNOWN"
  | "VF_INPUT_PROPERTY_MISSING"
  | "VF_INPUT_VALUE_INVALID"
  | "VF_INPUT_LIMIT_EXCEEDED"
  | "VF_INPUT_ABORTED"
  | "VF_APPLICABILITY_FACT_MISSING"
  | "VF_APPLICABILITY_EXCLUDED"
  | "VF_RECORD_RULE_FAILED"
  | "VF_RECORD_EXTERNAL_FACT_MISSING"
  | "VF_RECORD_TOTAL_MISMATCH"
  | "VF_RECORD_TOTAL_CHECK_NOT_APPLICABLE"
  | "VF_CATALOG_VALUE_UNKNOWN"
  | "VF_FINGERPRINT_FORMAT_INVALID"
  | "VF_FINGERPRINT_MISMATCH"
  | "VF_CHAIN_REFERENCE_INVALID"
  | "VF_EVIDENCE_INPUT_INVALID"
  | "VF_EVIDENCE_ENGINE_REJECTED"
  | "VF_EVIDENCE_MISMATCH"
  | "VF_DIAGNOSTICS_TRUNCATED"
  | "VF_EDITION_UNKNOWN"
  | "VF_XML_MALFORMED"
  | "VF_XML_UNSAFE"
  | "VF_XML_LIMIT_EXCEEDED"
  | "VF_XML_SCHEMA_INVALID"
  | "VF_QR_INPUT_INVALID"
  | "VF_QR_UNSUPPORTED"
  | "VF_CERTIFICATE_INVALID"
  | "VF_CERTIFICATE_UNTRUSTED"
  | "VF_SIGNATURE_INVALID"
  | "VF_SIGNATURE_UNAVAILABLE"
  | "VF_STATE_TRANSITION_INVALID"
  | "VF_STATE_CONFLICT"
  | "VF_STATE_ROLLBACK_DETECTED"
  | "VF_OUTBOX_LEASE_INVALID"
  | "VF_OUTBOX_DUPLICATE"
  | "VF_OUTBOX_LIMIT_EXCEEDED"
  | "VF_TRANSPORT_ENDPOINT_INVALID"
  | "VF_TRANSPORT_TIMEOUT"
  | "VF_TRANSPORT_TLS_INVALID"
  | "VF_TRANSPORT_RESPONSE_INVALID"
  | "VF_AEAT_CODE_UNKNOWN"
  | "VF_AEAT_RESPONSE_PARTIAL"
  | "VF_AEAT_INDETERMINATE"
  | "VF_RETRY_POLICY_EXHAUSTED";

export type DiagnosticDetail = string | number | boolean | null;

export interface Diagnostic {
  readonly $schema: typeof VERIFACTU_DIAGNOSTIC_SCHEMA;
  readonly code: DiagnosticCode;
  readonly severity: DiagnosticSeverity;
  readonly phase: DiagnosticPhase;
  readonly messageKey: string;
  readonly path?: string;
  readonly ruleId?: string;
  readonly officialCode?: string;
  readonly engineCode?: string;
  readonly details?: Readonly<Record<string, DiagnosticDetail>>;
}

export interface DiagnosticInput {
  readonly code: DiagnosticCode;
  readonly severity: DiagnosticSeverity;
  readonly phase: DiagnosticPhase;
  readonly path?: string;
  readonly ruleId?: string;
  readonly officialCode?: string;
  readonly engineCode?: string;
  readonly details?: Readonly<Record<string, DiagnosticDetail>>;
}

const PHASE_ORDER: Readonly<Record<DiagnosticPhase, number>> = Object.freeze({
  input: 0,
  applicability: 1,
  record: 2,
  catalog: 3,
  fingerprint: 4,
  chain: 5,
  evidence: 6,
  limits: 7,
  security: 8,
  compatibility: 9,
  state: 10,
  transport: 11,
});

export function createDiagnostic(input: DiagnosticInput): Diagnostic {
  return Object.freeze({
    $schema: VERIFACTU_DIAGNOSTIC_SCHEMA,
    code: input.code,
    severity: input.severity,
    phase: input.phase,
    messageKey: `verifactu.${input.code}`,
    ...(input.path === undefined ? {} : { path: input.path }),
    ...(input.ruleId === undefined ? {} : { ruleId: input.ruleId }),
    ...(input.officialCode === undefined ? {} : { officialCode: input.officialCode }),
    ...(input.engineCode === undefined ? {} : { engineCode: input.engineCode }),
    ...(input.details === undefined ? {} : { details: Object.freeze({ ...input.details }) }),
  });
}

export function orderDiagnostics(values: readonly Diagnostic[]): readonly Diagnostic[] {
  return Object.freeze(
    [...values].sort(
      (left, right) =>
        PHASE_ORDER[left.phase] - PHASE_ORDER[right.phase] ||
        compare(left.ruleId, right.ruleId) ||
        compare(left.path, right.path) ||
        compare(left.code, right.code),
    ),
  );
}

function compare(left: string | undefined, right: string | undefined): number {
  const leftValue = left ?? "";
  const rightValue = right ?? "";
  return leftValue < rightValue ? -1 : leftValue > rightValue ? 1 : 0;
}
