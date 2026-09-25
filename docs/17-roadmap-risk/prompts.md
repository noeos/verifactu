---
id: ROADMAP-DOC-0018
title: Codex implementation phase prompts
status: approved
authority: informative
owner: project-owner
created: 2026-09-13
last-reviewed: 2026-09-25
dependencies: [ROADMAP-DOC-0004, ROADMAP-DOC-0017]
decisions: [ADR-0001, ADR-0031, ADR-0051, ADR-0055, ADR-0056, ADR-0057, ADR-0058]
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
- declare every phase population and threshold before implementation, execute
  every applicable percentage, control, toolchain, OS, CI, security,
  supply-chain, compatibility and audit check on the final head, and mark a
  missing denominator as `blocked` rather than closing on partial evidence;
- keep code, tests, generated contracts, docs, risks, findings, migrations and
  traceability synchronized;
- continue autonomously through safe correctable work; stop only for a genuine
  authority/credential/external/destructive blocker and record exact unblock
  evidence without falsely closing;
- end through a dedicated handoff closure PR and verify protected `main`.

## Universal quality and completeness directive

The following directive is inherited in full by every phase prompt below and
cannot be weakened by local interpretation:

- Fulfil every applicable standard and control in the approved documentation,
  ADRs, requirements, risks, REV findings and governing law. This includes
  functional completeness, code quality, architecture, repository organization,
  CI, toolchain, security, privacy, supply chain, legal/regulatory,
  performance, reliability, recovery, compatibility and release operations.
- Declare every benchmark, budget, SLO, coverage denominator, mutation
  population, critical branch catalogue, line/function/branch threshold and
  platform/provider matrix before implementation. Measure every applicable item
  completely and retain raw, exact-subject evidence. A missing, partial,
  superficial, skipped, retried, flaky, synthetic-only or unverified result is
  blocked and cannot be presented as complete or green.
- Always test and preserve every claimed Ubuntu, Windows and macOS support
  profile, together with the declared Node/npm/toolchain, module, filesystem,
  package and provider compatibility cells. An unobserved cell is unknown, not
  compatible; an unsupported cell must be explicitly excluded from the claim.
- Enforce the strictest applicable thresholds. The final minimum is 98% line,
  98% function, 95% branch, 100% critical branch, 100% critical mutation and
  95% other valid mutation coverage, plus all area-specific performance,
  security, legal, recovery, supply-chain and operational thresholds. Do not
  game denominators, omit reachable code, hide branches or lower a threshold to
  make a result pass.
- Do not merge, close, publish or claim code merely because it is plausible,
  elegant, locally green or superficially useful. Demonstrate complete
  operation and acceptance of every applicable CI, toolchain, repository,
  security, legal, performance, compatibility and organizational control with
  reproducible evidence. If a failure appears, preserve it, fix its cause and
  variants, add regression coverage and rerun every invalidated check.
- Treat quality and completeness as hard stop conditions. No retry-to-green,
  silent waiver, placeholder, mock of a mandatory dependency, unowned exception,
  unmeasured claim or unsupported assertion of perfection/excellence is allowed.

Every prompt is therefore a complete engineering mandate, not permission to
produce a good-looking subset, a superficial implementation or code without
demonstrable acceptance evidence.

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

## Prompt P3-B — Pre-P4 assurance gate

```text
Execute P3-B of docs/17-roadmap-risk/p3b-pre-p4-assurance.md completely.
This is a mandatory gate between P3 and P4. Read the entire current corpus,
validate the protected P3 handoff and verify P1–P3 against exact local,
GitHub, toolchain, source, generated-contract and evidence state.

Run the complete P3-B campaign: documentation/REV graph, source custody,
generators and independent oracles, toolchain and OS matrix, required CI
contexts and closure, negative fixtures, security/privacy/resource/parser
controls, property/fuzz tests in scope, lock/licence/Actions admission, dual
SBOM, provenance, reproducibility, compatibility and audit read-back. Declare
every population, denominator, percentage, critical catalogue and threshold
before interpreting results. A missing or partial metric is blocked, never
passed.

Do not implement P4 code in this phase. Correct every P1–P3 defect and variant
through signed+DCO protected PRs, rerun all invalidated evidence, and close only
with an exact-subject handoff PR whose matrix proves every applicable cell. The
closure must prepare the canonical coverage, mutation, fuzz, fault, recovery,
performance and compatibility policies that P4 will run from its first commit.
Do not start P4 until P3-B is protected, green and independently understandable.
```

