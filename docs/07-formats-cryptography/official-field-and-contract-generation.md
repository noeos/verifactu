---
id: CRYPTO-DOC-0001
title: Official field and contract generation
status: approved
authority: normative
owner: regulatory-owner
created: 2026-09-12
last-reviewed: 2026-09-16
decisions: [ADR-0018]
sources: [SRC-0018, SRC-0019, SRC-0020, SRC-0021]
historical-inputs: [REV-001, REV-008, REV-037, REV-039]
---

# Official field and contract generation

Each edition manifest closes the XSD/WSDL/import/include graph and pins every
byte. The generator produces structural field paths, namespaces, cardinality,
order, lexical facets, choice groups, service/operation/binding metadata and
source locations. It rejects unresolved imports, duplicate identities, remote
resolution, unsupported schema constructs and nondeterministic output.

The semantic overlay records one sourced rule per applicability predicate,
cross-field condition, catalogue, temporal rule, AEAT validation/error and
legal obligation not expressible in XSD. Structural and semantic coverage are
reported separately; neither may claim the other.

Generated output carries exact snapshot, source-manifest and source-closure
digests, generator artifact digest, runtime/configuration and output manifest.
The canonical primary runtime is a schema-validated configuration input, never
ambient `process.version`; supported Node 22 and primary Node 24 executions must
therefore reproduce the same checked-in bytes. Two clean runs must be
byte-identical.
Edition diff classifies additions, removals, facet/order/namespace/binding and
rule changes, then maps impact to domain, contracts, migrations and vectors.

## Implementation status

P3 implements the deterministic generator at
`tooling/regulatory/generate-contracts.mjs` and the independent Python
challenge path at `internal/independent-oracles/oracle.py`. It emits a staged
public envelope, field-constraint and catalogue files, SOAP-binding discovery,
source/generator digests and a blocked-candidate report from the immutable
snapshot. Generation is network-denied and repeatable; missing linked payloads
are retained as unresolved rather than silently converted into fiscal fields.
The generated output therefore proves custody and drift controls, not fiscal
semantics or AEAT acceptance.
