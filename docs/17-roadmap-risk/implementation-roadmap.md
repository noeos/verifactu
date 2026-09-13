---
id: ROADMAP-DOC-0004
title: Complete implementation roadmap
status: approved
authority: normative
owner: project-owner
created: 2026-09-12
last-reviewed: 2026-09-13
dependencies: [DOCS-INDEX, ROADMAP-DOC-0002, ROADMAP-DOC-0003, ROADMAP-DOC-0005, ROADMAP-DOC-0006, ROADMAP-DOC-0007, ROADMAP-DOC-0013, ROADMAP-DOC-0014, REPO-DOC-0022]
decisions: [ADR-0001, ADR-0002, ADR-0015, ADR-0026, ADR-0030, ADR-0031, ADR-0033, ADR-0038, ADR-0040, ADR-0051, ADR-0053]
historical-inputs: [REV-001, REV-063, REV-065, REV-066, REV-067, REV-071, REV-072, REV-073, REV-074, REV-075, REV-076, REV-077, REV-078, REV-079, REV-080, REV-081, REV-082, REV-083, REV-084]
---

# Complete implementation roadmap

## Purpose and authority

This is the canonical execution plan for taking `noeos/verifactu` from its
documentation-only state to a complete, published, independently verified and
supported `1.0.0`. It instantiates the rest of `docs/`; it does not replace or
weaken it. This is not an MVP roadmap: phases order dependencies and bound Codex
context, never remove, postpone or disguise a committed capability.

Higher authority prevails under governance. This roadmap prevails over its
derived prompts. Observed repository/external reality prevails over a stale
handoff, which must then be corrected before work proceeds.

## Terminal outcome

Completion requires one exact protected source commit and its derived bytes to
demonstrate all of the following:

- both compliance modes; every required record, correction, state, event,
  sequence, chain, official format, XSD, XAdES/certificate, QR and AEAT lifecycle;
- atomic host integration, durable stores/outbox, idempotency, concurrency,
  crash recovery, reconciliation, retention and restoration;
- complete installable `@noeos/verifactu`, `@noeos/verifactu-cli` and
  `@noeos/verifactu-adapter-kit` packages and `noeos-verifactu` binary;
- exact installed-package conformance with Verification Engine, the versioned
  future-Facturacion host contract through a maintained synthetic host, and every
  claimed provider/adapter/runtime/platform cell;
- complete source→requirement→decision→implementation→test/oracle→task/job→
  evidence→package/release/claim traceability;
- current quality, security, privacy, supply-chain, compatibility, performance,
  reliability, recovery, legal, regulatory, external and operational evidence;
- signed, reproducible OIDC publication, independent public read-back, honest
  dossier and supported operation with no material unknown, stale exception,
  open release finding, unowned risk or unsupported claimed cell.

The exact final gate is
[`release-1.0.0-criteria.md`](release-1.0.0-criteria.md). Status and public words
follow [`completion-dashboard-and-status-language.md`](completion-dashboard-and-status-language.md)
and [`independence-and-claim-language.md`](../18-assurance-audits/independence-and-claim-language.md).

## Starting baseline

At P1 start, re-observe rather than assume: local/remotes/history/worktree;
documentation inventory; Git identity, SSH signing and DCO; GitHub settings,
rulesets, Actions/security/environments/apps; official/AEAT access; npm ownership;
Verification Engine package/release; Facturacion fixture; certificates, performance
runner and external-review availability. Record safe identities and discrepancies,
never secret values, private keys or fiscal/personal data.

## Dependency graph

```text
P1 protected bootstrap
 -> P2 executable engineering foundation
  -> P3 official sources, editions, contracts and oracles
   -> P4 deterministic fiscal core, artifacts and verification
    -> P5 durable consistency and AEAT operation
     -> P6 public products and ecosystem conformance
      -> P7 whole-product assurance and release rehearsal
       -> P8 stable publication, independent verification and support
```

A successor starts only after its mandatory predecessor is `evidence-complete`
on protected `main` and its inputs remain current.

