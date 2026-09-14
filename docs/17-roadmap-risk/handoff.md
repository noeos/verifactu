---
id: ROADMAP-DOC-0017
title: Implementation phase handoff
status: approved
authority: normative
owner: project-owner
created: 2026-09-13
last-reviewed: 2026-09-15
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

| Field                        | Current value                                                                                                                                                                                                                                                                                         |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Roadmap                      | Eight phases P1–P8; P2 implementation is complete and this dedicated closure is active.                                                                                                                                                                                                               |
| Current phase                | `P2` closure candidate on `docs/10-p2-closure`; implementation PRs `#11`–`#14` are protected and merged.                                                                                                                                                                                              |
| Phase status                 | P1 is `evidence-complete`; P2 becomes `evidence-complete` only after this closure PR passes all 17 contexts, is native-squashed and receives final `main` read-back.                                                                                                                                  |
| Last evidence-complete phase | `P1`, final protected SHA `2c67a80837b9ac170e786701a16394252c7fdfea`, tree `6d2929da32b6400d3dfac37bd419d12199a98e95`.                                                                                                                                                                                |
| Local repository             | P2 engineering foundation: 682 tracked paths before closure evidence, 411 current Markdown documents, 117 immutable historical files and exactly three non-fiscal package shells.                                                                                                                     |
| Protected `main` SHA         | `baa92d948912593d0dc5cb5ed361a4bd645f885c`, tree `0b92a2e8ccc7040b80438ffbd6101205eeaf62fb`; input to this closure candidate.                                                                                                                                                                         |
| GitHub effective state       | 89/89 comparisons and 17/17 exact producers passed at `2026-09-14T22:19:21Z`; retained report `.github/evidence/p2-effective-state-baa92d9.json`, canonical-format SHA-256 `4c4f1744e4507ddd501d53c88050a8da1b79111bb4d4ad600ee2dcb53f459953`.                                                        |
| Toolchain/lock               | Node `22.14.0`, `22.23.2`, `24.21.0`; npm `11.19.1`; TypeScript `5.9.3`; Python `3.13.15`; exact 248-entry npm lock and hash-locked Python validator requirements.                                                                                                                                    |
| Regulatory edition           | None implemented or selected in P2; edition, source acquisition, contracts and independent oracles start in P3.                                                                                                                                                                                       |
| Verification Engine          | Public `@noeos/verification-engine@1.0.1`, tarball SHA-256 `74e2449b5bab61ee62bdedc0355567461b33eadf15338f7d3265207bd28395f8`, admitted and consumed only from a clean tarball test.                                                                                                                  |
| Public packages              | Three private `0.0.0-development` shells and reproducible tarballs; publication remains forbidden until P8 and no fiscal behavior is exported.                                                                                                                                                        |
| External gates               | Legal/RRSIF and CRA review, AEAT access/certificates, npm ownership/OIDC, stable performance runner and independent review remain downstream observed gates. Facturacion does not exist and no real integration with it is claimed; only future contract boundaries and synthetic hosts are in scope. |
| Immediate instruction        | Complete only this protected P2 closure, verify branch deletion and final `main` effective state, then begin P3 from the resulting immutable SHA; do not implement fiscal behavior in this closure.                                                                                                   |

## Phase ledger

| Phase | Status            | Input `main`                               | Closure `main`                             | Closure PR                       | Summary                                                                                                                           |
| ----- | ----------------- | ------------------------------------------ | ------------------------------------------ | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| P1    | evidence-complete | no remote commit                           | `2c67a80837b9ac170e786701a16394252c7fdfea` | `#5`, corrections `#6`–`#9`      | Bootstrap, probes, zero-review solo governance, community surface and complete fail-closed GitHub/Actions state.                  |
| P2    | closure candidate | `2c67a80837b9ac170e786701a16394252c7fdfea` | derived by P3 intake                       | `#11`–`#14` plus this closure PR | Executable repository, toolchain, 29-task registry/28-task gate, 17 contexts, supply chain and reproducible non-publishing build. |
| P3    | planned           | —                                          | —                                          | —                                | Official sources, editions, contracts and oracles.                                                                                |
| P4    | planned           | —                                          | —                                          | —                                | Deterministic fiscal core, artifacts and verification.                                                                            |
| P5    | planned           | —                                          | —                                          | —                                | Durable consistency and AEAT operation.                                                                                           |
| P6    | planned           | —                                          | —                                          | —                                | Public products and ecosystem conformance.                                                                                        |
| P7    | planned           | —                                          | —                                          | —                                | Whole-product assurance and release rehearsal.                                                                                    |
| P8    | planned           | —                                          | —                                          | —                                | Stable publication, verification and support.                                                                                     |

## Active-phase working record

