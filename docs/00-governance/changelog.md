---
id: GOV-DOC-0021
title: Governed implementation changelog
status: active
authority: normative
owner: project-owner
created: 2026-09-21
last-reviewed: 2026-10-04
dependencies: [ROADMAP-DOC-0017, ROADMAP-DOC-0020]
decisions: [ADR-0026, ADR-0053]
---

# Governed implementation changelog

This log records protected phase transitions. It is not a product release
changelog and makes no compliance, publication or support claim.

## 2026-10-04 — Refresh the active P5 continuation handoff

- Added Amendment P5-018 and refreshed the handoff capsule with the current
  clean local/remote branch SHA and PR #114 exact-head workflow snapshot.
- Made the operational instruction explicit: a P5 session must continue
  authorized branch work while P4 is blocked. The P4 failures remain visible;
  this does not waive checks, enable a protected merge or close either phase.
- Recorded local P5 gate evidence and the remaining serial-wave and external
  qualification conditions without treating pending GitHub checks as passes.

## 2026-10-04 — Clarify continued P5 implementation authorization

- Clarified ADR-0060: its one-time owner decision authorizes continued P5-A…P5-G
  implementation on issue #113's named branch; the authorization was not
  consumed by the first session or commit. Resumed sessions must continue the
  branch without reopening P4 closure as an entry prerequisite.
- P4 remains blocked. The clarification changes no P4 finding, required check,
  P5 protected-merge gate, P5 phase-exit criterion or external qualification
  requirement.

## 2026-10-04 — Add durable recovery checkpoint port and bounded startup read

- P5 review found that recovery accepted `RecoveryCheckpoint` as an input but
  `PersistencePorts` had no checkpoint storage contract. Added
  `RecoveryCheckpointStore` with complete-chain read verification and an
  immutable predecessor-digest compare-and-append staged in the host UoW; the
  persistence port contract is now version 2.
- Startup recovery now applies a bounded, cancellable checkpoint read and
  blocks worker/network activity on timeout, cancellation, unavailable data or
  adapter failure. Replaced the immediate unavailable mock behind
  `P5-FAULT-054` with a real deadline and abort-triggered store response.
- The P5 production/test path inventories and campaign counts are unchanged.
  Exact local gate and protected-head evidence will be recorded after the
  revised commit and workflows complete.

## 2026-10-04 — Record terminal P5-head workflow closure

- Added Amendment P5-015 with terminal results for PR #114's exact `94db4c6`
  head: all five platform cells, P2, conformance and 14/17 required contexts
  passed; OSV, npm audit and derived required-check closure failed.
- Recorded that the closure job downloaded all 16 expected leaf artifacts and
  rejected only the two audit reports. P4 remains blocked and unwaived.

## 2026-10-04 — Refresh exact P5 remote-state handoff

- Added Amendment P5-014 to replace the stale P5-013 read-back with the exact
  `94db4c6` branch/PR identity and current required workflow states.
- Recorded the completed prior-head P2 and conformance results separately from
  the newer exact-head runs, which remain pending or failed as observed.
- P4 remains blocked; no required check, serial-wave condition or P5 exit gate
  changed.

## 2026-10-04 — Refresh P5 handoff after entry-rule clarification

- Added Amendment P5-013 with the exact local commit/tree, local P5-G and
  documentation check evidence, current PR #114 workflow observation, active
  protection state and the still-open serial-wave delivery gap.
- Recorded the latest upstream npm/cli bundled-dependency issue observation.
  P4 remains blocked; no required check or P5 exit dependency changed.

## 2026-10-04 — Cross-reference the scoped P5 entry decision from ADR-0058

- Updated ADR-0058's governing transition rule to point directly to ADR-0060's
  P4-to-P5 implementation-entry exception. A resumed P5 session is explicitly
  directed to continue the named branch without treating open P4 closure as an
  implementation blocker.
- The exception is limited to P5 branch implementation. P4 remains blocked;
  P4's sequence and assurance criteria, P5 required checks, protected merge
  rules and P5 phase-exit dependency remain in force.

## 2026-10-03 — P5 assurance population frozen

- Before P5 product modules, the P5-specific quality plan declares 25 production
  modules, one shared identity module, 23 test files, 24 critical decisions,
  40 mutations, 12 seeded property campaigns, 56 fault injections and five
  OS/runtime cells. The strict coverage and mutation thresholds remain aligned
  with the approved quality policy.
- The plan requires `creationAllowed=false` for the current candidate, keeps P4's
  frozen denominator separate and declares no external AEAT acceptance,
  production durability or deployment SLO claim.
- The machine inventory and fail-closed validator are in
  `config/quality/p5-quality-plan.json` and
  `tooling/assurance/p5-quality-plan.mjs`; `p5:quality-plan` is included in the
  P2 and platform task closures before P5-A starts.
- The signed+DCO baseline identity, clean reports, package hashes, current PR
  check state and exact public-source read-back are recorded in Amendment
  P5-003 of `docs/17-roadmap-risk/handoff.md`.

## 2026-10-03 — Scoped P5 implementation start authorized

