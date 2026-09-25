---
id: ROADMAP-DOC-0017
title: Implementation phase handoff
status: approved
authority: normative
owner: project-owner
created: 2026-09-13
last-reviewed: 2026-09-25
dependencies:
  [ROADMAP-DOC-0004, ROADMAP-DOC-0005, ROADMAP-DOC-0007, ROADMAP-DOC-0013]
decisions: [ADR-0026, ADR-0031, ADR-0051, ADR-0053, ADR-0055, ADR-0056, ADR-0057, ADR-0058]
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

## Current authority notice

The append-only P4-readiness read-back below supersedes the stale restart
capsule and P3-B-era status statements where they conflict. The latest
protected `main` is `e7df2649e9ee148a61ccda0d8d4af6b8d3e0fe0f`; the zero-code
P4-readiness gate is evidence-complete at PR `#53` (`763b582…`). P4-A is ready
to begin from current protected `main`, but no P4 implementation is present.
Later P4–P7 sections below remain historical records and do not establish
current implementation or evidence.

## Historical initial baseline control — retained

This section records the initial state before the current P1/P2 execution and is
retained for audit continuity. Its statements that work has not started are no
longer current. The retained prior-attempt lessons are available in
[`previous-docs`](../previous-docs/). They inform requirements, risks, tests and
future gates, but they do not establish a current phase, implementation state or
release evidence.

At that historical baseline, no P1 work had started. P1 could begin only after
the approved documentation was committed through the governed bootstrap and the
effective protected repository state was inspected. P2 and every later phase
remain downstream of their exact prerequisites. The mandatory
[`P3-B`](p3b-pre-p4-assurance.md) gate remains a future readiness control between
P3 and P4; it is not evidence that later phases have run in the current
execution.

Any discrepancy between this initial baseline and the actual worktree, protected
GitHub state, package registries, official sources or external authorities must
be recorded before implementation proceeds. Missing, partial, stale, skipped or
unknown evidence is `blocked`, never `passed`.

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

| Field                        | Current value                                                                                                                                                                                    |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Roadmap                      | Eight phases P1–P8, with mandatory P3-B between P3 and P4.                                                                                                                                       |
| Current phase                | P4-A is ready; no P4 implementation is present. P4 readiness is evidence-complete at protected PR `#53`, commit `763b58239d9e589e377b86928ecfc953d72f321b`. |
| Phase status                 | P1–P3-B and zero-code P4 readiness are evidence-complete. P4-A may start under the frozen census and serial-wave rules; fiscal creation remains disabled. |
| Last evidence-complete phase | P4 readiness: PR `#53`, merged `2026-09-25T08:42:49Z`; exact protected checks and push read-back are recorded in the append-only amendment below. |
| Local repository             | P2 foundation, P3 source custody/contracts/oracle, P4 readiness manifest/validator/gates; no P4 fiscal runtime or creation behavior. |
| Protected `main` SHA         | `e7df2649e9ee148a61ccda0d8d4af6b8d3e0fe0f`, tree `6133182c9bb4776923fd1a9d03b1f9c5c810ba03`; PR `#57` contains the final readiness handoff read-back. |
| GitHub effective state       | Active zero-bypass protected-main ruleset; PR `#53` exact-head required/auxiliary checks and protected-push checks passed. This documentation PR requires its own read-back. |
| Toolchain/lock               | Node `22.14.0`, `22.23.2`, `24.21.0`; informational `26.8.2`; npm `10.9.2`/`11.19.1`; TypeScript `5.9.3`; Python `3.13.15`; exact lock and admissions below.                                     |
| Regulatory edition           | Immutable authoritative snapshot `rrsif-2026-09-21-authoritative` and generated candidate `rrsif-2026-09-21-authoritative-candidate`; `creationAllowed=false`.                                   |
| Verification Engine          | Public `@noeos/verification-engine@1.0.1` is exactly admitted and exercised only as a package dependency; fiscal integration remains downstream.                                                 |
| Public packages              | Three private `0.0.0-development` package shells build reproducibly and clean-consume from tarballs; they are not published and export no capability.                                            |
| External gates               | Legal, AEAT, provider, stable-performance, independent-assurance and publication gates remain explicitly downstream and make no P2 claim.                                                        |
| Immediate instruction        | Start only P4-A from current protected `main`, with its own issue and vertical signed+DCO PR. Preserve `creationAllowed=false`; do not begin P4-B before protected A closure/read-back. |

## Phase ledger

| Phase | Status            | Input `main`                               | Closure `main`                             | Closure PR  | Summary                                                                                                                  |
| ----- | ----------------- | ------------------------------------------ | ------------------------------------------ | ----------- | ------------------------------------------------------------------------------------------------------------------------ |
| P1    | evidence-complete | `fa2998d4e7f5e36715b95ee2618b4eaf73cc03c0` | `93d92ca131be93f9430ae13ddc384e471c74cdaa` | `#8`–`#10`  | W1–W7, protected closure, audit correction/finalization and read-back complete; documentation-only scope preserved.      |
| P2    | evidence-complete | `93d92ca131be93f9430ae13ddc384e471c74cdaa` | `5d71bec40a62fce3adbea13c79f23600fd1eca4a` | `#25`       | W1–W8, protected squash, branch deletion, 23/23 PR check-runs, 22/22 protected-push check-runs and 86/86 audit complete. |
| P3    | evidence-complete | `9571b69df4f5eec2b0efc548c30867fcadfd356b` | `89e85f1ff79c0569ddc7c1dfbcb6fdc0e365c71e` | `#28`–`#30` | Protected safe source custody, blocked candidate and independent oracle, with truthful blocker handoff/read-back.        |
| P3-B  | evidence-complete | `89e85f1ff79c0569ddc7c1dfbcb6fdc0e365c71e` | `999d78c19b0e1be3097201a0cc61947a10760bbe` | `#31`–`#34`, `#38` | Source observation, implementation, handoff/read-back and authoritative-edition pointer correction complete. |
| P4    | planned           | P3-B restart baseline `999d78c19b0e1be3097201a0cc61947a10760bbe` | — | readiness + A–G | Readiness decisions and plan are prepared; machine gate must pass before any wave starts. |
| P5    | planned           | P4 closure required                        | —                                          | —           | Persistence, atomicity, AEAT protocol boundaries and recovery.                                                           |
| P6    | planned           | P5 closure required                        | —                                          | —           | Public products and ecosystem conformance.                                                                               |
| P7    | planned           | P6 closure required                        | —                                          | —           | Whole-product assurance, external validation and release rehearsal.                                                      |
| P8    | planned           | P7 closure required                        | —                                          | —           | Stable publication, verification and support.                                                                            |

## Current working record

P1–P3 and P3-B are evidence-complete at their recorded protected points. P3-B
corrected the formerly blocked source graph and executed the pre-P4 assurance
campaign. The current `main` restart baseline is the pointer correction
`999d78c`; it contains no P4 quality plan or P4 runtime. This amendment makes
CRL/OCSP ownership, QR dependency/oracle, DSS 6.5 and claim separation explicit.
P4 remains blocked until the machine-readable population and fail-closed
readiness context specified in `p4-quality-plan.md` are admitted. No source from
a prior P4 attempt is implementation or test evidence for the restart.

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

## Current P1 closure — governed bootstrap and effective protection

### Identity and status

- Status: `closure-candidate`; becomes `evidence-complete` only after protected
  squash of PR `#8`, successful final-head contexts, GitHub-verified one-parent
  squash/DCO read-back and automatic deletion of `docs/1-p1-closure`.
- Started/closed (UTC): start timestamp was not retained; baseline observation
  completed before issue `#1` at `2026-09-19T18:00:14Z`; closure is derived by
  P2 intake. No more precise start value is guessed.
- Input main SHA / tree: `fa2998d4e7f5e36715b95ee2618b4eaf73cc03c0` /
  `8f57a99980891ccc68701b94b94342f7ae0e02d6`.
- Latest protected main SHA / tree before closure: `d9d133c1d7969f353d018618367cffc4574adaa0` /
  `ffd1e3642d960475df62306d4c8f123a3bf101ec`.
- Closure PR: `#8`, branch `docs/1-p1-closure`; its protected squash identity is
  necessarily derived and verified after this record is committed.
- Roadmap revision: `ROADMAP-DOC-0004` from the admitted documentation tree.
- Documentation inventory: 418 current files, including 415 Markdown files;
  intake aggregate SHA-256
  `a99b0dfc29e9da0d2a22f75bebbe9e782e215e74b72ee28da2ed00320eb5b3f8`.
  The closure-tree aggregate is derived by P2 because this record participates
  in its own digest.

### Readiness and sources

- Prerequisites and evidence: issue `#1`; local and remote baseline; complete
  current-document and 118-file archive inventory; signer fingerprint
  `SHA256:65VbGskWghAQAXDbJ3/1hrWuYegZNLs/+S96BbNQCzI`; local SSH sign/verify;
  GitHub user/repository/settings/history/API observations.
- Re-observed mutable sources: repository and organization REST surfaces,
  Actions checkout release `v7.0.1` at full SHA
  `3d3c42e5aac5ba805825da76410c181273ba90b1`, npm registry, Verification
  Engine repository/package, and the private empty-default-branch Facturacion
  repository boundary.
- Assumptions resolved/falsified: `main` initially contained only `LICENSE`;
  all approved documentation was untracked; the prior closure records below are
  retained non-authoritative history; GitHub tag signature enforcement accepts
  a lightweight tag pointing at a signed commit and therefore does not prove an
  annotated signed release tag.
- Initial risks/blockers: no P1 blocker remains. Eight organization administrative
  surfaces return `403`/`404` without `admin:org` and remain explicit unknowns,
  not empty-state claims. They do not contradict the repository-level no-bypass
  read-back. Bus factor remains one.

### Work packages and protected history

| Work ID                | Issue | Branch / PR                            | branch commit or probe                                                        | protected squash / result                                                                                                    |
| ---------------------- | ----- | -------------------------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| P1-W1–W5 bootstrap     | `#1`  | `docs/1-p1-governed-bootstrap` / `#2`  | `75d10ff61a2aa3881534cf8badf41af6cf522ce2`, admitted SSH signer and DCO       | one-time bootstrap exception landed the same exact green PR head directly as `75d10ff`; not accepted as protected-flow proof |
| P1-W6 unsigned         | `#1`  | `probe/1-unsigned-commit` / `#3`       | `538a66509f5f8488cc3bec6cb4e1138b96eda69e`, DCO present, signature absent     | blocked; run `35460024650`; closed and branch deleted                                                                        |
| P1-W6 missing DCO      | `#1`  | `probe/1-missing-dco` / `#4`           | `5c5ad2a3c1188cacd995757f9408d2d5b0a98227`, admitted SSH signer, DCO absent   | blocked; run `35460026407`; closed and branch deleted                                                                        |
| P1-W2/W6 wrong signer  | `#1`  | `probe/1-unadmitted-signer` / `#5`     | `89a4af5d7268683b8a70d1c309f3ddf5263d9c6c`, disposable unadmitted key and DCO | blocked; run `35460027565`; private fixture key destroyed, PR closed and branch deleted                                      |
| P1-W6 positive flow    | `#1`  | `ci/1-p1-effective-state-audit` / `#6` | `4d9c718e46e713c638799f2842816cdba1ef256e`, admitted SSH signer and DCO       | `8c9a462eaae32fedbdae25ef16215cbe51299d07`; GitHub-verified one-parent squash, canonical DCO, branch deleted                 |
| P1-W6 audit correction | `#1`  | `fix/1-p1-audit-main-subject` / `#7`   | `7aa71c87dce8d8a97b5a1a001b7f14ff576f7d77`, admitted SSH signer and DCO       | `d9d133c1d7969f353d018618367cffc4574adaa0`; GitHub-verified one-parent squash, canonical DCO, branch deleted                 |
| P1-W7 closure          | `#1`  | `docs/1-p1-closure` / `#8`             | this signed+DCO closure range                                                 | derived by P2 intake after protected merge/read-back                                                                         |

### Implemented state

- Components and behavior: dependency-free current-document/link/ID/archive/root
  validator; trailer-aware whole-range SSH/DCO verifier; allowed-signers policy;
  read-only Link-pagination-aware redacted GitHub auditor; always-run three-job
  closure; governed PR/work-item templates and root community documents.
- Paths created or changed: `.github/{ISSUE_TEMPLATE,PULL_REQUEST_TEMPLATE.md,
policy,scripts,workflows,evidence}`, root community/configuration files,
  complete `docs/`, and this handoff. No product directory exists.
- Public API/CLI/events/diagnostics: none; P1 scripts emit versioned JSON only.
- Schemas/formats/editions/generated output: governance schemas and retained
  historical archive only; no product schema or regulatory edition.
- Persistence/migrations/compatibility: none.
- Toolchain/dependencies/Actions: Python standard library, Git, OpenSSH, `gh`,
  and GitHub-owned checkout pinned at the admitted full SHA; no package install.
- GitHub effective state: repository public/default `main`; squash only; branch
  auto-delete; Actions selected/GitHub-owned plus full-SHA enforcement; read-only
  default token; all external contributors require workflow approval; 90-day
  retention; dependency graph, Dependabot security updates, secret scanning,
  push protection and private vulnerability reporting enabled. Validity checks
  and non-provider scanning read back disabled and remain explicit capability
  states. No environment, repository/Dependabot secret, variable, hook, deploy
  key, team, pending invitation or self-hosted runner was observed.
- Rulesets: main `23705155`; tag `23705170`; both active with empty bypass lists
  and `current_user_can_bypass=never`. Main has zero approvals, no CODEOWNERS,
  last-push or unattributed-change approval, squash-only PRs, conversation
  resolution, linear/signed history, strict App `15368` checks and no delete/
  force push. `v*` refs require signed subjects and cannot update/delete, with
  the lightweight-tag limitation above retained for the later release gate.

### Verification and evidence

| Claim                                 | Test/oracle                                                        | Subject                                                   | Result                                        | Evidence locator                                                                                                                          |
| ------------------------------------- | ------------------------------------------------------------------ | --------------------------------------------------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Documentation/archive/root policy     | local and CI repository validator plus negative self-tests         | PR heads `75d10ff`, `4d9c718`, `7aa71c8` and closure head | pass                                          | PR runs `35459828051`, `35460317571`, `35460420961`; archive aggregate `0bdda50cfbccca9fe17c65c5ba5dd0d532374292c21a8cb7471930c5418a231e` |
| Signature and DCO positive            | local allowed-signers verification and exact PR ranges             | `75d10ff`, `4d9c718`, `7aa71c8`                           | pass                                          | same runs; GitHub App `15368`                                                                                                             |
| Unsigned / missing DCO / wrong signer | live disposable PRs                                                | PRs `#3`, `#4`, `#5`                                      | rejected; closure also failed                 | runs `35460024650`, `35460026407`, `35460027565`                                                                                          |
| Direct protected update               | fresh signed+DCO commit `5eef39c54245abf8f4964424d9c5aa543728a1f6` | `main`                                                    | rejected `GH013`: PR plus 3/3 checks required | terminal output retained in this execution record                                                                                         |
| Force update                          | push initial `fa2998d` over protected `main`                       | `main`                                                    | rejected `GH013`: force push, PR and checks   | terminal output retained in this execution record                                                                                         |
| Delete default branch                 | Git delete push                                                    | `main`                                                    | rejected by GitHub default-branch protection  | terminal output retained in this execution record                                                                                         |
| Protected PR/squash/delete            | native squash and API read-back                                    | PRs `#6`, `#7`                                            | pass                                          | squashes `8c9a462`, `d9d133c`; both valid, one-parent, DCO-preserving; source refs `404`                                                  |
| Effective settings/rules/producers    | 76 exact authenticated read-only comparisons                       | protected `d9d133c`; check head `7aa71c8`                 | 76/76 pass                                    | `.github/evidence/p1-effective-state-d9d133c.json`; SHA-256 `b3627f881996bfc048ddd4630b30050f73777c32683f602b7d1e31bc76dc79af`            |

- Coverage/mutation/fuzz: not applicable to absent product; policy checkers have
  deterministic positive and named negative cases.
- Security/privacy/supply chain: no private key, token, live certificate or
  fiscal/personal fixture is retained. The wrong-signing-key fixture was created
  in a private temporary directory and destroyed after commit-object creation.
- Performance/reliability/recovery: five-minute bounded P1 jobs; product claims
  are not made. Recovery is forward-only through signed+DCO protected PRs.
- Package/tarball/integration: no VeriFactu package exists. Registry returned
  `404` for all three planned names; this workstation is not npm-authenticated.
  `@noeos/verification-engine` public latest is `1.0.1`; admission belongs to P2.
- Legal/regulatory/external independence: owner/self and tool evidence only; no
  legal, CRA, AEAT, provider or independent-assessment result is claimed.

### Failures, corrections and review

- First failures retained: invalid initial API shapes for public Advanced
  Security and Actions booleans; initial main ruleset defaulted unattributed
  approval to true and allowed all merge methods; the first direct probe reused
  the already-green PR `#2` head and landed as the authorized bootstrap rather
  than proving rejection; the first audit used the wrong workflows endpoint;
  a lightweight signed-commit tag was creatable; and a first hand-written
  baseline tree identity was caught as wrong before closure.
- Root causes and affected variants: API capability/encoding assumptions;
  omitted non-permissive rule parameters; an invalid negative-test subject;
  endpoint path error; GitHub's tag signature semantics; and manual identity
  transcription. No failed proof was promoted to pass.
- Corrections/regressions: requests were reshaped and read back; main parameters
  were explicitly set to false/squash; a fresh direct commit failed; the auditor
  now uses `/actions/workflows`, follows `Link`, and separates protected/check
  subjects; the tag limitation is explicit; Git-derived tree identity replaces
  the erroneous value.
- Temporary tag relaxation: the accidental disposable
  `v0.0.0-p1-unsigned-probe` became undeletable. Ruleset history version
  `50260095` records the exact-ref exclusion starting
  `2026-09-19T18:06:05.020Z`; the tag was deleted; version `50260097` records
  restoration with an empty exclusion list at `2026-09-19T18:06:07.236Z`.
  Enforcement remained active, bypass actors remained empty, final read-back and
  the committed audit confirm no relaxation remains.
- Invalidated evidence rerun: all three contexts reran on PRs `#6` and `#7`;
  final effective state passed 76/76 against `d9d133c`.
- Review: project-owner lifecycle acceptance only; no independent human review,
  fake reviewer, CODEOWNERS or approval is claimed.

### Traceability and residual state

- Closed on successful closure read-back: P1-W1 through P1-W7; GOV-001–GOV-012
  operational P1 scope; ADR-0003/0004/0005/0031/0032/0033; REPO-DOC-0010–0017,
  REPO-DOC-0020–0022 P1 scope.
- Historical findings: REV-073 and REV-075–081 are implemented for current P1
  scope. REV-078's release authorization semantics and REV-079's durable
  long-term dossier remain mapped to later phases rather than overstated here.
- Findings/risks: eight organization administrative surfaces are inaccessible;
  bus factor one; GitHub tag rules do not establish annotated-tag identity;
  validity checks/non-provider scanning are disabled; none is hidden as passing.
- Exceptions: the one-time bootstrap ended when the fresh direct update was
  rejected. The 2.216-second exact-tag exclusion above is closed and removed.
