---
id: ROADMAP-DOC-0021
title: Universal phase close control matrix
status: approved
authority: normative
owner: project-owner
created: 2026-09-19
last-reviewed: 2026-09-19
dependencies: [ROADMAP-DOC-0013, QA-DOC-0019, REPO-DOC-0008]
historical-inputs: [HIST-QUALITY-REBASELINE-001]
---

# Universal phase close control matrix

This matrix applies to P1–P8. A phase may narrow a row only by recording a
positive not-applicable proof. It may never omit a row silently.

| Control family              | Required proof before closure                                                                                                               |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Scope and requirements      | Complete requirement/finding population, acceptance mapping, owner, downstream effects and no orphan.                                       |
| Identity and evidence       | Final commit/tree/parent, signed+DCO commits, command, environment, config, raw report, schema and digest.                                  |
| Toolchain                   | Exact runtime versions, package manager, compiler, validators, external tools, archives and engine compatibility.                           |
| Task graph                  | Acyclic graph, declared inputs/outputs/env/network/secrets/timeouts, zero-work failure and clean isolated outputs.                          |
| CI and GitHub               | Required contexts, closure check, event/path matrix, permissions, branch/tag protection, dependency review and final-head read-back.        |
| Platforms                   | Every supported OS/runtime/toolchain cell; no unobserved matrix cell represented as green.                                                  |
| Functional quality          | Unit, contract, integration, E2E and clean consumer tests for the complete declared population.                                             |
| Quantitative quality        | Coverage denominators, mutation population/statuses, critical catalogue, property/fuzz/fault counts and all thresholds.                     |
| Security and privacy        | Threat/control matrix, hostile inputs, secrets, redaction, limits, parser/signature/network isolation, SAST and dependency results.         |
| Performance and reliability | Frozen workloads, raw samples, noise/profile data, budgets, percentiles, capacity, stress/soak, crash and recovery evidence.                |
| Compatibility               | Public API/schema/CLI/types, persisted data, provider/Engine, version/OS and migration matrices.                                            |
| Supply chain                | Lock and registry integrity, Action/tool admission, licences, lifecycle policy, SBOM reconciliation, provenance and clean rebuilds.         |
| Operations and law          | Applicability, declaration, monitoring, incident, support, continuity, account/key recovery and required competent/external observations.   |
| Negative assurance          | Maintained fixtures prove each material control fails closed for wrong tree, source, tool, network, write, report, dependency and artifact. |
| Closure                     | No unowned finding, expired exception, unknown claim, missing denominator, hidden retry/skip or unresolved applicable blocker.              |

## Status semantics

Every row is `passed`, `blocked` or `failed`. `blocked` is allowed only with a
precise reason, owner, next evidence and impact. It cannot be promoted by
counting other rows. A phase is `evidence-complete` only when all applicable
rows are `passed`; a release gate additionally requires all external and legal
rows required for that release.

## Evidence discipline

Reports from a previous commit, different lock, different toolchain or different
population are stale. A source or configuration change invalidates every mapped
row and triggers a complete rerun of the affected population. Aggregate green
status never overrides a failed threshold or a missing denominator.