- Project owner `ddavid07` authorized ADR-0060 to begin P5-A…P5-G implementation
  on issue #113 / branch `work/p5-implementation`, based on protected main
  `1f66da46e21127d1d82018cfdf093f595e1c08ae`, while P4 phase closure remains
  incomplete.
- This is a one-time start authorization only. P4 is not `evidence-complete`;
  PR #109's OSV and npm audit/signature/licence contexts failed and required-check
  closure failed as a consequence. The protected-main ruleset remains restored
  with all 17 required contexts. No check has been waived for P5 work.
- At 2026-10-03 14:46 UTC, protected-push runs `37125943358`, `37125943364` and
  `37125943420` were still in progress. Regulatory observation
  `37125943378` and Security `37125943357` had succeeded. Re-read the exact runs
  before relying on these states; none of the in-progress results is a pass.

- The current repository handoff capsule, roadmap index, definition of ready and
  P5 prompt point to ADR-0060 so a resumed Codex session applies this scoped
  authorization. P4's protected closure matrix itself remains unchanged.
- The roadmap and P5 execution prompt now explicitly direct the next session to
  start P5-A on the authorized branch while P4 remains phase-unclosed. P4
  evidence, protected-check requirements and P5 phase-exit dependencies remain
  unchanged.

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

## 2026-09-25 — P4-B implementation protected

- PR #68 closed issue #67. Its exact head a5a8dde811bd1d386381536bddde15463bde1bb9
  passed 26/26 App 15368 check-runs, including all 17 required contexts and
  required-check closure.
- The protected squash is b06b2ffea2a9bf914a131450fc4e84c70d51a50f
  (tree 11f538c42701492fffac151ffd2a3d514a74cd94), sole parent
  3415fd5540b3b8663fc6aec9b44535b4aac6b0c2; valid GitHub signature and
  canonical DCO. Its protected push passed all 25 App 15368 check-runs and
  all five workflows: required foundation 36163538219, Engineering CI
  36163537937, Conformance 36163538438, Regulatory observation 36163538058,
  and Security 36163537976.
- P4-B is implemented and protected. Issue #69 / the final read-back PR records
  this exact evidence and must pass its own exact-head and protected-push
  closure before P4-C starts. creationAllowed=false; no tax-compliance,
  AEAT-acceptance, publication or release claim is made.

## 2026-09-25 — P4-C implementation protected

- PR #73 implemented the admitted XML/XSD provider and hardened XML model.
  Its exact head `7810ef6d1cf84be2bebc1569ef67eb4fdfd6a193` passed 26/26 App
  15368 check-runs, including all 17 required contexts plus closure and all
  five frozen compatibility cells.
- Protected squash `2aae4b0628f98447bd7cd56f21d3e4fdf04f2bcd` has tree
  `3289cefc041dde8962846982a9708807101987af`, sole parent
  `a72f8e4f45a0e8ab1652b429e0922ca77a1a1312`, a valid GitHub signature and
  canonical DCO. Its protected push passed all 25 App 15368 check-runs and
  all five workflows: required foundation `36184783185`, Engineering CI
  `36184783090`, Conformance `36184783118`, Regulatory observation
  `36184783187` and Security `36184783191`.
- Clean exact-head gates passed: test:p4-c (15 cases, zero skips,
  P4-MUT-001–025 all killed, three seeded P4-C faults detected),
  gate:platform 9/9, gate:p2 7/7 and gate:p4-readiness 2/2. The exact
  protected squash also passed platform 9/9, P2 7/7 and readiness 2/2.
- P4-C remains in serial order; P4-D may start only after separate final
  read-back PR #74 passes its own protected closure. Frozen P4 populations
  remain unchanged, `creationAllowed=false`, and no compliance, AEAT
  acceptance, publication or release claim is made.

## 2026-09-27 — P4-F implementation protected

- PR #99 closed implementation issue #98. Exact head
  `25ba7dfe486b0ee8cd8f2e2f20ee4f4682328032` passed 25/25 check-runs,
  including all 17 required contexts and required-check closure.
- Protected squash `7d129703bf6077549d94cb3066db286c422190e8` has tree
  `380acf6735ff25e3811baffd52513371f968acf0`, sole parent
  `4b46e704c367c5792dd3c0f1ad8907ca1f2707f5`, valid GitHub signature and
  canonical DCO. Its protected push passed all 25 check-runs and five
  workflows. Clean exact-head tasks passed: P4-F 5/5, P4-A 9/9,
  readiness 2/2, platform 12/12, and P2 10/10, all without skips.
- P4-F's dedicated final protected read-back is issue #100. P4-G remains
  gated until that separate documentation PR and its protected-push checks
  pass. `creationAllowed=false`; no legal, fiscal-compliance, AEAT-acceptance,
  publication or release claim is made.

## 2026-09-27 — P4-G cumulative implementation protected

- PR #103 completed the frozen P4-G cumulative campaign on all 44 production
  modules and 26 registered tests. Its five exact runtime/platform cells passed
  with 189 cases, 198/198 task checks, zero skips/failures, all 13 report
  classes, Node and Java coverage, and the independent oracle. Exact artifact
  IDs and SHA-256 digests are in `docs/17-roadmap-risk/handoff.md`.
