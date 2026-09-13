---
id: ROADMAP-DOC-0017
title: Implementation phase handoff
status: approved
authority: normative
owner: project-owner
created: 2026-09-13
last-reviewed: 2026-09-13
dependencies: [ROADMAP-DOC-0004, ROADMAP-DOC-0005, ROADMAP-DOC-0007, ROADMAP-DOC-0013]
decisions: [ADR-0026, ADR-0031, ADR-0051, ADR-0053]
historical-inputs: [REV-063, REV-074, REV-079, REV-080, REV-084]
---

# Implementation phase handoff

## Purpose

This file is the bounded, human-reviewable handoff between implementation phases.
It records what is demonstrably true, what changed, what remains and how the next
Codex context must resume. It never replaces inspection of Git, GitHub, package
registries, official sources or retained evidence.

The execution authority is
[`implementation-roadmap.md`](implementation-roadmap.md). A handoff cannot waive
its scope or gates. False, ambiguous, stale or secret-bearing entries are defects.

## Mandatory operating rules

1. At phase entry, compare this snapshot with the actual worktree, protected
   `main`, remote settings, workflow state, packages and external inputs.
2. If they differ, preserve this statement, add an amendment, assess impact and
   correct the snapshot before implementation.
3. Update the working record throughout a phase, but merge its final record in a
   dedicated protected closure PR after all implementation PRs.
4. Record exact IDs, SHAs, URLs, digests, versions, environments and timestamps.
   Use `not-observed` or `blocked`, never guessed values.
5. Link large/raw evidence by immutable locator and digest. Do not paste logs.
6. Never record credentials, secret values, private keys, taxpayer/customer data,
   private review material or unredacted payloads.
7. A correction is an append-only amendment naming the old statement, reason,
   actor, time, evidence and invalidated decisions. Do not silently rewrite a
   closed phase record.
8. Status is one of `planned`, `ready`, `active`, `blocked` or
   `evidence-complete`. Only protected closure can establish the last state.

## Current context capsule

This capsule is intentionally short and MUST be refreshed by the active phase.
Historical detail belongs in phase records below.

| Field | Current value |
| --- | --- |
| Roadmap | Eight phases P1–P8; P2 is next. |
| Current phase | `P1` corrective closure; PR `#8` versions remaining applicable Actions settings. |
| Phase status | P1 is re-established as `evidence-complete` only by protected merge and final read-back of PR `#8`; P2 remains `planned`. |
| Last evidence-complete phase | None while the Actions-surface P1 finding is open; PR `#8` re-establishes P1. |
| Local repository | Documentation/governance only: 411 current Markdown documents before this handoff update, 117 immutable historical files and no product source. |
| Protected `main` SHA | `844853ef02296a537d5744dca74a6dc62fe51aba`, tree `ad760935bd0fc1973948acbbef2c048e91e6d35a`; corrective PR `#8` result is derived at P2 intake. |
| GitHub effective state | Link-paginated 71-check baseline is retained; fork workflow approval is now `all_external_contributors`, retention is 90 days and public reusable-workflow access is explicitly not applicable. |
| Toolchain/lock | Planned profiles only; no admitted implementation manifest/lock evidence yet. |
| Regulatory edition | No implemented edition selected or generated yet. |
| Verification Engine | Planned integration baseline must be independently re-observed/admitted. |
| Public packages | Not implemented or published. |
| External gates | Legal/CRA review, AEAT access/certificates, npm ownership/OIDC, performance runner and independent review must be observed. Facturacion is not built; only its versioned contract and maintained synthetic host are in current scope. |
| Immediate instruction | Merge corrective PR `#8` only after final checks and retained successor audit, then verify native squash, main-only push run, branch deletion and full state before P2. |

## Phase ledger

