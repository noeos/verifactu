---
id: ROADMAP-DOC-0025
title: P5 preimplementation assurance baseline
status: accepted
authority: normative
owner: quality-owner
created: 2026-10-03
last-reviewed: 2026-10-05
dependencies: [ROADMAP-DOC-0004, QA-DOC-0010, QA-DOC-0019, ADR-0051, ADR-0060]
historical-inputs:
  [
    REV-028,
    REV-029,
    REV-030,
    REV-031,
    REV-032,
    REV-033,
    REV-034,
    REV-035,
    REV-036,
    REV-037,
    REV-038,
    REV-039,
    REV-040,
    REV-041,
    REV-042,
    REV-043,
    REV-044,
    REV-051,
    REV-052,
    REV-060,
  ]
---

# P5 preimplementation assurance baseline

This baseline is frozen on the P5 work branch before the first P5 production
module. It is governed by `config/quality/p5-quality-plan.json` and validated by
`tooling/assurance/p5-quality-plan.mjs`. It binds to protected P4 input
`1f66da46e21127d1d82018cfdf093f595e1c08ae` and the ADR-0060 authorization
commit `4b31844af98f7e3e62bcea31b4e97a510116e392`. Its inventory is phase-scoped:
P4's frozen denominator remains independently governed by its existing plan;
every P5 module is counted in this plan and no new P5 path may sit outside it.

### Additive security amendment P5-PLAN-AMEND-001 (2026-10-05)

The initial critical inventory is extended by two P5-D controls after review
found that DNS filtering allowed special-purpose addresses `192.88.99.0/24`
and IPv6 allocations whose IANA registry entries are not globally reachable.
The executable plan records this amendment and adds `P5-CRIT-025/026` with
critical mutants `P5-MUT-041/042`. The resulting population is 26 critical and
16 other mutants (42 total); all original IDs, thresholds, tests, and fault
counts remain in force. See the normative transport policy and P5 handoff for
the full address ranges, source records, regression evidence, and implementation
SHA.

The quality owner adopts the already-approved strict thresholds: 98% statements,
lines and functions; 95% branches; 100% registered critical branches; 100% killed
critical non-equivalent mutants; 95% killed for other valid non-equivalent
mutants; zero unreviewed security/regulatory survivors; and zero compile errors,
timeouts, hidden retries, skips or missing reports. Coverage is per declared
production population, with source inventory reconciliation before metrics are
aggregated. The amended P5 mutation inventory declares 26 critical and 16 other
mutants.

## Frozen production-module inventory

```text
packages/verifactu/src/persistence/model.ts
packages/verifactu/src/persistence/ports.ts
packages/verifactu/src/persistence/unit-of-work.ts
packages/verifactu/src/persistence/atomic-coordinator.ts
packages/verifactu/src/persistence/head-cas.ts
packages/verifactu/src/persistence/leases.ts
packages/verifactu/src/persistence/journal.ts
packages/verifactu/src/persistence/recovery.ts
packages/verifactu/src/persistence/migrations.ts
packages/verifactu/src/persistence/backup-restore.ts
packages/verifactu/src/persistence/retention.ts
packages/verifactu/src/aeat/edition-profile.ts
packages/verifactu/src/aeat/soap-wire.ts
packages/verifactu/src/aeat/response-parser.ts
packages/verifactu/src/aeat/transport.ts
packages/verifactu/src/aeat/node-https-transport.ts
packages/verifactu/src/aeat/certificate-authorization.ts
packages/verifactu/src/aeat/batch-planner.ts
packages/verifactu/src/aeat/submission-coordinator.ts
packages/verifactu/src/aeat/retry-policy.ts
packages/verifactu/src/aeat/correlation.ts
packages/verifactu/src/aeat/reconciliation.ts
packages/verifactu/src/aeat/consultation.ts
packages/verifactu/src/operations/safe-observability.ts
packages/verifactu/src/operations/runbook-decisions.ts
```

`packages/verifactu/src/domain/identities.ts` is an existing shared production
module whose P5 additions are included in P5 coverage and mutation evidence.
P5 additions to it do not alter P4's frozen set of paths. The executable
validator requires every listed P5 path to exist after implementation starts,
discovers all P5 source paths and fails on missing, duplicate, untracked or
undeclared entries. Generated type declarations and test support are outside
the production denominator; all authored runtime TypeScript is in it.

## Frozen test-file inventory

