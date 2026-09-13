---
id: ROADMAP-DOC-0018
title: Codex implementation phase prompts
status: approved
authority: informative
owner: project-owner
created: 2026-09-13
last-reviewed: 2026-09-13
dependencies: [ROADMAP-DOC-0004, ROADMAP-DOC-0017]
decisions: [ADR-0001, ADR-0031, ADR-0051]
historical-inputs: [REV-063, REV-074, REV-079, REV-084]
---

# Codex implementation phase prompts

## Use and precedence

Prepend `/goal` to exactly one phase prompt. Do not combine phases. Each prompt
is a derived execution aid; [`implementation-roadmap.md`](implementation-roadmap.md),
higher-authority documentation and current law prevail.

The operator should issue the next prompt only after the prior phase closure is
on protected `main`. If a session resumes an unfinished goal, reuse the same
phase prompt: Codex must inspect the existing branch/PR/evidence and continue
rather than recreate completed work.

## Mandatory behavior embedded in every prompt

Every phase prompt requires Codex to:

- read all current documentation outside `previous-docs` in indexed batches,
  especially the roadmap, handoff, phase authorities and applicable ADRs;
- use `previous-docs` only as historical input while reading all mapped REV
  findings and relevant reproductions;
- inspect actual local, GitHub, package and external state instead of trusting
  prose; correct discrepancies visibly;
- execute the full scoped phase, not an MVP, scaffold, happy-path substitute,
  mock of a mandatory dependency or deferral;
- create traceable work packages/issues and multiple coherent PRs as needed;
- use SSH-signed+DCO human commits, final-head CI, native squash, protected main
  and verified automatic branch deletion;
- preserve first failures, diagnose root cause/variants, add regressions, rerun
  invalidated evidence and never retry-to-green or weaken gates;
- keep code, tests, generated contracts, docs, risks, findings, migrations and
  traceability synchronized;
- continue autonomously through safe correctable work; stop only for a genuine
  authority/credential/external/destructive blocker and record exact unblock
  evidence without falsely closing;
- end through a dedicated handoff closure PR and verify protected `main`.

## Prompt P1 — Governed bootstrap and effective protection

```text
Execute Phase P1 of docs/17-roadmap-risk/implementation-roadmap.md completely.
Your terminal outcome is a documentation-only repository whose effective GitHub
and Git state enforce the approved single-maintainer protected flow before any
product source exists.

First read all current documentation in indexed dependency batches, then reread
the roadmap, handoff, all 00-governance documents and the complete 13-repository-ci
bootstrap/settings/rulesets/workflow/signature/single-maintainer/audit set. Read
all mapped historical findings and relevant previous-docs reproductions. Inspect
the real local repository, GitHub repository, history, identity and settings;
never assume the handoff is current.

Execute P1-W1 through P1-W7 in order. Establish and test SSH signing, allowed
signers and DCO without exposing private material. Create only the minimum
full-SHA least-privilege documentation/governance workflow needed to bootstrap.
Observe every context before requiring it. Configure squash-only merging,
automatic branch deletion, Actions/security settings and strict no-bypass main
and tag protection with zero approvals and no CODEOWNERS, fake reviewer or
routine bypass. Prove direct, force, delete, unsigned and missing-DCO paths fail
in disposable branches, and prove the signed protected PR/squash/delete path
succeeds. Read back every effective endpoint and remove/read back any temporary
relaxation. Do not create product code.

Use coherent issues/branches/PRs and git commit -S -s. Preserve redacted evidence
for each positive and negative claim. Formally accept documentation only through
the resulting protected path without claiming code is implemented. Correct every
in-scope defect and rerun invalidated checks. Finish by updating handoff.md in a
dedicated closure PR with exact SHAs, PRs, checks, settings evidence, failures,
corrections, long-lead external items and P2 prerequisites. P1 is complete only
when its roadmap exit criteria pass on protected main.
```

## Prompt P2 — Executable engineering, CI, build and supply chain