| Phase | Status | Input `main` | Closure `main` | Closure PR | Summary |
| --- | --- | --- | --- | --- | --- |
| P1 | evidence-complete after PR `#8` read-back | no remote commit | derived by P2 intake | `#5`, corrections `#6`–`#8` | Bootstrap, probes, approval, isolated contexts and complete fail-closed GitHub/Actions state. |
| P2 | planned | — | — | — | Executable engineering/CI/build foundation. |
| P3 | planned | — | — | — | Official sources, editions, contracts and oracles. |
| P4 | planned | — | — | — | Deterministic fiscal core, artifacts and verification. |
| P5 | planned | — | — | — | Durable consistency and AEAT operation. |
| P6 | planned | — | — | — | Public products and ecosystem conformance. |
| P7 | planned | — | — | — | Whole-product assurance and release rehearsal. |
| P8 | planned | — | — | — | Stable publication, verification and support. |

## Active-phase working record

No phase is active after protected merge and final read-back of corrective PR
`#8`. P2 starts with a new working record only after its intake reconciles this
handoff with Git and GitHub.

## Required phase-record schema

Each closed phase appends one section using every heading below. A field with no
event says `none` and why; headings are never deleted.

```markdown
## Pn closure — <phase title>

### Identity and status
- Status:
- Started/closed (UTC):
- Input main SHA / tree:
- Closure main SHA / tree: derived by next-phase intake
- Closure PR:
- Roadmap revision:
- Documentation inventory digest:

### Readiness and sources
- Prerequisites and their evidence:
- Re-observed mutable sources/dependencies:
- Assumptions resolved/falsified:
- Initial risks/blockers:

### Work packages and protected history
| Work ID | Issue | Branch | PR | branch commits/signers/DCO | squash SHA | result |

### Implemented state
- Components and behavior:
- Paths/files created, changed or removed:
- Public API/CLI/events/diagnostics:
- Schemas/formats/editions/generated output:
- Persistence/migrations/compatibility:
- Toolchain/dependencies/Actions:
- GitHub/npm/external effective state:

### Verification and evidence
| Claim/requirement | test/oracle | canonical task/job | subject/environment | result | evidence locator/digest |
- Coverage/mutation/fuzz results and justified scope:
- Security/privacy/supply-chain results:
- Performance/reliability/recovery results:
- Package/tarball/integration matrix results:
- Legal/regulatory/external observations and independence class:

### Failures, corrections and review
- First failures retained:
- Root causes and affected variants:
- Corrections/regressions:
- Invalidated evidence rerun:
- Review conversations and dispositions:

### Traceability and residual state
- Requirements/ADRs/controls closed:
- REV findings disposed:
- Current findings:
- Risks/exceptions/open questions:
- Explicit remaining committed scope:
- Deviations from roadmap and authority:

### Recovery and next phase
- Recovery/revert point and verified procedure:
- Exit-criteria evaluation:
- Next phase and exact prerequisites:
- Exact first commands/observations:
- Priority documents to reread:
- Long-lead items carried forward:
```

The closure `main` SHA cannot truthfully be embedded in the commit that creates
it. The next phase derives that SHA from Git, verifies the record it contains and
adds it to its input identity. External evidence may additionally bind the
closure PR and resulting SHA.

## Amendments

Append corrections in this form:

```markdown
### AMD-<phase>-<sequence> — <UTC date>
- Statement corrected:
- Correct value and reason:
- Discovered by / actor:
- Evidence locator and digest:
- Affected requirements, phases, releases and claims:
- Evidence/exits invalidated:
- Remediation and protected PR:
```

## Phase closure records

## P1 closure — governed bootstrap and effective protection

### Identity and status

- Status: `evidence-complete` upon protected merge of PR `#5`.
- Started/closed (UTC): `2026-09-13T11:14:42Z` / protected merge time of PR
  `#5`, to be derived by P2 intake.
- Input main SHA / tree: no remote commit / empty repository.
- Closure main SHA / tree: derived by P2 intake; self-reference from this commit
  is impossible and is not guessed.
- Closure PR: `#5`, branch `docs/p1-closure`.
- Roadmap revision: `ROADMAP-DOC-0004`; content baseline at
  `57a062c7d907287eb25461bea560f42d9dd8b87c`.