P2 closure is active. Its implementation baseline is protected `main`
`baa92d948912593d0dc5cb5ed361a4bd645f885c`; only this handoff and its retained,
redacted effective-state evidence may change. The closure PR must reference and
close issue `#10`, emit all 17 contexts for this documentation/evidence-only path,
use one verified SSH+DCO branch commit, native squash with DCO and automatic branch
deletion. P3 is not active until the resulting `main` SHA and tree are read back.

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

| Work ID           | Issue | Branch                       | PR                  | branch commits/signers/DCO                                                                                                                           | squash SHA                                             | result                  |
| ----------------- | ----- | ---------------------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | ----------------------- |
| P1-W1–W5          | `#1`  | `docs/governance-foundation` | bootstrap plus `#2` | `c40f5d6e4e2dc8debe0b365790f9a112d27af663`, `6b61669e2c487b2b449ef97cb8fb40785a92f60d`; admitted SSH signer and matching DCO                         | `57a062c7d907287eb25461bea560f42d9dd8b87c` for PR `#2` | pass                    |
| P1-W6 unsigned    | `#1`  | `probe/unsigned-commit`      | `#3`, closed        | `b2d8158d303a15c9060680d9a8650d2b39db7f76`; deliberately unsigned, DCO present                                                                       | none                                                   | rejected as intended    |
| P1-W6 missing DCO | `#1`  | `probe/missing-dco`          | `#4`, closed        | `d79ae2b4a1d47b15f1307651c05ee088da056327`; admitted SSH signer, deliberately no DCO                                                                 | none                                                   | rejected as intended    |
| P1-W6/W7          | `#1`  | `docs/p1-closure`            | `#5`                | `bb897f7073f9b58eec44357780be26c3a72f1327`, `349692ed721eeb40e523a25ea799c706c8aa3689` and this handoff commit; admitted SSH signer and matching DCO | derived by P2 intake                                   | final closure candidate |

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

| Claim/requirement              | test/oracle                                                | canonical task/job                          | subject/environment                                       | result                | evidence locator/digest                                                                                                   |
| ------------------------------ | ---------------------------------------------------------- | ------------------------------------------- | --------------------------------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Bootstrap identity             | local and CI signature/DCO verification                    | `Required · governance signatures and DCO`  | `c40f5d6e4e2dc8debe0b365790f9a112d27af663`                | pass                  | run `34754555914`                                                                                                         |
| Documentation/archive          | metadata, IDs, dependencies, links, archive digest         | `Required · documentation and traceability` | bootstrap and every accepted head                         | pass                  | 410 initial docs; 117 archive files; archive digest in `GOV-013`                                                          |
| Required-check closure         | always-run dependency result assertion                     | `Required · required-check closure`         | bootstrap, PR and main push events                        | pass                  | runs `34754555914`, `34754932667`, `34754989598`                                                                          |
| Positive protected flow        | signed PR, native squash verification and branch read-back | all three contexts                          | PR `#2` / main                                            | pass                  | squash `57a062c7d907287eb25461bea560f42d9dd8b87c`; head branch `404`                                                      |
| Direct/force/delete protection | live Git pushes                                            | GitHub rules                                | `main`                                                    | rejected              | `GH013` direct/force diagnostics; default-branch deletion refusal; `GOV-013`                                              |
| Unsigned rejection             | live negative PR                                           | signature/DCO plus closure jobs             | PR `#3`                                                   | rejected/blocked      | run `34755046577`                                                                                                         |
| Missing-DCO rejection          | live negative PR                                           | signature/DCO plus closure jobs             | PR `#4`                                                   | rejected/blocked      | run `34755154669`                                                                                                         |
| New-branch range regression    | zero-before positive branch event                          | all three contexts                          | `349692ed721eeb40e523a25ea799c706c8aa3689`                | pass                  | run `34755507436`; disposable branch deleted                                                                              |
| Effective GitHub policy        | 68 exact read-only comparisons                             | `audit-github.py`                           | protected main `57a062c7d907287eb25461bea560f42d9dd8b87c` | pass, zero mismatches | observed `2026-09-13T11:47:26Z`; redacted JSON SHA-256 `b29e02105091b27d168d128f877a52eebfa67269f4ca960ca4f8b984ccc471a9` |

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

### AMD-P1-004 — 2026-09-13

- Statement corrected: P1 was treated as complete although the roadmap's P1
  path-effects matrix explicitly requires root community files, `REPO-DOC-0001`
  requires `README.md`, `SECURITY.md`, `CONTRIBUTING.md`, `LICENSE` and `NOTICE`,
  and `REPO-DOC-0009` requires a PR template with change/omission, impact,
  evidence and rollback fields. None existed on protected `main`.
- Correct value and reason: P1 has the five root files, a governed PR template
  and one non-sensitive structured work-item form with private security routing.
  The repository is described truthfully as documentation-only; Facturación is
  an unbuilt future consumer; no product, release, support-version or compliance
  claim is made. Because no distribution licence has been selected or legally
  reviewed, `LICENSE` reserves rights and blocks distribution instead of
  inventing an open-source grant. DCO records provenance but is not represented
  as a licence.
