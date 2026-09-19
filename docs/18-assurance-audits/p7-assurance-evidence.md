---
id: ASSURANCE-DOC-0022
title: P7 whole-product assurance evidence
status: approved
authority: normative
owner: assurance-owner
created: 2026-09-17
last-reviewed: 2026-09-17
dependencies: [ASSURANCE-DOC-0002, ASSURANCE-DOC-0004, ROADMAP-DOC-0017]
decisions: [ADR-0026, ADR-0052, ADR-0053]
historical-inputs: [REV-056, REV-057, REV-059, REV-060, REV-063, REV-074, REV-079, REV-080, REV-082, REV-083, REV-084]
---

# P7 whole-product assurance evidence

## Initial scope and status

P7 is planned and has not started. This document defines the whole-product
assurance campaign and release rehearsal that will follow implementation; it is
not a dossier, campaign result, release authorization or support claim.

The future campaign must bind every result to an exact repository subject, tree,
edition, toolchain, configuration, environment and evidence digest. It must
fail closed when quality, performance, security, supply-chain, external,
recovery, legal or publication evidence is missing, stale, partial or
independent authority is unavailable.

The required waves are P7-A graph closure, P7-B quality, P7-C security/privacy,
P7-D performance/reliability, P7-E supply chain, P7-F external integration
matrix, P7-G legal/operations, P7-H audits, P7-I release rehearsal and P7-J
dossier generation. The 84 historical findings remain an explicit population;
none may be marked `verified-prevented` without current packaged regression and
assurance evidence. The synthetic Facturacion host proves only the future public
boundary; the absent real Facturacion repository is not a VeriFactu release
blocker.

## Retained execution record (non-authoritative)

The complete execution record below is retained so that no prior-attempt result,
correction, blocker, evidence locator or lesson is lost. It is not current
status and cannot authorize P7, P8 or release. The initial status above is the
only current state represented by this document; any future campaign must create
fresh exact-subject evidence under the approved roadmap.

## Scope and status — retained execution record

## Executable graph

The canonical task registry adds the ordered waves:

| Wave | Task | Executed result | Release meaning |
| --- | --- | --- | --- |
| A | `assurance:p7-graph` | passed | 84 `REV` rows and the complete typed graph plan enumerated; Wave J closed 163 nodes/296 edges with no orphans or unknown references. |
| B | `assurance:p7-quality` | passed task / blocked report | 18 installed scripts, 1,000 fuzz cases and 259 property cases passed; production coverage and mutation denominators are unavailable. |
| C | `security:p7-privacy` | passed task / locally verified | 18 threats/controls inventoried, XML/fiscal/boundary regressions and admitted Gitleaks scan passed; no independent penetration review. |
| D | `performance:p7-baselines` | passed task / blocked report | 20 raw samples with latency and RSS observations; no qualified runner or adopted official baseline. |
| E | `supply-chain:p7-audit` | passed task / blocked report | 248 lock entries, 39 Action references, dual SBOM and provenance rehearsal reconciled; no stable attestation exists. |
| F | `integration:p7-external-matrix` | passed task / blocked report | Installed Engine, offline providers and synthetic future-Facturacion host passed; authorized AEAT/production provider observations are absent. The absent real Facturacion repository is explicitly not a blocker. |
| G | `release:p7-legal-operations` | passed task / blocked report | Current runbooks and source blockers inventoried; competent legal/CRA review and recovery custody/drill absent. |
| H | `assurance:p7-audits` | passed task / blocked report | Internal self-assessment covers all 84 rows; required competent external review is absent. |
| I | `release:p7-rehearsal` | passed task / blocked report | Three-package partial publication, forward recovery and independent-readback simulation passed without external mutation. |
| J | `assurance:p7-dossier` | passed task / blocked report | Dossier binds the nine raw wave artifacts and explicitly denies unsupported claims. |

Every wave report is generated from the task runner's exact subject and the raw
artifact digest is included in the report. `gate:p7` intentionally exits with
`P7_BLOCKED`/exit 42 when the dossier contains any mandatory blocker; no green
closure report is manufactured by the generic task-report schema.

## Findings and thresholds

The first campaign exposed and retained two harness defects: an unused
helper was rejected by ESLint, and a task attempted an undeclared `git` child
process. The helper was removed; the task runner now passes its already-resolved
subject to children without granting shell authority; the child-entrypoint
allowlist covers only the campaign scripts. A further child-environment defect
was corrected so the admitted Gitleaks executable can resolve its system `git`
dependency. The authoritative campaign was rerun from the protected merged
tree after those corrections.

The following release blockers remain open and are not waivers:

| ID | Exact condition | Required evidence to unblock |
| --- | --- | --- |
| `P7-BLOCK-001/002` | No admitted production line/function/branch instrumenter or production mutation engine produced valid denominators. | Full all-module coverage report meeting 98/98/95 and critical-branch 100; valid mutation population meeting 100% critical and 95% other, with regression retest. |
| `P7-BLOCK-004` | Local performance is exploratory and no stable qualified runner/baseline was observed. | Frozen environment, raw/noise/profile evidence and adopted workload budgets on an authorized stable runner. |
| `P7-BLOCK-007` | No authorized AEAT observation, production certificate/mTLS or external provider conformance is available. | Authorized AEAT test evidence with exact endpoint/certificate identity and scoped provider matrices. |
| `P7-BLOCK-009/011` | No competent independent legal/RRSIF/CRA/privacy or technical/security review has occurred. | Reviewer identity/competence/conflicts, scope, report, findings, remediation and independent retest. |
| `P7-BLOCK-010` | Account/key/workstation/OIDC recovery and independent custody drill is unavailable. | Non-production drill with RPO/RTO, custody, read-back and forward-recovery evidence. |
| `P7-BLOCK-012` | Real hosted OIDC publication, registry observation and recovery were not authorized. | Exact three-package RC rehearsal in an authorized non-production namespace, including partial failure and independent read-back. |
| `P7-BLOCK-013` | Dossier cannot be signed or promoted while the above blockers remain. | New exact-subject dossier after all blockers and invalidated campaigns are rerun. |

The real Facturacion repository is absent by design. The synthetic host contract
is the complete permitted evidence for that future consumer; P7 does not claim a
real integration and does not require that future repository for this phase.

The P7-F correction removed an incorrect release blocker that had treated the
absent real Facturacion repository as a failure. PR `#49` preserved the roadmap
boundary; the corrected P7-F result now blocks only on unavailable authorized
AEAT, production certificate/mTLS and external-provider observations.

## External mutable-state read-back

At the authoritative post-merge read-back on 2026-09-17, GitHub showed
protected `main` at the last pre-amendment documentation merge
`8281ffa490ec856276dc91ffe90f2103f4834b97`, tree
`fc9d5fb211dd1e4c6a8d3ed2db07b8ff8eb5ed75`, with active branch/tag rulesets
with no bypass actors, required
signatures, squash-only merges, 17 required contexts, automatic branch deletion
and no configured environments. P7 implementation PR `#46` merged through that
protected flow as `aa08c567abb256d7aa81d7691a787cae5660ea55`; correction PRs
`#49`, `#51`, `#53` and `#54` subsequently merged through the same protected
flow; no P7 closure PR was created. Handoff binding PRs `#47` and `#48` also
merged through that flow. PR `#54` refreshed the mutable CycloneDX SPDX
admission pin from the observed `v1.1-3.28.0` digest to the observed
`v1.1-3.29.0` digest
`33863a360fc4d348e183d89c1ca7aa0877f481e7eb55be2d4102a30386188a10`.
Open PRs are unrelated Dependabot updates. npm `whoami` failed
with `ENEEDAUTH` and the three VeriFactu names were not published; no
publication or dist-tag was mutated.

These observations prove current limits, not readiness. GitHub and npm state
must be re-read immediately before any future RC; stale local reports cannot
authorize it.

## Historical findings disposition

P7-A enumerated exactly `REV-001` through `REV-084`; P7-H repeated the complete
population for internal audit. No row is closed by the aggregate count. Each row
inherits its earlier phase evidence only within that phase's declared scope and
remains `adopted`/`downstream` where the current packaged regression, threshold,
external observation or recovery proof is missing. The P7 dossier therefore
preserves every row and its reopen obligation; it does not convert a historical
finding into `verified-prevented` by assertion.

## Claims and limitations

The only claims supported by this record are that the declared local campaigns
were run, their raw results are digest-bound to the stated subject, and the
synthetic release state machine did not mutate production channels. The project
does not claim `stable`, `supported`, `compliant`, `certified`, AEAT acceptance,
CRA completion, real Facturacion integration, production durable storage or
publication.

## P8 inputs, not authorization

P8 may start only after a new protected handoff proves: all blockers closed;
current RRSIF/GDPR/CRA/applicability and declaration review; competent external
reports and retests; qualified performance and quality thresholds; authorized
certificate/AEAT/provider observations; account/OIDC/recovery custody; exact
package ownership; and an explicitly signed release authorization. The current
P7 dossier supplies no such authorization.

## Authoritative final protected evidence binding