```text
Execute Phase P2 of docs/17-roadmap-risk/implementation-roadmap.md completely.
Start by reading all current documentation and validating the P1 handoff against
clean protected main and effective GitHub state. Reread all 05-architecture,
13-repository-ci, 14-supply-chain-build, applicable quality/assurance documents,
ADRs and historical findings. Reopen P1 if its protections are not truly effective.

Implement P2-W1 through P2-W8 as real production engineering infrastructure:
the exact allowlisted repository/workspace tree and ownership/import rules;
independently admitted pinned toolchain; exact three package shells without fake
capabilities; typed canonical acyclic task graph with declared IO/environment/
network/timeouts/reports and zero-work failure; format/lint/types/docs/IDs/graph/
architecture/API/package policy; all 17 required leaf contexts plus always-run
closure across path/event classes and OS/runtime matrix; full-SHA Actions and
dependency/tool/lifecycle/licence admission; clean hermetic reproducible build,
closed package allowlists, tarball-only consumers, one reconciled component graph,
CycloneDX/SPDX and honest provenance rehearsal.

Seed deliberate invalid fixtures for every material control: wrong tree/import,
hand-edited generated file, undeclared tool/network/write, cycle/duplicate/stale/
empty task, missing job/report, mutable Action/dependency, package leak and
nonreproducible output. Prove each fails for its intended reason, then keep only
safe maintained negative fixtures. Never satisfy a context with a placeholder.

Use traceable signed+DCO protected PRs, fix all in-scope failures and read back
GitHub after context changes. End with a closure PR updating handoff.md with the
admitted versions/digests, task/check registry, package/tree state, evidence and
P3 inputs. Complete only when every P2 exit criterion passes from clean state.
```

## Prompt P3 — Official sources, editions, contracts and oracles

```text
Execute Phase P3 of docs/17-roadmap-risk/implementation-roadmap.md completely.
Read all current documentation; validate the handoff and P1/P2 evidence against
protected main. Prioritize 02-regulatory, 03-requirements, official formats/source
custody, contract generation, fixtures/oracles, security and historical findings.
Re-observe every mutable official/legal/AEAT source through the documented
authority hierarchy; do not implement from memory or stale examples.

Execute P3-W1 through P3-W6. Acquire official bytes through a quarantined bounded
import with exact authority, URL, time, digest, licence and dependency identity.
Create immutable edition manifests and lifecycle. Implement hostile-safe offline
XSD/WSDL/catalog/rule import and deterministic generation of runtime staged
contracts, public schemas, field constraints, SOAP binding descriptions and
catalog access. Build official, synthetic, boundary, adversarial and compatibility
vectors plus genuinely independent oracles unavailable to production imports.
Prove clean no-diff regeneration, changed-input invalidation, provenance/licence
closure, unsupported-structure rejection and seeded-defect detection.

Resolve material ambiguity using authority/ADR process; if external authority is
genuinely unavailable, finish all safe work but mark the exact work blocked rather
than invent semantics. Map every implementable requirement to edition, contract
and oracle. Use signed+DCO protected PRs, correct all defects, and close through a
handoff PR recording source/edition/generator/oracle identities and exact P4
readiness. Do not start fiscal production logic before P3 evidence is complete.
```

## Prompt P4 — Deterministic fiscal core, artifacts and verification

```text
Execute Phase P4 of docs/17-roadmap-risk/implementation-roadmap.md completely.
Read all current docs and validate the handoff/source editions on protected main.
Prioritize all 04-domain, 05-architecture, 06-contracts, 07-formats-cryptography,
XML/signature security, testing and Verification Engine documents and mapped
historical failures. Inspect the exact admitted Verification Engine public package.

Implement waves P4-A through P4-G in dependency order using multiple vertical
signed+DCO PRs. Complete staged codecs, identities/context/values, all record and
correction operations, modes/tenure, events/states/invariants/sequences/chains and
diagnostics. Implement effect-free plans, official projection, encoding/order/
decimal/date, fingerprint and exact byte custody. Add hardened XML serialization,
real offline XSD provider, XAdES/PKI creation and verification, certificate chain/
time/revocation/algorithm handling, QR content/render/decode, separate claims and
the exact installed Verification Engine profile adapter. No implicit clock,
randomness, storage, network or key state; no internal/oracle public leak.

Develop positive/boundary/negative tests with implementation: unit, contract,
property/shrinking, official/independent vectors, mutation, fuzz, parser/signature/
wrapping/resource attacks and clean packed consumers. Meet 100% critical branch
and mutation behavior and project global thresholds for this scope; do not game
coverage or mutation. Seed faults to demonstrate the oracles detect them. Preserve
exact bytes through every boundary and keep official, crypto, AEAT and Noeos
claims distinct.

Fix every scoped defect and affected variant, rerun all invalidated evidence and
merge only protected final-head greens. Close via handoff PR with public/contract/
artifact/provider/Engine identities, test metrics, evidence, remaining external
items and exact P5 prerequisites.
```