- Discovered by / actor: Codex requirement-by-requirement completion audit after
  PR `#8`, comparing the P1 phase matrix, repository tree contract and actual
  protected tree.
- Evidence locator and digest: signed+DCO branch commit
  `812ad206baa7df75273d546ab3abce4f3f7903f9`, tree
  `6646ec54892e751c3c8bad8d1094e150d3f371f4`, in PR `#9`; sole
  `pull_request` run `34763062255` produced the three exact successful required
  contexts. A read-only effective-state audit at `2026-09-13T14:35:25Z` passed
  75/75 comparisons with zero mismatch; redacted transient-report SHA-256
  `94de41e7c1fb3f3da2acd67204fdfe83064ef95a5c8e06366f4c71c7229dd159`.
  The governance report binds SHA-256 for every mandatory artifact:
  `README.md` `472aeca6a43ea1981a42a9c9e7b1e29ae54e2e502bef701f290ead07b9608e5f`,
  `CONTRIBUTING.md` `2d3eb13bd25d68b91e8fd12db87ec035422348275a752d2eb7b0d015855cb21d`,
  `SECURITY.md` `c05599c3076ccfee2dd62fd4af69497e0c86daddc749404bbcf100c36683acf4`,
  `LICENSE` `7e1de9c15443eee92da435265af15813a36e7e4d34a11095142d43d32e7d3dff`,
  `NOTICE` `fbccd2b807ea0ba8278d633f088d79b1997783748f5b82f162d494a5a1b56e6c`,
  PR template `28efab4958199b48361f037c903a9cdab3681447057d6d91db6e7c91e01a248b`,
  issue config `03a26f3208f89d1647ad922ff81fa126478f0e235131f38b3c7b016b0262696b`
  and work-item form
  `aba4639a605aae6c401c7366ac63f14ce78c8fac30b232e5c5336ce875ecbfb8`.
- Affected requirements, phases, releases and claims: P1-W7,
  `ROADMAP-DOC-0004`, `REPO-DOC-0001`, `REPO-DOC-0009`, `REPO-DOC-0016`,
  `BUILD-DOC-0012`, `RELEASE-DOC-0017`, `RELEASE-DOC-0019`, ADR-0003,
  ADR-0004, ADR-0030 and ADR-0031. P2 and every public contribution or release
  depend on the corrected repository contract.
- Evidence/exits invalidated: P1 artifact/completeness and handoff closure were
  reopened. Prior signature/DCO probes, protection/settings read-backs,
  context-isolation proof, archive identity and documentation semantics remain
  valid.
- Remediation and protected PR: PR `#9` adds the eight governed artifacts and a
  dependency-free validator that fails on absence, CR/non-UTF-8, unresolved
  placeholders, broken Markdown links or missing mandatory declarations and
  emits each digest. Its negative fixture proves a missing root artifact fails.
  This amendment is the dedicated corrective handoff commit; self-identifying
  its own commit or eventual squash SHA is impossible without changing that
  identity. P1 returns to `evidence-complete` only after this final PR head passes
  all three contexts, GitHub native-squashes it with verified signature and DCO,
  its `main` run passes, the branch is automatically deleted and the 75-control
  read-back passes. P2 intake derives and records the resulting immutable
  squash SHA/tree.

## P2 closure — executable engineering, CI, build and supply-chain foundation

### Identity and status

- Status: `closure candidate`; all P2 implementation and pre-closure evidence is
  complete. `evidence-complete` requires this record's protected merge, all 17
  documentation-path contexts, branch deletion and final `main` read-back.
- Started/closed (UTC): issue `#10` opened `2026-09-13T15:26:45Z`; closed time is
  the protected merge time of this closure PR and is derived by P3 intake.
- Input main SHA / tree:
  `2c67a80837b9ac170e786701a16394252c7fdfea` /
  `6d2929da32b6400d3dfac37bd419d12199a98e95`, the final P1 closure read back
  before any P2 source was admitted.
- Implementation-complete main SHA / tree:
  `baa92d948912593d0dc5cb5ed361a4bd645f885c` /
  `0b92a2e8ccc7040b80438ffbd6101205eeaf62fb`.
- Closure main SHA / tree: derived and independently read back by P3 intake;
  embedding a commit's own identity in that commit is impossible.
- Closure PR: dedicated branch `docs/10-p2-closure`; GitHub number is added to
  this record after the first signed branch publication.
- Roadmap revision: `ROADMAP-DOC-0004` as present in protected main
  `baa92d948912593d0dc5cb5ed361a4bd645f885c`; P2-W1–P2-W8 and every stated
  exit criterion were evaluated without reducing scope.