- Remaining scope: every product, package, edition, full 17-context P2 CI,
  supply-chain, external validation and release capability remains unimplemented.
- Deviations: PR `#2` was not a native squash; it is the recorded bootstrap
  exception. PRs `#6`, `#7` and closure `#8` provide the protected path proof.

### Recovery and next phase

- Recovery point: protected `d9d133c1d7969f353d018618367cffc4574adaa0`
  before closure; any correction uses a new SSH-signed+DCO PR and native squash.
- Exit evaluation: all P1 work packages and negative/positive paths pass subject
  to closure PR `#8` itself. No product source, CODEOWNERS, approval fiction,
  bypass actor, persistent secret, environment or temporary relaxation remains.
- Next phase: P2 only after deriving PR `#8` squash/tree, checking its GitHub
  verification, canonical DCO, one parent, exact three final-head successes,
  source-ref `404`, clean local `main`, and a fresh 76-control audit.
- P2 first observations: fetch/prune; inspect clean tree/history; rerun repository
  and commit-policy self-tests; audit GitHub; then admit the exact toolchain,
  semantic tree/task graph and all 17 producers before requiring them.
- Priority reread: roadmap/handoff/P2 prompt, complete `05-architecture`,
  `13-repository-ci`, `14-supply-chain-build`, applicable quality/security/
  assurance documents, ADRs and mapped REV findings.
- Long-lead items: legal/fiscal and CRA reviews not obtained; AEAT certificate,
  authorization and portal access not observed; three npm names return public
  `404` and ownership/OIDC/recovery are unverified; Verification Engine `1.0.1`
  is discoverable but not admitted; private `noeos/facturacion` has no default
  branch and remains a future product; no stable performance runner, production
  signer/certificate provider, account/key recovery drill or independent
  assessment exists. Each retains its roadmap gate.

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

### AMD-P1-CURRENT-001 — 2026-09-19

- Statement corrected: closure PR `#8` treated a 76-control effective-state
  audit as complete for `REPO-DOC-0021`, although it did not enumerate open
  Code Scanning, Dependabot and secret-scanning alerts; branch inventory;
  collaborator access; repository app-installation visibility; the exact
  workflow run/event/path; or legacy status producers.
- Correct value and reason: all surfaces named by the P1 audit authority must be
  observed or explicitly classified. The successor collector adds those nine
  comparisons and passes 85/85 for protected
  `e04fa9cc678264181700023c789567374cfe46c5`, using closure head
  `2b05645b2616d4f0946ba5ccab01f557bb02974b` for producer evidence.
- Discovered by / actor: Codex requirement-by-requirement completion audit after
  protected merge and read-back of PR `#8`.
- Evidence locator and digest:
  `.github/evidence/p1-effective-state-e04fa9c.json`, observed
  `2026-09-19T18:20:01Z`, SHA-256
  `c0b9e5a4c00ada5178157f3fde0c2166f34274aca530780c08a998539a470ebd`.
  Code scanning is explicitly `404 no analysis found`; Dependabot and secret
  scanning each have zero open alerts; only protected `main` exists; the sole
  collaborator is the real owner/admin; repository installation visibility is
  `404` unknown; the sole subject run is successful `pull_request` run
  `35460659047` from `.github/workflows/governance.yml`; legacy statuses are
  empty and cannot duplicate the required check producers.
- Affected requirements, phases, releases and claims: P1-W4/W5/W7, REV-076,
  REV-080, REV-081, `REPO-DOC-0021`, `ASSURANCE-DOC-0010` and every successor
  phase consuming the GitHub audit.
- Evidence/exits invalidated: the earlier 76-control report remains historical
  evidence for its enumerated fields but is insufficient for P1 closure. PR
  signature/DCO, negative enforcement, rulesets/settings and protected squash
  evidence remain valid.
- Remediation and protected PR: PR `#9` carries the expanded collector,
  successor redacted report and this amendment. P1 becomes `evidence-complete`
  only after its final-head contexts pass, GitHub native-squashes it, preserves
  DCO with a valid signature, automatically deletes the branch and a fresh
  85-control read-back passes.

### AMD-P1-CURRENT-002 — 2026-09-19

- Statement corrected: the current capsule and phase ledger still described PR
  `#9` as a pending correction after its protected merge and final read-back.
- Correct value and reason: P1 is `evidence-complete`. GitHub native-squashed PR
  `#9` as `3a046c71120e16adb57f9539cbc9ba2c4d14e1d0`, tree
  `2dba4fc4664289076e69985eb9d2f3572b247b7f`, with sole parent
  `e04fa9cc678264181700023c789567374cfe46c5`; GitHub reports its signature
  valid at `2026-09-19T18:22:42Z` and the canonical DCO trailer is present.
- Discovered by / actor: Codex final requirement-by-requirement completion audit
  after the protected merge of PR `#9`.
- Evidence locator and digest: final-head Actions run `35460941966` passed all
  three required App `15368` contexts; the source branch returns `404` after
  automatic deletion; a fresh 85/85 effective-state audit observed at
  `2026-09-19T18:26:14Z` has SHA-256
  `8d2001de49a8d0648457598bbec8a4e2fcab41d261d3d4c4837dbabc70f92e31`;
  the immutable corrective read-back is issue `#1` comment
  `https://github.com/noeos/verifactu/issues/1#issuecomment-5744329736`.
- Affected requirements, phases, releases and claims: P1-W7, the P1 exit, the
  current context capsule and P2 intake. No product, publication, external
  validation or later-phase claim is affected or introduced.
- Evidence/exits invalidated: only the stale pending status in the current
  capsule and ledger. The underlying PR `#8` closure evidence and PR `#9`
  corrective evidence remain valid.
- Remediation and protected PR: this dedicated handoff-only amendment records
  the completed correction through the same signed, DCO-conformant, protected
  squash path. Its post-merge identity and read-back are added to issue `#1` so
  the handoff does not pretend to predict its own squash commit.

## Retained execution record (non-authoritative)

The material below is retained in full so that no execution detail, correction,
failure, evidence locator or lesson from the prior attempt is lost. It is not the
current phase ledger, does not establish an implementation baseline and cannot
authorize resumption. The initial baseline above is the only current status;
future closures must create new exact-subject records under the approved roadmap.

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

## P2 closure — current protected execution (2026-09-21)

### Identity and status

- Status: `evidence-complete`. Dedicated closure PR `#25` passed its required
  and auxiliary checks, was native-squashed through protected `main`, had its
  branch deleted, and its one-parent result has valid GitHub signature/DCO. The
  protected push and final authenticated effective-state read-back also pass.
- Started/closed (UTC): issue `#11` opened at `2026-09-20T19:46:29Z`;
  implementation completed at `2026-09-21T08:08:20Z`; closure merged at
  `2026-09-21T08:33:13Z`.
- Input main SHA / tree: `93d92ca131be93f9430ae13ddc384e471c74cdaa` /
  `12a243f493f660e95ac9e97e4cf164c3ad3b625d`, the final P1 recovery point.
- Implementation-complete main SHA / tree:
  `d2fe740f9793f6c59e7ba80d4099c7d120bb1632` /
  `52c54a57e4a8e02ea881ef8de32fb8695e7adb1b`.
- Closure main SHA / tree: `5d71bec40a62fce3adbea13c79f23600fd1eca4a` /
  `9574ed07e45ec6b56aaee5d06b729fdcd27e3f5a`; one parent is the implementation
  point above.
- Closure PR: `#25`, final signed+DCO head
  `3a082dbc6c3b6e0d4282b42989406e89a36c488b`; protected squash `5d71bec…`;
  source branch deleted and GitHub signature verified.
- Roadmap revision: `ROADMAP-DOC-0004`; P2-W1–P2-W8 and every stated P2 exit
  condition were evaluated without adding fiscal behavior or reducing scope.
- Documentation inventory: `533` tracked Markdown files before this closure;
  sorted-path/content SHA-256 aggregate
  `c298c006c0a2c068604a387a8c0905b378efefac03bb8f338b843a22415abd86`.
  This file changes that aggregate, so P3 intake derives the closure-tree value
  rather than embedding a self-invalidating digest.

### Readiness and sources

- Prerequisites and evidence: P1 finalization PR `#10` landed protected recovery
  point `93d92ca…`; its clean repository, one-parent GitHub-verified signature,
  DCO, branch deletion, three required contexts and 85/85 effective-state audit
  were revalidated before P2 source was created.
- Re-observed mutable sources/dependencies: official Node release manifests and
  assets; npm registry metadata/signatures; TypeScript and Python releases;
  GitHub Action tags/commits/trees/signatures/manifests; Gitleaks and OSV
  archives; public `@noeos/verification-engine@1.0.1`; official CycloneDX 1.7
  and SPDX 3.0.1 schema/context/model bytes; effective GitHub repository,
  security, workflow, branch, ruleset and producer state.
- Assumptions resolved/falsified: empty package shells can be real reproducible
  artifacts without fake fiscal exports; one typed registry can drive local and
  hosted work; a green umbrella cannot replace 16 substantive leaf reports plus
  closure; workspace imports cannot prove packed consumers; syntactic SPDX is
  insufficient without official schema and SHACL validation; bot proposals are
  untrusted and cannot satisfy human signature/DCO admission.
- Initial risks/blockers: P1 remained effective. Mutable refs, workspace leaks,
  empty work, undeclared capabilities, incomplete platform coverage, ambiguous
  producers and non-reconciled SBOM inputs were treated as construction work.
  No P2 blocker remains.

### Work packages and protected history

| Work ID                                 | Issue | Branch / PR                          | signed+DCO branch commits                                                   | protected squash / result                                                                                          |
| --------------------------------------- | ----- | ------------------------------------ | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| P2-W1–W8 foundation                     | `#11` | `build/11-p2-foundation` / `#12`     | `7e9c0f8`, `161822c`, `fecd580`, `d012289`, `55c02ca`; whole range verified | `bfdd9e80a34f3e8fb1be60bbd5b679173b3bc20c`; valid GitHub signature, DCO, one parent; pass                          |
| P2 graph/SBOM/effective-state hardening | `#11` | `build/11-p2-hardening` / `#22`      | `fa0a060`, `ddc9aa6`; whole range verified                                  | `d782ee8f46907f3eb8cc9e773cbcd3884ff4037b`; valid GitHub signature, DCO, one parent; pass after Windows correction |
| P2 Action-runtime correction            | `#11` | `build/11-p2-action-runtime` / `#24` | `4445fc5914d59ff1f1685b24e5f8c9b973049273`; verified                        | `d2fe740f9793f6c59e7ba80d4099c7d120bb1632`; valid GitHub signature, DCO, one parent; pass                          |
| P2 closure                              | `#11` | `docs/11-p2-closure` / `#25`         | signed+DCO head `3a082db`; all required and auxiliary checks passed         | `5d71bec40a62fce3adbea13c79f23600fd1eca4a`; valid GitHub signature/DCO, one parent, branch deleted; pass           |

All merged implementation branches were automatically deleted. There was no
direct protected-branch push, force push, bypass, merge commit, rebase,
CODEOWNERS fiction or approval fiction.

### Implemented state

- Components and behavior: semantic tree/workspace allowlist, exact ownership
  and imports; independently admitted toolchain; three package shells; typed
  acyclic task DAG with closure roots, capabilities and atomic reports;
  format/lint/types/docs/metadata/link/ID/architecture/API/package policies;
  17 required contexts and always-run closure; separate PR-safe engineering,
  conformance, security and performance workflows plus scheduled/manual audit,
  Scorecard and release-candidate workflows; exact Actions/dependency/tool/
  lifecycle/licence admission; deterministic closed tarballs; clean offline
  consumers; one component graph; CycloneDX/SPDX; honest non-publishing
  provenance.
- Paths/files: `642` tracked paths at the implementation point including the
  seven auxiliary workflows and their report writer. Machine state is
  under `config/{repository,toolchain,tasks,ci,admission,provenance}`; execution
  is under `tooling/`; temporary evidence, build output and `node_modules` are
  ignored and registry-classified. Unknown roots, ownership ambiguity, case
  collision, forbidden import and generated hand edit fail closed.
- Public API/CLI/events/diagnostics: exactly `@noeos/verifactu`,
  `@noeos/verifactu-adapter-kit` and `@noeos/verifactu-cli` exist as private
  `0.0.0-development` shells. Each exports an empty module; CLI has no `bin`;
  no fiscal API, event, parser, state transition or behavior is claimed.
- Schemas/formats/editions/generated output: task-report and machine-registry
  schemas plus generated toolchain summary only. No official fiscal source,
  regulatory edition, XSD, QR, XAdES or AEAT contract was generated in P2.
- Persistence/migrations/compatibility: none. Task and build portability is
  proved on Ubuntu 24.04, Windows 2025 and macOS 15, with Node floor/latest-22/
  primary cells. This is not fiscal/provider compatibility.
- Toolchain/dependencies/Actions: Node `22.14.0`, `22.23.2`, `24.21.0` and
  informational `26.8.2`; npm `10.9.2`/`11.19.1`; TypeScript `5.9.3`; Python
  `3.13.15`; Gitleaks `8.30.1`; OSV Scanner `2.5.1`; exact `package-lock.json`
  with `238` entries (`234` external paths). Eight direct dependencies are
  exact/cooling-period admitted. Eight Actions are full-SHA/tree/signature/
  contract/advisory admitted (seven GitHub-owned plus the pinned Scorecard
  action); executable JavaScript Actions use Node 24 and CodeQL is a reviewed
  composite. All workflow action references are admitted and immutable.
- Registry identities: toolchain `d44d6035abea8c6451ee43d02ff16985b23cdfe2256047077b5f39329a6718a4`;
  dependencies `c9fe7192ad86d449abacceebd58069da1fd3d967628c75ed295772eb622efd0b`;
  Actions `89b972fbd775c7df981f28ce7f22fefebe4261f1917ffb67dce4c45606cef0d6`;
  external tools `1f70a9884bfc655c305f6c692dcc50e6c7c8a24c757a17fd6b9e297c43d642c9`;
  external inputs `46343a2c9377b08848e0a6404e1ee934161bea63e493f618113e0f6ce3d6da7a`;
  lock `2ee5b0e9182bf7417a8b180a5e793ac1863d549295d5d213ddca03afefb5e680`.
- Canonical task/check registry: `TASK-GRAPH-0001` has `26` reachable typed
  tasks and closure roots `gate:p2`/`gate:platform`; SHA-256
  `d714c9ada405cc6be31efb5f39cedfb3e3977e35a2a304cd77ace6dfd47ac380`.
  `REQUIRED-CHECKS-0001` has exactly `17` contexts; SHA-256
  `13164dfc9c0729180105e5e42816498967ca886e34a930661fddb75d3c9e4ea9`.
- GitHub/npm/external effective state: main ruleset `23705155` and tag ruleset
  `23705170` are active with no bypass. Main requires strict production by App
  `15368` of all 17 exact contexts, signatures, pull requests, linear history
  and resolved threads. Squash-only, auto-delete, read-default workflows,
  selected GitHub-owned/full-SHA Actions, no persistent secrets/variables/
  environments and the untrusted Dependabot flow remain effective.

### Verification and evidence

| Claim                              | test/oracle                                                                          | canonical task/job                                         | exact subject/environment                                                                 | result                                                                                                     | locator/digest                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ---------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Complete P2 implementation         | typed DAG and all P2 policies                                                        | `gate:p2`                                                  | `4445fc5914d59ff1f1685b24e5f8c9b973049273`, tree `52c54a57…`, Node 24.21.0/Python 3.13.15 | pass; development run correctly records a dirty-tree diagnostic before closure commit                      | output digest `6e9145e1b2c0dbed50b1fe18327ac033ae81e14024f2f635d2b295eb58813a5e`                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Required PR contexts               | 16 leaves plus always-run closure                                                    | all `Required ·` jobs                                      | PR `#12` head `55c02ca…`                                                                  | 17/17 pass                                                                                                 | run `35538372783`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Hardened cross-platform controls   | exact hosted OS/runtime matrix                                                       | all `Required ·` jobs                                      | PR `#22` head `ddc9aa6…`                                                                  | 17/17 pass                                                                                                 | run `35575365939`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Current Action runtime/admission   | exact pinned Node-24 Actions                                                         | all `Required ·` jobs                                      | PR `#24` head `4445fc5…`                                                                  | 17/17 pass; Node-20 warning eliminated                                                                     | run `35576097119`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Protected implementation main      | push path and squash attribution                                                     | all `Required ·` jobs                                      | `d2fe740f9793f6c59e7ba80d4099c7d120bb1632`                                                | 17/17 pass                                                                                                 | run `35576334044`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Protected P2 closure               | protected squash, branch deletion and hosted producers                               | 17 required; auxiliary jobs are event-specific             | PR `#25` head `3a082dbc…`; main `5d71bec…`                                                | 23/23 PR check-runs; 22/22 protected-push check-runs                                                       | PR workflow runs `35578325566`, `35578325622`, `35578325605`, `35578325623`, `35578325631` (17 required + 6 auxiliary jobs); main runs `35578500946`, `35578500955`, `35578500970`, `35578501031` (17 + 5 push jobs; performance is PR/schedule/manual)                                                                                                                                                                                                                                                                 |
| Final evidence-record validation   | protected documentation follow-up and current-tip read-back                          | 17 required; auxiliary jobs are event-specific             | PR `#26` head `41507fa…`; current main `8645735…`                                         | 23/23 PR check-runs; 22/22 protected-push check-runs; 86/86 audit; clean clone gate and platform gate pass | PR workflow runs `35579193720`, `35579193833`, `35579193827`, `35579193699`, `35579193666`; main runs `35579373749`, `35579373658`, `35579373741`, `35579373702`; audit `/tmp/p2-final-current-audit.json` SHA-256 `86670fc0b0096f7a7cf2be01b9f3a0cf0ab2b819e0bd289d36b366d3965efb13`; clean `gate:p2` output `52d3ddc6c322212f24aa6df07c218ddc8a42bea7077f0930b75c18a9f8b5c77e`, `gate:platform` output `e2f96f2e6cfb738bf2208a9bf764af11bded324e9b89d4672c95516898a8a5e4`, `test:policy` 29/29, `policy:docs` 533/533 |
| Effective GitHub state             | authenticated redacted comparison                                                    | `audit_github.py`                                          | subject `5d71bec…`, check subject `3a082dbc…`, observed `2026-09-21T08:38:36Z`            | 86/86 pass                                                                                                 | `/tmp/p2-final-audit.json` SHA-256 `cab9b11e5dde0a92f361836b53dbc2a2fa6e836befc64d88c1eefb9f453c3789`                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Deliberate falsifiers              | expected stable failure code per mutation                                            | `test:policy`                                              | implementation tree                                                                       | 29/29 reject for intended reason                                                                           | task report incorporated by `gate:p2`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Reproducible closed packages       | two isolated builds, allowlists, packed-only consumer                                | `package:reproducibility`, `integration:tarball-consumers` | implementation tree, `SOURCE_DATE_EPOCH=0`                                                | 3/3 byte-identical; 18 allowlisted entries; clean imports/deep-import rejection pass                       | core `694361716a4f66b37644ca07d58347924896f266e1cda0b5aafe1088290f1569`; adapter `0f59f26b4d88372a1e1067da984d90f9d26d5088ed7964d8c297869f5e51e1d6`; CLI `bbe6f1797b6f8f3ec66c76e784a4829596b8e4f968027f03647e05fd2170e9a4`                                                                                                                                                                                                                                                                                             |
| Reconciled supply-chain graph/SBOM | lock/install/package/Action/tool/runtime/data graph; official schemas and SPDX SHACL | `sbom:component-graph`, `sbom:documents`                   | 264 components / 500 relationships                                                        | counts reconcile; SHACL pass, 8,618 data triples                                                           | graph `40c2cfa51f7f38abc7d1c0da9beefc4e997d3c1c77ea5b7021335209ac6c7c6d`; CycloneDX `6f46ada7be5f7a57ba7683054f356fae52e5415b3bcae961cf59375153907785`; SPDX `8fd912d2f1cc43f4b46d9dd8ad0a280bf5684ed2811046a974e5133a5a797fa0`                                                                                                                                                                                                                                                                                         |
| Honest provenance                  | in-toto/SLSA-shape statement bound to source/tree, 3 subjects and 10 materials       | `provenance:rehearsal`                                     | implementation tree                                                                       | unsigned, nonpublishable, SLSA level `none`                                                                | SHA-256 `adc671bf59ea748328cda0948c6a413aa65031aec8fce1af792760d1d4213523`                                                                                                                                                                                                                                                                                                                                                                                                                                              |

