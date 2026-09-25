---
id: CRYPTO-DOC-0013
title: QR rendering and verification
status: approved
authority: normative
owner: api-owner
created: 2026-09-12
last-reviewed: 2026-09-24
sources: [SRC-0025]
historical-inputs: [REV-045]
decisions: [ADR-0021, ADR-0056]
---

# QR rendering and verification

Rendering consumes only canonical QR payload bytes and explicit output options
permitted by the edition. The contract fixes error correction, symbol/version
selection policy, quiet zone, module scale, colors/contrast, raster dimensions,
SVG viewBox and deterministic metadata. It cannot truncate or replace content
to fit.

SVG output contains only static geometry and declared accessibility text: no
script, external resource, event handler, foreign object or attacker-controlled
markup. PNG has bounded dimensions/pixels and deterministic encoding policy.
The visible VERI*FACTU/QR legend is a separate layout requirement returned to
the host; an image alone does not prove invoice placement or print quality.

Verification decodes the rendered artifact with the independent, test-only
`@zxing/library@0.23.0` candidate and compares exact payload bytes; it may not
call the production encoder to decode its own output. Exact integrity, licence,
transitive graph and vulnerability admission must pass before use. The corpus
covers supported sizes, print/scan, rotation, scaling, compression and bounded
degradation, while pristine output must decode in all required independent
readers. Input bytes, dimensions, pixels, CPU time and memory are bounded by the
frozen P4 quality plan before allocation or decode. Payload validity, image
decodability, invoice placement and rendering quality remain separate claims.