- Documentation inventory digest: pre-handoff baseline, 411 current Markdown
  documents, SHA-256
  `d0ba69776a52abe8cd7766eb8c1af9202c35e70b504775a2550072e6a19b7864`;
  117 immutable historical files, SHA-256
  `99641c59c5e5bc32c08dfc337912301b8a7c1f91f08976673eb52396f41c93a1`.
  This record changes the current aggregate, so P3 intake derives the final
  closure-tree value instead of recording a self-invalidating digest.

### Readiness and sources

- Prerequisites and their evidence: P1 was reopened through four semantic
  completion audits, then established at exact protected SHA `2c67a808...` with
  clean worktree, verified native squash/DCO, no source branch, three passing P1
  contexts and complete effective GitHub read-back. Issue `#10` bounded P2 and
  explicitly prohibited fiscal behavior, release credentials and publication.
- Re-observed mutable sources/dependencies: Node release manifests, detached
  signatures and release-key repository; npm registry metadata/signatures;
  TypeScript; Python reference distribution; all admitted Action tags and SHAs;
  public `@noeos/verification-engine@1.0.1`; official CycloneDX 1.7 and SPDX
  3.0.1 schemas/model/context; Gitleaks 8.30.1 release checksums/archive; GitHub
  effective repository/ruleset/security/producer state. Mutable bytes are never
  trusted by URL or tag alone: exact digests live in `config/admission/` and
  `config/toolchain/`.
- Assumptions resolved/falsified: package shells can be real build/package
  subjects without inventing fiscal exports; required checks must be 17 distinct
  leaf contexts rather than a single umbrella; a canonical DAG needs executable
  IO/network/tool/report enforcement, not script-name convention; an Actions
  token cannot perform administrative read-back; release-asset download failures
  need bounded status-aware retry; GitHub Dependabot signs commits but has no
  configuration control for the required DCO trailer, so bot PRs are untrusted
  proposals and never an auto-merge path.
- Initial risks/blockers: the deleted predecessor had false-positive tasks,
  workspace-only package tests, loose exports/imports, mutable or incomplete
  dependency trust, divergent SBOM inputs, ambiguous GitHub producers and
  incomplete CI portability. Each class received an executable control and a
  falsifying fixture before closure. No P2 blocker remains.

### Work packages and protected history

| Work ID             | Issue | Branch                                 | PR                               | branch commits/signers/DCO                                                                                           | squash SHA                                                              | result                                               |
| ------------------- | ----- | -------------------------------------- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ---------------------------------------------------- |
| P2-W1–W3            | `#10` | `build/10-p2-tree-toolchain-packages`  | `#11`                            | `4df6866a08af373bce0e40ca45d3f36b777d8c79`; GitHub-verified SSH signature, matching DCO                              | `ce837b97cb526e690d49705960e3cd8b40e91b7e`; verified GitHub GPG and DCO | pass                                                 |
| P2-W4–W8            | `#10` | `build/10-p2-ci-build-supply-chain`    | `#12`                            | `8f2c7e2`, `1e1d7ce`, `c01abba`, `596a194`, `11e99c4`, `ad248a4`; every commit GitHub-verified SSH with matching DCO | `38b43f95a2637438af915a1edcd349dbd6206987`; verified GitHub GPG and DCO | pass after retained portability/security corrections |
| P2-W6/W8 correction | `#10` | `fix/10-p2-rehearsal-audit-boundaries` | `#13`                            | `7667753dcc4d80cfbcf90a7d123f6f5fe821370a`; GitHub-verified SSH and DCO                                              | `c583bcf3d3f46576de53a0bb296f6cf706d61b28`; verified GitHub GPG and DCO | pass                                                 |
| P2-W7 completion    | `#10` | `build/10-p2-dependabot-flow`          | `#14`                            | `5fea8a93b82acb3cd645cb59ba7adfa1e724e0ff`; GitHub-verified SSH and DCO                                              | `baa92d948912593d0dc5cb5ed361a4bd645f885c`; verified GitHub GPG and DCO | pass                                                 |
| P2 closure          | `#10` | `docs/10-p2-closure`                   | assigned after first publication | recorded after final-head publication; every human commit must be verified SSH and DCO                               | derived by P3 intake                                                    | pending only protected closure mechanics             |

Every merged implementation branch was automatically deleted. There was no
direct `main` push, merge commit, rebase, bypass actor, CODEOWNERS requirement,
approval fiction or history rewrite.

### Implemented state

- Components and behavior: exact semantic repository allowlist and ownership;
  import/export/builtin/cycle boundaries; independently admitted tool profiles;
  three package shells; typed task DAG and evidence schema; deterministic
  generation, formatting, linting, strict type checking and repository/API/
  package/document policy; 17-context CI/security/conformance matrix; bounded
  external-input preparation; clean reproducible builds and tarballs; offline
  tarball consumers; one reconciled component graph; CycloneDX/SPDX generation
  and validation; non-publishing provenance rehearsal; effective GitHub auditor,
  authority-boundary guard, Scorecard signal and Dependabot intake.