- Documentation inventory digest: pre-handoff approved candidate, 411 current
  Markdown files, SHA-256
  `52cb771f27f2abe36498ec55735529f47dd64f6314c46f934a4e12d0942c253e`;
  P2 derives the final closure-tree inventory.

### Readiness and sources

- Prerequisites and their evidence: empty-history/local/remote/GitHub intake;
  owner identity; usable SSH signer; documentation and archive inventory; issue
  `#1`; all recorded in the initial signed bootstrap.
- Re-observed mutable sources/dependencies: GitHub REST effective state,
  `actions/checkout` official `v7.0.1` tag and Verification Engine governance
  reference. Checkout resolved to full SHA
  `3d3c42e5aac5ba805825da76410c181273ba90b1`.
- Assumptions resolved/falsified: the remote was empty; GitHub selected the
  first-pushed branch as default and was explicitly corrected to `main`; web DCO
  is organization-enforced; installed `gh` lacks `--slurp`; new-branch push
  events use a zero `before` SHA.
- Initial risks/blockers: protection deadlock and fictional reviewers were
  avoided by observing producers before enforcement and setting zero approvals,
  no CODEOWNERS and no bypass. No P1 blocker remains.

### Work packages and protected history

| Work ID | Issue | Branch | PR | branch commits/signers/DCO | squash SHA | result |
| --- | --- | --- | --- | --- | --- | --- |
| P1-W1–W5 | `#1` | `docs/governance-foundation` | bootstrap plus `#2` | `c40f5d6e4e2dc8debe0b365790f9a112d27af663`, `6b61669e2c487b2b449ef97cb8fb40785a92f60d`; admitted SSH signer and matching DCO | `57a062c7d907287eb25461bea560f42d9dd8b87c` for PR `#2` | pass |
| P1-W6 unsigned | `#1` | `probe/unsigned-commit` | `#3`, closed | `b2d8158d303a15c9060680d9a8650d2b39db7f76`; deliberately unsigned, DCO present | none | rejected as intended |
| P1-W6 missing DCO | `#1` | `probe/missing-dco` | `#4`, closed | `d79ae2b4a1d47b15f1307651c05ee088da056327`; admitted SSH signer, deliberately no DCO | none | rejected as intended |
| P1-W6/W7 | `#1` | `docs/p1-closure` | `#5` | `bb897f7073f9b58eec44357780be26c3a72f1327`, `349692ed721eeb40e523a25ea799c706c8aa3689` and this handoff commit; admitted SSH signer and matching DCO | derived by P2 intake | final closure candidate |

### Implemented state

- Components and behavior: dependency-free documentation/governance validator,
  trailer-aware whole-range SSH/DCO validator, read-only paginated/redacted
  GitHub auditor and an always-closed three-context workflow.
- Paths/files created, changed or removed: `.github/policy/*`,
  `.github/scripts/*`, `.github/workflows/governance.yml`, `.gitignore`, complete
  `docs/`; transient Python bytecode was removed before publication.
- Public API/CLI/events/diagnostics: no product API or CLI. Governance scripts
  emit versioned JSON results and precise fail-closed diagnostics.
- Schemas/formats/editions/generated output: governance schemas and immutable
  previous-docs aggregate only; no regulatory edition or generated product
  output.
- Persistence/migrations/compatibility: none in P1.
- Toolchain/dependencies/Actions: Python standard library, Git, OpenSSH and one
  GitHub-owned checkout Action pinned to the admitted full SHA; no package
  dependency or install step.
- GitHub/npm/external effective state: `main` ruleset `23163524`, release-tag
  ruleset `23163527`, squash-only, automatic branch deletion, full-SHA selected
  Actions, read-only default workflow token and enabled repository security
  controls. No npm/publication action occurred.

### Verification and evidence