## Long-lead lane

| Dependency | Start by | Gate | Unavailable behavior |
| --- | --- | --- | --- |
| Legal/fiscal RRSIF/declaration review | P1 | P7 | Preserve questions; block affected claim/release. |
| CRA role/applicability/support review | P1 | P7 | Apply conservative policy; claim no external review. |
| AEAT certificate, authorization and portal/test access | P1 | P5/P7 | Use labelled synthetic harness; external validation remains absent. |
| Three npm names, recovery, 2FA and trusted publishing | P1 | P7/P8 | Rehearse without long-lived publication token. |
| Verification Engine exact release | P2 | P4/P6/P7 | Pin admitted candidate; drift reopens admission. |
| Future Facturacion UoW/host contract fixture | P2 | P6/P7 | Maintain strict synthetic host; real integration belongs to the future Facturacion repository and does not block VeriFactu `1.0.0`. |
| Stable performance environment | P2 | P7 | Exploratory data cannot establish official baseline. |
| Signing/account recovery custody | P1 | P7/P8 | Release blocks until drilled. |
| Independent technical/security assessment | P3 | P7 | Self/tool evidence stays labelled and cannot simulate independence. |

Codex performs all technically executable work. Only the real account owner,
authority, issuer, AEAT or competent professional may perform acts reserved to
them. Codex prepares requests and verifies returned evidence; it never fabricates
or silently waives it.

## Universal phase protocol

### Intake

1. Start from clean, current protected `main`; inspect local and external state.
2. Read this roadmap, [`handoff.md`](handoff.md), the phase prompt and all current
   documentation in indexed dependency batches. `previous-docs` is non-normative,
   but mapped findings and relevant reproductions are mandatory inputs.
3. Validate metadata, links, IDs, graph and current mutable sources/dependencies.
4. Instantiate work packages under [`work-package-model.md`](work-package-model.md)
   with requirements, ADRs, paths, threats, risks, tests, evidence and rollback.
5. Apply [`definition-of-ready.md`](definition-of-ready.md). A missing mandatory
   authority, oracle, owner, provider or negative test blocks affected work.

### Construction and integration

1. Use a coherent issue/branch/PR per vertical package; a phase is not one mega-PR.
2. Change canonical sources only; generate derived output via declared tasks.
3. Implement behavior with positive, boundary, negative, adversarial, recovery
   and performance evidence appropriate to its claims.
4. Update contracts, docs, migrations, risks, findings and traceability together.
5. Run the impacted task graph and pre-push closure; inspect generated/package/
   dependency diffs and preserve first failures.
6. Commit using `git commit -S -s`; verify every branch commit's signer and DCO.
7. Run required CI on final head. Diagnose root cause and variants, add regression
   and rerun invalidated work. Never retry-to-green, skip, weaken or exclude.
8. Native-squash only after all leaf/closure contexts pass; read back protected
   main attribution/ancestry/checks and automatic branch deletion.

### Closure

1. Apply [`definition-of-done.md`](definition-of-done.md) and
   [`phase-exit-criteria.md`](phase-exit-criteria.md) to every package/cell.
2. Reconcile requirements, historical findings, risks, exceptions, dependencies,
   package bytes and evidence. Explicit remaining scope stays mapped downstream.
3. Update `handoff.md` in a dedicated closure PR with preceding merge SHAs and
   immutable evidence locators/digests; never embed large logs or secrets.
4. Pass the full applicable graph, squash, re-read `main`, then mark the phase
   `evidence-complete`. The next phase verifies the SHA containing the handoff.

Correctable defects are work, not blockers. New authority, credentials, external
actors or destructive/public actions may require a stop. Never relax protection,
thresholds or claims. Changes to source, edition, contract, tool, lock, provider,
workflow, platform, package, risk or finding invalidate mapped evidence and phase
exits. Merged/published history is corrected by audited revert/forward recovery,
never overwritten.

## P1 — Governed bootstrap and effective protection

