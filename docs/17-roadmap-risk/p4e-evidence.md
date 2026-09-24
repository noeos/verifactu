---
id: P4E-EVIDENCE
title: P4-E QR content, rendering and independent decoding evidence
status: active
authority: informative
owner: quality-owner
created: 2026-09-23
last-reviewed: 2026-09-23
dependencies: [P4-QUALITY-PLAN-0001, P4C-EVIDENCE]
sources: [SRC-0025, SRC-0089]
---

# P4-E QR content, rendering and independent decoding evidence

## Scope and claim boundary

P4-E accepts only QR profile `aeat.qr@0.5.0` for edition
`rrsif-2026-09-21-authoritative-candidate`; the canonical URL is bound to that
edition, environment and operating mode. It encodes the four required fields in fixed order, preserves
UTF-8 bytes, returns the edition/profile identity and required visible labels,
renders a deterministic static SVG at error-correction level M, and checks the
matrix with an independent ZXing decoder. This is implementation evidence; it
does not claim that AEAT accepted a particular invoice or that a printed page
has been positioned or scanned in the field.

The QR profile follows AEAT specification 0.5.0 for endpoint, parameter order,
ASCII invoice number, date and amount bounds. The QR document describes amount
as numeric with up to 12 integer and 2 fractional digits but does not spell out
the sign. AEAT's official procedures FAQ documents rectification invoice totals
that are negative. Accordingly, this profile preserves a leading minus sign
and applies digit limits to the magnitude; this is recorded as an explicit
profile interpretation, not as a verbatim QR-PDF rule.

## Rendering geometry and resource limits

The QR matrix is fixed at 32 × 32 mm. A quiet zone of at least 2 mm is added
outside the matrix, while the overall SVG remains within 40 × 40 mm. Payloads
or symbol versions unable to meet both dimensions return a limit outcome; they
are not truncated or silently rescaled below the minimum. Payload bytes are
bounded at 512, input must be printable ASCII after strict UTF-8 decoding, and
the static SVG contains no script, reference, event handler or foreign object.

## Executable evidence

- `P4-PROP-011`: 4,096 encode/decode/rebuild cases, including signed and
  unsigned values, printable reserved characters, calendar boundaries, both
  environments and both modes; zero discards.
- `P4-FUZZ-005`: 4,096 deterministic bounded byte inputs; no uncaught provider
  exception. Over-limit, malformed UTF-8/ASCII and geometry-limit outcomes are
  distinguished.
- Independent ZXing decoding reconstructs from the emitted SVG paths and
  confirms exact URL text, including a negative-total case. Rotated, 2× scaled,
  gzip/restored and five-module-degraded matrices remain decodable.
- `P4-MUT-030` swaps the mode endpoints; `P4-MUT-031` removes canonical-text
  enforcement. Both are killed by the focused payload tests (2/2).
- Three local cumulative coverage runs pass the declared thresholds: P4-A/B
  99.32% statements/lines, 95.95% branches and 100% functions; P4-C 99.01%,
  95.67% and 100%, respectively.
- The cumulative mutation run kills 1,210/1,228 mutants (98.53%), with zero
  compile errors, test errors or timeouts. All 18 survivors are in the
  pre-existing XML provider/worker population; none are in QR production code.
- These runs are dirty-tree diagnostic evidence only. Protected final-head CI
  must repeat and bind the evidence before merge.

## Remaining external claims

AEAT endpoint acceptance for signed QR amount syntax should be exercised only
through an authorized, controlled test environment. The official sources prove
negative invoice totals exist but do not explicitly demonstrate that exact
signed lexical form in a QR URL. Real printer layout, grayscale contrast,
scanner diversity and print/scan degradation remain external validation items.
