---
id: P4A-EVIDENCE
title: P4-A deterministic domain and codec evidence
status: active
authority: informative
owner: quality-owner
created: 2026-09-21
last-reviewed: 2026-09-21
dependencies: [P4-QUALITY-PLAN-0001, P3B-EVIDENCE]
---

# P4-A deterministic domain and codec evidence

P4-A implements the effect-free fiscal foundation behind the package root:
staged and bounded JSON decoding, closed result/diagnostic contracts, branded
identities and explicit context, exact decimal and civil date/time values,
fiscal-document identities and provenance, tax breakdowns, alta/anulacion
construction outcomes, correction/substitution/cancellation graphs, mode tenures,
regulated events, independent record lifecycle dimensions, installation
transitions, scoped sequences, and genesis/link chain verification.

The current authoritative edition remains a creation-disabled candidate. P4-A
therefore exports pure validation and modelling capabilities, but no operation
that creates an official fiscal record under that edition.

## Decisions

| Decision                                                        | Enforced consequence                                                                                                                              |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| No implicit clock, random source, digest, filesystem or network | Every such value or effect is an explicit input or a later port.                                                                                  |
| JSON decoding is staged                                         | Byte limit, UTF-8, syntax/duplicate member, structure and domain failures retain distinct diagnostics and stop advancement.                       |
| Decimal values retain coefficient, scale and lexical form       | Binary floating-point input is rejected.                                                                                                          |
| Construction and lifecycle states are independent               | Rejected and indeterminate construction never become chain eligible; impossible durability, chain, submission and response combinations conflict. |
| Mode and state changes use closed transition functions          | Unlisted edges conflict; VERI\*FACTU rollback is rejected unless a future edition explicitly permits it.                                          |
| Correction relationships are explicit graph edges               | Self-reference, cycles, unsupported kinds, cross-context targets, missing evidence and ambiguous successors conflict.                             |
| Genesis and linked predecessors are distinct variants           | Verification recomputes every digest and rejects gaps, duplicate records, wrong predecessors and wrong heads.                                     |
| Quality tools are cooled and hash-pinned                        | `typescript-eslint@8.69.0` and `c8@12.0.0` are admitted; the parser release published on the implementation day was not used.                     |

## Executable evidence

`p4a:assurance` depends on the protected pre-P4 readiness gate and the canonical
package build. It runs ten mapped test files over compiled JavaScript with V8
coverage, then runs both the critical-decision campaign and an AST-generated
whole-production mutation campaign one mutant at a time.
`gate:p4a` is the cumulative required quality task.

- 37 behavior tests cover P4-A unit, contract, security, property and fuzz cases.
- Seven property campaigns execute 4,096 cases each: 28,672 total, zero discards.
- The staged-codec fuzz campaign executes 4,096 bounded arbitrary-byte inputs.
- Coverage is measured independently for statements, branches, functions and
  lines; every value must meet its predeclared threshold and the exact values
  are recorded in each subject-bound task report.
- `P4-MUT-001` through `P4-MUT-016` alter compiled production semantics. All
  16 are killed; there are no survivors, timeouts, compile errors or test errors.
- The whole-production campaign generates 506 mutants across all 18 compiled
  P4-A production files using the six predeclared operator classes. It kills
  488 (96.44%), exceeding the 95% threshold; all 18 survivors remain in the
  machine-readable report, with zero timeouts, compile errors or test errors.
- The cumulative gate also retains dependency admission, clean installation,
  reproducible archive, SBOM, regulatory and platform controls.

Canonical task reports bind these measurements to the tested commit and tree.
Developer reports from a dirty tree are diagnostic only; protected CI produces
the admissible evidence.

## Claim boundary

| Claim                                                            | Evidence                                                   | Not claimed                                 |
| ---------------------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------- |
| P4-A pure domain behavior is deterministic for explicit inputs   | Property campaigns, frozen outputs and architecture policy | Official fiscal conformance                 |
| Staged JSON inputs fail closed within declared limits            | Unit, fuzz and critical-mutant evidence                    | XML or signed-XML safety                    |
| Sequence and chain verification detect mapped integrity failures | Unit/property tests and `P4-MUT-014..016`                  | Cryptographic strength of a digest provider |
| Candidate policy blocks an official creation API                 | Public and edition contract tests                          | Candidate activation or release readiness   |

P4-B and later slices must extend this cumulative gate and may not weaken the
predeclared thresholds.