The canonical `assurance:p7-dossier` run on protected `main` executed 59 tasks
after graph correction PR `#54` and the admitted CycloneDX SPDX input refresh.
The nine raw wave artifacts below are the exact inputs to P7-J:

| Wave | Raw artifact SHA-256 |
| --- | --- |
| A | `2555c9d32f153a587432303b02a27cd51d989938ffb57bf249be22ef98758104` |
| B | `a569dd0cf463f33a70dedeab58ae4d83b03459233862a88835b0042c06985de9` |
| C | `6e0a0eaca347dae5b8c78c0edf904f0fc4df2842e6a9ada101f12c37cc81618d` |
| D | `c5d77230a3ba1b7143d5dbf0dbead03a1808ad71fd0c06e3227e66a9bb8e8881` |
| E | `485109bb7d747798c248fa0d935345791d99f99ce6d43f2240aea6606f54cbb3` |
| F | `7b0346da7cce94c0d309eb4806326643b1399beb7523824b851796063e3cb8b6` |
| G | `8555f05127d0ddc100d7ee1c56594197bce36343ef934341791ab1f47891bae0` |
| H | `8609fc55794faa554249d432a90e8e86d0d97830217d823ef593a876ae5f6a86` |
| I | `b477d0aa39c3b730551b8b8179f8e3578672cee1765d301a1a25de0e50b27619` |
| J | `19ab73f9f1a70d487b609a4cb440a38b4f6f365b25599858f8c90432d0b3bb19` |

The dossier task report is
`5b52f8a5e8cc241015b99f2089bd9483874f9c9b6b7ba646afb46c17333c2976`.
The separately attempted exact-tree `gate:p7` run is
`evidence/runs/p7-gate-blocked-main-5`; its task report is
`2c7f8f0c18013c4924c684a5113c4143c0f38d44d5b6a30cd53a93b56260991a`; it
failed closed with exit 42 and
reported these exact blocker keys: `coverage-and-mutation-thresholds-not-qualified`,
`stable-performance-runner-and-baseline-not-observed`,
`authorized-aeat-and-production-certificate-observation-unavailable`,
`competent-independent-review-unavailable`,
`legal-cra-applicability-review-unavailable`, and
`account-key-oidc-recovery-and-registry-readback-not-authorized`.

Wave J records graph closure as 163 nodes and 296 edges, with zero orphan
nodes, unknown references, stale evidence, missing artifacts or unknown claims;
all eight configured release cells remain explicitly blocked. The P7-B raw
campaign covers 18 installed scripts, 1,000 fuzz cases and 259 property cases;
coverage and mutation thresholds remain unqualified.

### Amendment P7-004 — 2026-09-17 expanded quality campaign

- Statement corrected: P7-B previously documented 14 installed campaign
  scripts although the task graph admitted 18 installed quality/contract/
  policy/performance scripts.
- Correct value and reason: protected PR `#53` merged the omitted installed
  entrypoints into the P7 campaign; fresh evidence records 18 executions,
  1,000 fuzz cases and 259 property cases. Coverage and mutation blockers
  remain unchanged because no admitted production denominators exist.
- Evidence locator: `evidence/runs/p7-dossier-main-6/p7-b-raw.json`, digest
  `a569dd0cf463f33a70dedeab58ae4d83b03459233862a88835b0042c06985de9`.
- Protected implementation identity: PR `#53` squash
  `8717adbfc5050404730f6692485f7b1fdb328470`, tree
  `d65eeec28458ff21842d975dc61a215973823ab8`.

### Amendment P7-005 — 2026-09-17 typed graph and external-input readback

- Statement corrected: P7-A/J previously lacked a complete machine-validated
  claim/evidence graph closure, and the pinned CycloneDX SPDX subschema had
  drifted from the current upstream content.
- Correct value and reason: protected PR `#54` added the graph manifest/schema
  and Wave J closure, and refreshed the admitted digest after confirming the
  upstream version changed from `v1.1-3.28.0` to `v1.1-3.29.0`.
- Evidence locator: final A raw digest
  `2555c9d32f153a587432303b02a27cd51d989938ffb57bf249be22ef98758104`, final J
  raw digest
  `19ab73f9f1a70d487b609a4cb440a38b4f6f365b25599858f8c90432d0b3bb19`, and
  final dossier task report
  `5b52f8a5e8cc241015b99f2089bd9483874f9c9b6b7ba646afb46c17333c2976`.
- Findings and disposition: graph integrity is locally verified; P7 remains
  active and blocked by the six normalized gate conditions. No stable,
  supported, compliant, certified, AEAT-accepted, real-Facturacion or
  publication claim is widened.
