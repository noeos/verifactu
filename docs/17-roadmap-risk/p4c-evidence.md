---
id: P4C-EVIDENCE
title: P4-C hardened XML and offline XSD evidence
status: active
authority: informative
owner: quality-owner
created: 2026-09-22
last-reviewed: 2026-09-22
dependencies: [P4-QUALITY-PLAN-0001, P4B-EVIDENCE]
---

# P4-C hardened XML and offline XSD evidence

P4-C adds a pure, typed XML infoset model and deterministic UTF-8 serializer,
then validates bytes through a bounded isolated lxml worker. The public model
cannot represent raw markup. The provider accepts only a caller-supplied,
digest-verified in-memory schema closure and never uses a filesystem, network
or ambient key/clock/random state.

## Security and validation boundary

| Decision | Enforced consequence |
| --- | --- |
| Expanded names and explicit bindings only | Duplicate attributes, unbound or reserved prefixes, namespace conflicts, illegal names/characters and unsafe comments are invalid. |
| One serializer representation | Declaration, UTF-8, namespace position, sorted expanded attributes, quotes, escaping and empty-element form are fixed. |
| Closed schema resolver | Every imported URI must be one of the supplied aliases; unknown file/network references fail closed and are never resolved externally. |
| Legacy XMLDSIG compatibility is narrow | The official XMLDSIG schema's legacy internal DTD is stripped only after its fixed source digest matches the pinned snapshot. Arbitrary schema and instance DTD/entities remain denied. |
| Bounded isolated execution | Input/schema bytes, depth, nodes, attributes, namespace declarations, text, worker output and wall deadline are bounded before or during validation. |
| Result separation | XSD status, semantic status and provider status are distinct. A provider fault, cancellation, limit or unavailable engine never claims XSD validity. |

## Vectors and independent oracle

The checked-in positive vector is a minimal synthetic record that conforms to
the pinned `SuministroLR`, `SuministroInformacion` and XMLDSIG schema closure;
it makes no fiscal or AEAT-success claim. A minimal `TipoFactura` facet mutation
is rejected by the production lxml backend.

The independent oracle uses `xmlschema`/`elementpath`, the Python standard
library XML parser and no TypeScript production or lxml import. It creates a
temporary local-only closure, verifies the pinned XMLDSIG source digest before
removing its legacy DTD declaration, and checks the positive fixture plus
facet, cardinality, namespace, order and type failures. Its sandbox rejects
remote resolution and records zero loader warnings.

## Executable assurance

`p4c:assurance` is the cumulative quality task and `gate:p4c` is the required
quality gate.

- P4-C adds typed model, contract, integration and resource/security tests.
- `P4-PROP-010` executes 4,096 serializer/parser round trips with zero
  discards; `P4-FUZZ-002` and `P4-FUZZ-003` each execute 4,096 bounded XML/XSD
  cases.
- `P4-MUT-023` through `P4-MUT-025` seed removal of forbidden-markup denial,
  XML byte limits and XSD/semantic separation; all are killed.
- The coverage and whole-production mutation scripts extend the existing
  compiled package campaign to `ports/xml-xsd.ts` and both isolated provider
  modules. They preserve the declared 98/98/95/98 global coverage and 95%
  whole-population mutation thresholds.
- The independent oracle executes 17 checks: nine existing fingerprint checks,
  six XML/XSD vectors, sandboxed closure loading and a standard-library XML
  infoset round trip.

Canonical task reports bind these measurements to the tested commit and tree.
Dirty-tree reports are diagnostic only; protected final-head CI is the
admissible evidence.

## Claim boundary

| Claim | Evidence | Not claimed |
| --- | --- | --- |
| The admitted closure can validate the pinned synthetic vector offline | Production lxml result and independent xmlschema result agree | External AEAT acceptance, submission or activation of the candidate edition |
| Hostile XML resource paths fail closed | DTD/entity/XInclude/resolver/limit/cancellation tests and critical mutations | That all XML implementations have identical behaviour |
| XML bytes are deterministic for the supported infoset | Model unit/property tests and independent standard-library round trip | General XML canonicalization or signature verification, which is P4-D |
