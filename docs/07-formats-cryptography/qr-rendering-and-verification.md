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
permitted by the edition. The renderer fixes error correction, symbol/version selection policy, module
scale, colors/contrast, raster dimensions and deterministic metadata. It emits a
30–40 mm symbol with at least a 2 mm quiet zone on each side, represented in SVG
physical dimensions and PNG pHYs density. It cannot truncate or replace content
to fit.

SVG output contains only static geometry and a static accessible title: no
script, external resource, event handler, foreign object or attacker-controlled
markup. PNG uses bounded dimensions/pixels and deterministic stored-deflate
encoding without timestamps or metadata beyond physical pixel density. The
visible “QR tributario:” label is returned separately; “VERI\*FACTU” is an
optional second line in VeriFactu mode. The host owns placement and invoice
layout; an image alone does not prove invoice placement or print quality.

Verification decodes the rendered artifact with the independent, test-only
`qr@0.7.0` (`qr/decode.js`) candidate and compares exact payload bytes; it may not
call the production encoder to decode its own output. Exact integrity, licence,
transitive graph and vulnerability admission must pass before use. The decoder
shares ZXing algorithm lineage, so independence is at the package and
implementation boundary, not the algorithm-family level. The corpus
covers supported sizes, print/scan, rotation, scaling, compression and bounded
degradation, while pristine output must decode in all required independent
readers. Input bytes, dimensions, pixels, CPU time and memory are bounded by the
frozen P4 quality plan before allocation or decode. Payload validity, image
decodability, invoice placement and rendering quality remain separate claims.