| Claim/requirement | test/oracle | canonical task/job | subject/environment | result | evidence locator/digest |
| --- | --- | --- | --- | --- | --- |
| Bootstrap identity | local and CI signature/DCO verification | `Required · governance signatures and DCO` | `c40f5d6e4e2dc8debe0b365790f9a112d27af663` | pass | run `34754555914` |
| Documentation/archive | metadata, IDs, dependencies, links, archive digest | `Required · documentation and traceability` | bootstrap and every accepted head | pass | 410 initial docs; 117 archive files; archive digest in `GOV-013` |
| Required-check closure | always-run dependency result assertion | `Required · required-check closure` | bootstrap, PR and main push events | pass | runs `34754555914`, `34754932667`, `34754989598` |
| Positive protected flow | signed PR, native squash verification and branch read-back | all three contexts | PR `#2` / main | pass | squash `57a062c7d907287eb25461bea560f42d9dd8b87c`; head branch `404` |
| Direct/force/delete protection | live Git pushes | GitHub rules | `main` | rejected | `GH013` direct/force diagnostics; default-branch deletion refusal; `GOV-013` |
| Unsigned rejection | live negative PR | signature/DCO plus closure jobs | PR `#3` | rejected/blocked | run `34755046577` |
| Missing-DCO rejection | live negative PR | signature/DCO plus closure jobs | PR `#4` | rejected/blocked | run `34755154669` |
| New-branch range regression | zero-before positive branch event | all three contexts | `349692ed721eeb40e523a25ea799c706c8aa3689` | pass | run `34755507436`; disposable branch deleted |
| Effective GitHub policy | 68 exact read-only comparisons | `audit-github.py` | protected main `57a062c7d907287eb25461bea560f42d9dd8b87c` | pass, zero mismatches | observed `2026-09-13T11:47:26Z`; redacted JSON SHA-256 `b29e02105091b27d168d128f877a52eebfa67269f4ca960ca4f8b984ccc471a9` |

- Coverage/mutation/fuzz results and justified scope: not applicable to the
  absent product; policy self-tests cover all material P1 false-pass classes.
- Security/privacy/supply-chain results: no secret/private key retained; Actions
  has empty top-level permissions, no privileged event/write permission, one
  admitted full-SHA Action and no persistent repository secret.
- Performance/reliability/recovery results: policy tasks complete within bounded
  5/10-minute jobs; product performance is not a P1 claim.
- Package/tarball/integration matrix results: not applicable; no packages exist.
- Legal/regulatory/external observations and independence class: owner/self and
  tool evidence only; no legal, AEAT or independent validation claimed.

### Failures, corrections and review

- First failures retained: local diff gate found three surplus final blank lines;
  prepublication review found generated bytecode staged; `gh --slurp` was absent;
  GitHub returned `422` when a repository patch attempted to restate inherited
  web DCO; an audit report contained a non-serializable set; and new-branch run
  `34755419567` failed on zero `before` SHA.
- Root causes and affected variants: input formatting; transient local output;
  CLI-version assumption; organization inheritance; JSON normalization error;
  and conflation of an empty-history bootstrap with a new branch based on main.
- Corrections/regressions: normalized files; removed bytecode and ignored it;
  implemented explicit REST pagination; omitted the immutable inherited field
  and read it back as enabled; sorted ruleset names; distinguished `404` from
  authorization denial; resolved new-branch base via authenticated default-branch
  API and verified the full ancestral range.
- Invalidated evidence rerun: all local fixtures/gates, effective-state audit,
  PR checks and the dedicated new-branch run `34755507436` passed after fixes.
- Review conversations and dispositions: project-owner approval is represented
  by the lifecycle transition and `GOV-013`; zero additional human approval is
  required or fabricated.

### Traceability and residual state

- Requirements/ADRs/controls closed: P1-W1 through P1-W7; ADR-0003/0004/0005/
  0031/0032/0033 governance scope; GOV-001 through GOV-013.
- REV findings disposed: REV-073 and REV-075–081 have explicit P1 dispositions
  in `GOV-013`; every other historical finding remains mapped in the ledger.
- Current findings: none material in P1 scope.
- Risks/exceptions/open questions: no exception accepted. Organization Actions,
  runner, secret and variable surfaces returned `403`; organization rulesets and
  hooks returned `404` and are not treated as proof of absence.