- Paths/files created, changed or removed: P2 admitted 682 pre-closure tracked
  paths across `.github/`, `benchmarks/`, `config/`, `docs/`, `editions/`,
  `evidence/`, `fixtures/`, `internal/`, `packages/`, `schemas/`, `scripts/`,
  `tests/`, `tooling/` and exact root control files. The machine tree contract is
  `config/repository/tree.json`; unknown roots, case collisions and forbidden
  generated/vendored placement fail closed.
- Public API/CLI/events/diagnostics: exactly three package names exist, but their
  P2 source modules export `{}` and the CLI has no `bin`; public export count is
  zero. Policy errors use stable codes such as `IMPORT_CYCLE`, `ZERO_WORK`,
  `UNDECLARED_NETWORK`, `PACKAGE_CONTENT_LEAK` and `MISSING_REQUIRED_JOB`.
- Schemas/formats/editions/generated output: versioned JSON schemas govern tree,
  imports, packages, toolchains, task/report graph, CI contexts, Actions,
  dependencies, external inputs and rehearsal provenance. Only the toolchain
  summary is checked in as generated output. No regulatory source, edition,
  fiscal schema, official vector or generated fiscal contract exists in P2.
- Persistence/migrations/compatibility: none; no database, queue, transport,
  tenant, certificate, taxpayer or AEAT state exists. Portability is exercised on
  Ubuntu 24.04, Windows 2025 and macOS 15 plus Node floor/LTS/primary profiles.
- Toolchain/dependencies/Actions: required Node `22.14.0`, `22.23.2` and
  `24.21.0`; informational Node `26.8.2`; npm `11.19.1`; TypeScript `5.9.3`;
  Python `3.13.15`; exact npm lock SHA-256
  `5c14655a889f4f84723e8062ec9070f5f6f381e26bc38cb511b5b65dac200a54`
  with 248 package entries. Ten admitted Actions are full-SHA pinned:
  checkout `3d3c42e`, setup-node `2499707`, setup-python `ece7cb0`,
  upload-artifact `043fb46`, download-artifact `3e5f45b`, dependency-review
  `2031cfc`, CodeQL `b96794f`, Scorecard `2d11466`, OSV `90b209d` and reserved,
  unused-in-P2 attest `1e69f48`.
- GitHub/npm/external effective state: `main` ruleset `23163524` and tag ruleset
  `23163527` are active with no bypass; squash-only, required signatures, thread
  resolution, strict 17-context closure, branch auto-delete and zero reviews/
  no CODEOWNERS remain intentional for the sole developer. Default workflow
  permission is read; write scopes are isolated to exact security events. There
  are no repository Actions/Dependabot secrets, variables, environments,
  deploy keys, webhooks or teams. Publication remains forbidden.
- Canonical task/check registry: `TASK-GRAPH-0001` contains 29 typed tasks.
  `gate:p2` version 2 executes and retains 28 reports; `gate:platform` is the
  separate portable matrix root. Every task declares owner, dependencies,
  inputs, outputs, working directory, exact tool profile/command, environment,
  network, secrets, timeout, locks, selection class, report schema and zero-work
  behavior. All execution tasks deny secrets; only `prepare:external-inputs`
  permits bounded `prepare-only` network.
- Package state: `@noeos/verifactu`, `@noeos/verifactu-adapter-kit` and
  `@noeos/verifactu-cli` are private `0.0.0-development`, `sideEffects:false`,
  with closed `files` and conditional exports. Core alone admits public
  Verification Engine `1.0.1`; adapter and CLI depend only on the exact workspace
  core. Tarballs contain only `dist`, `package.json`, `README.md`, `LICENSE` and
  `NOTICE`; CLI has no CJS surface or executable in P2.

### Verification and evidence