- Coverage/mutation/fuzz: P2 contains deliberately empty package surfaces and
  no fiscal parser/state/branch population, so product coverage and mutation
  percentages are positively not applicable. The complete P2 control population
  is instead exercised by 29 maintained falsifiers. P3/P4 must establish new
  denominators when parser or fiscal behavior appears.
- Security/privacy/supply chain: CodeQL produced non-empty SARIF; Gitleaks scans
  complete history; OSV, dependency review, npm advisory/signature/licence,
  lifecycle/native/optional/registry/integrity checks pass. No taxpayer,
  customer, certificate, fiscal payload or persistent credential was used.
- Performance/reliability/recovery: P2 claims deterministic build/rebuild and
  bounded external-input retry only. Stable product benchmarks, soak, crash and
  recovery populations do not yet exist and are not represented as green.
- Package/integration matrix: all three tarballs are consumed without workspace
  access; Ubuntu/Windows/macOS and three admitted Node cells pass. The public
  Verification Engine dependency is exact and cache/install content is compared.
- Legal/regulatory/external: internal/tool evidence only. Licence provenance is
  reconciled; no legal advice, independent review, official edition, AEAT
  acceptance, supported compliance or publication assertion is made.

### Phase close control matrix

| Control family              | status | P2 proof / positive not-applicable boundary                                                                                           | owner               |
| --------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| Scope and requirements      | passed | P2-W1–W8, issue `#11`, three implementation PRs and this exact closure mapping                                                        | project-owner       |
| Identity and evidence       | passed | exact subjects/trees/runs/digests; every human commit signed+DCO; protected squashes verified                                         | repository-owner    |
| Toolchain                   | passed | exact admitted runtimes, packages, Python, scanners and external inputs                                                               | build-owner         |
| Task graph                  | passed | 26-task acyclic/reachable/single-producer DAG; declared capability enforcement and zero-work failure                                  | quality-owner       |
| CI and GitHub               | passed | exact 17 required contexts, auxiliary workflow architecture, closure, PR/main/bot events, least privilege and authenticated read-back | repository-owner    |
| Platforms                   | passed | Ubuntu 24.04 Node 22.14/22.23/24.21, Windows 2025 and macOS 15 Node 24.21                                                             | quality-owner       |
| Functional quality          | passed | complete declared P2 population: policy, package, consumer, SBOM and provenance tasks; no skipped cell                                | quality-owner       |
| Quantitative quality        | passed | no production/fiscal denominator exists; 29/29 material foundation falsifiers replace no percentage claim                             | quality-owner       |
| Security and privacy        | passed | SAST, secrets, OSV, npm/dependency/licence controls pass; no sensitive-data surface exists                                            | security-owner      |
| Performance and reliability | passed | applicable deterministic/retry controls pass; product workloads/SLOs are absent and explicitly downstream                             | performance-owner   |
| Compatibility               | passed | complete claimed P2 OS/runtime/package-consumer cells pass; no fiscal/provider compatibility claimed                                  | compatibility-owner |
| Supply chain                | passed | exact lock/admissions, clean builds/consumers, 264-node graph, dual SBOM and honest provenance                                        | supply-chain-owner  |
| Operations and law          | passed | no product operation/publication/legal claim exists; licence controls pass and external gates remain mapped downstream                | project-owner       |
| Negative assurance          | passed | 29 safe maintained fixtures reject every material requested mutation for its intended code                                            | quality-owner       |
| Closure                     | passed | no material P2 blocker/exception/unknown; PR `#25` checks, squash `5d71bec…`, deletion, protected push and 86/86 read-back complete   | project-owner       |

### Failures, corrections and review

- First failures retained: the foundation PR history contains portability and
  admission corrections. PR `#22` run `35539273814` failed Windows with
  `TREE_GIT` because a fixture-only operation invoked Git after its declared
  environment removed `PATH`; closure failed as designed. The exact correction
  changed fixture discovery to Node filesystem traversal while preserving Git
  discovery in the real tree policy. PR `#24` was triggered by hosted warnings
  that three admitted Actions still declared Node 20.
- Root causes/affected variants: undeclared fixture tooling affected Windows;
  outdated upload/download/dependency-review Action runtimes affected all hosted
  jobs. No failure was retried on an unchanged SHA.
- Corrections/regressions: `ddc9aa6` adds the Windows regression; `4445fc5`
  admits GitHub-verified upload `v7.0.1`, download `v8.0.1` and dependency-review
  `v5.0.0`, requires Node-24/composite runtime, expands contract/ancestry/
  advisory records and adds `NEG-ACTION-RUNTIME-001`.
- Invalidated evidence rerun: PR `#22` run `35575365939`, PR `#24` run
  `35576097119`, protected-main run `35576334044`, clean `gate:p2` and the final
  85/85 audit supersede their invalidated predecessors.
- Review: the single maintainer's zero-approval/no-CODEOWNERS policy remains
  intentional and effective. No absent external reviewer is invented.

### Traceability and residual state

- Requirements/ADRs/controls closed: P2-W1–P2-W8; ADR-0029–ADR-0038; the
  applicable repository/CI, architecture, supply-chain, quality, security and
  assurance controls named by the roadmap. This closes only the engineering
  foundation.
- Historical findings: REV-056, REV-063, REV-065–REV-072 and REV-075–REV-080
  are addressed by explicit empty-scope boundaries, exact subject evidence,
  safe tar inspection, packed consumers, isolated reproducibility, dual-SBOM
  reconciliation, inventory/licence/tool admission, tree/import controls,
  protected exact producers and unified local/CI task execution.
- Current findings: latest admitted `actions/download-artifact@v8.0.1` emits an
  upstream Node `DEP0005` warning during artifact download. It is owned by the
  supply-chain owner, does not alter bytes/results or indicate a vulnerable
  runtime, and must be re-admitted when upstream releases a correction. Open
  Dependabot PRs remain untrusted proposals; redundant Action proposals may be
  automatically closed after reconciliation and none is merged by bot authority.
- Risks/exceptions/open questions: repository-scoped authentication cannot read
  several organization-admin surfaces; these remain explicit 403/404 limits,
  not absence claims. No exception or risk acceptance was used to pass P2.
- Remaining committed scope: P3 official sources/editions/contracts/oracles;
  P4 fiscal core; P5 durable/AEAT operation; P6 public products; P7 assurance;
  P8 publication/support. None is implicitly implemented here.
- Deviations: none that reduce roadmap scope. Two corrective PRs increased
  reachability, artifact, SPDX, provenance, platform and Action-runtime strength.

### Recovery and next phase

- Recovery point/procedure: closure point `5d71bec…` (tree `9574ed…`); recover only via a
  new bounded signed+DCO protected PR. Rebuild from exact lock/toolchain,
  regenerate/compare tarballs and SBOMs, run both closure roots, then repeat the
  authenticated GitHub read-back. Force/deletion/bypass remain unavailable.
- Exit evaluation: clean install/tasks pass; cycles, orphans, duplicate
  tasks/producers, undeclared tool/network/write, missing/stale/empty reports,
  generated edits, mutable Action/dependency, package leak and nonreproducible
  output fail; all 17 contexts are produced on human PR/main and live bot path
  classes; tarballs, consumers, graph, SBOMs and provenance reconcile.
- P3 prerequisites: derive and verify closure squash `5d71bec…`/tree `9574ed…`/parent,
  GitHub signature/DCO, all 17 final-head and push contexts, auxiliary producers,
  branch deletion and fresh 86-control audit. Then re-observe official AEAT sources, applicability,
  licences, immutable acquisition inputs and independent oracle availability.
- Exact first commands: fetch/prune; switch to clean protected `main`; inspect
  SHA/tree/parent/signature/trailer; verify closure PR/deleted branch and push
  run; install the exact lock with scripts/optional code disabled; install
  hash-locked Python requirements; run `gate:p2`; rerun `audit_github.py` against
  the exact closure subject and its final PR head.
- Priority P3 reading: this handoff and roadmap; `docs/02-regulatory/`,
  `docs/03-requirements/`, `docs/07-formats-cryptography/`, official-source and
  independent-oracle quality documents, `docs/13-repository-ci/`,
  `docs/14-supply-chain-build/`, applicable ADRs and REV-001–REV-006/008/019.
- Long-lead items: competent legal/RRSIF/CRA review, AEAT authorization and test
  access, certificate custody, npm namespace/OIDC, stable performance runner,
  independent technical/security assessment and recovery drills remain mapped
  to their downstream gates.

## Superseded prior-attempt phase records

The records below are retained verbatim as prior-attempt evidence and lessons.
They are not current-state claims, do not supersede the authority notice or the
2026-09-21 P2 closure above, and cannot authorize P3–P8 in this execution.

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
- Closure PR: `#24`, dedicated branch `docs/10-p2-closure`.
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

| Work ID             | Issue | Branch                                 | PR    | branch commits/signers/DCO                                                                                                                                          | squash SHA                                                              | result                                               |
| ------------------- | ----- | -------------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ---------------------------------------------------- |
| P2-W1–W3            | `#10` | `build/10-p2-tree-toolchain-packages`  | `#11` | `4df6866a08af373bce0e40ca45d3f36b777d8c79`; GitHub-verified SSH signature, matching DCO                                                                             | `ce837b97cb526e690d49705960e3cd8b40e91b7e`; verified GitHub GPG and DCO | pass                                                 |
| P2-W4–W8            | `#10` | `build/10-p2-ci-build-supply-chain`    | `#12` | `8f2c7e2`, `1e1d7ce`, `c01abba`, `596a194`, `11e99c4`, `ad248a4`; every commit GitHub-verified SSH with matching DCO                                                | `38b43f95a2637438af915a1edcd349dbd6206987`; verified GitHub GPG and DCO | pass after retained portability/security corrections |
| P2-W6/W8 correction | `#10` | `fix/10-p2-rehearsal-audit-boundaries` | `#13` | `7667753dcc4d80cfbcf90a7d123f6f5fe821370a`; GitHub-verified SSH and DCO                                                                                             | `c583bcf3d3f46576de53a0bb296f6cf706d61b28`; verified GitHub GPG and DCO | pass                                                 |
| P2-W7 completion    | `#10` | `build/10-p2-dependabot-flow`          | `#14` | `5fea8a93b82acb3cd645cb59ba7adfa1e724e0ff`; GitHub-verified SSH and DCO                                                                                             | `baa92d948912593d0dc5cb5ed361a4bd645f885c`; verified GitHub GPG and DCO | pass                                                 |
| P2 closure          | `#10` | `docs/10-p2-closure`                   | `#24` | `a9a6951fb3558c9b30f443971d1af83304f6f1f5` plus this final record commit, whose self-SHA is derived from the PR head; every human commit must verify as SSH and DCO | derived by P3 intake                                                    | pending only protected closure mechanics             |

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
  No RRSIF/VERI\*FACTU compliance claim, supported regulatory edition, AEAT
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
  legal RRSIF/VERI\*FACTU and CRA opinions, AEAT authorization/certificates/test
  endpoint, npm namespace/OIDC custody, stable performance runner, independent
  oracle/technical/security assessment and account/signing recovery. Their
  absence blocks only the mapped downstream exits and is never silently waived.

## P3 blocked closure — official sources, editions, contracts and independent oracles

### Identity and status

- Status: `blocked`. P3-W1–P3-W6 safe implementation and executable evidence are
  complete; the phase is not `evidence-complete`, no edition is approved and P4
  is not ready because five mandatory AEAT authorities remain unavailable.
- Started/closed (UTC): issue `#25` bounded P3; implementation merged through PR
  `#26` at `2026-09-15T20:53:49Z` and PR `#27` at
  `2026-09-15T21:18:52Z`. This record closes the safe implementation interval,
  not the external blockers.
- Input main SHA / tree:
  `50078eee5363c579ec8a9dca047d5cfc490b00c2` /
  `0d9177371099ac288e0248d70632da639345f526`, the final P2 closure.
- Implementation-complete main SHA / tree:
  `5d23cb7324874127686db0cff403170452c361fa` /
  `224bfc2d10b91512b7ac0391261c710bcb850a86`.
- Closure main SHA / tree: derived by resumed P3/P4 intake after this protected
  closure PR; a commit cannot embed its own identity.
- Closure PR: dedicated `docs/25-p3-closure` branch and protected PR derived from
  this record.
- Roadmap revision: `ROADMAP-DOC-0004`, P3-W1–P3-W6, with no reduction of source,
  custody, parser, generation, vector, oracle, drift or freeze scope.
- Documentation inventory digest: before this amendment, 412 current Markdown
  documents aggregate to SHA-256
  `73879525a80c29cf1f93b7f3045ea513b7f32949db5aae61421b313fc53ffe57`;
  117 immutable historical files remain unchanged. The next intake derives the
  final closure aggregate to avoid a self-invalidating statement.

### Readiness and sources

- Prerequisites and evidence: P2 closure PR `#24` is native-squashed at
  `50078eee5363c579ec8a9dca047d5cfc490b00c2`, signature-valid, DCO preserving
  and branch-deleted. Its four post-merge workflows passed before P3 acquisition.
  P3 used admitted Node `24.21.0`, npm `11.19.1`, Python `3.13.15` and
  hash-locked `pyshacl 0.40.1` environments.
- Re-observed mutable sources: bounded observation at `2026-09-15T13:16:10Z`
  covered BOE, AEAT, EUR-Lex and W3C authorities. Only authenticated,
  media-checked, size-bounded, no-redirect results entered quarantine; runtime
  generation and all oracles subsequently ran offline.
- Assumptions resolved/falsified: the production AEAT WSDL/XSD graph is
  structurally closable, but XSD enumerations do not replace the unavailable
  business-validation catalogue; a reachable page is not an authoritative
  payload; failed TLS is not permission to weaken validation; a separate parser
  can challenge the JavaScript generator without importing it; a blocked
  candidate is evidence, not authority to create fiscal artifacts.
- Initial risks/blockers: stale/partial authority, archive/current ambiguity,
  XML active content/exhaustion, remote/traversing imports, unsupported silent
  loss, generator/oracle common cause, hand-edited output, incomplete licences
  and false downstream completion. Controls fail closed for each class. Five
  external AEAT blockers remain.

### Work packages and protected history

| Work ID            | Issue | Branch                             | PR                       | branch commits/signers/DCO                                                                                          | squash SHA                                                                 | result                                          |
| ------------------ | ----- | ---------------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ----------------------------------------------- |
| P3-W1–W4           | `#25` | `build/25-p3-regulatory-contracts` | `#26`                    | `c0c0e2054e862eab122f2d4484fadbd4b3a289e6`; GitHub-verified SSH and DCO                                             | `577429df451e55a021b97a233b7b3af52fcf3164`; valid GitHub signature and DCO | pass; blocked candidate retained                |
| P3-W5–W6           | `#25` | `build/25-p3-independent-oracles`  | `#27`                    | `0b8c0d7f295149812b684a34023a6ea1ff7a5400`, `b6e303ece22e82344090d379a891a373d5fa0e52`; GitHub-verified SSH and DCO | `5d23cb7324874127686db0cff403170452c361fa`; valid GitHub signature and DCO | pass after CI environment correction            |
| P3 blocked closure | `#25` | `docs/25-p3-closure`               | derived from this record | verified SSH+DCO required                                                                                           | derived by resumed intake                                                  | records blockers; cannot establish P4 readiness |

Both implementation branches were automatically deleted after native squash.
There was no direct `main` push, bypass, force push, approval fiction,
CODEOWNERS requirement or second-person approval requirement.

### Implemented state

- Source custody: immutable snapshot
  `rrsif-2026-09-15+src.c0c6eb21f6d2`, 37 regular non-symlink objects,
  manifest SHA-256
  `b70fee25ac863a41141af9f04116b3f7ad87a1d847afefae64620a0fc901d84f`
  and closure SHA-256
  `2be623953f8ac58a35b5f686bc8d144e9998c2499756e4df00fb56500b1bf49f`.
  Every object has exact length, SHA-256/SHA-512, authority, role, URL,
  dependencies, licence and redistribution disposition.
- Licence closure references exactly `AEAT-MANUAL-TERMS`, `AEAT-REUSE-TERMS`,
  `BOE-REUSE-TERMS` and `W3C-SOFTWARE-DOCUMENT-NOTICE`; no unknown licence was
  silently accepted.
- Edition/contracts: immutable candidate
  `rrsif-2026-09-15-candidate.c0c6eb21f6d2`, five contracts, six public strict
  JSON Schemas and output closure
  `ddf049864e2ef8312c09ed4244f228670a903b8336ac264ee4cbf82b2604c2ed`.
  Status is `candidate`, `immutable=true`, `creationAllowed=false`, approval null.
- Generator: `RRSIF-CONTRACT-GENERATOR-0001`, configuration
  `db2de6827a9f8e2a899df09463b60c4e0bb3739c4b2291b6d57f702328a2189d`;
  catalogue access `517377ca...43d5`, generator `87c57cb0...502` and hostile
  parser `2473559b...748`. It closes 13 imports, 8 XSDs, one WSDL, 416 element
  declarations, 45 catalogues and 2 SOAP services.
- Hostile boundary: digest verification precedes parsing. DTD/entity/XInclude/
  processing instruction, invalid character/QName/namespace, duplicate expanded
  attribute, remote/path escape, missing import, namespace mismatch and every
  byte/depth/node/attribute/text overflow reject. Only the exact W3C XMLDSig DTD
  is stripped by a bounded scanner without expansion or retrieval.
- Independent oracle: Python `3.13.15` stdlib Expat implementation
  `e37f92be9fc6fd09874a8b462c79e5c4d369d40f313f82c5e1277213757296a8`,
  seed manifest
  `b22ebd92bb0142cb9fb2c5ef55277ab66dff219ae78613d92881a4e8bc46076e`.
  It imports no production parser/generator, authenticates all 37 objects and
  reconstructs document/import/field/facet/catalogue/SOAP/artifact/state results.
