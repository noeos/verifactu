---
id: ROADMAP-DOC-0024
title: P4 pre-implementation quality population and budgets
status: approved
authority: normative
owner: quality-owner
created: 2026-09-21
last-reviewed: 2026-09-21
dependencies: [ROADMAP-DOC-0004, ROADMAP-DOC-0023, QA-DOC-0019, PERF-DOC-0002]
decisions: [ADR-0026, ADR-0027, ADR-0028, ADR-0033]
historical-inputs:
  [REV-056, REV-057, REV-058, REV-059, REV-060, REV-062, REV-063, REV-064]
---

# P4 pre-implementation quality population and budgets

## Authority and subject

`config/quality/p4-quality-plan.json` is the machine authority declared before
the first P4 fiscal implementation change. It consumes protected-main subject
`999d78c19b0e1be3097201a0cc61947a10760bbe`, the complete authoritative source
snapshot, candidate generation digest and exact installed Verification Engine
1.0.1 SRI. The edition remains `creationAllowed=false`; this declaration does
not activate fiscal creation or establish a compliance, AEAT or release claim.

The manifest fixes 43 production modules and 26 test files for waves P4-A–P4-G.
Every later production path must already be present in that population. A new or
renamed path requires a standalone protected quality-plan change before the
affected implementation PR. Generated declarations and test fixtures are the
only class exclusions; handwritten semantics and private runtime providers stay
in the denominator.

## Quantitative gates

Each P4 work package runs the applicable population on its final head and adds
the raw evidence in the same PR. Missing, empty, skipped, retried, stale or
wrong-subject reports are `blocked`.

| Population        | Exact rule                                                                                         | Threshold                                                                   |
| ----------------- | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| coverage          | all declared production modules plus rejection of undeclared discovered modules                    | ≥98% statements/lines/functions, ≥95% branches                              |
| critical branches | 36 versioned decisions in `criticalCatalogue`                                                      | 100% conditions and outcomes                                                |
| critical mutation | `P4-MUT-001`–`P4-MUT-036`, one per critical decision                                               | 100% killed, no compile/error/timeout/NoCoverage                            |
| other mutation    | all compilable non-equivalent applications of the six declared operators to all production modules | ≥95% killed; no unreviewed regulatory/security survivor                     |
| property          | 12 named properties × 4,096 executions                                                             | 49,152 executed with declared discard ceilings and shrinking                |
| fuzz              | six named targets × 4,096 executions                                                               | 24,576 executed; zero crash, hang, leak, nondeterminism or forbidden effect |
| seeded faults     | 26 named cross-oracle faults                                                                       | 100% detected for the intended reason                                       |
| compatibility     | five exact OS/Node/npm/ESM cells                                                                   | 100%; unavailable is blocked, never skipped                                 |
| evidence          | 11 named raw report classes                                                                        | all present, schema-valid and bound to final commit/tree                    |

Critical branch entries bind decision, source path, observing test and mutant.
Mutation is over compiled production behavior; text enumeration, compiler error,
timeout and unreachable code do not count as kills. Equivalent mutants require a
per-mutant rationale and two-person role review, and cannot reduce the exact
critical population.

## Test and oracle contract

The declared test files cover focused unit and contract checks, property and
mutation campaigns, real offline XSD and PKI provider integration, QR
render/decode, installed Engine tarball integration, XML/signature/resource and
isolation attacks, performance/resource measurement and an offline packed
consumer. Each wave must add its tests with its implementation. P4-G aggregates
these existing measurements; it cannot be their first execution.

Official vectors remain byte-identical and source-digested. Independent vectors
and the Python P4 oracle cannot import production builders, generated
intermediate assumptions or private package paths. Seeded faults cover staging,
identity, context, decimal/time, records, corrections, mode/events, chains,
ordering/encoding, byte custody, XSD, XAdES, PKI, QR, claim separation and Engine
profile/result adaptation. Official, structural/XSD, cryptographic, certificate,
AEAT and Noeos claims always retain separate outcomes.

## Toolchain and performance meaning

The required cells are Ubuntu 24.04 on Node 22.14.0/npm 10.9.2, Node
22.23.2/npm 11.19.1 and Node 24.21.0/npm 11.19.1; Windows 2025 and macOS 15 on
Node 24.21.0/npm 11.19.1. TypeScript is 5.9.3 and the independent runtime is
Python 3.13.15. Node's V8 coverage instruments compiled output. The mutation
harness applies the closed operator registry and recompiles each mutant.

Eight enforced P4 budgets are correctness/security/resource ceilings: bounded
JSON, XML and signed-XML bytes; XML depth and node/attribute population; a
five-second per-operation deadline; a 256 MiB single-operation RSS ceiling; and
a five-second gross-regression ceiling for 1,000 representative effect-free
plans on the primary Ubuntu profile. These values do not claim a product SLO.
The stable official performance environment and customer capacity basis remain
`calibration-required` for P7; inventing a latency/throughput claim now would
contradict the performance authority.

## Enforcement and change control

The canonical `p4:quality-plan` task validates identities, population
cardinality, critical mappings, thresholds, campaigns, matrix and budgets, then
runs seeded negative mutations of the declaration itself. `gate:p4-readiness`
is produced by the required quality job before any implementation merge.
Thresholds cannot be lowered during P4. Any legitimate expansion lands first in
a separate signed+DCO protected PR and invalidates all mapped evidence.