## Prompt P4 — Deterministic fiscal core, artifacts and verification

```text
Execute Phase P4 of docs/17-roadmap-risk/implementation-roadmap.md completely.
Read every current document outside previous-docs in indexed batches and validate
the handoff, exact source editions, repository, package admission, CI and GitHub
protected-main state. Prioritize all 04-domain, 05-architecture, 06-contracts,
07-formats-cryptography, XML/signature/PKI security, the entire 11-quality-testing
area, 12-performance, 14-supply-chain, 16-integrations-conformance, ADR-0020,
ADR-0021, ADR-0055–0058, p4-quality-plan.md and mapped REV-001..084 findings.
Inspect the exact installed/admitted Verification Engine public artifact and
confirm no P4 source/runtime from an earlier attempt is present or reused as
evidence.

Do not implement fiscal or provider code until the zero-code P4-readiness gate
is protected and green: exact machine-readable whole-production/test populations,
critical catalogue, seeds/operators, report schemas, thresholds, supported
OS/runtime/JDK/Maven/DSS matrix, exact dependency/action/artifact digests,
performance/resource ceilings and fail-closed readiness task must all be frozen
and seed-tested. Keep creation disabled, do not publish to npm and make no legal,
AEAT, fiscal-conformity or release claim.

Implement strictly serial waves P4-A → P4-B → P4-C → P4-D → P4-E → P4-F → P4-G
using coherent vertical signed+DCO PRs. Do not start the next wave until the
preceding wave is merged through protected main with its final-head evidence read
back. No parallel sibling waves, stale-base merges, skipped wave or mega-PR.
P4-A completes staged codecs, identities/context/values, every record/correction,
modes/tenure, events/states/invariants/sequences/chains and diagnostics. P4-B
completes effect-free plans, official projection, ordering/encoding/decimal/date,
fingerprint and exact bytes. P4-C completes hardened XML serialization and a real
bounded offline XSD provider. P4-D uses locally executed EU DSS 6.5 behind a
private adapter for actual XAdES creation and cryptographic verification; enforce
the exact AEAT profile, signature references/transforms, certificate chain/time/
usage/algorithm/key policy and cancellation/resource bounds. CRL/OCSP retrieval,
refresh and cache belong only to the future commercial Facturacion host. The
library receives original bounded evidence bytes and validates them offline:
valid requires authenticated fresh evidence, revoked rejects, and unknown/stale/
absent evidence stays indeterminate, never valid. No implicit network, DNS,
clock, randomness, storage, trust store, key or provider state. P4-E binds QR
content to immutable edition/mode; admit the exact pinned encoder and use an
independent test-only decoder, with no truncation and explicit byte/image/CPU/RSS
limits. P4-F preserves separate official-format, crypto, certificate/authorization,
AEAT and Noeos claims and adapts the exact installed Engine profile/version/digest.
P4-G is cumulative closure, not the first run of earlier tests.

Every production module, including private providers and authored Java bridge
code, is in coverage and mutation denominators. Require ≥98% statements/lines,
≥98% functions and ≥95% branches per public package, 100% critical branch/condition
coverage, 100% killed critical non-equivalent mutants and ≥95% all other
non-equivalent mutants; zero unreviewed security/regulatory survivors. Use unit,
contract, property+shrinking, official/independent vectors, complete seeded faults,
mutation, fuzz, parser/signature/wrapping/CRL/OCSP/QR/resource attacks, clean
packed consumers and every declared compatibility/performance cell. NoCoverage,
empty discovery, skipped work, timeouts, compile/test errors, hidden retries,
unreviewed survivors, narrowed denominators or stale evidence block. Preserve
first failures, fix causes/variants and rerun all invalidated work.

Do not stop or end this goal with a status-only answer while any safe scoped work,
P4 wave, required PR, gate or exact-head verification remains. Continue until
P4-G is completely implemented and the final protected-main handoff is verified.
If an actual external authority/credential/permission blocker prevents a specific
cell, finish all safe work, record its owner and exact unblock evidence, mark the
goal blocked (never complete) and resume after it changes. Close through a
dedicated P4-G handoff PR with exact SHAs/trees, signatures/DCO, claims/artifact/
provider/Engine identities, every metric/report digest, survivors/exceptions and
remaining external prerequisites; reread protected main and every required check.
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