- Task/CI state: `TASK-GRAPH-0001` has 37 tasks; `gate:p3` executes 36 reports.
  CI quality, regulatory Conformance and non-publishing rehearsal use the same
  gate with pinned Python and hash-locked SPDX validation. The 17 required
  context names and zero-review solo governance remain unchanged.
- Product boundary: no fiscal domain, hash, XAdES, QR, XML emission, persistence,
  AEAT transport, public API or CLI behavior was implemented. Three package
  shells still expose zero public bindings; publication remains forbidden.

### Verification and evidence

| Claim                                  | test/oracle                                   | task/job                                                | subject/environment                          | result                                                   | evidence                                                                                       |
| -------------------------------------- | --------------------------------------------- | ------------------------------------------------------- | -------------------------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Bounded custody/licences               | 21 source cases                               | `policy:regulatory-source-negative`                     | snapshot `rrsif-2026-09-15+src.c0c6eb21f6d2` | pass; 37 sources, 7 blockers, 4 licences                 | PR `#26`; closure `2be62395...49f`                                                             |
| Hostile offline import                 | 20 XML cases                                  | `security:regulatory-xml`                               | 9 technical documents                        | pass; no network                                         | PRs `#26`/`#27` reports                                                                        |
| Deterministic generation               | 16 generation/invalidation cases              | `contract:regulatory-generation`, `generate:checked-in` | Node `24.21.0`                               | pass; two byte-identical runs, no diff                   | output `ddf04986...c2ed`                                                                       |
| Independent challenge                  | Python/Expat plus 10 seeds                    | `oracle:regulatory-independent`                         | Python `3.13.15`, Expat `2.8.2`              | pass; 10/10 defects detected                             | oracle `e37f92be...296a8`; seeds `b22ebd92...6076e`                                            |
| Requirement/predecessor accountability | matrices plus 9 falsifiers                    | `policy:p3-traceability`                                | 19 requirements, 8 findings                  | pass; 10 enforced, 1 preventive, 6 blocked, 2 downstream | matrices `850d3c11...5eaf`, `118bf5cc...0fb`                                                   |
| Complete repository gate               | all inherited/P3 controls                     | `gate:p3`                                               | clean Node `24.21.0` / Python `3.13.15`      | pass; 36 reports                                         | PR `#27` CI/Conformance                                                                        |
| Protected exact-head closure           | required checks plus Performance/inner CodeQL | 17 `Required ·` contexts                                | PR `#27` head `b6e303e`                      | 17/17 plus both additional checks pass                   | CI `35024695609`, Security `35024695586`, Conformance `35024695585`, Performance `35024695699` |

- Coverage/mutation/fuzz scope: 20 XML, 21 source, 16 generation, 10 oracle and
  9 traceability cases plus inherited foundation/supply-chain falsifiers. Ten
  oracle mutations cover each independent critical comparison. No percentage or
  fiscal mutation claim is made because P4 fiscal code does not exist.
- Security/privacy/supply chain: parsing/generation is offline; no secrets or
  personal/fiscal production data exist; full-history secret scan, CodeQL, OSV,
  dependency review, npm audit/signatures/licences and SBOM/SHACL pass. P3 adds
  no dependency.
- Performance/reliability/recovery: the gate includes correctness-guarded clean
  builds, reproducible packages/SBOM/provenance and bounded parser inputs. These
  are not represented as production fiscal throughput or recovery evidence.
- Independence: official custody is first party; the Python oracle is
  implementation-independent, not organizationally or legally independent. No
  legal compliance, external AEAT conformance or assessment claim is made.

### Failures, corrections and review

- Retained failures: local gate first used the stdlib-only Python wrapper and
  failed inherited SPDX SHACL because `pyshacl` was intentionally absent; the
  full locked wrapper passed. PR `#27` first head exposed that promoted
  Conformance installed Python but not the hash-locked SPDX validator.
- Root cause: promoting Conformance from `gate:p3-contracts` to `gate:p3` made
  inherited P2 SPDX semantics transitive. CI quality and release rehearsal
  already installed it; Conformance did not.
- Correction/regression: signed+DCO `b6e303e` added the identical
  `--require-hashes --only-binary=:all:` install. The new exact head reran every
  context; regulatory Conformance passed in 78 seconds and the failed run remains.
- Review: the owner authorized P3 execution. No external review was invented;
  zero approvals are approved solo governance. Merges depended on executable
  checks, verified signatures/DCO and exact read-back.

### Traceability and residual state

- P3 matrix: `REG-0010/11/12/16/17/18/21/23/25/30/31/70/71/72` and
  `SEC-0010/11/12/16/70` map to sources, blockers, contracts and task IDs.
  the prior extraction record and its non-claim boundary.
- Historical findings: REV-006 is verified prevented for P3 custody/regeneration;
  REV-001/002/004/005 remain blocked; REV-003/008/019 continue to P4. No finding
  is deleted or globally claimed fixed.
- Mandatory blockers: `AEAT-RECORD-DESIGN-PAYLOAD` and
  `AEAT-VALIDATION-CATALOGUE-PAYLOAD` expose no authoritative artifact;
  `AEAT-HASH-SPECIFICATION-PDF`, `AEAT-SIGNATURE-SPECIFICATION-PDF` and
  `AEAT-QR-SPECIFICATION-PDF` fail the admitted TLS certificate chain. TLS was
  not disabled and archived bytes were not substituted.
- Other observations: fresh EUR-Lex GDPR/CRA snapshots returned unstable
  interstitial content and remain blockers for later mapped phases; they do not
  grant or remove P3/P4 authority.
- Exit evaluation: origin/digest/licence is complete for admitted bytes;
  generation, unsupported rejection, seeded oracle and no live runtime source
  pass. Mandatory-source completeness fails, so P3 remains blocked, no edition
  is approved and `creationAllowed=false` remains mandatory.

### Recovery and next phase

- Recovery point: protected `5d23cb7`. Recovery uses a scoped SSH-signed+DCO PR
  and native squash; immutable snapshot/candidate directories are never edited.
- Invalidation: any source plan/byte/dependency/licence/parser/generator/schema/
  oracle/seed/matrix/blocker change requires a successor identity and full rerun.
- Unblock procedure: re-observe with normal TLS and bounded acquisition; admit
  all five authorities into a new quarantine closure; resolve licences and
  dependencies; promote a successor snapshot/candidate; generate only sourced
  semantic/hash/signature/QR contracts; add independent vectors/oracles; rerun
  all negative/drift gates; merge a new protected closure.
- P4 MUST NOT start while blocked. It becomes ready only after zero mandatory
  AEAT blockers, an approved edition with explicit creation policy, complete
  requirement-to-contract/oracle mapping and protected final-main read-back. No
  deadline or exception can waive these facts.
- Resume by fetching/pruning `main`; verify closure PR/signature/DCO/deleted
  branch/post-merge workflows; run `gate:p3`; perform bounded source observation;
  compare all identities before creating a successor. If authority is still
  unavailable, refresh the observation and retain `blocked` without P4 code.

### Amendment P3-001 — closure identity read-back

- Superseded statement: the P3 work-package table above names the PR `#26`
  branch as `build/25-p3-regulatory-contracts`; GitHub's immutable PR record
  proves its actual head branch was `build/25-p3-source-custody`.
- Reason and actor: final requirement-by-requirement completion audit by Codex
  compared the handoff with GitHub after PR `#28` merged and detected the naming
  mismatch. No source, contract, test or phase-status evidence is affected.
- Correct identity: PR `#26`, head
  `c0c0e2054e862eab122f2d4484fadbd4b3a289e6`, branch
  `build/25-p3-source-custody`, squash
  `577429df451e55a021b97a233b7b3af52fcf3164`; the remote branch is deleted.
- Closure read-back: PR `#28`, head
  `64ff30a6bba67c167b0ee193fc1bfe035a4ab57e`, branch
  `docs/25-p3-closure`, squash
  `3e58deeccc1ea35c88da32dad9336b33df28c170`, tree
  `1b6b57e4960ca42210356f87c3eec0c8b898e205`, one parent `5d23cb7`; GitHub
  verifies the native squash signature and retained DCO, and the branch is
  deleted.
- Final-main evidence: push runs CI `35025796522`, Security `35025796626`,
  Conformance `35025796503` and Performance `35025796520` all completed
  successfully on exact SHA `3e58dee`. Issue `#25` remains open by design as the
  authoritative external-blocker record.
- Disposition: current capsule and phase ledger now contain the derived closure
  identity. P3 remains `blocked`; this amendment does not approve an edition,
  authorize fiscal creation or make P4 ready.

### Amendment P3-002 — 2026-09-16 source-observation correction

- Statement corrected: the blocked-source summary stated that the record-design
  and validation discovery pages exposed no authoritative artifact link. The
  immutable captured pages and a fresh P4 intake observation both contain an
  explicit AEAT link to the corresponding payload on the legacy
  `www.agenciatributaria.es` host.
- Correct value and reason: both linked HTML payloads are unavailable through
  the admitted channel because normal TLS validation fails before HTTP with
  curl exit `60`, OpenSSL verify result `68` and `CA signature digest algorithm
too weak`. The three linked hash, signature and QR payloads fail identically.
  This corrects the first two reason descriptions; it does not remove a blocker.
- Discovered by / actor: Codex P4 intake on `2026-09-16T06:10:39Z`, while
  validating observed reality against the handoff before implementation.
- Evidence locator and digest: the five authenticated discovery-page byte
  lengths and SHA-256 values, target diagnostics and alternate-host `404`
  observations are recorded in
  [`open-questions-and-blockers.md`](open-questions-and-blockers.md).
  Fresh `gate:p3` executed 36 reports successfully on protected SHA
  `3ed7436d4898f80b1d39365b9381232f1851ee28` with Node `24.21.0`, npm
  `11.19.1` and Python `3.13.15`; its result still reports seven blocked sources,
  six blocked requirements and `creationAllowed=false`.
- Affected requirements, phases, releases and claims: `REG-0011`, `REG-0018`,
  `REG-0021`, `REG-0023`, `REG-0025`, `FUN-0010`–`FUN-0019`, P3 and P4. P3
  remains `blocked`; P4 remains `planned` and not ready; no release or fiscal
  creation claim is authorized.

### Amendment P3-004 — 2026-09-16 semantic extraction and activation closure

- Superseded current statements: the active capsule and Amendment P3-003 said
  that the admitted AEAT workbook, validation/error catalogue, fingerprint,
  XAdES/PKI and QR authorities were still pending. That was true at the
  successor-custody transition and remains immutable historical evidence; it is
  no longer the current P3 state.
- Active successor: `rrsif-2026-09-16-active.dc3f7e967b00`, derived from the
  immutable snapshot `rrsif-2026-09-16+src.e29c003123dc` and overlay digest
  `dc3f7e967b00250cd62b60fc80dd6aaca515e91497ece15a3c95ae8a94e0403c`.
  The descriptor is immutable, `status=active`, `creationAllowed=true`, has
  explicit decision `P3-ACTIVATION-0001` and no creation blockers. The former
  candidate remains immutable, unapproved and non-creating.
- Semantic contract: `contracts/semantic-overlay.json` contains the complete
  11-sheet record-design workbook extraction, 247 live error codes, 12
  source-located validation groups, temporal cutover, three official SHA-256
  fingerprint preimage/digest vectors, XAdES-EPES target/reference/transform/
  algorithm/policy/certificate contract, authenticated signature-example
  identities and QR endpoint/content/rendering contract. Official statements,
  Noeos hardening and downstream P4 implementation are explicitly separated.
- Independent evidence: the Python 3.13.15 stdlib/Expat oracle authenticates 44
  source objects, reconstructs 416 structural declarations and 45 catalogues,
  independently parses the workbook/error catalogue/signature examples,
  recomputes all three fingerprint vectors and detects 17/17 seeded defects.
  `generate:checked-in`, regulatory state and the nine traceability falsifiers
  pass; traceability reports 19 requirements, zero pending/blocked P3 statuses,
  five verified-prevented historical findings and three downstream findings.
- Schema compatibility: the historical v1 public bundle schema is untouched;
  the active edition uses the new strict v2 bundle schema so immutable historical
  descriptor identities remain valid. Six active public schemas remain closed;
  lifecycle negatives prove inactive editions cannot authorize creation.
- Boundary: this transition authorizes P4 to implement edition-bound fiscal
  behavior. It does not claim that packages, XML/XSD runtime validation,
  fingerprint/chaining runtime, XAdES/PKI provider, QR renderer, Verification
  Engine adapter, AEAT transport, legal declaration or product publication are
  complete. Those claims remain owned by P4–P8 and their evidence gates.
- Protected closure mechanics: this amendment must be merged through a
  GitHub-protected SSH-signed+DCO PR with final-head required checks, squash to
  `main`, automatic branch deletion and post-merge read-back. The exact PR,
  squash/tree identities and workflow run IDs are appended after GitHub closes
  that transition; until then P4 source remains unstarted.
- Evidence/exits invalidated: the historical snapshot stays immutable, but its
  `OFFICIAL_PAGE_HAS_NO_ARTIFACT_LINK` explanation must not be repeated as the
  current cause. P3 completion and every P4 exit remain unsatisfied until a
  successor snapshot admits all five payload bytes and closes their dependent
  contracts and independent oracles.
- Remediation and protected PR: this append-only correction plus the live
  blocker summary enter through issue `#25` and a signed+DCO protected PR. The
  resulting squash SHA, checks and branch deletion are derived by the next
  intake; no P4 production source is added by this correction.

### Amendment P3-003 — 2026-09-16 successor source custody

- Statements superseded: Amendment P3-002 correctly described the OpenSSL TLS
  failure observed at `2026-09-16T06:10:39Z`, but its live conclusion that five
  AEAT authorities were unavailable is no longer current. The historical
  snapshot/candidate and earlier prose remain immutable evidence of what was
  known then; they are not rewritten or presented as the selected edition.
- Discovery and decision: Microsoft Edge and the Microsoft-signed Windows
  `curl.exe` 8.21.0 Schannel backend validated the legacy host through their
  ordinary platform trust path. A new versioned importer was admitted rather
  than weakening OpenSSL, disabling verification, copying browser cache or
  replacing the authoritative origin. The acquisition requires
  `ssl_verify_result=0`, TLS 1.2 or later, no proxy, no redirect, exact media and
  magic, bounded bytes and both SHA-256/SHA-512.
- Transport identity: `windows-curl-schannel-v1`; executable 818,512 bytes,
  SHA-256
  `73d24149ff289afc49ec41f08918ef9faa727d39ad993e929757dc2ddafab805`;
  Authenticode status `Valid`, signer `Microsoft Windows`, thumbprint
  `DC91E564D5BC1E3A8E02D6A8508682ABEA8A2443`. Configuration SHA-256 is
  `249f5f72e7576e64b9a3332846a092146be531edf60ea99f646752e43671928c`.
- Tool identities: Schannel acquisition
  `d6c8cd3b235980dd15b780682946ac2456407fb6ccd13f76fc8218139c4554f7`;
  offline promotion
  `e64168a41ad66aac3cfde1241ba3e16bfb1232122ea06ff1ef9cacad15c4aab0`;
  successor generator
  `b2f2dd9b28abf6fa980b13241ab1b780036fb8ec8ff785fafb4d9e8b0e4a8cd8`.
  Each identity is authenticated by the succeeding transition before bytes are
  admitted or generated.
- Source transition: plan canonical SHA-256
  `e29c003123dc49b62854a32874c5ea1805177b6997a113e1dfbadb4596ef3b32`
  produced immutable snapshot
  `rrsif-2026-09-16+src.e29c003123dc`, descriptor SHA-256
  `29cb6c94a11df22957e09fb16e51d25429e5729a905bae7dc0cc1575e19cc36d`,
  with 44 sources and closure
  `70d5d94c33f9bd307d8d36f6fe806bccb08e7cad4808af555d16d057b954de5b`,
  manifest
  `d85dc6012cb46c9b7ba11012bc5566916b125a3f78a96a8e22b7cc267da2b64d`
  and custody evidence
  `b07610260f2f48fc749e77dad3b9a2506c79acccf424a3452db471cd35751878`.
  It adds the record workbook, validation PDF, live error properties, hash PDF,
  signature PDF/examples ZIP and QR PDF, and admits the observed updated
  consolidated RD 1007/2023 bytes. Promotion normalizes every retained data file
  to mode `0644`, preventing executable-bit inheritance from the Windows source
  mount.
- Candidate transition: generator `RRSIF-CONTRACT-GENERATOR-0002` produced
  `rrsif-2026-09-16-candidate.e29c003123dc`, descriptor SHA-256
  `7a4503ab03b2d271c944fbdd1523349e9b1b955d875780922d63d4e2e72b1a93`
  and output closure
  `ba88247d8095ad4b26228975c1ddb55cc85ec88a531ac12ab373a5c70471a499`.
  Its structural counts remain nine technical documents, thirteen imports, 416
  fields, 45 catalogues and two SOAP services. It is immutable, unapproved and
  `creationAllowed=false`.
- Cross-runtime determinism correction: the first PR head exposed that generator
  v2 recorded the executing Node version, so the compatibility jobs produced
  different canonical bytes under Node `22.14.0` and `22.23.2`. The admitted
  primary runtime is now an explicit, schema-validated configuration input
  (`node 24.21.0`) shared by both generator stages; it is not ambient process
  state. Configuration SHA-256 is
  `60091b8b335c05119abcfb4754e20dfd93856491bcd2050cc1081376816e6b8b`.
- Executable evidence: `policy:regulatory-source-negative` passes 25 cases over
  37 historical and 44 successor sources; `security:regulatory-xml` passes 20;
  `contract:regulatory-generation` passes 16 with byte-identical no-network
  generation; the independent Python/Expat oracle authenticates all 44 sources,
  reports zero baseline differences and detects 10/10 seeded defects; the nine
  traceability falsifiers pass. Full `gate:p3` passes 36 reports on Node
  `24.21.0` and Python `3.13.15`.
- Correct status and residual work: acquisition is no longer an external P3
  blocker. The two deferred EUR-Lex observations map only to later legal phases.
  P3 is `active`, not evidence-complete: source-located semantic/error,
  fingerprint, XAdES/PKI and QR extraction, independent vectors/attacks and an
  explicit approved/active edition transition remain. No P4 source, fiscal
  artifact authority, publication or legal compliance claim is created here.
- Invalidated instruction: do not keep re-observing the five AEAT payloads as
  unavailable and do not begin P4. Resume by verifying the protected
  successor-custody PR/signature/DCO/checks/branch deletion, then complete the
  remaining P3 semantic and activation work in separate signed+DCO vertical
  PRs. The successor-custody squash SHA and post-merge runs are self-referential
  here and must be added by the next protected intake.

### Amendment P3-005 — 2026-09-16 protected semantic activation closure

- Protected identity: PR `#32` carried signed+DCO head
  `7bdd185d55f3aee97a428204638fa4d7b7961a6a` from branch
  `build/25-p3-semantic-edition-activation`. GitHub merged it with protected
  squash as `608f74b366aaaec21b24e3b322618a2d0ac6e1e2`; the native GitHub
  signature and DCO are valid and the source branch was automatically deleted.