**Outcome:** all later changes traverse a verified single-maintainer protected
path before product code exists.

**Authorities:** [`00-governance`](../00-governance/),
[`bootstrap-and-protection-rollout.md`](../13-repository-ci/bootstrap-and-protection-rollout.md),
[`branch-and-tag-rulesets.md`](../13-repository-ci/branch-and-tag-rulesets.md),
[`workflow-permissions-and-trust.md`](../13-repository-ci/workflow-permissions-and-trust.md),
[`ssh-signatures-and-dco.md`](../13-repository-ci/ssh-signatures-and-dco.md) and
[`github-effective-state-audit.md`](../13-repository-ci/github-effective-state-audit.md).

| Work package | Required implementation |
| --- | --- |
| P1-W1 baseline | Safe local/remote/GitHub inventory, documentation/archive validation, discrepancies and recovery point. |
| P1-W2 identity | SSH signer/allowed-signers and DCO validation with positive and wrong/unsigned fixtures. |
| P1-W3 workflow seed | Smallest reviewed full-SHA, least-privilege documentation/governance check producers; no product code. |
| P1-W4 settings | Actions/security, squash-only merge, auto-delete and default-branch settings with read-back. |
| P1-W5 rulesets | Strict no-bypass main/tag rules and exact contexts only after every producer/event/path is observed. |
| P1-W6 proof | Disposable negative probes for direct/force/delete/unsigned/missing-DCO; positive protected PR/squash/delete proof. |
| P1-W7 acceptance | Protected documentation gates, truthful lifecycle/owner approval record and bootstrap handoff. |

Exit requires effective state—not saved intent—to match policy; no CODEOWNERS,
approval, last-push approval, fake account or routine bypass; untrusted workflows
cannot gain secret/write capability; temporary bootstrap relaxation is removed
and read back. No `packages/` source is permitted before exit.

## P2 — Executable engineering, CI, build and supply-chain foundation

**Outcome:** deterministic repository/toolchain/task/CI/build controls make empty,
skipped, undeclared or workspace-only success impossible.

**Authorities:** [`repository-structure.md`](../13-repository-ci/repository-structure.md),
[`toolchain.md`](../13-repository-ci/toolchain.md),
[`canonical-task-graph.md`](../13-repository-ci/canonical-task-graph.md),
[`required-jobs-and-checks.md`](../13-repository-ci/required-jobs-and-checks.md),
[`14-supply-chain-build`](../14-supply-chain-build/) and
[`05-architecture`](../05-architecture/).

| Work package | Required implementation |
| --- | --- |
| P2-W1 tree | Allowlisted semantic root/workspaces, ownership, naming/generated/vendored rules and negative tree/import fixtures. |
| P2-W2 toolchain | Independently admitted pinned Node/npm/TypeScript/reference tools; aligned node/engine/package-manager/lock/CI metadata. |
| P2-W3 package shells | Three exact package manifests, closed exports/files/bin/side-effects and roots without fake fiscal behavior. |
| P2-W4 task graph | Typed acyclic registry, declared IO/environment/network/timeouts, atomic isolation, report schemas, zero-work/meta checks and thin launchers. |
| P2-W5 policy | Format/lint/types/docs/metadata/links/IDs/architecture/API/package validation plus falsifying fixtures. |
| P2-W6 CI | All 17 leaf contexts, always-run closure, required OS/runtime matrix, trust separation, caches/artifacts/concurrency/timeouts. |
| P2-W7 admission | Full-SHA Actions; dependency/registry/lifecycle/native/optional/download/licence policies; Dependabot untrusted flow. |
| P2-W8 build | Clean/hermetic reproducible builds, package allowlists, clean tarball consumers, unified component graph, CycloneDX/SPDX and provenance rehearsal. |

Exit requires supported clean installs/tasks; rejection of cycles, duplicate
producers, undeclared IO/network/tools, stale/empty output and hand edits; every
required context produced for all PR path classes; reproducible allowlisted
tarballs; reconciled SBOMs; adversarial fixtures; and post-change GitHub audit.

