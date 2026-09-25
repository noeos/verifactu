---
id: ROADMAP-DOC-0024
title: P4 pre-implementation quality population and budgets
status: approved
authority: normative
owner: quality-owner
created: 2026-09-21
last-reviewed: 2026-09-25
dependencies: [ROADMAP-DOC-0004, ROADMAP-DOC-0023, QA-DOC-0019, PERF-DOC-0002]
decisions: [ADR-0021, ADR-0026, ADR-0027, ADR-0028, ADR-0033, ADR-0055, ADR-0056, ADR-0057, ADR-0058]
historical-inputs: [REV-010, REV-011, REV-012, REV-015, REV-021, REV-045, REV-046, REV-056, REV-057, REV-058, REV-059, REV-060, REV-062, REV-063, REV-064, REV-074, REV-079, REV-084]
---

# P4 pre-implementation quality population and budgets

## Authority and readiness status

This is the human-readable authority for the P4 readiness manifest and its
fail-closed task. It starts from P3-B protected subject
`999d78c19b0e1be3097201a0cc61947a10760bbe`; that subject contains no P4
implementation. Protected readiness PR `#53` added the machine-readable
population, validator, seeded plan faults, `p4:quality-plan` task and required
`gate:p4-readiness`; its exact-head and protected-push checks passed at
`763b58239d9e589e377b86928ecfc953d72f321b` (tree
`287a46ba4bfa43143ce6ccecae6d3a3ed56e9e02`). The readiness state is therefore
**evidence-complete**, and P4-A is **ready to start** from that protected
subject. This document remains the plan, not product implementation evidence.
The protected readiness change binds the authoritative edition/generation
digests, exact Verification Engine package identity and dependency/tool
digests. Creation remains disabled; this plan makes no compliance, AEAT,
release or publication claim.

The counts and exact paths below freeze the intended whole-P4 census before
implementation. The new single authored DSS bridge source is included. Any
necessary new or renamed handwritten production path, test file, critical
decision, operator, campaign, dependency, toolchain cell or exclusion must be
added by a separate signed+DCO protected readiness amendment **before** the
affected implementation is written. It must update both this document and the
machine manifest, preserve or strengthen every gate and invalidate affected
evidence. Runtime providers and project-authored bridge code are never excluded.
Only generated declarations, type-only declarations and test fixtures are
eligible for exclusion, by exact path and approved reason.

## Immutable quantitative gates

| Population | Frozen planned denominator | Required result |
| --- | ---: | --- |
| Production modules | 44 exact paths below; discovered handwritten production paths must equal this set | 100% discovered and instrumented; no empty/partial population |
| Test source files | 26 exact paths below; no unregistered test module may be silently omitted | all are executed by their declared campaigns; zero hidden skip/retry |
| Per-public-package coverage | all production statements/lines/functions/branches | ≥98% statements and lines, ≥98% functions, ≥95% branches |
| Critical control catalogue | 43 versioned branch/condition decisions | 100% outcomes/conditions observed on the complete declared population |
| Critical mutations | `P4-MUT-001`–`P4-MUT-043`, one per critical decision | 100% killed by an assertion observing intended behavior |
| Other production mutations | all compilable non-equivalent applications of six admitted operators to every production module | ≥95% killed; zero unreviewed security/regulatory survivors |
| Property testing | 14 named properties × 4,096 executions | all 57,344 executions; declared shrinking/discard ceilings; zero hidden retry |
| Fuzzing | 8 named targets × 4,096 executions | all 32,768 executions; zero crash, hang, leak, OOM, nondeterminism or forbidden effect |
| Seeded faults | 33 named cross-oracle faults | 100% detected for the intended reason |
| Compatibility | five exact OS/Node/npm/ESM cells, each with the admitted local DSS/JDK/Maven path | 100%; unavailable is blocked, never skipped |
| Evidence | 13 raw report classes | all schema-valid and bound to the exact final commit/tree/lock/toolchain/config |

