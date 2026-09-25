---
id: GOV-DOC-0021
title: Governed implementation changelog
status: active
authority: normative
owner: project-owner
created: 2026-09-21
last-reviewed: 2026-09-21
dependencies: [ROADMAP-DOC-0017, ROADMAP-DOC-0020]
decisions: [ADR-0026, ADR-0053]
---

# Governed implementation changelog

This log records protected phase transitions. It is not a product release
changelog and makes no compliance, publication or support claim.

## 2026-09-21 — P3-B pre-P4 assurance

- Protected prerequisite observation PR `#31` added bounded normal-TLS source
  observation on Ubuntu, Windows and macOS.
- Protected implementation PR `#32` admitted a 27-artifact immutable source
  snapshot, deterministic structural candidate contracts, an independent
  Python oracle and the mandatory `gate:p3b` campaign.
- Exact populations, thresholds, the critical catalogue, all 84 REV
  dispositions and P4 first-commit quality policies are canonical and
  fail-closed.
- Fiscal runtime implementation remains absent. The candidate remains
  `creationAllowed=false`; P4 is authorized only under the frozen first-commit
  controls after protected handoff PR `#33` and forward-correction/read-back PR
  `#34` are green on their exact required subjects.
- PR `#33`'s protected squash retained a literal escaped newline instead of a
  canonical DCO trailer, and its protected-push governance check failed. The
  required closure check consequently failed. Both failed results are retained;
  PR `#34` forward-corrects the latest protected subject with a canonical
  signed-off trailer and reruns the complete matrix.

## 2026-09-25 — P4 zero-code readiness protected

- PR `#53` merged to protected `main` as `763b58239d9e589e377b86928ecfc953d72f321b`
  (tree `287a46ba4bfa43143ce6ccecae6d3a3ed56e9e02`). It adds the frozen 44-path
  production and 26-file test census, readiness validator, 16 seeded negative
  checks, canonical task and required `gate:p4-readiness` without fiscal runtime.
- PR exact-head run `36114028365` completed all 17 required contexts and the
  declared auxiliary checks successfully. Protected-push run
  `36114419541` and its required-check siblings all concluded success on the
  exact merge SHA. P4 readiness is evidence-complete; P4-A is ready to start.
- Scheduled Scorecard run `36114759405` ended `startup_failure`; it is an
  auxiliary signal and was not a required context. Preserve that failed
  observation; it does not alter the successful required closure.
- `creationAllowed=false`; this status transition grants no fiscal-compliance,
  AEAT-acceptance, publication or release claim.

## 2026-09-25 — P4-A protected implementation

- PR `#62` implements the staged JSON codec and effect-free domain core from
  the frozen P4-A inventory. It adds task-enforced coverage, property, fuzz,
  critical mutation and seeded-fault evidence; it keeps `creationAllowed=false`
  and adds no package entrypoint exports.
- Exact PR head `3f5c4bee7b67a2ff8bee447d5c6489bf12dc6b68` passed all 17 required
  App `15368` contexts plus nine auxiliary checks. Protected squash
  `8b0724350b9e30ec6616e837d7605bd7ab839e17` has tree
  `b38dc4f459cf0aff99e1bbc1807ea7ad99e99d1b`, a valid GitHub signature and
  canonical DCO trailer. All five protected-push workflows and all 25
  check-runs passed on the exact squash; see `handoff.md` for the full
  read-back.
- P4-A is implemented. P4-B remains blocked until read-back issue `#63` and
  its documentation PR have completed exact-head and protected-push closure.
  The frozen P4 populations are unchanged. No fiscal-compliance,
  AEAT-acceptance, publication or release claim is made.

## 2026-09-25 — P4-B implementation started

- The P4-A handoff correction PR #66 is protected at
  3415fd5540b3b8663fc6aec9b44535b4aac6b0c2 (tree
  ea058baf138e1b1aec77622c877cbc9beb42ae2a), with valid GitHub signature
  and canonical DCO. All 25/25 App 15368 check-runs passed, including the
  17 required contexts and required-check closure; all five push workflows
  succeeded. Issue #65 is closed.
- P4-B issue #67 and branch build/67-p4b-plans-artifacts start from that
  exact protected main. The implementation adds effect-free operation and
  record plans, edition-bound official field projection/serialization and
  fingerprinting, explicit digest-port use, and process-bound exact-byte
  custody transitions. It adds no public package export and keeps
  creationAllowed=false.
- The local cumulative campaign passed 9/9 selected tasks: 37 test cases,
  properties P4-PROP-001–009 at 4,096 executions each, 22/22 critical mutants,
  99.92% lines, 95.28% branches, 100% functions and 12/12 P4-A seeded faults.
  Local gate:p2 passed 6/6 tasks and gate:p4-readiness passed 2/2 subgates.
  These runs were on the dirty implementation worktree and are development
  evidence; the signed commit and its exact-head checks must regenerate final
  evidence. P4-C remains blocked until P4-B's protected closure and final
  read-back complete.
- This transition changes no frozen P4 path/test population, threshold, budget
  or control mapping. The generic internal serialization rules require an
  explicit edition identity, exact field order and a declared nil token where
  nil is serialized. No fiscal-compliance, AEAT-acceptance, publication or
  release claim is made.

## 2026-09-25 — P4-B clean exact implementation commit

- Signed+DCO commit 9c0d1ff575707ca42b07e88f7508d5eefa04cc31 (tree
  84fc6b38e43b933286aa6ed3c4858b07cbb335c8), sole parent
  3415fd5540b3b8663fc6aec9b44535b4aac6b0c2, passed test:p4-a (9/9 campaigns),
  gate:p2 (6/6 tasks) and gate:p4-readiness (2/2 subgates) on a clean tree.
  Coverage was 99.92% lines, 95.28% branches and 100% functions; 22/22
  critical mutants were killed and P4-PROP-001–009 each ran 4,096 executions.
- The exact PR-head and protected-push matrices are still required. P4-C remains
  blocked until P4-B is protected and has a final protected read-back.