## P3 — Official sources, editions, contracts and independent oracles

**Outcome:** current official bytes become content-addressed immutable editions,
deterministic generated contracts and independent oracles.

**Authorities:** [`02-regulatory`](../02-regulatory/),
[`03-requirements`](../03-requirements/),
[`official-field-and-contract-generation.md`](../07-formats-cryptography/official-field-and-contract-generation.md),
[`official-vectors-and-independent-oracles.md`](../11-quality-testing/official-vectors-and-independent-oracles.md).

| Work package | Required implementation |
| --- | --- |
| P3-W1 authority/import | Refresh applicability/SRC state; quarantine bounded acquisition with URL/authority/time/digest/licence/dependency identity. |
| P3-W2 editions | Immutable IDs/manifests/source graph/digests and creation/verification/support transitions; no runtime network refresh. |
| P3-W3 parsers | Hostile-safe offline XSD/WSDL/catalog/rule import rejecting entity/network/path/resource/ambiguity failures. |
| P3-W4 generation | Runtime staged contracts, public schemas, field constraints, SOAP bindings and catalogue access from canonical editions. |
| P3-W5 vectors/oracles | Official plus independent synthetic/boundary/adversarial/compatibility fixtures with exact bytes/diagnostics. |
| P3-W6 drift/freeze | Clean no-diff regeneration, changed-source invalidation, provenance/licences and requirement→contract/oracle readiness. |

Exit requires authoritative origin/digest/licence for every byte, deterministic
generation on supported profiles, rejection rather than silent loss, separately
implemented oracles catching seeded defects and no live mutable runtime source.

## P4 — Deterministic fiscal core, artifacts, cryptography and verification

**Outcome:** all effect-free semantics and byte transformations are complete and
depend only on explicit inputs.

**Authorities:** [`04-domain`](../04-domain/), [`05-architecture`](../05-architecture/),
[`06-contracts`](../06-contracts/),
[`07-formats-cryptography`](../07-formats-cryptography/),
[`10-security-privacy`](../10-security-privacy/) and
[`16-integrations-conformance`](../16-integrations-conformance/).

| Wave | Required implementation |
| --- | --- |
| P4-A domain | Staged codecs; identities/context/values; alta/anulacion/correction/substitution; modes/tenure; events/states/invariants/sequences/chains/diagnostics. |
| P4-B planning/artifacts | Effect-free operation plans, official projection, decimal/date/encoding/order, fingerprint and exact byte custody. |
| P4-C XML/XSD | Hardened model/serializer and admitted offline bounded XSD backend with exact diagnostics and independent round trips. |
| P4-D XAdES/PKI | Provider boundary, transforms/references, creation/verification profiles, chain/time/revocation, algorithm policy/agility and key isolation. |
| P4-E QR | Edition/mode-bound content, encoding/render/decode and independent size/error/boundary verification. |
| P4-F claims/Engine | Separate official/crypto/AEAT/Noeos claims and exact installed Verification Engine profile/version/digest integration. |
| P4-G closure | Unit/contract/property/mutation/fuzz/vector/security/resource/public-export and installed-tarball campaigns. |

Exit requires tests for every invariant/illegal transition; 100% critical branch
and valid mutation coverage plus global project thresholds; independent XML/XSD/
XAdES/PKI/QR oracles and attacks; preserved exact bytes; no internal/oracle leak;
and no implicit storage, clock, randomness, network or provider state.

## P5 — Durable consistency and AEAT operation

**Outcome:** fiscal plans commit atomically, survive modeled crashes and reach or
reconcile AEAT through edition-bound authenticated protocols.

**Authorities:** [`08-persistence-consistency`](../08-persistence-consistency/),
[`09-aeat-integration`](../09-aeat-integration/) and relevant contracts/security.