## Prompt P5 — Durable consistency and AEAT operation

```text
Execute Phase P5 of docs/17-roadmap-risk/implementation-roadmap.md completely.
Read all documentation; verify the handoff and deterministic-core package bytes.
Prioritize all 08-persistence-consistency and 09-aeat-integration documents plus
host/provider contracts, concurrency, security/privacy, quality, performance and
historical findings. Re-observe authorized AEAT/certificate access without
exposing credentials or taxpayer data.

Implement waves P5-A through P5-G with signed+DCO vertical PRs. Complete durable
record/artifact/event/evidence/outbox ports, identity/idempotency and schema rules;
host UoW atomic commit; CAS heads/forks, leases/fencing and checkpoints; journal,
crash/rollback/reconciliation/migration/retention/backup/restore/DR behavior. Then
implement edition-bound endpoint/WSDL/SOAP/headers/system identity, mTLS and
certificate authorization, exact wire bytes/safe response parsing, batches/order/
limits/timing, attempts/correlation/responses, safe retry, indeterminate delivery,
consultation and required submission. Build the strict local AEAT peer and safe
redacted observability/runbooks.

Use model/adapter/contract/integration tests and deterministic fault injection at
every commit/network boundary, including races, duplicates, stale commands,
cancellation, crash/restart, drop/delay/duplicate/malformed/TLS/partial responses,
migration, restore and long reconciliation. Prove no split records/chains/events/
artifacts/outbox and no secret/fiscal leakage. Never label the harness as external
AEAT acceptance. Correct all root causes/variants and close through handoff with
store/state/protocol matrices, recovery evidence, external gaps and P6 readiness.
```

## Prompt P6 — Public products and ecosystem conformance

```text
Execute Phase P6 of docs/17-roadmap-risk/implementation-roadmap.md completely.
Read all current docs; verify protected-main handoff and installed artifacts.
Prioritize 06-contracts, 16-integrations-conformance, package/build/compatibility,
public security and historical findings. Re-observe exact Verification Engine
and provider versions/capabilities; treat Facturacion as an unbuilt future
consumer represented only by its versioned contract and synthetic host.

Execute P6-W1 through P6-W8. Finalize the complete public library operations,
configuration/capabilities/results/errors/events/editions/schemas/limits/exports;
the strict streaming JSON/NDJSON CLI and deterministic process behavior; and the
adapter kit's typed interfaces, executable conformance, fixtures, fault controls
and schema reports. Prove ESM/CJS/type identity, supported Node/OS/TypeScript,
closed deep imports, files/bin/licences and exact lockstep dependencies.

All integration tests must install digest-checked public package tarballs in clean
roots with workspace/sibling-source access denied. Complete Verification Engine
profile/version/upgrade conformance, the full synthetic future-Facturacion
host/UoW lifecycle, and every claimed signer/certificate, XML/XSD, storage and
transport provider cell. Test migrations, persisted historical verification,
offline consumers and complete executable examples. Do not allow adapters to add
tax semantics or aggregate success to hide a failed/absent cell.

Use signed+DCO protected PRs, correct all defects and compatibility variants, and
close through handoff with exact package digests/exports/commands/matrices,
integration evidence, remaining external gates and P7 prerequisites.
```

## Prompt P7 — Whole-product assurance and release rehearsal