| Claim/requirement                                      | test/oracle                                                                                | canonical task/job                                                                | subject/environment                                     | result                                                                         | evidence locator/digest                                                                                                                                                                                                     |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Exact tree, imports, toolchain and three honest shells | schema/policy plus 10 foundation falsifiers                                                | `gate:foundation`                                                                 | PR `#11`, required OS/runtime matrix thereafter         | pass                                                                           | branch `4df6866`; squash `ce837b9`                                                                                                                                                                                          |
| Typed acyclic execution and no false success           | registry/schema, atomic snapshots, tool/network/report checks and 9 task-runner falsifiers | `gate:p2` v2                                                                      | `baa92d9`, Ubuntu 24.04 / Node 24.21.0 / Python 3.13.15 | pass, 28 reports                                                               | run `34902355808`; `gate-p2.json` SHA-256 `8ea65f9f7257e3240feabd82cc3661ebf7f8940daeb72d5b7e7512bcd4dd536b`                                                                                                                |
| All protected contexts on implementation PR            | exact check registry and always-run closure                                                | 17 `Required ·` contexts                                                          | PR `#14` head `5fea8a9`                                 | 17/17 pass                                                                     | CI `34870501394`, Security `34870500818`, Conformance `34870501414`, Performance `34870501078`                                                                                                                              |
| All protected contexts on `main`                       | exact producer-to-subject audit                                                            | 17 `Required ·` contexts                                                          | `baa92d9`                                               | 17/17 pass                                                                     | CI `34871065235`, Security `34871065337`, Conformance `34871065121`, Performance `34871065225`                                                                                                                              |
| Effective GitHub and producer state                    | 89 fail-closed comparisons, paginated/redacted collection                                  | `audit-github.py`                                                                 | `baa92d9`, observed `2026-09-14T22:19:21Z`              | 89/89 pass, 17/17 producers                                                    | `.github/evidence/p2-effective-state-baa92d9.json`, canonical-format SHA-256 `4c4f1744e4507ddd501d53c88050a8da1b79111bb4d4ad600ee2dcb53f459953`                                                                             |
| Reproducible closed packages                           | two independent clean outputs, tar allowlists and clean offline consumers                  | `package:reproducibility`, `integration:tarball-consumers`                        | `baa92d9` release rehearsal                             | pass                                                                           | core `752f913153e6116837b07b0d2dba87a4ae3ea04f87ae205324e836192e26d9c9`; adapter `1e2652f80ba2bb77bbd5d5e8511c79c48b3009be2f5a6b328a6083e9f90a8e2e`; CLI `fce1cd5b6cce76c1d14ecf4834ef5165da8878b3c05efcf0489cabcfec65e819` |
| Runtime dependency from public bytes                   | exact tgz digest, manifest/lock/licence/native/lifecycle checks and clean consumer         | `prepare:external-inputs`, `policy:supply-chain`, `integration:tarball-consumers` | `@noeos/verification-engine@1.0.1`                      | pass                                                                           | SHA-256 `74e2449b5bab61ee62bdedc0355567461b33eadf15338f7d3265207bd28395f8`                                                                                                                                                  |
| One dependency/tool/Action/data graph                  | lock/manifests/tarballs/Actions/reference runtimes/external inputs reconciliation          | `sbom:component-graph`                                                            | `baa92d9`                                               | 270 nodes, 494 edges                                                           | graph SHA-256 `f85e6a76cea6d11ff99e7a44ebfe3aef1952099b858d541311b5a47347fc034e`                                                                                                                                            |
| Valid reconciled SBOMs                                 | official pinned schemas plus independent SPDX SHACL/OWL pass                               | `sbom:documents`, `sbom:spdx-shacl`                                               | CycloneDX 1.7 / SPDX 3.0.1                              | pass                                                                           | CycloneDX `dddc113fc643fd223ceb2b09d4a50dcb4660a694b399c0e0f629adf32cb8b295`; SPDX `62b97480e2bba4a1a8d0a87159bd631a5ec3e326031d7e49046b8ffbd53168a1`                                                                       |
| Honest provenance preparation                          | subject/material/byproduct reconciliation and schema                                       | `provenance:rehearsal`                                                            | `baa92d9`, run `34902355808`                            | pass; unsigned, nonpublishable, claimed SLSA level `none`                      | three subjects, four resolved dependencies, two byproducts; SHA-256 `6f5f0ee6f689eb988a4de1fc9d35fe7f71199b6438f37ea4cec33c15951c3579`                                                                                      |
| Actions-token authority boundary                       | repository read succeeds, administration returns expected 403                              | `github-audit.yml`                                                                | protected main                                          | pass; explicitly not an effective-state audit                                  | run `34902355866`, artifact `10370498979`, JSON SHA-256 `37a319596b327c96b2cb51456705d62eae5b2139b937776abc51b08db953e074`                                                                                                  |
| Scorecard is a scoped signal                           | non-badge SARIF, security upload and retained artifact                                     | `scorecard.yml`                                                                   | post-Dependabot main                                    | pass                                                                           | run `34902355826`, artifact `10370773004`, SARIF SHA-256 `694db3ef1a880d774f89dfcb395244dd6002dc8fae57af03af698366baaa4206`                                                                                                 |
| Dependabot untrusted path                              | live npm and github-actions proposals                                                      | all 17 required contexts per bot head                                             | PRs `#15`–`#23`                                         | 17/17 contexts emitted on every PR; expected policy/DCO failures prevent merge | exact heads and check-run URLs retained by GitHub; `#15`–`#17`, `#19`–`#21`, `#23`: 13 pass/4 fail; `#18`: 4/13; `#22`: 3/14                                                                                                |