| Wave | Required implementation |
| --- | --- |
| P5-A stores | Record/artifact/event/evidence/outbox ports, durable semantics, idempotency and schema/adapter requirements. |
| P5-B atomicity | Host UoW, atomic commit, CAS heads/forks, leases/fencing, checkpoints, cancellation/resource ownership. |
| P5-C recovery | Journal/states, crash matrix, rollback detection, reconciliation, migration, retention/purge, backup/restore/DR. |
| P5-D wire | Edition endpoint/WSDL/SOAP, headers/system identity, mTLS/certificate authorization, exact outbound bytes and safe parsing. |
| P5-E orchestration | Batches/order/limits/timing, attempts/correlation/responses, safe retries, indeterminate delivery, consultation/submission. |
| P5-F harness/ops | Strict delay/drop/duplicate/malformed/TLS/partial peer; redacted observability and executable runbook decisions. |
| P5-G closure | Faults at every durability/network boundary, races/restarts/restores/migrations and long reconciliation campaigns. |

Exit requires model/adapter evidence against split state; deterministic duplicate/
stale/concurrent handling; CAS/fencing safety; explicit ambiguous delivery; no
key/fiscal data leakage; and honest distinction between local harness and external
AEAT observation.

## P6 — Public products and ecosystem conformance

**Outcome:** all three installable products and their real ecosystem boundaries
are complete without workspace or sibling-source shortcuts.

**Authorities:** [`06-contracts`](../06-contracts/),
[`16-integrations-conformance`](../16-integrations-conformance/) and package/build
and compatibility specifications.

| Work package | Required implementation |
| --- | --- |
| P6-W1 library | Final clients/operations/config/capabilities/results/errors/events/editions/schemas/limits and reviewed exports. |
| P6-W2 CLI | Strict grammar; JSON/NDJSON streams; deterministic stdio/diagnostics/signals/cancellation/exit behavior. |
| P6-W3 adapter kit | Typed interfaces, executable conformance, fixtures/faults and schema reports; adapters cannot add tax semantics. |
| P6-W4 package matrix | ESM/CJS/types identity, Node/OS, closed deep imports, files/bin/licences and exact lockstep dependencies from tarballs. |
| P6-W5 Engine | Clean public-tarball profile/claim/failure/upgrade/version-matrix conformance. |
| P6-W6 future Facturacion boundary | Full synthetic host transaction, identity/tenant, command/result/event/outbox/restore/lifecycle conformance. Publish integration guidance; do not require or claim a real Facturacion implementation. |
| P6-W7 providers | Every claimed signer/certificate, XML/XSD, storage and transport capability/version cell. |
| P6-W8 consumers | Migration, persisted-history verification, clean offline consumers, complete examples and compatibility reconciliation. |

Exit requires exact-digest clean tarball installs with workspace/sibling access
denied; evidence for every public export/schema/command/event/error/capability;
tests for ecosystem ownership; and individual success for every publicly claimed
matrix cell.

## P7 — Whole-product assurance, external validation and release rehearsal

**Outcome:** the installed candidate is attacked, measured, audited, externally
observed where required and rehearsed through release/recovery until no blocker
remains.

**Authorities:** [`10-security-privacy`](../10-security-privacy/),
[`11-quality-testing`](../11-quality-testing/),
[`12-performance-reliability`](../12-performance-reliability/),
[`14-supply-chain-build`](../14-supply-chain-build/),
[`15-release-operations`](../15-release-operations/) and
[`18-assurance-audits`](../18-assurance-audits/).

