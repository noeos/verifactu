---
id: REPO-DOC-0014
title: GitHub Actions workflow architecture
status: approved
authority: normative
owner: repository-owner
created: 2026-09-12
last-reviewed: 2026-09-12
sources: [SRC-0052]
decisions: [ADR-0030, ADR-0032, ADR-0033]
historical-inputs: [REV-058, REV-075, REV-079, REV-080, REV-082]
---

# GitHub Actions workflow architecture

| Workflow | Events/trust | Responsibility |
|---|---|---|
| `ci.yml` | PR-safe, main push, manual | docs/policy/generated, tests, OS/runtime, package/repro closure |
| `conformance.yml` | PR-safe, main, schedule | regulatory, format, state/crash and adapter contracts |
| `security.yml` | PR-safe/main/schedule | dependency review, CodeQL, secrets, OSV, npm/licence, fuzz |
| `performance.yml` | PR smoke; trusted schedule/manual | correctness-guarded budgets/stress/soak |
| `github-audit.yml` | trusted schedule/manual/policy | read-only effective state and alerts |
| `scorecard.yml` | schedule/policy | pinned JSON/SARIF signal, not closure |
| `release-candidate.yml` | protected rehearsal | non-publishing candidate/evidence only until Lot 4 |

Future `release.yml` and `release-verification.yml` remain incapable of
publication until Lot 4. Workflows declare exact events, `permissions: {}` or
read default, job elevation, shell, timeout, concurrency/cancellation, matrix
limits and artifact contract. Actions are full-SHA admitted.

YAML orchestrates canonical tasks and never embeds competing build/test logic.
PR and main runs bind the actual checked-out SHA; pull-request merge refs cannot
be misreported as head. Scheduled failures create findings and visible owner
notifications, not silent badges.