- Explicit remaining committed scope: all P2–P8 implementation, assurance,
  external and release work remains; documentation approval is not implementation.
- Deviations from roadmap and authority: none. The false-red correction added a
  maintained full-range new-branch behavior rather than weakening a check.

### Recovery and next phase

- Recovery/revert point and verified procedure: protected main evidence point
  `57a062c7d907287eb25461bea560f42d9dd8b87c`; any correction is a new signed+DCO
  PR and native squash. No bypass or history rewrite is available.
- Exit-criteria evaluation: effective desired state matches 68/68 comparisons;
  negative and positive paths behave as required; documentation is accepted;
  no product source/CODEOWNERS/bypass/approval fiction or temporary relaxation
  remains. P1 passes upon protected merge of PR `#5`.
- Next phase and exact prerequisites: P2, only after deriving PR `#5` squash SHA,
  verifying its GitHub signature/DCO/one-PR mapping, confirming automatic branch
  deletion, rerunning all three checks and auditing effective state.
- Exact first commands/observations: `git fetch --prune origin`; switch to clean
  `main`; inspect `git status`, signed log and tree; run both policy self-tests and
  repository validation; run the GitHub auditor against the derived main SHA;
  compare ruleset IDs/contexts/producers and reopen P1 on any mismatch.
- Priority documents to reread: implementation roadmap/handoff/P2 prompt,
  `05-architecture`, complete `13-repository-ci`, `14-supply-chain-build`,
  applicable quality/assurance docs, ADRs and mapped historical findings.
- Long-lead items carried forward: legal/RRSIF and CRA review, AEAT
  authorization/certificates/portal, three npm names and OIDC custody,
  Verification Engine exact release admission, future-Facturacion synthetic host
  contract, stable performance runner, signing/account recovery and independent
  assessment. Absence retains the exact downstream block; it is not waived.

### AMD-P1-001 — 2026-09-13

- Statement corrected: the PR `#5` closure treated successful required contexts
  as unambiguous although `governance.yml` produced identical context/App pairs
  on branch push, pull request and manual dispatch.
- Correct value and reason: required PR contexts must be emitted only by the
  `pull_request` event; `push` is restricted to `main` for post-squash
  verification and manual dispatch is absent. GitHub required checks bind
  context and App, not event, so another event for the same SHA must not be able
  to satisfy or mask the PR result.
- Discovered by / actor: Codex completion audit after protected merge of PR `#5`.
- Evidence locator and digest: corrective commit
  `01e001eb1b4a3f7b72573e2dc0c101b5f7f68d2c` had zero run/check producers when
  pushed as `fix/p1-context-isolation`; PR `#6` then produced exactly three
  successful checks from sole `pull_request` run `34755972167`. Effective-state
  audit passed 68/68; redacted JSON SHA-256
  `f18e7123057c9083fc06d79ff69c5566a58fa801061c0eed20d8a33051589450`.
- Affected requirements, phases, releases and claims: P1-W3, P1-W5, P1-W6,
  P1-W7, ADR-0032, ADR-0033, `REPO-DOC-0013`, `REPO-DOC-0014`,
  `REPO-DOC-0015`; P2 and every later protected change depend on the correction.
- Evidence/exits invalidated: P1's producer-isolation and effective required-path
  claims were reopened; repository settings, ruleset parameters, signature/DCO,
  destructive probes, archive identity and documentation approval evidence were
  not invalidated.
- Remediation and protected PR: PR `#6` restricts triggers and adds maintained
  negative fixtures rejecting wildcard branch push and any third/manual event.
  P1 returns to `evidence-complete` only after its final-head checks, native
  signed/DCO squash, `main` push run, automatic branch deletion and full
  effective-state read-back pass. P2 derives the resulting SHA and tree.

### AMD-P1-002 — 2026-09-13

- Statement corrected: audits before PR `#7` claimed complete paginated endpoint
  coverage although numeric `page` traversal failed for Dependabot alerts and
  that signal error did not affect the overall result.
