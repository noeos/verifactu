---
id: ROADMAP-DOC-0017
title: Implementation phase handoff
status: draft
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
| Roadmap | Eight phases P1–P8; P1 is next. |
| Current phase | `P1` — governed bootstrap and effective protection. |
| Phase status | `active`; P1 intake and local policy validation started at `2026-09-13T11:14:42Z`. |
| Last evidence-complete phase | None. |
| Local repository | Empty-history repository on `docs/governance-foundation`; 410 current Markdown documents and 117 immutable historical files observed; no product source. |
| Protected `main` SHA | `not-observed`; do not infer one. |
| GitHub effective state | Intake observed empty remote history, no rulesets/environments and settings that do not yet satisfy P1; issue `#1` tracks remediation. |
| Toolchain/lock | Planned profiles only; no admitted implementation manifest/lock evidence yet. |
| Regulatory edition | No implemented edition selected or generated yet. |
| Verification Engine | Planned integration baseline must be independently re-observed/admitted. |
| Public packages | Not implemented or published. |
| External gates | Legal/CRA review, AEAT access/certificates, npm ownership/OIDC, performance runner and independent review must be observed. Facturacion is not built; only its versioned contract and maintained synthetic host are in current scope. |
| Immediate instruction | Complete P1 bootstrap, producer observation, effective protection probes, governance acceptance and dedicated closure PR. |

## Phase ledger

| Phase | Status | Input `main` | Closure `main` | Closure PR | Summary |
| --- | --- | --- | --- | --- | --- |
| P1 | active | no remote commit | — | — | Issue `#1`; local governance validators and negative fixtures pass before bootstrap. |
| P2 | planned | — | — | — | Executable engineering/CI/build foundation. |
| P3 | planned | — | — | — | Official sources, editions, contracts and oracles. |
| P4 | planned | — | — | — | Deterministic fiscal core, artifacts and verification. |
| P5 | planned | — | — | — | Durable consistency and AEAT operation. |
| P6 | planned | — | — | — | Public products and ecosystem conformance. |
| P7 | planned | — | — | — | Whole-product assurance and release rehearsal. |
| P8 | planned | — | — | — | Stable publication, verification and support. |

## Active-phase working record

### P1 working record — governed bootstrap and effective protection

- Status: `active`.
- Started: `2026-09-13T11:14:42Z`.
- Input Git state: repository has no commit; branch
  `docs/governance-foundation`; origin `noeos/verifactu` has no branch.
- Work item: GitHub issue `#1`.
- Documentation baseline: 410 current Markdown files, aggregate SHA-256
  `3814cb84052cdd7e14090f320398cf1d2a5679195f0c487fdfa11439112bd730`.
- Historical baseline: 117 files under `docs/previous-docs`, aggregate SHA-256
  `99641c59c5e5bc32c08dfc337912301b8a7c1f91f08976673eb52396f41c93a1`.
- Identity baseline: repository-local SSH signing and tag signing enabled;
  admitted public-key fingerprint
  `SHA256:65VbGskWghAQAXDbJ3/1hrWuYegZNLs/+S96BbNQCzI`; no private material retained.
- Local policy gates: documentation/governance validation and their negative
  fixtures pass; commit-policy positive and negative fixtures pass.
- GitHub intake discrepancy: merge/rebase enabled, automatic branch deletion
  disabled, SHA pinning and secret scanning disabled, and no effective rulesets.
- Recovery point: empty remote repository; no prior commit can be restored.
- Next operation: signed/DCO bootstrap, observe all three check producers, then
  install and read back the documented settings and no-bypass rulesets.
- Long-lead lane: external legal/CRA review, AEAT access, npm custody,
  performance environment, independent assessment and recovery custody remain
  `not-observed`; P1 does not claim their completion.

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

No implementation phase has yet produced a protected closure record. Planning
approval is not implementation or evidence.