```text
Execute Phase P7 of docs/17-roadmap-risk/implementation-roadmap.md completely.
Read the entire current corpus and verify the handoff, package bytes, GitHub and
all mutable sources. Prioritize 10-security-privacy, 11-quality-testing,
12-performance-reliability, 14-supply-chain-build, 15-release-operations,
18-assurance-audits, all risks/findings and REV-001..084. Treat this as an
adversarial release audit, not a polishing pass.

Execute P7-A through P7-J. Generate and close the complete claim/evidence graph.
Run full installed quality/property/mutation/fuzz/fault/recovery/compatibility
campaigns; reassess threats/privacy and all security controls; establish official
performance/reliability baselines with raw/noise/profile evidence; audit clean
reproducibility, dependencies, Actions, tools, licences, dual SBOM and provenance.
Run exact Engine/provider conformance, synthetic future-Facturacion host-contract
conformance and authorized AEAT conformance. Do not require or claim integration
with a real Facturacion implementation; that future repository will consume the
released contract. Refresh
RRSIF/applicability/declaration, CRA role/support, monitoring, incident, continuity,
account/key recovery and support obligations. Conduct internal and genuinely
required competent external reviews with truthful independence labels.

Triage every failure/finding, preserve it, fix root cause and variants, add
regression and repeat invalidated campaigns until zero release blockers remain.
Meet all documented coverage/mutation/performance/security/recovery thresholds
without exceptions that waive law or integrity. Dispose every historical finding
with new exact evidence. Perform an exact RC and complete non-production three-
package publication/OIDC/partial-failure/forward-recovery/independent-readback
rehearsal. Assemble the signed candidate dossier and claims.

Use protected signed+DCO PRs for every correction. If a mandatory external review
or observation is unavailable, record the precise blocker and do not close P7.
Finish only with a closure PR whose handoff proves every P7 exit criterion and
provides exact P8 release inputs and authorization prerequisites.
```

## Prompt P8 — Stable publication, verification and support

```text
Execute Phase P8 of docs/17-roadmap-risk/implementation-roadmap.md completely,
including the explicitly requested public release operations, but only after
verifying P7 evidence-complete and every release authorization/precondition.
Read all current docs and re-observe protected main, official/legal/dependency/
platform state, npm/GitHub ownership/OIDC, recovery custody and public endpoints.

Execute P8-W1 through P8-W9 exactly. Create the signed+DCO release PR for lockstep
1.0.0, changelog, matrices, edition, claims and dossier; run all final-head gates;
freeze its squash commit; create and independently verify the annotated SSH-signed
SemVer tag, signer, ancestry and authorization. Build all three stable subjects
cleanly in the protected workflow and repeat every gate without trusting PR/RC
caches or artifacts.

Publish explicit tarballs through npm OIDC only, dependency order, initially under
the unique verification-1-0-0 dist-tag. Record each state transition. Independently
download all three public packages and verify digest, provenance, manifests,
dependencies, licences and clean consumers before moving each to latest. Then
verify and publish the GitHub draft/assets/checksums/tag/dossier, enable/read back
immutable controls where available and reverify public state. Publish scoped
release/security/support/migration communication and component dossier/declaration
handoff. Run post-publication verification from independent current policy and
public inputs, never release-job code or artifacts.

Treat multi-package publication as non-atomic. On partial/wrong state, do not move
latest or claim release; preserve evidence, deprecate/communicate as governed,
open incident and forward-repair with a new version. Never reuse, overwrite or
silently delete published identities. Freeze on compromised identity or
contradictory evidence.

Activate monitoring, vulnerability/regulatory/support/continuity processes and
archive durable evidence. Use protected history for repository changes. Finish
with the final handoff containing exact public versions/digests/tag/release/
attestations/dossier/evidence and ongoing duties. Mark 1.0.0 supported only after
npm, GitHub, docs, independent verification and clean consumers all converge.
```

## Resume and final-audit prompts

For a resumed phase, prepend this sentence to the same phase prompt:

```text
Resume rather than restart: inspect current goal, branch, PRs, first-failure
evidence and handoff; preserve completed valid work and continue every remaining
or invalidated criterion to protected closure.
```

After P8, this audit may be run without changing scope:

```text
Audit the complete VeriFactu 1.0.0 outcome against every current document,
requirement, ADR, risk, finding, REV-001..084 disposition, source path, CI context,
package, public registry identity and release/support claim. Verify exact subjects
from protected Git/GitHub/npm/public evidence, not handoff assertions. Report any
orphan, stale evidence, contradiction, unsupported claim or missing external
independence as a finding; do not rewrite history or declare success around it.
```
