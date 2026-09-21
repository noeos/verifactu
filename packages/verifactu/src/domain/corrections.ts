import {
  failed,
  succeeded,
  type OperationResult,
} from "../contracts/results.js";
import type { FiscalInstant } from "./date-time.js";
import { diagnostic } from "./diagnostics.js";
import type {
  EditionId,
  EvidenceId,
  InstallationId,
  PrincipalId,
  RecordId,
  TaxpayerId,
  TenantId,
} from "./identities.js";
import type { ExactDecimal } from "./decimal.js";
import type { FiscalDate } from "./date-time.js";
import type { FiscalDocumentIdentity, Presence } from "./records.js";

export interface CorrectionEntry {
  readonly sequence: number;
  readonly recordId: RecordId;
  readonly correctedAt: FiscalInstant;
  readonly correctedBy: PrincipalId;
  readonly reason: string;
}

export type CorrectionHistory = readonly CorrectionEntry[];

export function appendCorrection(
  history: CorrectionHistory,
  entry: CorrectionEntry,
): OperationResult<CorrectionHistory> {
  if (entry.sequence !== history.length + 1 || entry.reason.length === 0) {
    return failed("conflict", [
      diagnostic(
        "DIAG-CORRECTION-SEQUENCE",
        "conflict",
        "state",
        "/corrections",
        {
          expected: history.length + 1,
          actual: entry.sequence,
        },
      ),
    ]);
  }
  return succeeded(Object.freeze([...history, Object.freeze({ ...entry })]));
}

export type CorrectionRelationshipKind =
  | "correction"
  | "substitution"
  | "cancellation";

export interface RelationshipContext {
  readonly tenantId: TenantId;
  readonly taxpayerId: TaxpayerId;
  readonly installationId: InstallationId;
  readonly editionId: EditionId;
}

export interface CorrectionRelationship {
  readonly kind: CorrectionRelationshipKind;
  readonly context: RelationshipContext;
  readonly source: FiscalDocumentIdentity;
  readonly target: FiscalDocumentIdentity;
  readonly affectedPeriod: Presence<
    Readonly<{ readonly from: FiscalDate; readonly through: FiscalDate }>
  >;
  readonly affectedAmount: Presence<ExactDecimal>;
  readonly evidenceIds: readonly EvidenceId[];
}

export interface CorrectionGraph {
  readonly relationships: readonly CorrectionRelationship[];
}

export function appendCorrectionRelationship(
  graph: CorrectionGraph,
  relationship: CorrectionRelationship,
  supportedKinds: readonly CorrectionRelationshipKind[],
): OperationResult<CorrectionGraph> {
  if (!supportedKinds.includes(relationship.kind))
    return relationshipFailure("DIAG-CORRECTION-KIND", "edition");
  if (documentKey(relationship.source) === documentKey(relationship.target))
    return relationshipFailure("DIAG-CORRECTION-SELF", "domain");
  if (
    relationship.source.issuerTaxpayerId !== relationship.context.taxpayerId ||
    relationship.target.issuerTaxpayerId !== relationship.context.taxpayerId
  )
    return relationshipFailure("DIAG-CORRECTION-CONTEXT", "domain");
  if (relationship.evidenceIds.length === 0)
    return relationshipFailure("DIAG-CORRECTION-EVIDENCE", "domain");
  if (
    graph.relationships.some(
      (edge) =>
        documentKey(edge.source) === documentKey(relationship.source) &&
        documentKey(edge.target) !== documentKey(relationship.target) &&
        edge.kind === relationship.kind,
    )
  )
    return relationshipFailure("DIAG-CORRECTION-AMBIGUOUS", "state");
  const relationships = [...graph.relationships, deepFreeze(relationship)];
  if (containsCycle(relationships))
    return relationshipFailure("DIAG-CORRECTION-CYCLE", "state");
  return succeeded(deepFreeze({ relationships }));
}

export function correctionLineage(
  graph: CorrectionGraph,
  identity: FiscalDocumentIdentity,
): readonly CorrectionRelationship[] {
  const key = documentKey(identity);
  return Object.freeze(
    graph.relationships.filter(
      (edge) =>
        documentKey(edge.source) === key || documentKey(edge.target) === key,
    ),
  );
}

function containsCycle(
  relationships: readonly CorrectionRelationship[],
): boolean {
  const outgoing = new Map<string, string[]>();
  for (const edge of relationships) {
    const source = documentKey(edge.source);
    const targets = outgoing.get(source) ?? [];
    targets.push(documentKey(edge.target));
    outgoing.set(source, targets);
  }
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const visit = (node: string): boolean => {
    if (visiting.has(node)) return true;
    if (visited.has(node)) return false;
    visiting.add(node);
    for (const target of outgoing.get(node) ?? [])
      if (visit(target)) return true;
    visiting.delete(node);
    visited.add(node);
    return false;
  };
  return [...outgoing.keys()].some(visit);
}

function documentKey(identity: FiscalDocumentIdentity): string {
  return `${identity.issuerTaxpayerId}\u0000${identity.series}\u0000${identity.number}\u0000${identity.issuedOn}`;
}

function relationshipFailure(
  code: `DIAG-CORRECTION-${string}`,
  stage: "domain" | "edition" | "state",
): OperationResult<CorrectionGraph> {
  return failed("conflict", [
    diagnostic(code, "conflict", stage, "/correctionGraph"),
  ]);
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}