The global package thresholds do not replace 100% critical branch or mutation
requirements. Java bridge code must have its own admitted Java line/branch
instrumentation and mutation mapping; Node coverage cannot stand in for it.
NoCoverage, compile/test errors, timeouts, invalid fixtures, empty discovery,
unknown statuses, waived security/regulatory survivors or stale subjects block.
An equivalent mutant needs per-mutant evidence and the reviews required by the
canonical mutation policy; it cannot shrink the critical denominator.

## Frozen production-module inventory

The following 44 handwritten production modules form the planned census. Any
additional handwritten runtime module requires a preimplementation amendment.

```text
packages/verifactu/src/index.ts
packages/verifactu/src/contracts/staged-codec.ts
packages/verifactu/src/contracts/results.ts
packages/verifactu/src/contracts/limits.ts
packages/verifactu/src/contracts/configuration.ts
packages/verifactu/src/domain/diagnostics.ts
packages/verifactu/src/domain/identities.ts
packages/verifactu/src/domain/context.ts
packages/verifactu/src/domain/decimal.ts
packages/verifactu/src/domain/date-time.ts
packages/verifactu/src/domain/records.ts
packages/verifactu/src/domain/corrections.ts
packages/verifactu/src/domain/mode-tenure.ts
packages/verifactu/src/domain/events.ts
packages/verifactu/src/domain/states.ts
packages/verifactu/src/domain/invariants.ts
packages/verifactu/src/domain/sequences.ts
packages/verifactu/src/domain/chains.ts
packages/verifactu/src/application/operation-plan.ts
packages/verifactu/src/application/record-planner.ts
packages/verifactu/src/application/official-projection.ts
packages/verifactu/src/application/official-serialization.ts
packages/verifactu/src/application/fingerprint.ts
packages/verifactu/src/application/xml-artifacts.ts
packages/verifactu/src/application/xades.ts
packages/verifactu/src/application/qr.ts
packages/verifactu/src/ports/xml-xsd.ts
packages/verifactu/src/ports/digest.ts
packages/verifactu/src/ports/signature.ts
packages/verifactu/src/ports/certificate.ts
packages/verifactu/src/ports/qr.ts
packages/verifactu/src/ports/verification-engine.ts
packages/verifactu/src/editions/registry.ts
packages/verifactu/src/editions/rrsif-2026-09-21.ts
packages/verifactu/src/verification/claims.ts
packages/verifactu/src/verification/engine-profile.ts
packages/verifactu/src/verification/engine-adapter.ts
internal/xml-provider/provider.mjs
internal/xml-provider/worker.mjs
internal/xades-provider/provider.mjs
internal/xades-provider/pki.mjs
internal/xades-provider/worker.mjs
internal/independent-oracles/p4_oracle.py
internal/xades-provider/dss/src/main/java/eu/noeos/verifactu/bridge/DssBridge.java
```

## Frozen test-file inventory

All 26 files are required. Tests in each file must include positive, boundary
and negative cases appropriate to its named responsibility.

```text
tests/unit/p4-codecs.test.mjs
tests/unit/p4-values-identities.test.mjs
tests/unit/p4-records-corrections.test.mjs
tests/unit/p4-modes-events-states.test.mjs
tests/unit/p4-sequences-chains.test.mjs
tests/unit/p4-plans-artifacts.test.mjs
tests/unit/p4-xml-model.test.mjs
tests/unit/p4-claims.test.mjs
tests/contract/p4-public-contract.test.mjs
tests/contract/p4-edition-contract.test.mjs
tests/contract/p4-xml-xsd-provider.test.mjs
tests/contract/p4-xades-provider.test.mjs
tests/contract/p4-qr-provider.test.mjs
tests/contract/p4-engine-adapter.test.mjs
tests/property/p4-properties.test.mjs
tests/mutation/p4-mutation.test.mjs
tests/integration/p4-offline-xsd.test.mjs
tests/integration/p4-xades-pki.test.mjs
tests/integration/p4-qr-roundtrip.test.mjs
tests/integration/p4-engine-tarball.test.mjs
tests/security/p4-xml-attacks.test.mjs
tests/security/p4-signature-attacks.test.mjs
tests/security/p4-resource-attacks.test.mjs
tests/security/p4-isolation-redaction.test.mjs
tests/performance/p4-deterministic-core.test.mjs
tests/packaging/p4-clean-consumer.test.mjs
```