- Final-main read-back: protected `main` is exactly
  `608f74b366aaaec21b24e3b322618a2d0ac6e1e2`, tree
  `b755d2dbdb3c3c4b272d413e502acba4ae3ff023`, with sole parent
  `70abda6ff11e288d8bf2a7a1c106e7e6e82befbc`. The local checkout fast-forwarded
  to that object without uncommitted implementation changes before this
  append-only handoff update.
- Required evidence: CI run `35135106587`, Security run `35135106687`,
  Conformance run `35135106786` and Performance run `35135106662` completed
  successfully on the PR head; the inner CodeQL check was also successful
  (`104925640990`). The required-check closure job
  `104925867120` passed after all required contexts completed.
- Closure result: P3 is now protected `evidence-complete` for source custody,
  semantic contract generation, active-edition lifecycle and independent
  oracle scope. The 17-seed oracle baseline remains zero-difference and all
  17 seeded defects are detected. This amendment does not claim fiscal runtime,
  XML/XSD runtime provider, XAdES/PKI, QR implementation, Verification Engine
  adapter, AEAT transport, publication or legal certification.
- Next-phase authorization: P4 may start from this exact `main` head. Its first
  context must re-read the complete handoff and roadmap, assert the active
  edition identity and rerun the P3 gates before adding production source.
  Facturacion does not exist and is not an input or integration dependency.

## P4 closure — deterministic fiscal core and verification boundaries

### Identity and status

- Status: `evidence-complete` for the P4 scope in `implementation-roadmap.md`.
- Started/closed (UTC): `2026-09-16T18:58:32Z` / `2026-09-16T19:29:52Z` protected merge; handoff closure follows in a dedicated PR.
- Input main SHA / tree: `608f74b366aaaec21b24e3b322618a2d0ac6e1e2` / `b755d2dbdb3c3c4b272d413e502acba4ae3ff023`.
- Closure implementation SHA / tree: `b6ffbe95b4d33038fc19e2c77d493295dcc88ff2` / `c2ac8b5978d6be66ccf8e60ae83aae1dd44645c7`.
- Closure handoff SHA / tree: `fd4b81640332a0d4f2169155d0f6f2d37ea0c1b6` / `2fd9fc9f1fa44f554e0cc94d4963f27c0a9a4a45` (protected PR `#38`).
- Closure PR: implementation PRs `#34`–`#37`; this handoff is the protected closure PR for the phase.
- Roadmap revision: `ROADMAP-DOC-0004`, P4-A through P4-G.
- Documentation inventory digest: derived by the closure task; no secrets or payloads are embedded here.

### Readiness and sources

- Prerequisites and evidence: protected P3 semantic activation (`#32`), active edition `rrsif-2026-09-16-active.dc3f7e967b00`, source snapshot `rrsif-2026-09-16+src.e29c003123dc`, and admitted `@noeos/verification-engine@1.0.1` tarball SHA-256 `74e2449b5bab61ee62bdedc0355567461b33eadf15338f7d3265207bd28395f8`.
- Re-observed mutable sources/dependencies: GitHub protected state, package lock, edition descriptor and public Verification Engine exports were re-read before each protected PR; no private/internal Engine import is used.
- Assumptions resolved/falsified: Facturacion is not built and is not a dependency; all clock, randomness, storage, network and key material enter through explicit ports; QR/XSD/signing backends cannot silently elevate their own results.
- Initial risks/blockers: historical semantic omissions, ambient authority, byte drift, XML entity/namespace attacks, signature wrapping and public-export drift were converted into bounded contracts and negative tests.

### Work packages and protected history

| Work ID       | Issue      | Branch                      | PR    | branch commits/signers/DCO                                                                      | squash SHA                                 | result |
| ------------- | ---------- | --------------------------- | ----- | ----------------------------------------------------------------------------------------------- | ------------------------------------------ | ------ |
| P4-A          | roadmap P4 | `build/27-p4a-domain-core`  | `#34` | `3c5bb56e5d3b4e35bf9d3f3a0d7fb20bf63c40c9`, SSH+DCO                                             | `0e3ffaf88cd60ad0d06658f7b387c287ab66fc27` | pass   |
| P4-B/C/D/E/F  | roadmap P4 | `build/28-p4b-xml-qr`       | `#35` | `fd6cef5786749aaa64bf8d23ab32e7fb2a2c002f`, `14abbffeaed67ab17f41ec400eed53dc0f0bc0b9`, SSH+DCO | `d7ccbff222f90b220545689568460165f8bc32b6` | pass   |
| P4-C provider | roadmap P4 | `build/29-p4c-xsd-provider` | `#36` | `8a8c748976ba82689bf7742ab541a81522cf8777`, SSH+DCO                                             | `71dafd150175469c6b6f4d60a13ba55e2c405b31` | pass   |
| P4-G          | roadmap P4 | `build/30-p4g-gate-attacks` | `#37` | `cc8ae46b1670418109bd93e6f5cc6c46ff231074`, SSH+DCO                                             | `b6ffbe95b4d33038fc19e2c77d493295dcc88ff2` | pass   |

### Implemented state

- Components and behavior: branded decimal/date/time/identifier values; fiscal context and mode tenure; alta/anulación/event records; immutable chain heads and fingerprints; effect-free plans with explicit head tokens/expiry; byte artifacts and monotonic states; deterministic XML projection/escaping; closed offline XSD provider; XAdES/PKI provider contracts with exact reference/algorithm/certificate checks; QR canonical content plus bounded SVG rendering/decode provider; distinct official/cryptographic/AEAT/Noeos claims; public Verification Engine `dev.noeos.jcs` adapter.
- Paths/files: `packages/verifactu/src/domain/{artifact,claims,context,edition,integrity,lifecycle,offline-xsd,operations,pki,qr,records,result,scalars,verification-engine,xades,xml}.ts`, package allowlists/counts, P4 contract and fiscal attack tests, task graph and required workflow gates.
- Public API/diagnostics: 149 admitted source bindings and 55 runtime bindings; all failure paths use versioned `DIAG-*` results; no internal/oracle exports.
- Schemas/formats/editions: active edition fingerprint/XAdES/QR profiles are consumed immutably; UTF-8, uppercase SHA-256, canonical decimals/dates, XML control/entity rejection, QR duplicate/unknown/canonical checks and provider identities are enforced.
- Persistence/migrations/compatibility: deliberately none; P5 owns durable state, UoW, outbox and migrations.
- Toolchain/dependencies/Actions: exact existing Node/npm/TypeScript matrix; only admitted Verification Engine dependency; required quality/regulatory/release jobs now execute `gate:p4`.
- GitHub effective state: protected squash-only `main`, zero approvals/CODEOWNERS, SSH signatures+DCO, auto-delete and all required checks green for every PR.

### Verification and evidence

| Claim/requirement                                  | test/oracle                                           | canonical task/job                                         | subject/environment                | result | evidence locator/digest                                     |
| -------------------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------- | ---------------------------------- | ------ | ----------------------------------------------------------- |
| Domain/plan/artifact/XML/QR/claims/Engine contract | `tests/contract/p4-domain-core.mjs` (26 assertions)   | `contract:p4-domain` through `gate:p4`                     | Node 22/24 CI matrix               | pass   | PR #37 required contexts; head check closure `104944730320` |
| Hostile XML/XSD/XAdES/PKI/QR/expiry/CAS cases      | `tests/security/p4-fiscal-attacks.mjs` (9 assertions) | `security:p4-fiscal` through `gate:p4`                     | network denied, explicit providers | pass   | PR #37 head `cc8ae46b...`; closure `104944730320`           |
| Package/API and clean consumers                    | shell/build/pack/tarball consumer tasks               | `package:reproducibility`, `integration:tarball-consumers` | ESM/CJS/types, clean install       | pass   | PR #35/#37 checks; runtime 55 bindings                      |
| Cross-platform deterministic gates                 | canonical task graph                                  | required Ubuntu/Windows/macOS contexts                     | Node 22.14.0, 22.23.2, 24.21.0     | pass   | PR #37 all required contexts and Performance/CodeQL         |

- Coverage/mutation/fuzz: P4 critical branches are exercised by positive, boundary and seeded hostile tests; full mutation/fuzz campaigns remain a P7 assurance obligation and are not falsely claimed here.
- Security/privacy/supply-chain: no ambient imports, raw keys, network/storage or taxpayer payloads in the core; parser/entity/wrapping/resource and export-drift negatives pass; CodeQL, OSV, dependency review, secret scan and npm admission pass.
- Performance/reliability/recovery: bounded byte/depth/node limits and deterministic build smoke pass; durable crash/recovery and long-run performance belong to P5/P7.
- Package/tarball/integration: allowlisted reproducible tarballs install in a clean consumer with exact public ESM/CJS/type identities and no CLI binary.
- Legal/regulatory/external observations: official semantic and source claims are inherited from P3; P4 does not claim AEAT acceptance, legal opinion, certificate issuance or publication authorization.

### Failures, corrections and review

- First failures retained: initial PR #35 failed every format-gated job because local formatting used default Prettier options; QR attack test initially accepted noncanonical decimal input.
- Root causes and affected variants: formatter configuration drift; parser validated percent encoding but not fiscal lexical canonicality.
- Corrections/regressions: repository Prettier config was applied in signed follow-up commit `14abbff...`; QR parsing now re-parses and compares canonical NIF/series/date/amount; PR #35 was rerun green and PR #37 added the regression.
- Invalidated evidence rerun: all PR #35 checks reran after formatting; PRs #36 and #37 passed required-check closure, platform matrix, conformance, Performance and CodeQL.
- Review conversations: protected branch policy, zero-approval solo governance and no-CODEOWNERS decision remain unchanged and were re-read by the governance job.

### Traceability and residual state

- Requirements/ADRs/controls closed: P4-A through P4-G in the implementation roadmap; domain/operations/artifact/XML/XSD/XAdES/PKI/QR/claims/Engine documents and mapped historical findings REV-002–027, REV-045–046 are represented by code/tests or explicit downstream boundaries.
- REV findings disposed: ambient authority, public-export drift, byte custody, canonical lexical drift, XML hostile constructs and signature wrapping are prevented or detected by executable controls.
- Current findings: real host XSD/XAdES/PKI/QR backend capability admission, durable persistence, AEAT transport, legal review, full mutation/fuzz campaigns and publication remain open downstream.
- Risks/exceptions/open questions: provider implementations are untrusted until their returned bytes/reports pass independent verification; no external certificate, AEAT credential or Facturacion system is assumed.
- Explicit remaining committed scope: P5 durable stores/UoW/recovery and edition-bound AEAT wire orchestration; P6 adapter kit/CLI/public package cells; P7 whole-product assurance; P8 publication/support.
- Deviations from roadmap and authority: none; provider boundaries are deliberately explicit to avoid ambient authority and do not waive the normative P4 contracts.

### Recovery and next phase

- Recovery/revert point: protected `main` `b6ffbe95b4d33038fc19e2c77d493295dcc88ff2`; revert/forward-recovery must use a new SSH-signed+DCO PR and rerun `gate:p4`.
- Exit-criteria evaluation: P4 gate, contract, hostile security, package, platform, regulatory and required-check closure evidence all pass; public release/legal/AEAT claims remain forbidden.
- Next phase and exact prerequisites: P5; re-read `08-persistence-consistency`, `09-aeat-integration`, `06-contracts/host-transaction-contract.md`, verify the active edition and Verification Engine tarball, then run `gate:p4` before adding ports.
- Exact first commands/observations: `git fetch origin main --prune`; verify `git rev-parse origin/main` equals `b6ffbe95...`; inspect `git status --short`; run `node tooling/tasks/run-task.mjs --task gate:p4` under the admitted Node/Python profile; inspect GitHub effective protection.
- Priority documents to reread: `implementation-roadmap.md`, `08-persistence-consistency/`, `09-aeat-integration/`, `06-contracts/host-transaction-contract.md`, `05-architecture/determinism-and-io.md`, `07-formats-cryptography/byte-artifact-lifecycle.md`.
- Long-lead items: legal/RRSIF review, AEAT test credentials/certificates and endpoint observations, provider capability admission, independent cryptographic/XML/QR readers, crash/recovery harness and future-Facturacion synthetic host contract.

### Amendment P4-001 — 2026-09-16 protected handoff identity

- Statement corrected: the initial P4 closure record necessarily named the
  implementation merge `b6ffbe95...` because a commit cannot contain its own
  final SHA; the current-context capsule therefore did not yet identify the
  handoff commit itself.
- Correct value and reason: protected handoff PR `#38` had signed+DCO head
  `a3caf98f0d2090fb2b359faee92cf3c9df5b6bc7` and native squash
  `fd4b81640332a0d4f2169155d0f6f2d37ea0c1b6`, tree
  `2fd9fc9f1fa44f554e0cc94d4963f27c0a9a4a45`, parent
  `b6ffbe95b4d33038fc19e2c77d493295dcc88ff2`.
- Discovered by / actor: Codex phase-closure read-back on `2026-09-16T19:35:01Z`.
- Evidence locator and digest: GitHub PR `#38`; all required contexts,
  `gate:p4`, Performance and CodeQL passed; required-check closure was
  observed on the PR head before merge.
- Affected requirements, phases, releases and claims: P4 handoff identity
  only; no implementation, legal, AEAT, publication or Facturacion claim is
  widened.
- Evidence/exits invalidated: none; the implementation evidence remains bound
  to `b6ffbe95...` and the current phase input is now bound to `fd4b816...`.
- Remediation and protected PR: this append-only amendment is merged through a
  new SSH-signed+DCO protected PR; its final SHA is derived by the next intake.

## P5 implementation candidate — unprotected working record

- Scope: roadmap P5-A through P5-G; this record is not a phase closure and has
  no protected identity until the implementation and closure PRs pass all
  required checks.
- Re-read and binding: `docs/08-persistence-consistency/`,
  `docs/09-aeat-integration/`, `docs/06-contracts/host-transaction-contract.md`,
  the active edition `rrsif-2026-09-16-active.dc3f7e967b00`, and the P4 public
  core were inspected before implementation.
- Candidate implementation: the public core now exposes provider-facing
  persistence ports, an atomic standalone test adapter with CAS, idempotency,
  journal, outbox leases/fencing, indeterminate delivery, reconciliation,
  checkpoints, rollback detection, schema migration, backup/restore and
  retention dry-run; it also exposes exact edition-bound AEAT request/response
  boundaries, certificate authorization, identity headers, one-observation
  transport, retry decisions, correlation and a synthetic local peer.
- Local evidence currently passes: P5 contract (29 assertions), boundary
  security (8), and recovery performance (100 records). The peer is local and
  synthetic; no AEAT acceptance, live certificate, private key, taxpayer
  payload or external portal result is claimed.
- Governance correction required before closure: the current protected `main`
  handoff identity `23dda329...` has a signed commit but no canonical
  `Signed-off-by` trailer, and its push CI reported the required commit-policy
  failure (`35141730436`). P4 functional evidence remains intact, but the
  append-only P5 delivery must correct this current governance state and
  re-observe the full required-check closure before claiming P1-P5 closed.
- Durable backend boundary: the package contains no ambient filesystem,
  database, network or key access. `InMemoryAtomicStore` is explicitly
  `standalone-test`; a production durable provider and authorized AEAT
  observation remain separately qualified boundaries and are not silently
  represented by the local adapter.

## P5 closure — deterministic persistence and AEAT protocol boundaries

### Identity and status

- Status: `evidence-complete` for roadmap P5-A through P5-G's declared
  deterministic model/adapter, recovery, security and local protocol scope.
- Started/closed (UTC): `2026-09-16` intake /
  `2026-09-16T21:30:41Z` protected implementation merge.
- Input main: `fd4b81640332a0d4f2169155d0f6f2d37ea0c1b6`, the protected P4
  handoff; implementation head `eed0a8ca2c004d5e9a957fe8ad055ae11249a514`
  was SSH-signed and DCO-valid.
- Protected implementation merge: PR `#40`, squash
  `bd51d2823cfc325947702493415c96b2249761eb`, tree
  `0cb1a848526b9772078a0b7f13057e6d7a0ff010`, sole parent
  `23dda32978787825bf71a1695c0e12f2f62faa21`.
- Closure record: this append-only handoff update is delivered by a dedicated
  signed+DCO closure PR; its final protected identity is recorded in the
  following amendment after merge.

### Implemented state

- Persistence ports cover records, exact byte artifacts, journal events,
  evidence backup/restore and outbox intent. The standalone adapter executes
  one atomic host publication boundary and rejects context/edition mixing,
  stale heads, conflicting command identities, invalid predecessors and
  outbox references outside the committed artifact set.
- Outbox lifecycle covers pending, leases, attempt start, indeterminate and
  possibly-observed delivery, reconciliation-required, retry-wait and
  terminal classifications. Lease owners and fencing tokens prevent stale
  workers from recording observations; unknown delivery requires
  reconciliation before resend.
- Recovery covers integrity re-verification, immutable checkpoint anchors,
  rollback detection, sequential schema migration, digest-verified backup and
  atomic restore-on-integrity-failure. Retention is dry-run and fail-closed;
  no record or artifact is silently purged.
- AEAT boundaries cover exact edition/environment HTTPS allowlists, system and
  taxpayer identity binding, certificate-purpose authorization, deterministic
  UTF-8 SOAP bytes, bounded batches/responses/wait values, strict XML active
  construct rejection, identity correlation and retry decisions. Transport
  observes once; retry and reconciliation remain durable orchestration
  concerns.
- `LocalProtocolHarness` is a strict synthetic peer with deterministic
  drop/TLS/write/timeout/truncate/oversize/malformed fault scenarios and
  redacted observations. It has no external AEAT authority and never emits
  acceptance evidence for the real service.

### Verification and evidence

- Exact local gate: `gate:p5` passed 43 tasks with Node `24.21.0`, npm
  `11.19.1`, TypeScript `5.9.3` and Python `3.13.15`. This included
  `gate:foundation`, `gate:p2`, `gate:p3`, `gate:p3-contracts`, `gate:p4`,
  all policy negatives, SBOM/SPDX SHACL, reproducible packages, clean
  consumers and the three P5 tasks.
- P5 contract: `tests/contract/p5-durable-aeat.mjs`, 29 assertions passed;
  security: `tests/security/p5-boundary-attacks.mjs`, 8 assertions passed;
  performance/recovery: `tests/performance/p5-recovery.mjs`, 100 chained
  records, 274621-byte backup, 93.19 ms exploratory local run.
- Package evidence from the same gate: public binding count 67; development
  Verifactu tarball SHA-256
  `da454dca6cbddf7c7527b4c02df817dd4854eda3d02198a1a138c833d048c460`;
  component graph SHA-256
  `f59ff2f98bc7ac31fd21c6e0086c654f947f2f5ad51a604cacc39a042d37e927`;
  CycloneDX SHA-256
  `eab0fbbe0d75374399140f9229cffca19224671501df07411783f24164b9f997`.
- Protected PR `#40` passed all required contexts, Performance and CodeQL:
  governance/DCO, documentation, quality, reproducibility, the five runtime
  matrix contexts, regulatory/generated contracts, integration conformance,
  CodeQL, OSV, dependency review, npm audit, secret scan and required-check
  closure (`104984613658`).
