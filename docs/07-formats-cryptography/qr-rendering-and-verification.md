---
id: CRYPTO-DOC-0013
title: QR rendering and verification
status: approved
authority: normative
owner: api-owner
created: 2026-09-12
last-reviewed: 2026-09-12
sources: [SRC-0025]
historical-inputs: [REV-045]
---

# QR rendering and verification

Rendering consumes only canonical QR payload bytes and explicit output options
permitted by the edition. The contract fixes error correction, symbol/version
selection policy, quiet zone, module scale, colors/contrast, raster dimensions,
SVG viewBox and deterministic metadata. It cannot truncate or replace content
to fit.

The AEAT matrix itself is rendered at 32 × 32 mm, within the required 30–40 mm
range; its quiet zone is outside that matrix and at least 2 mm per side. The
complete SVG remains at most 40 × 40 mm. If a payload/version cannot satisfy
all three bounds, rendering returns a limit outcome rather than shrinking the
symbol or quiet zone.

SVG output contains only static geometry and declared accessibility text: no
script, external resource, event handler, foreign object or attacker-controlled
markup. This package emits SVG only; rasterization and PNG output are a host
concern and must enforce their own pixel bounds. The visible VERI\*FACTU/QR
legend is a separate layout requirement returned to the host; an image alone
does not prove invoice placement or print quality.

Verification reconstructs pixels from the closed SVG geometry, decodes the
rendered artifact with an independent scanner and compares exact payload text.
The scanner is an exact-version development-only dependency, excluded from the
published VeriFactu package; optional decoder fallback code remains omitted by
the repository installation profile.
The executable corpus covers supported sizes, 90-degree rotation, 2× scaling,
lossless compression/decompression and five-module bounded degradation.
Pristine output must decode in all required independent readers. Real printer,
paper, camera, grayscale and optical scan behavior remain external validation;
payload validity and rendering quality are separate claims.