The P4-D integration/contract tests must exercise the Java bridge and exact DSS
artefact, including its coverage report; the P4-E tests must use an independent
decoder. New test files require a readiness amendment before creation.

## Critical branch and mutation controls

The 43 critical decisions are defined by this P4 plan before implementation;
they are not inherited branch identities from P3-B. `P4-CB-001`–`P4-CB-036`
map P4 domain, contract, XML and Verification Engine requirements to exact
tests, production spans and mutants. Seven additional decisions are mandatory:

| ID | Production span | Critical decision | Required observing test | Mutant |
| --- | --- | --- | --- | --- |
| `P4-CB-037` | `internal/xades-provider/provider.mjs` | The exact permitted XAdES profile/reference topology is selected; signing is bound to explicit artifact digest and opaque key handle. | `tests/contract/p4-xades-provider.test.mjs` | `P4-MUT-037` |
| `P4-CB-038` | `internal/xades-provider/provider.mjs` | Returned signature bytes are independently verified over the expected target; wrapping, altered bytes, extra references/transforms and missing values reject. | `tests/security/p4-signature-attacks.test.mjs` | `P4-MUT-038` |
| `P4-CB-039` | `internal/xades-provider/pki.mjs` | CRL/OCSP bytes are validated offline for authority, signature, certificate binding, validation time and freshness. | `tests/integration/p4-xades-pki.test.mjs` | `P4-MUT-039` |
| `P4-CB-040` | `internal/xades-provider/pki.mjs` | `revoked` rejects; `unknown`/`stale`/absent evidence remains indeterminate and never becomes valid. | `tests/integration/p4-xades-pki.test.mjs` | `P4-MUT-040` |
| `P4-CB-041` | `internal/xades-provider/worker.mjs` | The provider has no implicit DNS/HTTP/AIA/CDP access and fails closed on timeout, cancellation, malformed bridge data or resource exhaustion. | `tests/security/p4-resource-attacks.test.mjs` | `P4-MUT-041` |
| `P4-CB-042` | `packages/verifactu/src/application/qr.ts` | QR encoding preserves exact edition/mode-bound bytes and rejects overflow without truncation or fallback. | `tests/security/p4-resource-attacks.test.mjs` | `P4-MUT-042` |
| `P4-CB-043` | `packages/verifactu/src/application/qr.ts` | QR render verification uses an independent decoder and compares exact payload bytes; self-decode cannot satisfy the oracle. | `tests/integration/p4-qr-roundtrip.test.mjs` | `P4-MUT-043` |

Any additional safety-critical branch discovered during review is registered
before its implementation and cannot replace an existing catalogue entry.

## Campaigns, seeded faults and report classes

Property IDs `P4-PROP-001`–`014` are the P4 campaign defined here before
implementation. They cover the frozen P4 domain/contracts plus
`P4-PROP-013` (revocation outcome/freshness never upgrades uncertainty) and
`P4-PROP-014` (QR bytes round-trip exactly through independent decode). Each
runs 4,096 executions with reproducible seeds and shrinking.

Fuzz IDs `P4-FUZZ-001`–`006` retain the JSON codec, XML parser/serializer,
offline XSD, XMLDSig/XAdES, QR and Verification Engine targets. Add
`P4-FUZZ-007` for bounded CRL/OCSP evidence and `P4-FUZZ-008` for the DSS bridge
protocol. Each runs 4,096 inputs with retained corpus, seed and minimized
counterexamples. Every failure is preserved and fixed before rerun.

The 33 core seeded faults in the machine manifest are defined for P4 before
implementation. The following seven provider-specific faults are included and
must fail for their intended reason:

1. DSS alters returned signed bytes but reports success.
2. Provider serializes or logs private key material.
3. Stale CRL/OCSP evidence is promoted to valid.
4. Unauthorized OCSP responder or CRL issuer is trusted.
5. Provider attempts network retrieval when evidence is absent.
6. QR encoder truncates or rewrites a too-large payload.
7. QR test decodes with the production encoder instead of the independent reader.

Every closure contains all 13 versioned raw report classes: coverage;
critical-branch; critical and overall mutation; property and shrink; fuzz and
corpus; seeded-fault; official and independent vectors; security attacks;
performance/resource; OS/runtime/toolchain compatibility; clean packed
consumer; DSS reproducible offline build and bridge coverage; and Maven/SBOM/
shade/licence/NOTICE reconciliation. Missing or schema-invalid report blocks.

## Toolchain, supply chain and performance budgets

The Node matrix is five cells: Ubuntu 24.04 with Node/npm `22.14.0/10.9.2`,
`22.23.2/11.19.1`, and `24.21.0/11.19.1`; Windows 2025 and macOS 15 with
`24.21.0/11.19.1`. ESM package, clean packed consumer and exact lock integrity
are required in all cells. TypeScript is `5.9.3`; independent oracle runtime is
Python `3.13.15`. The frozen Java candidates are Eclipse Temurin JDK
`21.0.12.1+1`, Maven `3.9.12`, EU DSS `6.5`, and
`actions/setup-java@v6.0.1` at its full reviewed-candidate commit/tree; their
exact per-platform/archive digests and licenses are recorded in
`config/quality/p4-quality-plan.json`. These identifiers are frozen candidates,
not a claim that the full Java build is already admitted: before P4-D, the
action bundle/license, all platform JDK artifacts, Maven wrapper/distribution,
DSS source/runtime graph, Java coverage/mutation tools and offline dependency
cache must pass exact integrity, license, SBOM, NOTICE, reproducibility and
supported-cell admission. ZXing `0.23.0` is likewise only a decoder candidate;
its maintenance-only status requires a documented comparison with maintained
independent readers before P4-E admission. The DSS build is offline after
admission. No release of the package or npm publication is authorized by this
plan.

The frozen correctness/security ceilings are: staged JSON input 1 MiB; expanded
XML/XSD input 4 MiB; signed XML plus supplied certificate/revocation evidence
8 MiB; XML depth 64; XML nodes plus attributes 200,000; one effect-free core or
provider operation five seconds; peak single-operation RSS 256 MiB on
Ubuntu/Node 24.21.0; and 1,000 representative deterministic plans within five
seconds on that same primary profile. QR raster output is limited to 4,096 by
4,096 pixels, 16,777,216 total pixels and 64 MiB encoded output; dimensions,
pixels and elapsed time are checked before unbounded allocation. These are
security/regression ceilings, not a customer SLO. P7 still requires a stable
official performance environment and workload-calibrated capacity basis.

## Strict sequencing and enforcement

The serial dependency is **P4-A → P4-B → P4-C → P4-D → P4-E → P4-F → P4-G**.
One wave's PRs and protected closure finish before the next wave's
implementation branch starts. Every PR is vertical, signed+DCO, based on the
latest protected main and carries its tests/evidence; no mega-PR and no later
wave integrated out of order. P4-G reruns the full cumulative population after
any invalidating change. Only the exact final protected head and its required
checks can close a wave.

The required pre-P4 readiness task validates exact identities/cardinalities,
all source/test paths, critical mappings, non-empty denominators, thresholds,
provider admissions, dependency closure, toolchain/OS matrix, budgets and
report schemas. Seeded negative changes prove it rejects an omitted module,
missing test, changed threshold, missing critical mutant, zero-work campaign,
undeclared production path and stale subject. A failure remains failed until
cause and variants are fixed; retry-to-green, scope shrink, silent waiver,
partial coverage, mocked mandatory provider and unsupported claim are
prohibited.