| Wave | Required implementation/verification |
| --- | --- |
| P7-A graph | Generate complete claim/evidence graph; reject orphans, stale subjects, unknowns and unsatisfied `1.0.0` cells. |
| P7-B quality | Full installed unit/contract/integration/E2E/property/mutation/fuzz/compatibility/fault/concurrency/recovery campaigns. |
| P7-C security/privacy | Reassess threats/flows/abuse; SAST/dependency/secret/XML/signature/isolation/resource/redaction tests and finding triage. |
| P7-D performance | Freeze workloads/environment; latency/throughput/percentiles/memory/capacity/backpressure/stress/soak/recovery with raw/noise/profile evidence. |
| P7-E supply chain | Clean rebuild comparison, dependency/action/tool/licence/SBOM/provenance audit and unavailable/compromised-input recovery. |
| P7-F external | Exact Engine/provider matrices, synthetic future-Facturacion host-contract conformance and authorized AEAT observation with scoped meaning. |
| P7-G legal/ops | Current RRSIF/applicability/declaration, CRA role/support, regulatory monitoring, support/security/incident/continuity and key/account recovery. |
| P7-H audits | Internal and required competent external review; preserve independence/scope/results; remediate cause/variants and retest. |
| P7-I rehearsal | Exact RC and synthetic three-package OIDC/state rehearsal including partial publish, forward recovery and independent read-back. |
| P7-J dossier | Signed candidate dossier, claims, checksums, SBOM/provenance, matrices, audits, legal evidence, support/migration/recovery inputs. |

Exit requires ≥98% line/function and ≥95% branch coverage, 100% critical branches;
100% valid critical mutation and ≥95% elsewhere; passing official performance/
reliability budgets; current disposition/evidence for REV-001..084; zero release
finding/expired exception/material unknown; truthful independent evidence; and a
complete successful publication/recovery rehearsal. Mandatory absent external
review or observation blocks exit.

## P8 — Stable publication, independent verification and support

**Outcome:** `1.0.0` is published from exact protected source, reconciled from
public endpoints and placed in supported operation.

**Authorities:** [`release-readiness.md`](../15-release-operations/release-readiness.md),
[`stable-release.md`](../15-release-operations/stable-release.md),
[`npm-oidc-publication.md`](../15-release-operations/npm-oidc-publication.md),
[`post-publication-verification.md`](../15-release-operations/post-publication-verification.md)
and [`release-dossier-model.md`](../18-assurance-audits/release-dossier-model.md).

| Work package | Required operation |
| --- | --- |
| P8-W1 readiness | Refresh all volatile inputs; close scope/findings; verify npm/OIDC/recovery and authorization. |
| P8-W2 release PR | Signed+DCO lockstep version/changelog/matrices/edition/claims/dossier update and all final-head gates. |
| P8-W3 identity | Freeze squash commit/input; create and independently verify annotated SSH-signed SemVer tag/signer/ancestry/version/authorization. |
| P8-W4 rebuild | Protected stable clean build of three subjects; repeat all gates without RC/PR cache trust and attest exact bytes. |
| P8-W5 npm | OIDC-only explicit tarballs, dependency order and unique `verification-1-0-0` tag with durable call/state log. |
| P8-W6 verify/channels | Independent public download/digest/provenance/manifest/dependency/licence/consumer checks, then all three `latest` moves. |
| P8-W7 GitHub | Verify draft assets/checksums/tag/dossier, publish after npm convergence, enable/read immutable controls and reverify. |
| P8-W8 public closure | Scoped communication, component dossier/declaration handoff and independent post-publication workflow using no release-job code/artifacts. |
| P8-W9 support | Reconcile npm/GitHub/docs, clean consumers, archive evidence, activate monitoring/support/change/vulnerability processes and handoff. |

Three npm publishes are non-atomic. Before all verify, no `latest` or stable claim
is allowed. Partial/wrong publication is recorded and forward-repaired with a new
version; bytes, version, tag and evidence are never overwritten or reused.

Final exit requires public bytes equal attested subjects; every identity/channel/
asset/dossier points to the same source/edition/dependencies; independent public
verification and clean consumers pass; operational/recovery processes are active;
and the final handoff records public identities and support duties. Only then is
`1.0.0` `supported`.

## Per-phase control and filesystem matrix

This matrix makes the uniform phase contract explicit. Paths are semantic roots,
not permission to create undeclared children; the ownership registry and exact
work package diff remain controlling.