- Correct value and reason: every P1-required security surface must be readable
  and every paginated response must follow GitHub's actual `Link` pagination;
  malformed, inconsistent or inaccessible required data fails the audit.
- Discovered by / actor: Codex requirement-by-requirement completion audit after
  protected merge and final read-back of PR `#6`.
- Evidence locator and digest: first corrected local execution against protected
  main `c5697e33297daab98bc77de3202e7ca4d0fa290f` passed 71/71 checks at
  `2026-09-13T13:59:37Z`; Dependabot and secret-scanning alerts were verified
  with count zero, code scanning was explicitly `not-found`, and the redacted
  JSON SHA-256 was
  `9592427f77c5e7372de36fef3180acb184a65ff160a60a7bc9654560263db2f1`.
  The committed corrective auditor then produced 71/71 passing comparisons for
  exact PR `#7` subject `6237e2282cf8543346264ba1f5eefe072636d937`
  at `2026-09-13T14:02:50Z`; the complete redacted report is retained at
  `.github/evidence/p1-effective-state-6237e22.json` with SHA-256
  `995b6488d33be0e06bdd423cb3c4c6bf32bff236cd84951195b3ff1934bd940e`.
- Affected requirements, phases, releases and claims: P1-W4, P1-W5, P1-W7,
  REV-076, `REPO-DOC-0012`, `REPO-DOC-0021`, `ASSURANCE-DOC-0010` and every
  later phase relying on GitHub drift evidence.
- Evidence/exits invalidated: earlier 68-check GitHub audit closure reports are
  retained as historical but no longer sufficient; signing/DCO, branch/tag
  rules, destructive/invalid probes, documentation approval and context
  isolation remain valid.
- Remediation and protected PR: PR `#7` replaces numeric pagination with
  GitHub-Link traversal, adds four deterministic pagination fixtures, promotes
  required signal readability to conformance checks, and clarifies effective
  security capability states. P1 returns to `evidence-complete` only after the
  PR's final-head audit is retained and its signed/DCO native squash, main-only
  run, branch deletion and 71-check final-main audit all pass. P2 derives the
  resulting SHA and tree.

### AMD-P1-003 — 2026-09-13

- Statement corrected: the P1 machine policy and audit omitted three Actions
  settings named by `REPO-DOC-0012`: external-fork workflow approval,
  artifact/log retention and reusable-workflow access applicability.
- Correct value and reason: every external contributor requires workflow
  approval (`all_external_contributors`); retention is 90 days, GitHub's maximum
  for a public repository; reusable-workflow repository access is
  `not-applicable` because the endpoint is private/internal-only.
- Discovered by / actor: Codex semantic completion audit after PR `#7`.
- Evidence locator and digest: GitHub read-back changed fork approval from
  `first_time_contributors` to `all_external_contributors`; retention returned
  `{days: 90, maximum_allowed_days: 90}`; access returned the documented `422`
  applicability response. Exact PR `#8` subject
  `a55f3ee1951c5478590f00c740f6658febee6f29` passed 75/75 comparisons at
  `2026-09-13T14:15:25Z`; its complete redacted report is retained at
  `.github/evidence/p1-effective-state-a55f3ee.json` with SHA-256
  `dec1d1b6e19854c3d285cf4a3a40498cd5b19f04b2ab15662924a47f6b2fe3c5`.
- Affected requirements, phases, releases and claims: P1-W4, P1-W5, P1-W7,
  ADR-0032, `REPO-DOC-0012`, `REPO-DOC-0021`, `ASSURANCE-DOC-0010` and future
  untrusted-contribution workflows.
- Evidence/exits invalidated: completeness of the prior GitHub/Actions audit;
  all other P1 evidence remains valid.
- Remediation and protected PR: PR `#8` versions and audits the three surfaces,
  retains the complete redacted successor report and requires final protected
  squash, main-only checks, branch deletion and effective-state read-back before
  P1 returns to `evidence-complete`.
