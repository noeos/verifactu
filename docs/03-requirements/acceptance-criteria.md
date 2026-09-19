---
id: REQ-DOC-0009
title: Acceptance criteria
status: approved
authority: normative
owner: requirements-owner
created: 2026-09-12
last-reviewed: 2026-09-12
decisions: [ADR-0001, ADR-0010, ADR-0012, ADR-0013]
historical-inputs: [REV-056, REV-063, REV-074, REV-079, REV-082]
---

# Acceptance criteria

## Gate hierarchy

| ID | Gate | Required result |
| --- | --- | --- |
| `ACC-0001` | Documentation | Approved sources/ADRs/specifications; valid IDs/links/schemas; historical dispositions; fresh generated views. |
| `ACC-0002` | Requirements | Zero orphan/duplicate/compound/unverifiable mandatory requirements; full quality/threat/capability coverage. |
| `ACC-0003` | Correctness | Unit/integration/property/vector/contract tests cover every normative branch with independent oracles. |
| `ACC-0004` | Negative assurance | Boundary/adversarial/fault/mutation/fuzz fixtures prove checks fail for named defects and preserve state. |
| `ACC-0005` | Regulatory | Exact edition sources, generated contracts/rules, legal review and applicable AEAT external corpus pass. |
| `ACC-0006` | Security/privacy | Threat/control mapping complete; critical findings closed; boundary and privacy evidence passes. |
| `ACC-0007` | Performance/reliability | Every adopted budget and stream/stress/soak/restart/recovery gate passes. |
| `ACC-0008` | Integration | Verification Engine, packed hosts and supported adapters pass exact-version conformance. |
| `ACC-0009` | Package/supply chain | Tarball/API, clean install, licences, vulnerabilities, signatures, SBOM and reproducibility pass. |
| `ACC-0010` | Release | Signed tag/artifacts, provenance, post-publication checks, declaration and dossier reconcile. |
| `ACC-0011` | Operations | Deployment, backup/restore, outage/reconciliation, incident and EOL runbooks pass drills. |
| `ACC-0012` | Claim | No finding/risk/exception contradicts the advertised version/edition/mode/platform scope. |

## Result semantics

Every applicable constituent must conclude explicit success for the final
subject SHA/artifact. Missing, skipped, neutral, cancelled, timed-out, stale,
empty-range, partial or unparseable evidence fails. A changed commit invalidates
earlier runs.

## Requirement satisfaction

A requirement is `satisfied` only when specification, implementation and all
applicable evidence align. `not-applicable-demonstrated` requires a cited
predicate/test; `accepted-risk` requires authorized non-legal residual risk;
`blocked` prevents the affected claim. Counts cannot hide a P0/P1 gap.

## Stable release

Stable release requires `ACC-0001`–`ACC-0012`; there is no later-hardening
exception. Emergency/security patches execute the complete risk-applicable
matrix and produce the same publication verification/dossier obligations.
