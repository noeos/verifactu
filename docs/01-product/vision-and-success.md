---
id: PROD-DOC-0001
title: Product vision and success
status: approved
authority: normative
owner: product-owner
created: 2026-09-12
last-reviewed: 2026-09-12
decisions: [ADR-0001, ADR-0002, ADR-0007]
requirements: [PROD-0001, PROD-0002, PROD-0003, PROD-0004]
historical-inputs: [REV-001, REV-063, REV-074]
---

# Product vision and success

## Mission

VeriFactu is the complete, deterministic and independently auditable RRSIF
regulatory component for Noeos. It enables a conforming host to decide
applicability, create and preserve billing/event records, operate in either
VERI*FACTU or non-verifiable mode, produce official representations, communicate
with AEAT, recover from failure and demonstrate what an exact release verified.

## Product outcomes

| ID | Outcome |
| --- | --- |
| `PROD-0001` | A host can integrate every supported RRSIF obligation without duplicating fiscal rules or accessing internals. |
| `PROD-0002` | Given the same edition, inputs and permitted provider results, deterministic operations produce identical semantic results, official bytes and diagnostics. |
| `PROD-0003` | Every durable fiscal transition is attributable, ordered, recoverable and independently verifiable without trusting caller assertions. |
| `PROD-0004` | Every release claim is bounded by exact version, edition, platform, mode, integration surface and retained evidence. |

## Meaning of success

Success requires all of the following for a named stable release:

1. Complete applicable legal and AEAT requirements are source-traced.
2. Both modes and every supported state/failure branch are implemented.
3. Public library, CLI and adapter kit agree and pass packaged-consumer tests.
4. Official bytes pass pinned schemas, independent vectors and external AEAT
   validation where AEAT exposes a suitable environment.
5. Security, privacy, resource, performance, recovery and supply-chain gates
   pass for the release artifacts.
6. Verification Engine integration passes against an exact compatible package.
7. A responsible declaration and evidence dossier correspond to the released
   product bytes and remain reproducible.
8. No unresolved finding, exception or risk contradicts the stated claim.

## Failure of the product goal

The product is not successful merely because it compiles, emits an XML, receives
one HTTP 200, passes XSD, has high line coverage, produces a QR, signs one
fixture, or has a green workflow. These are evidence fragments, not the complete
claim.

## Quality principles

Correctness outranks availability; safe unavailability outranks fabrication or
loss of fiscal facts. Security and performance are designed, not appended.
Unsupported or indeterminate applicability fails closed. Historical data remains
verifiable after upgrades. No hidden network, telemetry, source refresh or mode
transition occurs.

## Product success evidence

The release dossier must bind requirements, source edition, commit, dependency
lock, toolchains, packages, SBOM, provenance, signatures, conformance results,
performance evidence, known risks and the declaration. Evidence from deleted
code or another commit is inadmissible.