| Phase | Entry evidence | Primary path effects | Principal failure risks | Recovery/stop rule | Required closure evidence |
| --- | --- | --- | --- | --- | --- |
| P1 | Documentation inventory; local/remote/GitHub baseline; usable owner signer | `.github/`, governance/signing material, root community files, documentation lifecycle/handoff | Protection deadlock, unintended bypass, secret/write exposure, unsigned ancestry | Restore last verified safer setting; stop before product code or unverified relaxation | Endpoint read-backs, context producers, negative probes, positive signed PR/squash/delete chain |
| P2 | P1 closure SHA and effective controls | root manifests/config; `packages/*` shells; `tooling/`, `scripts/`, `config/`, `tests/policy`, `evidence/schemas`, workflows | False green, undeclared executable, supply-chain drift, nonreproducible/leaking package | Revert scoped foundation PR or disable only the new untrusted producer without opening main; block product source | Tool/action/dependency manifests, task reports, negative fixtures, matrix runs, tarball/SBOM/reproduction reports |
| P3 | Clean P2 graph; current official authority and licences | `internal/source-import`, `internal/contract-generation`, `internal/independent-oracles`, `editions/`, `schemas/`, `fixtures/` | Stale/partial source, wrong interpretation, generator/oracle common cause, licence breach | Quarantine changed source and invalidate edition/output; stop on unresolved mandatory authority | Source/edition manifests, deterministic regeneration, oracle independence/seeded-defect and drift reports |
| P4 | Frozen edition/contracts/oracles; admitted providers/Engine candidate | `packages/verifactu/src/{contracts,domain,application,editions,verification}`, XML/XAdES provider internals and mirrored tests | Fiscal semantic error, byte drift, XML/signature attack, key exposure, circular/forbidden dependency | Revert unmerged slice; invalidate dependent artifacts; stop on unverifiable official/crypto rule | Exact vectors/digests, property/mutation/fuzz/security results, provider/oracle reports, packed Engine consumer |
| P5 | P4 exact package/artifact contracts; ready host/transport capabilities | `packages/verifactu/src/ports` and coordinators, protocol harness, persistence/AEAT contract/integration/recovery tests | Split commit, fork/duplicate, stale lease, data loss, unsafe retry, credential/fiscal leak | Preserve journal/wire facts, fence effects, reconcile; stop before duplicate external mutation | Crash/fault/concurrency matrices, adapter reports, exact wire fixtures, restore/reconciliation and redaction evidence |
| P6 | Stable core/ports; exact external capability/version inventory | finalized three `packages/*`, public `schemas/`, compatibility/integration/e2e/packaging tests and fixtures | API incompleteness, dual-package identity, workspace shortcut, empty adapter, ecosystem ownership leak | Withdraw unmerged surface; version/migrate published-compatible contracts; block any failed claimed cell | Tarball digests, public API/CLI/schema reports, OS/runtime/module, Engine/provider matrices and synthetic future-host conformance |
| P7 | P1–P6 exits current; complete candidate packages; external actors scheduled | benchmarks/baselines, assurance/evidence schemas and reports, release rehearsal inputs, docs/runbooks | Blind spot, threshold gaming, performance noise, stale source, overstated independence, unrecoverable release | Open finding, preserve first evidence, remediate and repeat full invalidated population; mandatory external absence blocks | Closure graph, raw campaign summaries/digests, audits, legal/external records, recovery drills, RC/rehearsal dossier |
| P8 | P7 evidence-complete; explicit release authorization; npm/GitHub/OIDC/recovery preflight | version/changelog/manifests/dossier plus external tag, npm versions/dist-tags and GitHub release/assets | Partial publication, wrong tag/bytes/channel, identity compromise, public contradiction | Freeze channels; never overwrite; deprecate/communicate and forward-release under incident procedure | Signed tag, attestations, public package/assets digests, independent read-back, clean consumers, final dossier/handoff |

## Historical-finding implementation allocation