- P1-P4 revalidation: the local 43-task gate passed every inherited gate,
  including P4's 26 domain and 9 fiscal-attack assertions. The observed
  missing-DCO defect on the prior handoff identity `23dda329...` was corrected
  by the DCO-bearing protected P5 squash `bd51d282...`; no functional P4
  failure was inferred from that governance correction.

### Failures, corrections and residual boundaries

- Observed local failures and corrections: an initial Python venv resolved to
  3.14.4 instead of the admitted 3.13.15 and was replaced by the exact locked
  runtime; one gate run was invalidated after an edit during its snapshot and
  was rerun from a stable tree; strict lease expiry and restore rollback were
  hardened before the final passing run.
- Production durable storage is intentionally not claimed by the package:
  filesystem/database authority is a provider responsibility behind the
  ports, and `InMemoryAtomicStore` reports `standalone-test`. Its atomic,
  fencing, digest and recovery behavior is contract evidence, not a claim of
  crash persistence in a selected production engine.
- External AEAT endpoint/WSDL/certificate/mTLS observations, authorized
  consultation/submission acceptance and legal/RRSIF review remain external
  gates. No credential, private key, taxpayer payload or Facturacion system was
  accessed or embedded. P6 owns adapter-kit/CLI integration; P7 owns whole
  product mutation/fuzz and sustained performance assurance; P8 owns
  publication/support.

### Exit and next phase

- P5 exit criteria are closed for the declared deterministic boundaries:
  atomic publication, no split record/artifact/journal/outbox outcome,
  idempotency/CAS/fencing, bounded recovery/migration/backup, exact wire
  bytes, fail-closed identity/response parsing, ambiguity reconciliation and
  redacted observability are executable and green.
- Next phase: P6, starting from protected `main` at
  `5207cd4db6291f8b31b2f9a23354ee9755ba8cdc` after this closure record is
  protected. P6 must qualify real provider implementations without widening
  the local-only or no-secret guarantees above.

### Amendment P5-001 — 2026-09-16 protected closure identity

- Protected closure PR `#41` carried signed+DCO head
  `886cea82a53fd84dcb1d4a10d916a96abd11883c`; GitHub merged it with protected
  squash `5207cd4db6291f8b31b2f9a23354ee9755ba8cdc`, tree
  `23d005d39068d577231ebdd3896ad6a4466aaa5e`, sole parent
  `bd51d2823cfc325947702493415c96b2249761eb`.
- Read-back performed on `2026-09-16T21:35:06Z`: PR `#41` required contexts,
  Performance and CodeQL were all successful; required-check closure was
  `104986047111`. Both P5 implementation and closure branches were deleted
  after protected merge.
- Affected scope: P5 handoff identity, evidence locators and next-phase
  pointer only. No implementation, legal, external AEAT, publication or
  Facturacion claim is widened. The final protected `main` is now the exact
  P5 recovery point.

## P6 closure — public products and ecosystem conformance

### Identity and status

- Status: `evidence-complete` for the declared P6 candidate-product and
  ecosystem scope; no publication or external acceptance is claimed.
- Started/closed (UTC): `2026-09-17T11:59:00Z` / protected closure merge
  `2026-09-17T12:28:34Z`.
- Input main SHA / tree:
  `742b5b609d055eb53c93dad92b40b79973f92678` /
  `ba1cf2aad92c82aed1e770e7c204a7627daa4dd0`.
- Closure main SHA / tree: `35cc132f20e9290b93dba4bee3d716c92745f57a` /
  `569fbb61a136a8e6e6ed9f1b4abe0c8c7166f558`.
- Closure PR: implementation `#43`; dedicated signed+DCO closure PR `#44`,
  with protected identity recorded in amendment `P6-001` below.
- Roadmap revision: `ROADMAP-DOC-0004`.
- Documentation inventory digest: closure-tree current Markdown inventory,
  413 files, SHA-256
  `af5885af6df3e6274ee83ce4c0b2f1f64534a6d0bcc14f32c4e6f84d5046a1c7`;
  historical archive remains 117 files, SHA-256
  `99641c59c5e5bc32c08dfc337912301b8a7c1f91f08976673eb52396f41c93a1`.

### Readiness and sources

- Prerequisites and their evidence: protected P5 `main` at
  `742b5b609d055eb53c93dad92b40b79973f92678`; current `06-contracts` and
  `16-integrations-conformance`; package/build/compatibility policies; active
  edition `rrsif-2026-09-16-active.dc3f7e967b00`; admitted public Verification
  Engine tarball; clean worktree and signed+DCO branch history.
- Re-observed mutable sources/dependencies: Node `22.14.0`, `22.23.2`,
  `24.21.0`; npm `11.19.1`; TypeScript `5.9.3`; Python `3.13.15`; exact lock;
  `@noeos/verification-engine@1.0.1`; profile `dev.noeos.jcs@1.0.0`; all
  package, Action, schema and external-input digests used by the inherited
  supply-chain controls. The Engine tarball is SHA-256
  `74e2449b5bab61ee62bdedc0355567461b33eadf15338f7d3265207bd28395f8`.
- Assumptions resolved/falsified: package consumers cannot use workspace or
  sibling source; ESM/CJS/type exports must refer to the same contract; the CLI
  bin is a real installed executable; adapter reports cannot add fiscal
  semantics; unavailable provider cells cannot become success; Facturacion is
  absent and is represented only by a versioned contract and synthetic host.
- Initial risks/blockers: incomplete public surface, deep-import leakage,
  CJS/ESM identity drift, dependency/source shortcuts, empty adapter reports,
  CLI nondeterminism, unbounded codecs and overclaiming provider/Facturacion
  capability. Each received a boundary or negative fixture; no P6 blocker
  remains inside the declared local scope.

### Work packages and protected history

| Work ID  | Issue                     | Branch                        | PR    | branch commits/signers/DCO                                                                                                                                                          | squash SHA                                 | result                                        |
| -------- | ------------------------- | ----------------------------- | ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ | --------------------------------------------- |
| P6-W1–W8 | none; roadmap-bound phase | `feature/p6-public-ecosystem` | `#43` | `d6894b58611883ae1878ebbcec8122b37f27bb18`, `e76fcf8`, `e040fb3`, `515ed52`; admitted SSH signer `SHA256:65VbGskWghAQAXDbJ3/1hrWuYegZNLs/+S96BbNQCzI`, matching DCO on every commit | `54bdda1ef4fe34ff45d98a432347f4dbf28996ce` | pass; native protected squash, branch deleted |

### Implemented state

- Components and behavior: public `createVerifactu` client with configuration,
  capabilities, records, verification, submissions, events, editions, schemas,
  evidence and limits; strict JSON/NDJSON codecs; deterministic CLI; typed
  adapter factory/instance/conformance reports, fault identities and cleanup;
  individual provider capability status; Engine and synthetic future-host
  integration contracts.
- Paths/files created, changed or removed: `packages/verifactu/src/public-api.ts`,
  public exports and persistence ports; `packages/cli/src/main.ts` and bin;
  `packages/adapter-kit/src/index.ts`; two public JSON schemas; P6 contract,
  integration and performance tests; clean-consumer child entrypoint; package
  content/shell/build/typecheck/task-graph policy updates; approved P6 evidence.
- Public API/CLI/events/diagnostics: library expected exports `227` and runtime
  exports `80`; adapter kit `16`/`5`; CLI `5`/`4`; installed consumer public
  binding count `89`. CLI commands are deterministic JSON/NDJSON with stable
  diagnostics and exit codes; configured-missing capabilities fail closed.
- Schemas/formats/editions/generated output: configuration/result schemas are
  included under `schemas/`; schema descriptors are closed and versioned;
  active edition is immutable and historical editions remain addressable;
  package files, bin mode, licence/notice and exports are allowlisted.
- Persistence/migrations/compatibility: P5 atomic UoW, fencing, outbox,
  backup/restore, migration and historical verification were re-exercised as
  inherited prerequisites; P6 synthetic Facturacion persists and reopens
  history. No production durable backend or real Facturacion repository was
  introduced.
- Toolchain/dependencies/Actions: exact 248-entry npm lock; package dependency
  lockstep is core Engine `1.0.1`, adapter/CLI core development version;
  declaration builds resolve dependent package types from clean built outputs;
  no lifecycle scripts or unadmitted network is added.
- GitHub/npm/external effective state: PR `#43` was squash-merged under the
  protected rules, all 17 required contexts plus Performance and CodeQL passed,
  and the implementation branch was deleted. Packages remain private
  `0.0.0-development` candidates; no npm publication occurred.

### Verification and evidence

| Claim/requirement                          | test/oracle                                                                                   | canonical task/job                                      | subject/environment                                                                         | result                                               | evidence locator/digest                                                                                                                                                                                                                                                   |
| ------------------------------------------ | --------------------------------------------------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Full inherited and P6 gate                 | task DAG, negative fixtures and gate closure                                                  | `gate:p6`                                               | protected `main` `54bdda1e`; Node 24.21.0/Python 3.13.15                                    | pass, 49 tasks                                       | `evidence/runs/p6-protected-final`; `gate:p6` report subject `54bdda1ef4fe34ff45d98a432347f4dbf28996ce`                                                                                                                                                                   |
| Exact package artifacts                    | clean build, normalized tarball and reproducibility oracle                                    | `package:reproducibility`, `package:tarballs`           | two clean roots; npm 11.19.1                                                                | pass                                                 | library `301fdc7bdf93caae87bafc8885ba02edbb313f1cf76bb9a2446e9fffeec6ac5a`; adapter `3360453a2bc6365d8ccca66c37a2b5a94590d173bc4f2a459323beb6a1aa3c46`; CLI `b9f0ed33206b38626ddcdd4e5746a1e19e8c855f4c190a6aca4cdbe69287608f`                                            |
| Installed ESM/CJS/types and closed imports | clean consumer with source/network denial and negative deep import                            | `integration:tarball-consumers`                         | one clean root, four digest-checked tarballs                                                | pass                                                 | `evidence/runs/p6-protected-final/integration-tarball-consumers.json`; 3 ESM, 2 CJS, 3 type packages, CLI bin present, 89 bindings                                                                                                                                        |
| Public library, CLI and adapter contracts  | P6 contract plus boundary tests                                                               | `contract:p6-public-products`, `security:p6-boundaries` | built candidate distributions                                                               | pass; 29 contract assertions, 3 adapter scenarios    | `tests/contract/p6-public-products.mjs`; `tests/integration/p6-providers.mjs`; reports in the P6 evidence run                                                                                                                                                             |
| Verification Engine and future Facturacion | Engine hash/evidence, atomic host UoW, claim fencing, backup/restore, historical verification | `integration:p6-engine-facturacion`                     | `@noeos/verification-engine@1.0.1`, `dev.noeos.jcs@1.0.0`, synthetic `facturacion-host-v1`  | pass, 18 assertions                                  | `tests/integration/p6-engine-facturacion.mjs`; package digest above; no real Facturacion implementation                                                                                                                                                                   |
| Provider cells                             | offline XSD and certificate fixtures; explicit signer/storage/transport absence               | `integration:p6-providers`                              | bounded offline fixtures, no credentials                                                    | pass for 2 exercised cells; 3 explicitly unavailable | `tests/integration/p6-providers.mjs`; `claimedProviderCells:0`, `explicitUnavailableCells:3`                                                                                                                                                                              |
| Clean build and consumer performance       | three clean builds and 1,000 codec/CLI iterations                                             | `performance:build-smoke`, `performance:p6-consumers`   | Node 24.21.0; isolated temp roots                                                           | pass; max build 3,420 ms; 1,000 iterations 46.33 ms  | reports in `evidence/runs/p6-protected-final`                                                                                                                                                                                                                             |
| Protected CI portability/security          | required contexts and platform matrix                                                         | PR `#43` checks                                         | Ubuntu 24.04 Node 22.14.0/22.23.2/24.21.0, Windows 2025 Node 24.21.0, macOS 15 Node 24.21.0 | all pass                                             | run jobs `105198592969`, `105198593229`, `105198593499`, `105198593396`, `105198593245`, `105198593571`, `105198593459`, `105198593559`, `105198593623`, `105199033255` plus security jobs `105198594846`, `105198595458`, `105198595130`, `105198595174`, `105198595234` |

- Coverage/mutation/fuzz results and justified scope: P6 exercised boundary,
  negative, lifecycle and fault identities; sustained whole-product mutation,
  fuzz, independent review and release rehearsal are intentionally P7.
- Security/privacy/supply-chain results: BOM/UTF-8/duplicate/framing/size,
  semantic-authority, deep-import, source-shortcut, package-content, lockstep,
  DCO/signature and network-denial controls passed; no secrets or taxpayer data
  were used.
- Performance/reliability/recovery results: clean builds, codecs, CLI,
  atomic synthetic host, fencing and backup/restore passed within exploratory
  local bounds; production SLOs and crash/long-run baselines remain P7.
- Package/tarball/integration matrix results: exact digests and installed
  ESM/CJS/type/bin matrix above; no workspace/sibling source was available to
  the consumer; unsupported cells remain visible and non-successful.
- Legal/regulatory/external observations and independence class: regulatory
  edition and generated contracts are inherited approved source-located
  evidence; provider and Engine observations are local/fixture or public
  tarball evidence. No live AEAT, legal acceptance, production certificate or
  independent external review was observed.

### Failures, corrections and review

- First failures retained: source typecheck could not resolve the workspace
  core package; clean declaration builds initially rejected the dependency
  source outside package `rootDir`; earlier P6 runs also exposed a fixture bin
  expectation, undeclared clean-child process, strict configuration-shape test,
  CLI LF framing, duplicate assurance ID and lint diagnostics.
- Root causes and affected variants: source-only type consumers had no admitted
  path mapping; clean package builds had no sibling `node_modules`; policy and
  negative fixtures still encoded P2 empty-shell assumptions; tests and docs
  were temporarily inconsistent with strict schemas and uniqueness rules.
- Corrections/regressions: source typecheck now maps the core package to its
  source; package declarations resolve the already-built core declaration from
  the clean build order; shell policy admits only the declared CLI bin; the
  clean child is declared; strict fixtures, LF output, lint and assurance IDs
  were corrected. No failed claimed provider cell was converted to success.
- Invalidated evidence rerun: the failed local/CI P6 attempts were superseded
  by the final protected `main` gate and the succeeding PR #43 required-check
  closure; all affected package/build/regulatory/quality reports were rerun.
- Review conversations and dispositions: PR #43 protected checks and
  governance/DCO validation passed; no approval fiction or bypass was used.

### Traceability and residual state

- Requirements/ADRs/controls closed: P6-W1–P6-W8; `docs/06-contracts`,
  `docs/16-integrations-conformance`; package/build/compatibility, public
  security and historical-finding controls named by the roadmap; ADR-0035,
  ADR-0038 and ADR-0039.
- REV findings disposed: the P6 historical inputs in this document are
  exercised or explicitly carried forward; no finding is closed by an absent
  provider or by aggregate success masking an unavailable/failed cell.
- Current findings: production durable storage, live AEAT, real Facturacion,
  private production signer/certificate material, legal/CRA acceptance,
  independent review and release/publication gates remain open downstream.
- Risks/exceptions/open questions: candidate packages are private and
  development-versioned; P6 performance is exploratory; provider capability
  descriptors intentionally report unavailable where no authorized real
  adapter exists.
- Explicit remaining committed scope: P7 whole-product assurance, sustained
  performance/recovery, migration campaign, release rehearsal and independent/
  external evidence; P8 stable publication, verification and support.
- Deviations from roadmap and authority: none. P6-W7 is satisfied by individual
  exercised cells plus explicit unavailable cells; the roadmap prohibition on
  inventing providers or requiring a real Facturacion implementation is
  preserved.

### Recovery and next phase

- Recovery/revert point and verified procedure: protected implementation merge
  `54bdda1ef4fe34ff45d98a432347f4dbf28996ce` is the P6 product recovery point;
  rerun the exact admitted `gate:p6` command from a clean checkout, then use
  the package digests above to compare artifacts. Revert only through a signed,
  DCO-bearing protected PR.
- Exit-criteria evaluation: complete; all P6 work packages, exact exports,
  schemas, commands, events, errors, capability cells, clean package installs,
  Engine profile, synthetic host, provider honesty, compatibility and CI
  requirements passed in the declared scope.
- Next phase and exact prerequisites: P7 after this closure record and its
  identity amendment are protected; first schedule whole-product assurance,
  sustained performance/recovery, mutation/fuzz, migration and release-
  rehearsal evidence, then obtain the remaining external observations.
- Exact first commands/observations: verify `git rev-parse origin/main`, its
  tree and this handoff; verify PR/branch deletion and required-check read-back;
  run `NODE_BIN=/tmp/verifactu-node.dmrkuL/node-v24.21.0-linux-x64/bin; PATH="$NODE_BIN:$PATH" TMPDIR=/tmp VERIFACTU_PYTHON=/tmp/verifactu-python-3.13.15-p3/bin/python "$NODE_BIN/node" tooling/tasks/run-task.mjs --task gate:p6 --evidence-dir evidence/runs/p7-intake`.
- Priority documents to reread: `docs/17-roadmap-risk/implementation-roadmap.md`,
  this handoff, `docs/06-contracts/`, `docs/16-integrations-conformance/`,
  `docs/10-security-privacy/`, `docs/11-quality-testing/` and
  `docs/18-assurance-audits/p6-public-ecosystem-evidence.md`.
- Long-lead items carried forward: authorized AEAT endpoint/WSDL/certificate
  access, production durable-store adapter, real Facturacion coordination,
  signer/certificate provider, independent/legal/CRA review, npm ownership/
  OIDC publication controls and stable performance/release baselines.

### Amendment P6-001 — 2026-09-17 protected closure identity

- Statement corrected: the P6 closure record initially named its implementation
  merge while the dedicated handoff PR was still unmerged.
- Correct value and reason: closure PR `#44` carried signed+DCO head
  `1e5ecd9ecaeeef4a193dbcdb28d9c8a2682cc148`; GitHub merged it with protected
  squash `35cc132f20e9290b93dba4bee3d716c92745f57a`, tree
  `569fbb61a136a8e6e6ed9f1b4abe0c8c7166f558`, sole parent
  `54bdda1ef4fe34ff45d98a432347f4dbf28996ce`.
- Discovered by / actor: Codex protected-main handoff read-back after PR #44.
- Evidence locator and digest: PR #44 required contexts, Performance and
  CodeQL all passed; required-check closure job `105201699788`; protected main
  read-back on `2026-09-17T12:28:34Z`. Package and Engine digests remain those
  in the P6 evidence table and are unaffected by this documentation-only
  amendment.
- Affected requirements, phases, releases and claims: P6 handoff identity,
  phase ledger, current-context capsule and P7 intake only. No implementation,
  provider, Facturacion, legal, external AEAT or publication claim is widened.
- Evidence/exits invalidated: the pre-merge closure identity placeholder only;
  all P6 implementation, CI, package and local evidence remains valid.
- Remediation and protected PR: PR #44 was merged squash-only with required
  signatures/DCO and automatic branch deletion. P7 must derive the resulting
  `main` SHA of this amendment, verify this record and rerun the declared intake
  observations before starting new implementation.

## P7 active record — whole-product assurance and release rehearsal

### Identity and status

