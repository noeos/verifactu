import { invalid, ok, type Result } from "../contracts/results.js";
import type { FiscalContext } from "./context.js";
import { sameContext } from "./context.js";
import {
  identityKey,
  sameIdentity,
  type FiscalDocumentIdentity,
} from "./identities.js";

export type CorrectionKind = "correction" | "substitution";
export interface CorrectionRelation {
  readonly kind: CorrectionKind;
  readonly context: FiscalContext;
  readonly source: FiscalDocumentIdentity;
  readonly target: FiscalDocumentIdentity;
  readonly evidenceId: string;
}
export interface CorrectionGraph {
  readonly relations: readonly CorrectionRelation[];
}
export function addCorrection(
  graph: CorrectionGraph,
  relation: CorrectionRelation,
): Result<CorrectionGraph> {
  if (
    !sameIdentity(relation.source.issuer, relation.context.taxpayerId) ||
    !sameIdentity(relation.target.issuer, relation.context.taxpayerId)
  )
    return invalid("DIAG-CORRECTION-CONTEXT", "domain");
  if (graph.relations.length >= 100_000)
    return invalid("DIAG-CORRECTION-LIMIT", "domain");
  const source = docKey(relation.source);
  const target = docKey(relation.target);
  if (
    graph.relations.some((edge) => !sameContext(edge.context, relation.context))
  )
    return invalid("DIAG-CORRECTION-CONTEXT", "domain");
  if (
    source === target ||
    !relation.evidenceId ||
    graph.relations.some(
      (edge) => docKey(edge.source) === source && edge.kind === relation.kind,
    )
  )
    return invalid("DIAG-CORRECTION-CONFLICT", "domain");
  const edges = [
    ...graph.relations,
    Object.freeze({
      ...relation,
      context: Object.freeze({ ...relation.context }),
      source: Object.freeze({ ...relation.source }),
      target: Object.freeze({ ...relation.target }),
    }),
  ];
  if (hasCycle(edges)) return invalid("DIAG-CORRECTION-CYCLE", "domain");
  return ok(Object.freeze({ relations: Object.freeze(edges) }));
}
const docKey = (d: FiscalDocumentIdentity): string =>
  identityKey([d.issuer, d.series, d.number, d.issueDate]);
function hasCycle(edges: readonly CorrectionRelation[]): boolean {
  const next = new Map<string, string[]>();
  const incoming = new Map<string, number>();
  for (const e of edges) {
    const source = docKey(e.source);
    const target = docKey(e.target);
    next.set(source, [...(next.get(source) ?? []), target]);
    incoming.set(source, incoming.get(source) ?? 0);
    incoming.set(target, (incoming.get(target) ?? 0) + 1);
  }
  const ready = [...incoming]
    .filter(([, count]) => count === 0)
    .map(([node]) => node);
  let visited = 0;
  while (ready.length > 0) {
    const node = ready.pop()!;
    visited += 1;
    for (const target of next.get(node) ?? []) {
      const count = (incoming.get(target) ?? 0) - 1;
      incoming.set(target, count);
      if (count === 0) ready.push(target);
    }
  }
  return visited !== incoming.size;
}