- Coverage/mutation/fuzz results and justified scope: P2 deliberately contains no
  fiscal production branch, state machine or parser to measure; no percentage,
  mutation or fuzz claim is made. Instead, every material foundation control is
  falsified: 10 tree/import/package/toolchain/generated fixtures, 9 DAG/IO/tool/
  network/report fixtures, 2 missing-CI fixtures, 5 admission/package/
  reproducibility/edition fixtures, 4 bounded-download retry fixtures and 11
  governance/document/workflow fixtures. Functional coverage, mutation and fuzz
  campaigns become mandatory as P3/P4 introduce parsers and fiscal logic.
- Security/privacy/supply-chain results: exact 248-entry lock; 98 registry
  artifacts plus admitted bundled/optional entries reconciled; zero lifecycle
  scripts executed; optional code omitted; npm audit/signatures/licences, OSV,
  dependency review, CodeQL and complete-history Gitleaks pass. Open Dependabot
  and secret-scanning alert counts are zero. No credential, customer, taxpayer,
  certificate or private payload was used or retained.
- Performance/reliability/recovery results: correctness-guarded isolated build
  smoke passes on every PR/main path and run `34902355808`; it is not represented
  as a stable production benchmark. Builds use clean temporary roots,
  `SOURCE_DATE_EPOCH=0`, deterministic ordering/modes and exact output comparison.
  Bounded external downloads retry at most three times only for transport errors
  or HTTP 408/425/429/500/502/503/504; 404 and all non-transient errors fail
  immediately, exhaustion fails closed and diagnostics redact query strings.
- Package/tarball/integration matrix results: all three tarballs are independently
  reproducible and allowlist-clean; clean consumers have no workspace/sibling
  access, install core with the exact public Verification Engine tarball, and
  exercise only admitted empty P2 import surfaces. Windows/macOS/Linux matrix
  proves task/path portability, not fiscal interoperability.
- Legal/regulatory/external observations and independence class: licenses and
  notices for admitted npm, Actions, tools and schema inputs are machine
  reconciled, but this is internal/tool evidence, not independent legal advice.
  No RRSIF/VERI*FACTU compliance claim, supported regulatory edition, AEAT
  connectivity or production release exists. Legal/RRSIF, CRA and independent
  technical assessment gates remain external and cannot be simulated by Codex.

### Failures, corrections and review

- First failures retained: PR `#12` exposed platform-dependent Action/path,
  Gitleaks distribution, Windows network-fixture and TypeScript-root assumptions;
  each failure remains in GitHub history and led to separate signed corrections.
  Manual audit run `34857522741` failed when its ephemeral token correctly lacked
  repository-administration permission. Initial rehearsal run `34857523972`
  failed on a transient GitHub release-asset HTTP 504. Neither was rerun blindly
  or deleted.
- Root causes and affected variants: policy conflated scheduled-token authority
  with maintainer read-back; downloader treated every non-2xx response as final;
  some initial commands assumed one OS/path form; the first completeness audit
  omitted the explicitly required Dependabot configuration and live bot path.
- Corrections/regressions: PR `#12` made tool resolution, fixtures and all matrix
  paths portable and promoted readable CodeQL state. PR `#13` separated the
  scheduled authority-boundary proof from authenticated local administrative
  audit, retained rehearsal artifacts under `always()`, and implemented bounded
  status-aware retry with response cancellation and query redaction. PR `#14`
  added exact two-ecosystem Dependabot policy plus missing-ecosystem/unadmitted-
  registry fixtures and the canonical `policy:governance` gate dependency.
- Invalidated evidence rerun: corrected authority run `34859293489`, corrected
  rehearsal `34859294246`, PR `#14` 17-context population, all four `baa92d9`
  push workflows, final rehearsal `34902355808`, guard `34902355866`, Scorecard
  `34902355826` and final 89/89 effective audit supersede invalidated evidence.
- Review conversations and dispositions: project-owner approved the governing
  documentation and P2 objective before execution. No external code review was
  present or invented; rules require zero approvals for a single developer and
  every material conclusion is backed by executable checks/read-back. Open bot
  PRs are proposals to assess in their own signed+DCO maintainer branches, never
  approvals or accepted changes.

### Traceability and residual state

- Requirements/ADRs/controls closed: P2-W1–P2-W8; ADR-0029–ADR-0038;
  `REPO-DOC-0001`–`REPO-DOC-0022`; `BUILD-DOC-0001`–`BUILD-DOC-0019`;
  applicable architecture, quality, security, performance and assurance
  requirements. Closure means their P2 foundation controls exist and pass; it
  does not claim later fiscal/product/release exits.