- Status: `active`; not `evidence-complete` and not eligible for a closure PR.
- Started: `2026-09-17T12:45:00Z` UTC; no closure time exists.
- Input protected `main`: `4fb35c2f0a4394120af1de94ea8a207ed5447aa4`, tree
  `651456ae2b4295bc38be858e2d69da5f012344f0`.
- Implementation PR: `#46`, merged squash-only through the protected flow;
  correction PRs `#49`, `#51`, `#53` and `#54` subsequently removed the false
  real-Facturacion blocker, corrected exact-tree binding, expanded the installed
  campaign and closed the claim/evidence graph; no P7 closure PR exists because
  the authoritative gate is blocked.
- Roadmap revision: `ROADMAP-DOC-0004`; campaign policy:
  `config/assurance/p7-campaigns.json` (`P7-ASSURANCE-0001`).
- P7 evidence schema: `evidence/schemas/p7-audit.schema.json`.

### Work packages and evidence

The canonical task graph now contains `assurance:p7-graph`,
`assurance:p7-quality`, `security:p7-privacy`, `performance:p7-baselines`,
`supply-chain:p7-audit`, `integration:p7-external-matrix`,
`release:p7-legal-operations`, `assurance:p7-audits`,
`release:p7-rehearsal`, `assurance:p7-dossier` and a fail-closed `gate:p7`.
The authoritative exact-tree dossier run `evidence/runs/p7-dossier-main-6`
executed 59 inherited/P7 tasks; the P7 task reports all bind subject
`4fb35c2f0a4394120af1de94ea8a207ed5447aa4` and tree
`651456ae2b4295bc38be858e2d69da5f012344f0`. The fail-closed gate run is
`evidence/runs/p7-gate-blocked-main-5` and exited 42.
The report files are ignored by Git by policy; raw artifact paths and SHA-256
digests are retained in `docs/18-assurance-audits/p7-assurance-evidence.md`.

Observed local evidence:

- P7-A enumerated all 84 historical findings and all ten P7 waves.
- P7-B ran 18 installed regression/consumer scripts, 1,000 deterministic fuzz
  cases and 259 property cases without a throw/hang. Production
  line/function/branch coverage and mutation thresholds remain unqualified
  because no admitted production instrumenter/mutation engine is present.
- P7-C ran XML, fiscal, boundary and admitted Gitleaks regressions; all 18
  threat/control references remain represented. No independent penetration
  review is claimed.
- P7-D retained 20 raw latency/RSS samples, explicitly exploratory because no
  stable qualified performance runner or adopted official baseline is available.
- P7-E reconciled the exact 248-entry lock, 39 Action references, dual SBOM and
  non-publishing provenance rehearsal. The mutable CycloneDX SPDX input was
  refreshed to observed digest
  `33863a360fc4d348e183d89c1ca7aa0877f481e7eb55be2d4102a30386188a10` through
  protected PR `#54`; no stable attestation exists.
- P7-F passed installed Engine `1.0.1`, offline providers and the synthetic
  future-Facturacion host. Correction PR `#49` removed the incorrect blocker for
  the absent real Facturacion repository; authorized AEAT, production
  certificate/mTLS and external provider observations remain absent.
- P7-G/H inventoried regulatory/CRA/declaration/operations evidence and all 84
  findings, but no competent legal/CRA/privacy or technical independent review
  has occurred. Internal evidence is labelled self-assessment.
- P7-I passed a non-production three-package partial-publication and
  forward-recovery simulation. No npm/GitHub channel or OIDC identity was
  mutated. P7-J produced `p7-candidate-blocked-v1`, not authorization.

### Current blockers and recovery

`gate:p7` is deliberately fail-closed with exit 42 while any of these remain:

1. Coverage/mutation denominators and the required 98/98/95, critical 100 and
   other 95 thresholds have not been produced by admitted tools.
2. Official performance/reliability baselines and a stable authorized runner
   have not been observed.
3. Authorized AEAT observation, production certificate/mTLS and external
   provider conformance are unavailable.
4. Competent external technical/security and legal/RRSIF/CRA/privacy reviews
   are unavailable; no self-review is relabelled independent.
5. Account/key/workstation/OIDC recovery custody and a real registry read-back
   rehearsal are unavailable.

The exact observations, first failures, corrections and unblock evidence are in
`docs/18-assurance-audits/p7-assurance-evidence.md`. No blocker is an exception
or legal waiver. The real Facturacion absence is a preserved ecosystem boundary.
Any correction invalidates affected waves and requires a fresh exact-subject
campaign through a signed/DCO protected PR. P8 cannot start until a later
protected P7 closure record supplies all required external evidence and explicit
release authorization. The exact post-merge raw-artifact digests and gate
blocker keys are recorded in `docs/18-assurance-audits/p7-assurance-evidence.md`.

### Final protected read-back

The last protected `main` pointer before this documentation amendment is
`8281ffa490ec856276dc91ffe90f2103f4834b97`, tree
`fc9d5fb211dd1e4c6a8d3ed2db07b8ff8eb5ed75`; GitHub reports PRs `#53` through
`#56` as merged/closed and their source branches as deleted. This amendment is
documentation-only and does not change the authoritative P7 campaign subject
`4fb35c2f0a4394120af1de94ea8a207ed5447aa4`, tree
`651456ae2b4295bc38be858e2d69da5f012344f0`.

### Amendment P7-003 — 2026-09-17 exact-tree campaign readback

- Statement corrected: the prior P7 record described the authoritative task
  reports with tree `not-derived-by-task-shell` and named the pre-`#51` campaign
  subject and raw-artifact set.
- Correct value and reason: protected PR `#51` merged as verified squash
  `a47b18c814fbab3ad6ccb191d07ff2441ff40853`, exact tree
  `162b1030824387de06e2354f22ef8b82f486510a`. Fresh A–J and gate runs were
  executed from that subject under Node `24.21.0` and Python `3.13.15`.
- Evidence locator and digest: dossier
  `evidence/runs/p7-dossier-main-4`, task-report SHA-256
  `5e6ea2e34af3db3b1295a22c46951d6cfa68f1afedb83ef43478975aee40211d`; gate
  `evidence/runs/p7-gate-blocked-main-3`, task-report SHA-256
  `c61df374047d909f9479d00246ddec7cc590539ce5022642a9579ce6430b24b2`, exit 42. The nine raw wave digests are in the P7 evidence document.
- Findings and disposition: A passed with exact subject/tree. B, D, E, F, G,
  H, I and J remain truthfully blocked by the previously recorded mandatory
  quality, performance, supply-chain attestation, authorized external,
  independent review, recovery-custody and hosted publication conditions. The
  six normalized gate blocker keys are unchanged. The absence of a real
  Facturacion implementation remains a documented boundary and is not a
  blocker.
- Affected requirements, phases, releases and claims: P7 campaign identity and
  evidence locators only; P7 remains active and no stable, supported,
  compliant, certified, AEAT-accepted, real-Facturacion or publication claim is
  widened.
- Evidence/exits invalidated: the pre-`#51` P7 campaign binding and its raw
  artifact locators are superseded for current exact-tree readback; no prior
  implementation or P6 evidence is invalidated.
- Remediation and protected PR: this amendment is delivered through a new
  SSH-signed+DCO protected documentation PR; its final protected SHA is derived
  by the next handoff readback.

### Amendment P7-004 — 2026-09-17 expanded quality campaign

- Statement corrected: the P7 record previously stated 14 installed scripts;
  the admitted campaign actually covers 18 installed quality, contract, policy
  and performance entrypoints.
- Evidence: protected PR `#53`, squash
  `8717adbfc5050404730f6692485f7b1fdb328470`, tree
  `d65eeec28458ff21842d975dc61a215973823ab8`; final B raw digest
  `a569dd0cf463f33a70dedeab58ae4d83b03459233862a88835b0042c06985de9`.
- Disposition: 18 executions, 1,000 fuzz cases and 259 property cases passed;
  coverage and mutation blockers remain open because no admitted production
  denominators exist.

### Amendment P7-005 — 2026-09-17 typed graph and external-input readback

- Statement corrected: P7-A/J lacked machine-validated graph closure, and the
  mutable CycloneDX SPDX subschema had moved from v1.1-3.28.0 to v1.1-3.29.0.
- Evidence: protected PR `#54`, squash
  `4fb35c2f0a4394120af1de94ea8a207ed5447aa4`, exact tree
  `651456ae2b4295bc38be858e2d69da5f012344f0`; graph closure 163 nodes/296
  edges with no orphans, unknown references, stale evidence, missing artifacts
  or unknown claims; refreshed input digest
  `33863a360fc4d348e183d89c1ca7aa0877f481e7eb55be2d4102a30386188a10`.
- Final locators: dossier `evidence/runs/p7-dossier-main-6`, task-report
  digest `5b52f8a5e8cc241015b99f2089bd9483874f9c9b6b7ba646afb46c17333c2976`;
  gate `evidence/runs/p7-gate-blocked-main-5`, task-report digest
  `2c7f8f0c18013c4924c684a5113c4143c0f38d44d5b6a30cd53a93b56260991a`, exit
  42 with the six normalized blocker keys.
- Disposition: P7 remains active and blocked; no closure PR, P8 authorization,
  stable/support/compliance/certification/AEAT acceptance, real-Facturacion or
  publication claim is widened.

## P3 closure — current protected execution (2026-09-21)

### Identity and status

- Status: `blocked` pending six authoritative AEAT payload edges; all safe
  P3-W1–P3-W6 implementation and local executable evidence are complete.
- Started/closed (UTC): started `2026-09-21`; protected closure time and final
  SHA are derived by the dedicated closure PR.
- Input main SHA / tree: `9571b69df4f5eec2b0efc548c30867fcadfd356b` /
  `c9e69e1bc1fcb3af3a05bca48886785f488380a9`.
- Closure main SHA / tree: derived by the protected closure read-back.
- Closure PR: implementation PR followed by a dedicated P3 handoff PR.
- Roadmap revision: `ROADMAP-DOC-0004`, P3-W1–P3-W6.
- Documentation inventory digest: derived by the closure task; no large source
  logs or secrets are embedded here.

### Readiness and sources

- P2 predecessor was revalidated at protected `main` tip above, including
  signed/DCO history, required contexts and the P2 audit record.
- Current observation plan is `config/regulatory/source-plan.json`, observed
  `2026-09-21T13:12:37Z`, with normal TLS, bounded bytes, same-authority
  redirects and runtime network denial.
- Twelve BOE/AEAT entry-point bytes are captured in
  `editions/source-snapshots/rrsif-2026-09-21-observed/`; each has URL,
  authority, media type, dependency edges, licence and SHA-256/SHA-512.
- Six linked AEAT developer payloads (`SRC-0019-PAYLOAD`,
  `SRC-0020-PAYLOAD`, `SRC-0021-PAYLOAD`, `SRC-0023-PAYLOAD`,
  `SRC-0024-PAYLOAD`, `SRC-0025-PAYLOAD`) remain blocked. Ordinary TLS
  validation fails or the current authority page does not expose a payload;
  TLS is not weakened and no stale/cached bytes are promoted.

### Work packages and protected history

| Work ID    | Issue                  | Branch                         | PR      | branch commits/signers/DCO | squash SHA | result                                  |
| ---------- | ---------------------- | ------------------------------ | ------- | -------------------------- | ---------- | --------------------------------------- |
| P3-W1–W6   | derived from P3 intake | `build/28-p3-source-contracts` | pending | SSH-signed+DCO required    | derived    | safe implementation; blocked activation |
| P3 closure | same                   | dedicated handoff branch       | pending | SSH-signed+DCO required    | derived    | exact final-main read-back required     |

### Implemented state

- Bounded source manifest/import, immutable lifecycle and licence closure.
- Hostile-safe offline XML parser rejecting DTD/entity, remote, traversal,
  duplicate and nesting/resource failures.
- Deterministic metadata-only staged contract, public envelope, catalogue,
  field-constraint and SOAP-binding outputs; no fiscal semantics are invented.
- Official entry-point, synthetic boundary/compatibility and adversarial
  fixtures plus an implementation-independent Python oracle with seeded-defect
  detection.
- Runtime network refresh is denied. The candidate is verification-only and
  `creationAllowed=false`; no P4/fiscal production source is present.

### Verification and evidence

| Claim/requirement                   | Test/oracle                           | Canonical task/job                        | Result                              | Evidence                       |
| ----------------------------------- | ------------------------------------- | ----------------------------------------- | ----------------------------------- | ------------------------------ |
| bounded custody and blocked closure | source manifest/importer              | `regulatory:import`                       | pass, 12 captured/6 blocked         | subject-bound task report      |
| deterministic staged output         | generator and repeat run              | `contract:generation`, `regulatory:drift` | pass, no-diff                       | generated report/output digest |
| hostile input rejection             | Python Expat parser and five fixtures | `oracle:independent`                      | pass                                | independent oracle report      |
| source/output provenance            | Python hashlib/json checker           | `oracle:independent`                      | pass, seeded defects detected       | independent oracle report      |
| complete P3 safe graph              | inherited P2 plus P3 dependencies     | `gate:p3`                                 | pass; activation blocked truthfully | gate report                    |

- Independence class: implementation-independent tool/runtime, not external,
  organizational or legal independence. No AEAT acceptance or compliance
  certification claim is made.
- Security/supply-chain scope is bounded parser/resource/network behavior;
  P4 cryptographic and fiscal behavior remains downstream.

### Failures, corrections and review

- The first local oracle invocation exposed that this environment names the
  interpreter `python3`; the task now honors `VERIFACTU_PYTHON` and falls back
  to `python3`, while CI pins the admitted Python runtime.
- A source snapshot HTML page contains an official asset path with a `home`
  segment; the
  documentation validator now explicitly permits immutable source bytes rather
  than treating an official asset path as a workstation path.
- Missing technical payloads are retained as blockers, not retried-to-green or
  replaced by memory/examples.

### Traceability and residual state

- The machine map is `docs/17-roadmap-risk/p3-evidence.md`; requirements
  REG-0010/0011/0012/0016/0018/0070/0071/0072 and SEC-0070 map to exact
  manifest, contract, fixture, oracle and task identities.
- Remaining blocker keys are the six payload IDs above. They invalidate
  approval, activation, fiscal generation and P4 readiness, but do not block
  the safe custody/parser/oracle implementation.
- Historical P3 records below this section are prior-attempt evidence and are
  not current authority.

### Recovery and next phase

- Recovery uses a successor signed+DCO PR. The current snapshot and generated
  candidate are immutable and must never be edited in place.
- Re-observe each blocked URL with ordinary TLS and bounded acquisition; admit
  exact bytes plus licences/dependencies; create a successor snapshot and rerun
  import, generation, drift, negatives and independent oracle.
- P4 and P3-B remain prohibited until all mapped blockers are resolved, an
  approved/active edition has a non-null approval record and the final protected
  main read-back binds every report to its exact subject/tree.

### Amendment P3-006 — 2026-09-21 protected implementation read-back

- Implementation PR `#28` was merged through the protected squash path as
  `a87044d312f4fbb03b6a02490d758f2e739dd254` at
  `2026-09-21T13:26:53Z`; GitHub reports the source branch deleted. The squash
  is GitHub-verified, but its merge message omitted a DCO trailer, so the
  protected main-push governance leaf failed. This is a retained first failure,
  not a reason to bypass protection.
- PR #28 had 23/23 check-runs successful, including required regulatory
  `gate:p3` and the auxiliary conformance gate. The failed first run and the
  corrected rerun remain in GitHub Actions history; the correction does not
  relabel the first result.
- The dedicated closure PR carrying this amendment is the corrective path. Its
  protected squash message MUST include `Signed-off-by: Daniel David
<ddcandales@gmail.com>`, and its post-merge main push MUST pass the complete
  required set before this phase record is evidence-complete.
- P3 status remains `blocked`: the immutable candidate is verification-only,
  `creationAllowed=false`, and six AEAT payload IDs remain unresolved. P4 and
  P3-B are prohibited regardless of protected CI success.

### Amendment P3-007 — 2026-09-21 final protected read-back

- Closure PR `#29` merged as verified protected squash
  `c8b2603453e7a4c364e7a8730a8ab6d5bc5702ca` at `2026-09-21T13:33:05Z`.
  Its tree is `01ca9709e43990b2bf61cc0bb09ab41356e399f5`, its sole parent is
  `a87044d312f4fbb03b6a02490d758f2e739dd254`, the DCO trailer is preserved,
  and GitHub deleted the source branch. GitHub API verification is `valid`.
- PR #29 read-back: 23/23 check-runs passed. The required workflow run is
  `35606110827`; auxiliary Conformance, Engineering, Performance and Security
  runs are `35606110890`, `35606110889`, `35606110812` and `35606110851`.
- Protected push read-back on exact final SHA: 22/22 check-runs passed. The
  required workflow is `35606336685`; Conformance `35606336957`, Engineering
  `35606336778` and Security `35606336813` also passed. Performance is
  pull-request/schedule scoped and therefore is not counted as a push check.
- Immutable evidence identities at this tree are source manifest
  `8b01ec2433a8f162ce63cca85577b29d306140caf19dc277a4a5142af3b89d6e`,
  generation report
  `dc174545a8038e89850c6dbbc9e749b5acffb27068e50a09af9de183c218a5db`, and
  source plan `b62370eb708e023c4ab8f2e2ab85d08f300605ae444f63f41420e0ba4756d295`.
- Final disposition: P3 is `blocked`, not `evidence-complete`, because the
  six payload blockers remain. The candidate stays verification-only and
  `creationAllowed=false`; P3-B and P4 are not authorized. Any successor
  observation must create a new snapshot/edition identity and rerun the full
  task graph and protected read-back.

## P3-B closure — pre-P4 assurance (2026-09-21)

### Identity and status

- Status: `closure-candidate`; becomes `evidence-complete` only when this
  dedicated signed+DCO handoff PR passes every required and auxiliary check,
  merges through protected squash, and its resulting protected-main subject
  passes final read-back.
- Started/closed (UTC): started after protected P3 read-back on `2026-09-21`;
  implementation protected at `2026-09-21T14:52:14Z`; closure time is derived
  from the handoff squash.
- Input main SHA / tree: `89e85f1ff79c0569ddc7c1dfbcb6fdc0e365c71e` /
  `a532ed80bc31a5f446eb8c019c466048b0b78911`.
- Latest protected implementation main SHA / tree:
  `ccc2b8decdbcdee58bdbfc5dd13209d47e1a9231` /
  `6a3fdf4eb4192df2fddb5a37b0cffda912b318f8`, sole parent
  `9e27bf377d07d93fe5faa448eb4ff907b7f21182`.
- Closure PR: `#33` from dedicated branch `docs/33-p3b-handoff`; its final
  head, squash and final-main run identities are appended by protected
  read-back.
- Roadmap revision: `ROADMAP-DOC-0020` plus universal matrix
  `ROADMAP-DOC-0021`.
- Documentation population: 539 files, 536 Markdown, aggregate SHA-256 derived
  by the closure head; every byte is machine-indexed and every current Markdown
  document passes ID/link/front-matter checks.

### Readiness and sources

- Protected P1–P3 handoffs, histories, task reports and effective GitHub state
  were re-read. Active rulesets `23705155` and `23705170` have zero bypass
  actors; protected main requires linear signed squash history and the exact 17
  GitHub App `15368` contexts.