```text
tests/contract/p5-persistence-contract.test.mjs
tests/contract/p5-host-uow-contract.test.mjs
tests/contract/p5-recovery-contract.test.mjs
tests/contract/p5-aeat-wire-contract.test.mjs
tests/contract/p5-aeat-orchestration-contract.test.mjs
tests/contract/p5-local-peer-contract.test.mjs
tests/unit/p5-persistence-model.test.mjs
tests/unit/p5-state-machine.test.mjs
tests/unit/p5-aeat-binding.test.mjs
tests/property/p5-persistence-properties.test.mjs
tests/property/p5-concurrency-properties.test.mjs
tests/property/p5-protocol-properties.test.mjs
tests/integration/p5-host-atomicity.test.mjs
tests/integration/p5-crash-restart.test.mjs
tests/integration/p5-migration-restore.test.mjs
tests/integration/p5-aeat-transport.test.mjs
tests/integration/p5-aeat-reconciliation.test.mjs
tests/security/p5-persistence-attacks.test.mjs
tests/security/p5-wire-attacks.test.mjs
tests/security/p5-redaction.test.mjs
tests/security/p5-resource-limits.test.mjs
tests/performance/p5-recovery-campaign.test.mjs
tests/mutation/p5-mutation.test.mjs
```

## Campaigns and immutable controls

The machine plan contains 26 named atomicity/state/identity/transport critical
branches, 42 exact mutation IDs, 12 deterministic property campaigns of 4,096
executions each, and 56 uniquely named fault injections. Faults span each staged
write and commit acknowledgment, head CAS, lease/fencing races, backup/restore,
migration, credential and endpoint checks, DNS/TLS, partial request writes,
response drop before/after remote application, malformed/hostile/oversized/partial
responses, cancellation, persistence after observation and reconciliation.
Every injection must prove that its trigger was reached and inspect durable
state after restart; a thrown high-level mock alone is insufficient.

The declared matrix is Ubuntu 24.04 with Node 22.14.0, 22.23.2 and 24.21.0;
Windows 2025 with Node 24.21.0; and macOS 15 with Node 24.21.0, all with npm
11.19.1. An absent or pending cell is unknown. The current handoff's local
protocol peer is synthetic and has no external AEAT authority. The retained
edition is verification-only (`creationAllowed=false`); production submission
must remain disabled until an edition is approved and activated.

Recovery campaigns capture duration, peak RSS, event-loop delay, queue high-water
and open handles. Hard bounds are one MiB response bytes, 500 items per page,
32 concurrent synthetic operations and a one-hour campaign deadline. The phase
does not assert production RPO/RTO, durable-backend qualification, deployment
SLOs or AEAT availability; those measurements require the real backend and
calibrated host workload. No external portal or certificate result is replaced
by the local harness.

The final P5 gate must reconcile the exact source and test inventories, all
contract/model/property/integration/security/mutation/fault reports, the five
platform/runtime cells, package and lock identities, redaction canaries, and
store/state/protocol matrices. Any untested inventory entry or applicable P4
closure row prevents P5 phase closure.

Under ADR-0060, unresolved P4 closure does not prevent serial implementation
work on issue #113's `work/p5-a` through `work/p5-g` branches. P4 status remains
visible and blocked; P4 closure does not prevent local construction and
validation of a P5 wave. A P5 pull request still must pass every effective
required context. P5 phase closure still requires all applicable P4 closure
rows to be resolved.

## Serial vertical delivery waves

P5 implementation is delivered as cumulative, serial vertical PRs P5-A through
P5-G, each based on the immediately preceding wave after it has been merged to
protected `main`. The machine-readable assignment is
`config/quality/p5-delivery-waves.json`; `tooling/assurance/p5-delivery-stage.mjs`
validates that the wave assignments form an exact, duplicate-free union of the
frozen production modules, test files, critical and other mutants, property
campaigns, and seeded faults above. GitHub PR heads named `work/p5-a` through
`work/p5-g` select their corresponding cumulative prefix. The existing
`work/p5-implementation` branch is treated as P5-G because it contains the full
implementation population.

Each prefix runs the same applicable P5 controls over its declared cumulative
scope, with the frozen thresholds and no hidden skips, retries or exclusions.
The prefix only determines which assigned implementation and evidence are
present in that vertical PR; it does not change the final denominator or waive
any check. P5-G must rerun the full frozen population, all 56 faults, all 12
property campaigns, all 42 mutants, and every platform/runtime cell. Each PR
must satisfy the normal protected required checks before integration, and every
wave must retain signed+DCO commits and exact-head handoff evidence.