- REV findings disposed: REV-056 has an honest zero-fiscal-code denominator and
  future coverage gate; REV-063 binds reports/check producers to exact subjects;
  REV-065 safe-inspects extracted closed tarballs; REV-066 uses clean consumers;
  REV-067 compares isolated builds; REV-068 validates reconciled CycloneDX/SPDX;
  REV-069 inventories transitive/tool/Action/data licenses; REV-070 reconciles
  manifest/lock/install/tarball inventories; REV-071 enforces exact tool path,
  version and digest; REV-072 enforces tree/module/export/import boundaries;
  REV-075 full-SHA admits Actions and effective settings; REV-076 paginates and
  binds 17 producers; REV-077 preserves usable zero-review/no-CODEOWNERS solo
  governance; REV-078 gives no routine tag/environment/admin bypass; REV-079
  unifies local/CI/rehearsal task evidence; REV-080 retains Scorecard only as a
  scoped signal.
- Current findings: six open Code Scanning records are Scorecard signals, not
  CodeQL defects: new-project age, zero human approvals/CODEOWNERS by approved
  solo governance, no fuzzing before parser/fiscal code, historical commits from
  before SAST, no OpenSSF Best Practices badge effort and non-maximal review
  settings. The DependencyUpdateTool signal was closed by the post-Dependabot
  rerun. Signals remain visible and are not dismissed or misrepresented.
- Risks/exceptions/open questions: nine Dependabot proposals `#15`–`#23` remain
  open and untrusted; each needs independent version/compatibility/security/
  license/toolchain admission and a maintainer-authored SSH+DCO PR if accepted.
  Organization-admin surfaces unavailable to the repository-scoped audit remain
  six explicit limitations (403/404), never interpreted as absence. No risk
  acceptance or exception was used to pass P2.
- Explicit remaining committed scope: P3 official sources/editions/contracts/
  independent oracles; P4 fiscal core; P5 durable operation/AEAT; P6 public API,
  CLI and adapters; P7 whole-product assurance; P8 stable publication/support.
  Facturacion is not built and is not a P2 integration target.
- Deviations from roadmap and authority: none in product scope or exit strength.
  Two corrective increments and the separately protected Dependabot completion
  were added after completion audits found authority/retry/admission omissions;
  they increased evidence and control strength without implementing P3 behavior.

### Recovery and next phase

- Recovery/revert point and verified procedure: immutable implementation point
  `baa92d948912593d0dc5cb5ed361a4bd645f885c`; recovery is a new bounded,
  signed+DCO protected PR and native squash. Direct push, force push, protected
  branch/tag deletion and bypass are unavailable. Rebuild from a clean clone,
  exact toolchain and lock, run `gate:p2`, compare tarball/SBOM digests and repeat
  the authenticated effective-state audit.
- Exit-criteria evaluation: clean installs and all supported task roots pass;
  cycles, duplicate producers/tasks/reports, undeclared IO/network/tools,
  zero-work, stale output and hand edits are rejected; all 17 contexts are
  observed on human implementation, `main` and live Dependabot paths, with no
  workflow path filters; this closure must supply the final docs/evidence-only
  observation. Tarballs are closed/reproducible and clean-consumed; component
  graph/SBOM/provenance are reconciled; adversarial fixtures and post-change
  89/89 GitHub audit pass. Only this closure PR's checks/mechanics and final-main
  read-back remain self-referentially pending.
- Next phase and exact prerequisites: P3 only after deriving this closure's
  squash SHA/tree, verifying GitHub-native signature plus DCO and one-parent
  history, confirming branch deletion/issue `#10` closure, observing all four
  post-squash workflows and rerunning the 89-control authenticated audit on the
  resulting exact SHA. Any mismatch reopens P2.
- Exact first commands/observations: `git fetch --prune origin`; switch to clean
  `main`; inspect `git status`, signed log, parent and tree; verify the closure PR
  and deleted ref by GitHub API; run `npm ci --ignore-scripts --omit=optional`
  under admitted Node `24.21.0`; install the hash-locked Python requirements;
  execute `node tooling/tasks/run-task.mjs --task gate:p2`; run
  `python3 .github/scripts/audit-github.py --subject-sha <closure-sha>`; compare
  registry, 17 producers, alerts, open proposals and retained evidence.
- Priority documents to reread: this handoff and implementation roadmap;
  `docs/02-regulatory/`, `docs/03-requirements/`,
  `docs/07-formats-cryptography/official-field-and-contract-generation.md`,
  `docs/11-quality-testing/official-vectors-and-independent-oracles.md`,
  `docs/13-repository-ci/`, `docs/14-supply-chain-build/`, applicable ADRs and
  REV-001–REV-006, REV-008 and REV-019.
- Long-lead items carried forward: official-source applicability/licence review,
  legal RRSIF/VERI*FACTU and CRA opinions, AEAT authorization/certificates/test
  endpoint, npm namespace/OIDC custody, stable performance runner, independent
  oracle/technical/security assessment and account/signing recovery. Their
  absence blocks only the mapped downstream exits and is never silently waived.