- Protected squash `35c886b31ca6d94dcd19bde889046b5a092cdaba` has tree
  `afe9ef71b64c81f238a208f9185bce9939c2afc3`, sole parent
  `aba0b5f2f9362120131c83773ae1536f5cefc1e3`, a valid GitHub signature and a
  canonical DCO trailer. Its protected-push matrix passed all 25 check-runs
  across five workflows. Issue #102 remains open for its dedicated signed+DCO
  final handoff PR and protected-push read-back. `creationAllowed=false`; no
  compliance, AEAT acceptance, certification, publication or release claim is
  made.

## 2026-10-04 — Clarify continued P5 implementation authorization

- Clarified that ADR-0060's one-time start authorization covers the P5-A…P5-G
  implementation work on the named branch, including its continuation after the
  initial start. This corrects any reading of the earlier changelog shorthand
  as permission that expires once work begins. A resumed session must continue
  existing P5 work while preserving P4's blocked status.
- The roadmap, definition of ready and phase-exit criteria now state this scope
  directly; the P5 prompt and current handoff already tell sessions to continue
  existing branch work.
- Protected P5 merges still require every normal required context, and P5 phase
  closure still requires applicable P4 closure rows to be resolved. No check,
  denominator, or phase-exit criterion was waived.

## 2026-10-04 — Make P5 entry decision explicit

- The project owner reaffirmed that P5-A…P5-G branch implementation should
  proceed while P4 retains its three failed required contexts. The prompt,
  readiness definition, roadmap index and handoff now state directly that these
  failures are not a P5 branch-entry blocker.
- This wording records authorization to start or continue P5 implementation. It
  leaves P4 `blocked`, preserves the failed results, and does not waive P5 checks,
  protected merge requirements or the P5 phase-exit dependency on applicable P4
  closure rows.
- The handoff capsule now records the observed local/remote implementation SHA
  `95a01d1c9cd4f477424cb6f8b2c74023cd1f6991`; the full point-in-time read-back is
  Amendment P5-005.

## 2026-10-04 — Refresh P5 continuation handoff

- Reaffirmed in the executable P5 prompt that P4 phase closure is not a
  prerequisite to start or continue P5 implementation on the ADR-0060 branch.
  A resumed session must inspect the current state and continue existing P5
  work rather than stopping after repeating the P4 closure analysis.
- Updated the handoff capsule and added Amendment P5-007 with the observed
  clean local/remote SHA `87edec46df6f74582f8a651226876cb3801762f3`, PR #114
  state and exact-head checks observed at 2026-10-04 07:18:39 UTC.
- P4 remains blocked. P5 protected merge still requires all normal required
  contexts to pass, and P5 phase closure still requires truthful resolution of
  applicable P4 closure rows. No check or gate is waived.

## 2026-10-04 — Clarify phase-prompt sequencing exception

- Clarified the general prompt-use rule: the next phase normally waits for
  predecessor closure, except where an explicit recorded decision authorizes a
  bounded implementation exception.
- Named ADR-0060 and its exact scope in that rule so a resumed P5 session can
  start or continue P5-A…P5-G branch work without treating P4 closure as an
  entry blocker.
- P4 remains blocked; P5 protected merges and phase closure retain their
  existing checks and dependencies.

## 2026-10-04 — Record P5 DER fixture correction and continuation state

- Recorded the intermittent Node 22.14 synthetic-certificate failure, its
  noncanonical DER serial root cause, deterministic regression and local P5
  results in the active handoff amendment.
- Refreshed the P5 prompt's handoff pointer and corrected the P4 workflow
  observation to its terminal status while preserving the three failed closure
  contexts and active protection.
- Recorded the unresolved difference between issue #113's serial wave PR
  requirement and the single cumulative PR #114; no check, denominator or phase
  closure criterion was waived.

## 2026-10-04 — Refresh the P5 entry handoff

- The project owner reaffirmed the ADR-0060 authorization to continue P5-A…P5-G
  branch implementation while P4 remains phase-unclosed.
- Refreshed the handoff capsule and added Amendment P5-009 with the observed
  local/remote SHA and exact-head PR #114 status. Updated the P5 prompt to point
  at that amendment and name the three outstanding P4 closure failures.
- The failures remain failed and do not become waived checks: P4 stays blocked,
  P5 merge needs every normal protected context, and P5 phase closure retains
  its applicable P4 closure dependency.

## 2026-10-04 — Add P5 implementation and recovery evidence matrices

- Added exact-subject `gate:p5` results and handoff matrices for stores, outbox
  state/retry, protocol operations, recovery/fault campaigns, external gaps and
  P6 readiness.
- Recorded the verified serial-wave delivery conflict: aggregate `gate:p2` and
  `gate:platform` depend on a P5 gate whose current validator requires the full
  frozen source/test population, preventing a partial-wave PR from passing.
- P5 remains active and P4 remains blocked. The cumulative PR, audit failures,
  incomplete current-head checks and external boundaries remain open; no check,
  threshold, denominator or phase-exit dependency was waived.
