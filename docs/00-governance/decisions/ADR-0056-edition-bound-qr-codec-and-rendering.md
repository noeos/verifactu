---
id: ADR-0056
title: Edition-bound QR codec and independent rendering verification
status: accepted
authority: decision
owner: architecture-owner
created: 2026-09-24
last-reviewed: 2026-09-24
dependencies: [ADR-0009, ADR-0018, ADR-0021, ADR-0034, ADR-0038]
sources: [SRC-0014, SRC-0015, SRC-0025]
historical-inputs: [REV-045, REV-046, REV-062]
---

# ADR-0056: Edition-bound QR codec and independent rendering verification

## Question and context

P4-E needs to construct and render the exact QR content required by each
immutable regulatory edition and mode, then show that the rendered symbol can
be read independently. Payload semantics, image encoding and invoice layout
are different responsibilities and claims.

## Decision criteria

The selected edition is authoritative for fields, URL, order, lexical forms,
encoding, maximum payload, legend and any required symbol parameters. Output
must be deterministic, bounded, privacy-safe, independently decodable and must
never truncate or rewrite official content.

## Options considered

- Handwrite QR matrix generation: rejected due to avoidable standards and
  algorithmic implementation risk.
- Use one library to encode and decode its own output as conformance proof:
  rejected because a shared implementation defect would be invisible.
- Use an admitted pinned encoder behind a private port and an independent
  decoder only in verification: selected.

## Decision

The implementation candidate is `@nuintun/qrcode@5.0.3` for matrix encoding;
`@zxing/library@0.23.0` is a test-only independent decode oracle and must not
enter the public runtime dependency graph. ZXing's package is marked as
maintenance-only, so it is a candidate rather than an unconditional selection:
before admission, compare currently maintained independent readers and record
why the selected oracle remains appropriate. Both candidates require fresh exact
integrity, licence, transitive graph, vulnerability and package-admission checks
before implementation; changing either candidate requires a decision update.

The pure payload codec binds edition, mode/environment, exact ordered fields,
UTF-8/percent encoding, length and visible legend to the pinned source data.
The renderer accepts only those canonical bytes and explicit permitted output
options. It has no arbitrary URL, locale formatting, fallback truncation,
undocumented correction-level override or dynamic content. Resource bounds are
enforced before decode/render: payload bytes and symbol version follow the
edition, while raster bytes/pixels, dimensions, CPU time and memory use the
approved P4 quality plan. Boundary overflow fails with a stable diagnostic.

Payload validity, rendered-symbol decoding, visual layout/print quality and
fiscal/regulatory validity remain separate claims. The host owns placement in a
complete invoice; a valid QR image alone proves neither placement nor invoice
conformance.

## Consequences and residual risks

Pinned dependencies reduce handwritten algorithm surface but add supply-chain,
licence and maintenance risk. A decoder oracle is not a legal interpretation of
the QR specification. Exact content and all size/encoding limits still come
only from the selected immutable edition, never from a library default.

## Verification

P4-E must compare exact official payload bytes, render boundaries and sizes,
decode every pristine rendered vector with the independent oracle, and exercise
property/shrinking, fuzzing, malformed/damaged images, rotation/scaling and
resource-limit failures. Independent official and implementation-independent
vectors must not call the production codec or renderer.

## Migration and reversal

Encoder or decoder upgrades require new admission evidence, regenerated exact
vectors, full consumer and compatibility tests, and impact review. A format or
limit change requires a new immutable edition or successor decision; old bytes
are never silently rewritten.