The canonical row-level obligation remains
[`historical-findings-ledger.md`](../18-assurance-audits/historical-findings-ledger.md).
These ranges assign first implementation; P7 re-verifies every row and P8
re-verifies release/publication rows. Overlap is intentional where one defect
crosses boundaries.

| Phase | First implementation or primary prevention |
| --- | --- |
| P1 | REV-073, REV-075–081: signing/DCO, full-SHA policy, complete GitHub audit, usable zero-approval governance, no bypass and honest effective-state evidence. |
| P2 | REV-056, REV-063, REV-065–072, REV-075–080: honest discovery/coverage foundations, exact evidence, tarball isolation, reproducible build/SBOM/licences/inventory/tool paths and enforced boundaries. |
| P3 | REV-001–006, REV-008, REV-019: complete authoritative inputs, semantic overlays, deterministic generation, full XSD graph and independent oracles. |
| P4 | REV-002–027 and REV-045–046: identities/rules/XML/XSD/XAdES/PKI/Engine/claims/modes/artifacts/QR. |
| P5 | REV-028–044, REV-051–052 and REV-060: atomicity, stores/concurrency/recovery, AEAT protocol, output containment/redaction and real failure/resource behavior. |
| P6 | REV-026–027, REV-047–055, REV-061–062, REV-066 and REV-084: complete API/CLI/contracts/adapters/oracles/installed consumers and public edition/assets/types. |
| P7 | REV-056–084 plus complete REV-001–084 regression: assurance thresholds, security, build/supply chain, protected evidence, external validation, recovery and release rehearsal. |
| P8 | REV-063, REV-067–071, REV-073–083: exact-subject protected release, packages/SBOM/licences/tools, claims, OIDC/public verification, archive and recovery. |

No range closes its rows as a group. Each row receives its own reproduction,
requirement/control, test/oracle, job, exact evidence and reopen trigger.

## Phase-to-area coverage

`I` means primary implementation, `V` mandatory verification and `O` operation.

| Area | P1 | P2 | P3 | P4 | P5 | P6 | P7 | P8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 00–03 governance/product/regulatory/requirements | I/V | I/V | I/V | V | V | V | V | O/V |
| 04–07 domain/architecture/contracts/formats | — | I | I | I | V | I/V | V | V |
| 08–09 persistence/AEAT | access | boundaries | inputs | ports | I | V | V | O |
| 10–12 security/quality/performance | V | I | I/V | I/V | I/V | I/V | I/V | O/V |
| 13–14 repository/CI/build/supply chain | I | I | V | V | V | I/V | I/V | O |
| 15–16 release/integrations | accounts | contracts | inputs | Engine | ports | I | I/V | I/O |
| 17–18 roadmap/risk/assurance | I | I/O | I/O | I/O | I/O | I/O | I/V | O |
| 99 reference views | V | generated | generated | generated | generated | generated | generated | published |

Every substantive document is refined into work-package metadata before its code
begins. Generated traceability—not this summary—proves per-requirement coverage.

## Handoff, prompts and maintenance

[`handoff.md`](handoff.md) is mandatory operational state, not a replacement for
Git/GitHub/evidence. It is verified at entry and updated through the phase closure
PR. False/stale entries become findings and visible amendments.

[`prompts.md`](prompts.md) provides one derived prompt per phase. Prompts cannot
change scope, authority, threshold or gate. The operator may prepend `/goal`;
authority still ends at the explicit operations and governing runbooks.

On source/scope/architecture/dependency/access/failure change, update the canonical
object and graph, invalidate mapped evidence/exits, recompute readiness/critical
path and preserve prior decisions. Before P8, generated closure views MUST prove:

- every current document/requirement/path/check/public artifact has a phase,
  implementation or reverification, test/job and exact evidence;
- every REV-001..084, risk, finding, exception, question and external dependency
  has a current release disposition;
- every public artifact traverses build, assurance, publication and independent
  verification;
- no mandatory capability is hidden as later, optional, MVP, placeholder, mock,
  skipped or unsupported while claimed.

Any failed view keeps `1.0.0` out of `supported` state.
