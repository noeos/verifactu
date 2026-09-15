---
id: CRYPTO-DOC-0001
title: Official field and contract generation
status: approved
authority: normative
owner: regulatory-owner
created: 2026-09-12
last-reviewed: 2026-09-15
decisions: [ADR-0018, ADR-0054]
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
Two clean runs must be byte-identical.
Edition diff classifies additions, removals, facet/order/namespace/binding and
rule changes, then maps impact to domain, contracts, migrations and vectors.

## P3 generated surface

The generator in `internal/contract-generation/` authenticates all source bytes,
parses them offline with fixed resource budgets and requires an exact supported
construct set. Thirteen imports must match the custody dependency graph and
target namespaces; absolute resolution is restricted to the digest-pinned W3C
XMLDSig alias. Relative resolution cannot leave `sources/technical`.

The hostile-input suite exercises 20 positive, negative and resource-boundary
cases. It includes DTD/entity/XInclude/processing-instruction rejection,
duplicate expanded attributes, malformed references and QNames, invalid XML 1.0
characters, reserved namespaces, non-XML whitespace and every configured size,
depth, node, attribute and text limit.

The candidate contains a normalized lossless structural graph, expanded QName
bindings, field/cardinality/choice/facet records, 45 catalogue views and complete
WSDL message/port type/binding/operation/service/port/address metadata.
Documentation prose is represented by normalized byte length and digest rather
than copied as semantics. Six closed public JSON Schemas validate the contract
bundle, edition descriptor, schema graph, fields, catalogues and SOAP bindings;
negative vectors prove that unexpected nested members are rejected. They do not
purport to validate fiscal domain input.

`generate:checked-in` regenerates all thirteen derived files in memory and compares
raw bytes and exact file sets. A second generation in the contract suite must be
byte-identical. Changed source bytes, source-manifest metadata or source closure;
unknown constructs; remote/traversing/missing imports; namespace mismatch; and
non-allowlisted DTD each fail for a stable reason. The unavailable semantic
overlay remains named and blocks fiscal creation.