- PR `#31` protected the bounded, no-bypass source observer across Ubuntu,
  Windows and macOS. PR `#32` protected the admitted successor source graph and
  assurance campaign.
- Immutable `rrsif-2026-09-21-authoritative` contains 27 source objects with
  exact URL, size, SHA-256/SHA-512, authority, licence and witness. All 14
  developer payloads agree byte-for-byte on macOS and Windows; Linux retains
  the ordinary-TLS weak-digest failure as a negative rather than weakening
  verification. Entry pages and the W3C XMLDSig dependency were observed on
  Linux with normal trust.
- The transitive source graph has zero blocked edge. Candidate
  `rrsif-2026-09-21-authoritative-candidate` stays immutable,
  `creationAllowed=false`, `verificationAllowed=true`; P3-B does not implement
  or activate P4 behavior.

### Work packages and protected history

| Work ID                          | Branch / PR                               | signed+DCO head                            | protected squash                           | Result                                                     |
| -------------------------------- | ----------------------------------------- | ------------------------------------------ | ------------------------------------------ | ---------------------------------------------------------- |
| P3-B source observation          | `build/31-p3b-source-observation` / `#31` | `a842d82a2debdd58656475ae4c265678f9b7a498` | `9e27bf377d07d93fe5faa448eb4ff907b7f21182` | 26/26 checks passed after retained ref-recovery correction |
| P3-B implementation and campaign | `build/32-p3b-assurance` / `#32`          | `d607c5fc7908ead1c30b34c6acbd46776107e1f0` | `ccc2b8decdbcdee58bdbfc5dd13209d47e1a9231` | 26/26 PR checks and 25/25 protected-push checks passed     |
| P3-B handoff                     | `docs/33-p3b-handoff` / `#33`             | SSH-signed+DCO required                    | derived by final read-back                 | must prove the exact closure-head matrix below             |

GitHub verifies both protected squashes, each has one parent and a canonical DCO
trailer, and both implementation source branches are deleted.

### Implemented state

- `P3B-BASELINE-0001` declares populations, denominators, 100% thresholds,
  critical catalogue and fail-closed missing/partial/unknown semantics before
  interpretation.
- `P3B-CLAIM-EVIDENCE-GRAPH-0001` types the complete 15-row universal control
  population and binds sources, decisions, implementation, oracle, fixtures,
  tasks, CI producer, report, subject, package, edition, disposition and P4
  consumer without orphan nodes.
- Generator `RRSIF-CONTRACT-GENERATOR-0002` emits 562 structural declarations,
  447 field constraints, 652 enumerations, 29 SOAP declarations and seven
  source/page-located semantic rules from eight AEAT WSDL/XSD documents.
- A separate Python ElementTree/hashlib/json oracle imports no generator code,
  recounts every population and kills 6/6 seeded defects.
- The task runner now propagates `blocked`, writes a schema-valid report and
  exits non-zero. An unknown/partial status has a material negative fixture.
- Canonical P4 first-commit policies cover all-production-module coverage,
  critical/overall mutation, property, fuzz, fault/recovery, performance and
  every supported compatibility cell. P4 code remains absent.

### Verification and evidence

| Population or control                              |              Denominator |    Passed | Result / evidence                                                |
| -------------------------------------------------- | -----------------------: | --------: | ---------------------------------------------------------------- |
| Documentation / Markdown                           |                539 / 536 | 539 / 536 | 100%; complete corpus and links/IDs                              |
| Historical findings                                |                       84 |        84 | 100%; 18 P1–P3-scope prevented, 66 retained open for later scope |
| Universal claim/evidence requirements              |                       15 |        15 | 100%; zero orphan/unknown graph endpoint                         |
| Required CI contexts                               |                       17 |        17 | 100%; strict closure context included                            |
| Source artifacts / AEAT XML documents              |                   27 / 8 |    27 / 8 | 100%; zero blocked source edge                                   |
| Structural / field / enumeration / SOAP / semantic | 562 / 447 / 652 / 29 / 7 |      same | 100%; independent recount agrees                                 |
| Parser negatives / oracle mutants                  |                    5 / 6 |     5 / 6 | 100%; exact expected rejection/detection                         |
| Property / fuzz / fault / privacy                  |    1,024 / 512 / 12 / 12 |      same | 100%; zero skip or hidden retry                                  |
| Compatibility cells                                |                        5 |         5 | Ubuntu Node 22.14/22.23/24.21, Windows 24.21, macOS 24.21        |
| Generator performance/recovery                     |                        3 |         3 | maximum below 5,000 ms; one digest; two atomic writers           |
| Critical catalogue                                 |                       14 |        14 | 100%; every named critical control passes                        |

Exact implementation-subject local gate on `ccc2b8de…` passed with input digest
`23dc55e13897cb519f221f7bdbada154afcb062d2828f50596c6fba22d4a5e6a`
and output digest
`fe5b5082fb0dc64ae27afc2dc53f10f63ccd70bb3ec4bf5cf26298fbe0a6df43`.
Canonical configuration/evidence digests at that subject are baseline
`88aa6bd6…f780`, REV disposition `fa253c36…cfcb`, source plan
`8b824f3b…3c1f`, source manifest `0856118b…0c6` and generation report
`514212d0…e06`.

### Universal closure matrix

| Control family              | P3-B result       | Proof / positive not-applicable boundary                                                                                                                                         |
| --------------------------- | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Scope and requirements      | passed            | 15/15 graph requirements, 84/84 REV rows, 539-file corpus                                                                                                                        |
| Identity and evidence       | passed            | exact commit/tree/parent, signed+DCO PRs, schema-valid same-subject reports                                                                                                      |
| Toolchain                   | passed            | admitted Node/npm/Python/TypeScript plus hash/digest and validator checks                                                                                                        |
| Task graph                  | passed            | acyclic declared graph, zero-work and blocked-result negatives, declared writes/network/secrets                                                                                  |
| CI and GitHub               | passed            | active zero-bypass protection, 17/17 required contexts and closure                                                                                                               |
| Platforms                   | passed            | 5/5 supported runtime cells; three source-observer trust stacks                                                                                                                  |
| Functional quality          | passed            | complete P1–P3 tasks, tarball consumers and generated-contract/oracle scope; P4 fiscal behavior positively absent                                                                |
| Quantitative quality        | passed            | all declared populations 100%; P4 coverage/mutation policies frozen before P4 code                                                                                               |
| Security and privacy        | passed            | hostile XML/resource/network, secret/SAST/dependency and 12/12 redaction probes                                                                                                  |
| Performance and reliability | passed            | three bounded deterministic runs, two clean rebuilds and atomic recovery writers; product workloads positively not applicable before P4                                          |
| Compatibility               | passed            | toolchain/OS cells and package-shell consumers pass; fiscal public API/CLI/data migration positively absent                                                                      |
| Supply chain                | passed            | exact lock, full-SHA Actions, tool/licence admission, reconciled CycloneDX/SPDX, provenance and reproducibility                                                                  |
| Operations and law          | passed            | source/licence custody complete; product operations, external transport and release/legal claims positively not applicable because no P4 runtime exists and creation is disabled |
| Negative assurance          | passed            | task/CI/supply/source/parser/report/dependency/artifact fixtures fail for exact reasons                                                                                          |
| Closure                     | closure-candidate | no unowned P3-B blocker or exception; becomes passed only through this handoff PR's exact-head matrix and protected-main read-back                                               |

### Failures, corrections and review

- PR `#31` first attempted merge against a stale full SHA and its remote branch
  was deleted before the API rejected the merge. The intact local signed commits
  were pushed back to the exact ref, the PR was reopened, all checks reran and
  only then was it protected-squashed. No evidence from the failed attempt was
  reused as success.
- Initial Linux observations retained six ordinary-TLS failures on the legacy
  AEAT developer host. Official `prewww2.aeat.es` served WSDL/XSD through normal
  trust; Windows and macOS independently captured the remaining legacy-host
  payloads and agreed byte-for-byte. No TLS bypass, cached copy or source rewrite
  was admitted.
- The source graph exposed an XMLDSig schema dependency. Its exact W3C bytes and
  licence were added; its DTD-bearing document is custody input but is never
  expanded or parsed by the generator.
- Clean local execution first selected ambient Node `24.19.0`, then intentionally
  failed the admitted `24.21.0` check; the exact admitted runtime reran the whole
  gate. A later local run correctly failed without locked `pyshacl`; the admitted
  Python environment reran the complete gate.
- PR `#32` had one auxiliary Conformance failure caused by a transient upstream
  SPDX-model HTTP `504`. The failed attempt is retained; an exact-head retry
  passed without code/evidence change. Required closure had already passed, but
  the PR was not merged until all 26 checks were successful.
- The dedicated handoff rerun reproduced that release-asset `504` twice. The
  admitted input now uses GitHub's immutable release asset-ID API endpoint
  `213001019` with an explicit octet-stream accept header; its 183,176 bytes and
  SHA-256 `6b0b3b91…08c4` are unchanged and no authentication is required. This
  availability correction invalidates and reruns supply-chain, SBOM,
  provenance, reproducibility and complete P3-B evidence on the handoff head.
- Reruns exposed that validation-only source import dropped witness arrays. The
  importer was corrected to reconstruct exact witnesses deterministically and
  all invalidated generation/oracle/assurance evidence reran.
- No external, legal or organizationally independent review is invented. The
  independent oracle is implementation-independent; GitHub checks provide
  executable solo-governance review under the approved zero-approval ruleset.

### Traceability and residual state

- All universal rows and critical controls are machine mapped in
  `config/quality/p3b-claim-evidence.json` and
  `config/quality/p3b-baseline.json`; dashboard, open questions, concrete risk
  rows, REV ledger and governed changelog are updated in this closure.
- There is no open critical P1–P3 defect, missing denominator, partial metric,
  hidden skip or accepted exception. Source/config/tool/task changes invalidate
  their mapped reports and reopen P3-B.
- Later legal declaration, AEAT credentials/transport, stable product workloads,
  organizationally independent assurance, real Facturacion integration and
  publication remain owned downstream prerequisites. They do not apply to
  starting P4 code, and they remain explicit rather than being marked complete.

### Recovery and next phase

- Recovery point before P3-B implementation is protected
  `9e27bf377d07d93fe5faa448eb4ff907b7f21182`; forward correction must use a new
  signed+DCO protected PR. Immutable source/edition identities are never edited.
- The handoff PR must pass every row above on its exact final head, squash with a
  retained DCO trailer, delete its source branch and pass all protected-main
  checks. A final append-only read-back records those non-self-referential IDs.
- Only then is P3-B `evidence-complete` and P4 ready. The first P4 commit must
  consume `P3B-BASELINE-0001` and all `p4FirstCommitPolicies`; it may not lower a
  threshold or reuse a stale subject. P3-B grants no compliance, AEAT acceptance,
  publication or release claim.

### Protected handoff and forward-correction read-back

The preceding closure-candidate did not become evidence-complete at PR `#33`'s
first protected squash. This append-only amendment is authoritative where the
candidate language above conflicts with the observed protected result.

- PR `#33` final head `e82225b8a332d27ce934609b43e6f1ba0249f115`, tree
  `dbb8d4f7bb8bfee8ec9a0698815688ee947700e4`, had two commits. GitHub verified
  both SSH signatures and both canonical DCO trailers. Its exact-head matrix
  passed 26/26 check-runs from App `15368`, including closure job
  `106399989088` in run `35619629851`.
- Protected squash `f6614f8d1ebd17c12e11d0149803d002e201c13e` has exact
  tree `dbb8d4f7bb8bfee8ec9a0698815688ee947700e4`, sole parent
  `ccc2b8decdbcdee58bdbfc5dd13209d47e1a9231` and a valid GitHub signature.
  GitHub auto-deleted the source branch.
- The merge API request escaped its intended line breaks. The squash message
  therefore contains literal `\\n` bytes before `Signed-off-by:` rather than a
  canonical trailer. Required protected-push job `106400357801` in run
  `35619996738` failed for that exact subject, and closure job `106401978019`
  consequently failed. The final protected-push matrix was 23/25 successful and
  2/25 failed. Both failed results are retained and neither is counted as
  closure success.
- PR `#34` is the forward correction and final read-back. Its own commits must
  be SSH-signed with canonical DCO, all 17 exact App `15368` contexts plus every
  auxiliary check must pass on its final head, and its protected squash request
  must encode real line breaks and retain a canonical DCO trailer.
- P3-B becomes evidence-complete only if PR `#34` merges through the active
  zero-bypass ruleset and every final protected-main check, including governance
  and required-check closure, passes. The authenticated post-merge API read-back
  supplies the non-self-referential final squash, tree, parent and run IDs.

This correction changes no source snapshot, generated contract, denominator,
threshold or P4 policy and implements no P4 runtime. It restores governance of
the newest protected subject and reruns all evidence invalidated by the new
documentation subject.

## P4-readiness protected read-back — 2026-09-25

This append-only amendment corrects the current-context capsule, the old
readiness statements in this handoff, and the historical P3-B-era plan/dashboard
language where those statements say P4 readiness is still pending. The older
phase narratives above remain intact as history. This amendment records the
protected state observed before P4-A and authorizes only P4-A entry.

### Exact protected identity and checks

- Work item: issue `#54`,
  https://github.com/noeos/verifactu/issues/54.
- Readiness PR: `#53`,
  https://github.com/noeos/verifactu/pull/53; merged at
  `2026-09-25T08:42:49Z`.
- Final PR head: `d34dd1b50eb9f0e691799365f7057c07ed76aaab`; its two commits
  were GitHub-verified and carried canonical DCO trailers. Exact-head checks
  from required App `15368` completed with 25/25 successes: all 17 required
  contexts and eight auxiliary check runs. The required regulatory context
  executed `gate:p4-readiness`.
- Protected squash: `763b58239d9e589e377b86928ecfc953d72f321b`, tree
  `287a46ba4bfa43143ce6ccecae6d3a3ed56e9e02`, sole parent
  `999d78c19b0e1be3097201a0cc61947a10760bbe`. The squash carries a valid
  GitHub signature and canonical DCO sign-off; its source branch was removed.
- Protected-push runs on the squash are Required engineering foundation
  `36114419541`, Engineering CI `36114419556`, Conformance `36114419521`,
  Regulatory source observation `36114419555`, and Security `36114419483`;
  all concluded success. Required engineering emitted all 17 contexts, each
  successful, including required-check closure. The effective main ruleset
  remains strict and zero-bypass.
- Local clean-tree readiness evidence on `84f676289694d4539e9a559b549971c59bb28e05`
  (tree `b67aa0613629e3a84733c13511cf437c40c3d703`) reports 2/2 subgates,
  zero failed/skipped, and 16/16 seeded plan faults. Frozen counts are 44
  production paths, 26 test paths, 43 critical controls/mutants, 57,344
  property executions, and 32,768 fuzz executions. This is readiness evidence,
  not evidence that those P4 runtime campaigns have executed.
- Scheduled Scorecard run `36114759405` at the same protected SHA concluded
  `startup_failure` with no jobs. It is auxiliary, not a required context; the
  failure is retained and does not change required closure.

### Current disposition and next action

P1–P3-B and the zero-code P4-readiness gate are evidence-complete. P4-A is
`ready`; implementation has not begun. Start P4-A only from the current
protected main SHA with a bounded issue/branch/PR and signed+DCO commits. P4-B
remains blocked until P4-A's protected closure and final-head read-back. The
frozen manifest, thresholds, campaigns, tool candidates, edition identity and
resource limits are unchanged by this correction. `creationAllowed=false`;
there is no fiscal-compliance, AEAT-acceptance, npm-publication or release
claim. P4-D/E exact external-artifact admission still remains required before
those waves.

## Final handoff read-back for readiness record — 2026-09-25

This non-self-referential amendment records PR `#55` after its merge and
protected-push closure. It confirms the readiness state above and sets the
current `main` identity from which P4-A must branch.

- Work item: issue `#56`,
  https://github.com/noeos/verifactu/issues/56. Prior readiness correction
  issue `#54` is closed after PR `#55`.
- PR `#55`, https://github.com/noeos/verifactu/pull/55, final head
  `6c744a405e6dcad7525c0714247c2d2eadf844c9`, one SSH-signed+DCO commit;
  all 17 required contexts and eight auxiliary checks passed on the exact head.
- Protected squash `f92424f3eabe7551224795d9ccaf99aa9ad6b149`, tree
  `edd2ce97ec6a7d20ff4b9f0b7c103c1c5a091f0e`, sole parent
  `763b58239d9e589e377b86928ecfc953d72f321b`, merged
  `2026-09-25T12:10:35Z`. The native squash signature is GitHub-verified,
  includes the canonical DCO trailer, and its source branch is deleted.
- The exact protected-push check-run set contains 25/25 successful checks
  from required App `15368`, including all 17 required contexts and the
  `Required · required-check closure` job. Required engineering run
  `36133440461` concluded success; sibling push runs were Conformance
  `36133440258`, Engineering CI `36133440291`, Regulatory source observation
  `36133440354`, and Security `36133440338`, all successful on this SHA.
- The active `protected-main` ruleset targets the default branch, has no bypass
  actors, requires strict checks from App `15368`, signed commits, PR+squash,
  linear history and resolved threads, and forbids deletion/force updates. It
  requires zero approvals and no CODEOWNERS/last-push/unattributed approval.
- P4-A entry is authorized from protected main
  `f92424f3eabe7551224795d9ccaf99aa9ad6b149` only. P4-B remains blocked until
  A's protected closure and exact final-head read-back. The readiness census,
  thresholds, admissions and report schemas are unchanged. `creationAllowed=false`;
no fiscal-compliance, AEAT-acceptance, publication or release claim follows.

## Final protected read-back before P4-A — 2026-09-25

This append-only amendment records PR `#57`'s post-merge result and confirms the
latest protected base for P4-A. It does not change the readiness manifest or
authorize any later P4 wave.

- Work item: issue `#59`,
  https://github.com/noeos/verifactu/issues/59. Issue `#58` is closed after
  this protected-main evidence was observed.
- PR `#57`, https://github.com/noeos/verifactu/pull/57, head
  `9c30be400370b65d7463f24ad5858377c5abf316`; exact head had 25/25 check-runs
  pass, comprising all 17 required contexts and eight auxiliary runs.
- Protected squash `e7df2649e9ee148a61ccda0d8d4af6b8d3e0fe0f`, tree
  `6133182c9bb4776923fd1a9d03b1f9c5c810ba03`, sole parent
  `f92424f3eabe7551224795d9ccaf99aa9ad6b149`, merged at
  `2026-09-25T12:20:56Z`. GitHub reports a valid signature, the canonical DCO
  trailer is present, and the PR source branch is deleted.
- The protected-push check-run set is 25/25 successful from required App
  `15368`; its `Required · required-check closure` job completed successfully.
  Exact push runs: Required engineering foundation `36134411631`, Engineering
  CI `36134411620`, Conformance `36134411632`, Regulatory source observation
  `36134411652`, and Security `36134411440`; each concluded `success` on this
  SHA.
- P4-A may now branch from protected `main`
  `e7df2649e9ee148a61ccda0d8d4af6b8d3e0fe0f`. P4-B remains blocked until A's
  protected closure and exact final-head read-back. `creationAllowed=false`;
  no fiscal-compliance, AEAT-acceptance, publication or release claim is made.
