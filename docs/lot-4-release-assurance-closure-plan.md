---
id: PLAN-L4
title: Lot 4 release, assurance and product-closure documentation plan
status: approved
authority: normative
owner: project-owner
created: 2026-09-12
last-reviewed: 2026-09-13
dependencies: [PLAN-L1, PLAN-L2, PLAN-L3, RELEASE-INDEX, ROADMAP-INDEX, ASSURANCE-INDEX, REF-INDEX]
decisions: [ADR-0001, ADR-0002, ADR-0004, ADR-0006, ADR-0007, ADR-0009, ADR-0010, ADR-0012, ADR-0013, ADR-0021, ADR-0025, ADR-0026, ADR-0028, ADR-0031, ADR-0032, ADR-0033, ADR-0034, ADR-0035, ADR-0036, ADR-0037, ADR-0038]
sources: [SRC-0010, SRC-0011, SRC-0014, SRC-0016, SRC-0017, SRC-0026, SRC-0027, SRC-0029, SRC-0030, SRC-0032, SRC-0033, SRC-0034, SRC-0037, SRC-0052, SRC-0053, SRC-0054, SRC-0055, SRC-0056, SRC-0057, SRC-0058, SRC-0059, SRC-0060, SRC-0061, SRC-0062, SRC-0063, SRC-0066, SRC-0067, SRC-0068, SRC-0069, SRC-0070, SRC-0071, SRC-0072, SRC-0073, SRC-0074, SRC-0075, SRC-0076, SRC-0077, SRC-0078, SRC-0079, SRC-0080, SRC-0081, SRC-0082, SRC-0083]
historical-inputs: [REV-001, REV-084]
---

# Lot 4 release, assurance and product-closure documentation plan

## Purpose and approval boundary

This plan governs the final documentation needed to turn the complete specified
VeriFactu product into an implementable, auditable, publishable and supportable
system. It closes four areas:

```text
complete requirements + executable architecture + assurance/build/integration
                                |
                                v
        dependency-driven implementation and risk-controlled readiness
                                |
                                v
       immutable candidate -> authorization -> guarded publication
                                |
                                v
       independent registry/release verification -> supported operation
                                |
                                v
        evidence dossier + audits + historical finding closure
```

This is not an MVP, beta-scope or release-workflow scaffold. `1.0.0` means the
entire committed product: both RRSIF modalities, all required records/events/
formats/signature/QR/AEAT behavior, library/CLI/adapter kit, Verification Engine
and Facturacion contracts, security/privacy/performance/recovery, packaging,
legal handoff and operational support. Phases order work; none authorizes a
partial stable product or moves mandatory capabilities to “later”.

Approval of this plan approves its inventory and decision directions. It does
not authorize npm/GitHub mutation, sign a responsible declaration, claim CRA or
RRSIF conformity, create release tags, publish packages, close findings or mark
evidence verified before the future protected exact-commit gates actually pass.

## Lot scope and inventory

1. `15-release-operations` — 25 specifications for identities/versioning,
   candidate/stable release, tags/environments/npm/GitHub assets, external
   validation, declaration handoff, support, vulnerabilities, incidents,
   recovery, regulatory operation and runbooks.
2. `17-roadmap-risk` — 20 specifications for dependency-driven implementation,
   work readiness/done, critical path, risks/assumptions/blockers, issue/PR/
   evidence mapping, phase and `1.0.0` exit and truthful status.
3. `18-assurance-audits` — 22 specifications for claim assurance, evidence
   custody, all 84 historical findings, internal/external audits, domain evidence,
   dossiers, exceptions, postmortems and retention.
4. `99-reference` — 15 non-normative, generated lookup documents that index
   canonical facts without duplicating authority.

The lot covers accepted `ADR-0039` through `ADR-0053`. There are 82 substantive
documents and 15 decisions.

## Non-negotiable closure principles

- Stable release is a state proved for exact source, three package bytes,
  regulatory edition, dependencies, toolchain, workflows and published registry
  observations; a tag, successful workflow or owner statement alone is not it.
- Package version, git tag, GitHub Release, npm registry metadata, dist-tags,
  SBOM, provenance, declaration/dossier and documentation MUST agree.
- Versions and tags are immutable. Repair means a new version; rollback means a
  verified forward release/dist-tag change and communication, never overwriting.
- `main` and release tags have no routine bypass. One maintainer means zero
  environment reviewers, not self-review theatre; signed intent, protected refs,
  exact gates, OIDC subject binding and independent read-back compensate.
- No persistent npm token exists. Trusted publishing uses short-lived OIDC from
  the exact protected workflow/environment and public package ownership is
  independently preflighted.
- Three npm packages cannot be published atomically. Partial publication is a
  first-class failure state that never receives `latest` or “released” status.
- Release builds do not trust PR caches/artifacts or a trust-root file controlled
  solely by the candidate. Signer/policy roots are pinned through a protected
  verifier and retained out-of-band recovery evidence.
- Candidate/stable workflows cannot publish merely because a tag glob matched;
  strict SemVer parser, annotated signed-tag verification, ancestry, version,
  authorization issue and expected environment are all required.
- External AEAT test observations are scoped evidence, not certification or an
  availability promise. Unavailable/unexercised required surfaces remain blocked.
- The component dossier and responsible-declaration handoff never impersonate
  the producer/signatory of an integrated Facturacion SIF.
- Security fixes do not skip integrity, critical regression, SBOM/provenance,
  signature, publication verification or communication. Embargo changes who can
  see evidence, not whether evidence exists.
- Every public claim names exact scope and evidence. “Compliant”, “certified”,
  “secure”, “approved by AEAT”, “complete” and badges are prohibited beyond their
  independently demonstrated meaning.
- All `REV-001`–`REV-084` close individually with current packaged regression
  evidence or an explicit governed disposition. Old remediation prose is never
  current proof.
- Reference indexes are generated from canonical registries and fail on drift;
  they introduce no requirement, status or interpretation.

## Research, legal and authority method

### Source precedence and freshness

Legal/regulatory release decisions follow the authority hierarchy in `REG-INDEX`:
BOE/EUR-Lex law, consolidated regulation with amendment checks, Order and exact
AEAT technical corpus, then dated interpretations. Engineering behavior follows
official GitHub/npm/Node/SLSA/SPDX/CycloneDX/NIST/FIRST specifications, exact
effective platform state and admitted upstream source. Repositories, issues and
forums provide implementations and failure hypotheses only.

All volatile sources are re-observed before every candidate and stable release.
The source manifest records resolved URI, bytes/digest, observed/effective dates,
supersession and result. Network/error/permission/parse failure is `unknown` or
`blocked`, never “no change”.

### RRSIF declaration boundary

RD 1007/2023 and Order HAC/1177/2024 bind responsible declarations to the exact
SIF product/version and required producer identity/content.^1 VeriFactu is an
embeddable component, so its release produces a component assurance dossier,
third-party component declaration inputs and a clearly labelled deterministic
draft/handoff. It MUST NOT sign or publish the final declaration for a
Facturacion installation unless the legally responsible producer confirms the
complete integrated SIF identity, deployment, modes, components and evidence.

The release gate validates current official order, source edition and all
required descriptor/value fields. “Exclusively VERI*FACTU”, multi-taxpayer,
signature-mode or support claims derive from executed product/integration scope,
not a template default. A material change creates a new version and declaration;
historic declarations remain immutable and accessible.

### Cyber Resilience Act and adjacent obligations

Regulation (EU) 2024/2847 requires a product-specific assessment of manufacturer,
commercial/open-source context, product-with-digital-elements scope, support
period, vulnerability handling, documentation and reporting duties.^2 Its
reporting provisions apply from 11 September 2026 while most obligations apply
from 11 December 2027; on the plan date the reporting phase therefore cannot be
treated as remote future work. This plan does not conclude applicability. Before
any distribution/commercial integration, legal review records role, market,
exceptions, timelines and evidence; uncertainty blocks affected public claims.

GDPR/LOPDGDD incident and breach assessment remains separate from tax retention.
Licences, third-party notices, export/sanctions, contractual support and sector
requirements are assessed for the actual distribution/customer context. A
technical checklist cannot issue legal advice or certification.

### Release and security standards

Semantic Versioning governs compatible public API meaning, not regulatory edition
identity.^3 npm versions are immutable; dist-tags are mutable pointers, package
deprecation communicates risk, and unpublish is exceptional under registry
policy.^4 Trusted publishing/provenance uses OIDC with eligible hosted workflows
and must bind exact package/repository/workflow/environment.^5

GitHub releases bind tags and assets; immutable-release controls, where available
and read-back verified, prevent later asset/tag mutation.^6 Environments can gate
deployment refs and secrets, but a sole maintainer cannot truthfully satisfy a
second/self-disallowed reviewer.^7 NIST SP 800-61r3 supplies the incident-response
lifecycle; CVSS 4.0 supplies a technical vector, while exploit activity,
reachability, RRSIF/CRA/GDPR impact and customer exposure independently set
operational priority.^8

## Verification Engine comparison and lessons

The 2026-09-12 baseline remains Verification Engine `1.0.1` at commit
`7df31cfb3ccc538c0ceab468e944172ed2480c95`. Its useful proven patterns are
signed release tags, protected ancestry, clean gates, full-SHA Actions, OIDC npm
publishing, GitHub attestations, registry metadata/provenance checks, byte
comparison of GitHub/npm tarballs and clean public consumers.

VeriFactu improves or scopes the following rather than copying it literally:

| Observed pattern/risk | Lot 4 rule |
|---|---|
| Two Engine packages; VeriFactu has three public packages | All three package subjects, dependency order and partial-publication recovery are mandatory. |
| Environment reviewer configuration can deadlock one maintainer | Zero reviewers; no CODEOWNERS/approval fiction; protected exact workflow/OIDC/ref and post-verification. |
| Tag/organization administrator bypass exists | No permanent normal bypass; emergency recovery is time-bounded, audited and cannot rewrite a release. |
| Tag globs can match more than intended | Strict SemVer parser and channel/environment state machine decide eligibility. |
| Release verifier checks current-main policy material | Trust roots/policy version are protected and bound independently from candidate/published bytes. |
| Stable workflow rebuilds packages after tag | Stable is rebuilt cleanly from its own signed commit; RC/stable equivalence is semantic because versions necessarily differ. |
| Registry verification is strong but release publication spans systems | A durable transaction log models npm/GitHub steps, partial failure and forward recovery. |
| Five-year major support policy | Recommended minimum, extended where CRA/use/contract requires; capacity and upstream runtimes are explicit risks. |

Verification Engine is a pinned release dependency, not an authority for fiscal
validity. VeriFactu publication cannot mutate or release Engine, and its release
matrix fails until the exact Engine tarball/profile passes installed conformance.

## Release identity and state model

### Public identities and version axes

Recommended package names are `@noeos/verifactu`, `@noeos/verifactu-cli` and
`@noeos/verifactu-adapter-kit`, with binary `noeos-verifactu`. The three packages
use lockstep SemVer and exact internal runtime dependencies for `1.x`; one tag
`vX.Y.Z[-rc.N]` identifies their common source. This avoids incompatible partial
combinations while public matrices retain Engine/profile/provider independence.

SemVer classifies public API, observable behavior and guarantees. Regulatory
edition IDs remain immutable independently selectable artifacts. An additive
edition can be minor-compatible; removing/altering a supported edition, public
schema/result or guarantee is breaking even if driven by law. A security/legal
deadline does not permit mis-versioning.

Channels are:

- unique `X.Y.Z-rc.N` versions under npm `next`, never recommended as stable;
- stable `X.Y.Z` initially published under unique temporary
  `verification-X-Y-Z`, then moved to `latest` only after all three packages pass;
- no `beta`, `canary` or hidden stable channel without a successor decision.

### State machine

```text
planned -> ready -> frozen -> tagged-candidate -> built -> verified
  -> authorized -> partially-published -> registry-verified
  -> channels-updated -> GitHub-release-immutable -> externally-verified
  -> supported

Any state -> blocked/aborted/incident
partially-published -> deprecated-partial + new-version recovery
supported -> deprecated -> end-of-support -> historical-verification-only
```

Transitions are durable, idempotent and evidence-bound. No state is inferred from
the existence of a tag or package. A failed step records which immutable external
effects occurred and invokes the precise recovery path.

### Single-maintainer authorization

Human intent is a dedicated protected release PR plus signed+DCO commits, a
release authorization record and an annotated SSH-signed tag created only after
all readiness evidence. `main` and tag rulesets have no routine bypass. GitHub
environments `npm-prerelease` and `npm-production` have zero required reviewers,
no admin bypass and exact deployment rules; their purpose is OIDC subject and
channel separation, not fake human approval.

Because tag patterns alone cannot parse SemVer, workflows validate exact grammar,
prerelease/stable version equality, tag type/signature/signer, protected ancestry,
authorization ID, package privacy/access/ownership and expected OIDC environment
before requesting write permission.

## Exact release workflow

1. Close implementation scope and all required findings; refresh legal, AEAT,
   CRA/applicability, dependency, Engine and platform state.
2. Create a signed+DCO release PR updating canonical version, changelog, support/
   compatibility matrices, source edition, dossier inputs and migration notes.
3. Run full final-head PR gates. Freeze the source/inputs/toolchain; any change
   invalidates readiness and requires a new candidate.
4. Create an annotated SSH-signed RC tag. A non-publishing builder performs two
   clean builds, all assurance campaigns and creates three allowlisted tarballs,
   SBOMs, checksums, provenance rehearsal and dossier.
5. Publish the unique prerelease versions to `next` through `npm-prerelease` OIDC
   only if RC publication is enabled. Independently download/verify all packages,
   installed flows and external available AEAT scenarios.
6. Stable preparation changes version/changelog through a new protected PR and
   repeats complete gates. It compares RC/stable semantic trees while allowing
   only declared version/provenance differences.
7. Create annotated SSH-signed stable tag from protected main. Rebuild from zero
   on hosted trusted infrastructure; do not consume RC tarballs or PR caches.
8. Attest the exact stable tarballs and publish library, adapter kit and CLI under
   a unique temporary dist-tag. A durable ledger records each irreversible npm
   effect. `latest` remains unchanged.
9. An independent verifier downloads each npm tarball/provenance and compares it
   byte-for-byte with attested subjects; verifies manifests, dependency order,
   SBOM/licences, consumers, Engine/adapter, synthetic future-Facturacion host
   contract and critical vectors.
10. Move all three `latest` pointers in governed order, verify convergence, then
    publish the prepared GitHub Release and lock it with immutable-release control
    when available. Verify assets, checksums, tag and public documentation again.
11. Publish scoped release/security/support communication and component dossier/
    responsible-declaration handoff. Start monitoring and evidence retention.
12. An independent post-publication workflow with protected current policy—not
    artifacts or code supplied by the release job—repeats registry/GitHub/public
    consumer verification and marks the release `supported`.

If package 2/3 fails after package 1 exists, the version is `partially-published`:
do not move `latest`, deprecate published partials with actionable text, open an
incident, preserve bytes and publish a new patch/RC after repair. npm/Git tags or
assets are never overwritten, and unpublish is used only when official policy,
security/legal necessity and evidence support it.

## Area 15 — Release and operations

### Questions it must close

- What exact identities and transitions constitute candidate, published and
  independently verified release across git, GitHub, npm and dossiers?
- How do SemVer, lockstep packages, regulatory editions, Engine profiles,
  schemas and stored evidence evolve without ambiguity?
- Who/what authorizes a release with one maintainer and no bypass or fake review?
- How are three non-atomic package publications staged, verified and recovered?
- How are tag signer/trust roots, OIDC claims, environments and package ownership
  protected and recovered without persistent tokens?
- Which official AEAT scenarios and responsible-declaration inputs are mandatory,
  and what can the component truthfully claim?
- What support period, compatibility, deprecation, vulnerability, incident,
  continuity and regulatory-change duties apply throughout supported life?

### Required documents

| Document | Mandatory content |
|---|---|
| `versioning-and-regulatory-editions.md` | Lockstep SemVer, edition/profile/schema/storage axes, breaking classification and historical readability. |
| `release-identities-and-state-machine.md` | All local/external identities, states, transitions, idempotency and partial failure. |
| `release-readiness.md` | Exact-source/legal/security/quality/performance/integration/evidence prerequisites and blockers. |
| `change-freeze-and-candidate-selection.md` | Freeze inputs, candidate SHA/tag authorization, invalidation/restart and embargo handling. |
| `release-candidate.md` | RC grammar, full clean build/campaign, `next`, external testing, evidence and no stable claim. |
| `stable-release.md` | Stable PR/tag, rebuild, authorization, staged three-package publish, GitHub release and completion. |
| `signed-tags.md` | Annotated SSH tags, allowed/revoked signers, protected ancestry/ruleset, no rewrite and independent roots. |
| `github-release-and-immutable-assets.md` | Draft/publish ordering, exact assets/checksums/attestations/dossier, immutability and public verification. |
| `npm-package-ownership-and-preflight.md` | Exact scopes/names/access/owners, trusted-publisher claims, no token, clean dry-run and takeover recovery. |
| `npm-oidc-publication.md` | Environments, OIDC subject/audience, permissions, three-package ordering, provenance and logs. |
| `npm-dist-tags-deprecation-and-removal.md` | `next`/temporary/`latest`, non-atomic recovery, deprecation/yank/unpublish policy and consumer messaging. |
| `release-artifacts-and-dossier.md` | Complete manifest, packages, sources, SBOM/licence/provenance, tests/audits/risks and custody. |
| `responsible-declaration-handoff.md` | Component versus integrated-SIF responsibility, exact official fields, draft/signature/publication and history. |
| `external-aeat-validation.md` | Environments/certificates/test identities, scenario coverage, result custody, limitations and renewal. |
| `post-publication-verification.md` | Independent trust, registry/GitHub byte/provenance/consumer verification, retry windows and incident trigger. |
| `release-observability.md` | Registry/download/advisory/source/CI health, privacy-safe metrics, alert ownership and SLOs. |
| `support-policy.md` | Lines, five-year minimum proposal, security/regulatory/runtime/edition scope, channels/SLA and EOL. |
| `compatibility-and-deprecation.md` | Matrices, migration, warning periods, unsafe withdrawal and historical verification. |
| `vulnerability-disclosure-and-advisories.md` | Private intake/security.txt, safe harbor, triage/CVSS+context, embargo, GHSA/CVE/OSV and credit. |
| `incident-response.md` | NIST-aligned prepare/detect/respond/recover, severity, evidence, notification decision and exercises. |
| `rollback-forward-recovery-and-revocation.md` | Immutable-version forward fix, dist-tag/deprecation/advisory, key/cert/edition/package revocation. |
| `maintainer-account-and-key-recovery.md` | GitHub/npm/domain/email/signing/OIDC ownership, hardware/recovery custody, compromise/unavailability. |
| `regulatory-change-operation.md` | Daily monitoring, semantic diff, severity/deadline, new edition/version, emergency block and communication. |
| `continuity-and-disaster-recovery.md` | Authoritative mirrors/evidence, RPO/RTO, restore/rebuild/publish drills and dependency outage. |
| `operations-runbook-catalog.md` | Executable preconditions/actions/verification/escalation for every declared operational scenario. |

### Recommended release/support policy

All three packages ship in lockstep. `1.0.0` is blocked until every complete-
product gate passes. Each stable major receives at least five years of security
support from GA, subject to a pre-GA capacity/legal commitment; CRA/applicable
expected-use or contract may require longer. The current major receives full
functional/regulatory/security support; older supported majors receive security,
critical legal compatibility and historical verification as published. No
supported package claims an EOL Node runtime; runtime migration notice precedes
removal unless urgent security makes continued use unsafe.

Critical security acknowledgement target is 4 hours and initial triage 24 hours;
high is one and two business days. Fix/mitigation targets are risk-based and
subordinate to legally shorter reporting duties. Exact SLA is public before GA
and measured; a target is not permission to wait.

### Area exit gate

All release states/identities are machine schemas; no accidental publication
path exists; package ownership/OIDC/environments/tags are read-back verified;
three-package partial failure is exercised; candidate/stable/post-verification
consume exact independent subjects; legal/CRA/AEAT/declaration scope is reviewed;
support/incidents/recovery/regulatory operation have drills; and a fully synthetic
release proves the flow without reserving or publishing production `1.0.0`.

## Area 17 — Roadmap and risk

### Questions it must close

- What dependency order reaches the complete product without interpreting an
  intermediate phase as a releasable MVP?
- What inputs make a work package ready, and what exact evidence makes it done?
- Which path, external dependency and capacity constraint controls `1.0.0`?
- How are risks, assumptions, decisions, blockers, issues, PRs and evidence kept
  current without a prose roadmap becoming fiction?
- How do scope/regulatory/security changes replan downstream work and invalidate
  evidence without deleting committed capability?

### Required documents

| Document | Mandatory content |
|---|---|
| `delivery-principles.md` | Complete-product/no-MVP policy, reversible increments, evidence first and no calendar-driven closure. |
| `dependency-map.md` | Requirement/decision/component/tool/source/integration/release DAG and external owners. |
| `sequencing-and-critical-path.md` | Critical chain, safe parallelism, integration points, long-lead legal/provider/platform work and buffers. |
| `implementation-roadmap.md` | Full implementation phases, deliverables, prerequisites, verification and non-release status. |
| `work-package-model.md` | Bounded vertical work, IDs/owners/inputs/outputs/tests/evidence/risks/rollback. |
| `definition-of-ready.md` | Authority/contract/oracle/data/tool/dependency/security/acceptance readiness and blocked rules. |
| `definition-of-done.md` | Packaged code, positive/negative tests, docs, compatibility, supply chain, evidence and no open contradiction. |
| `risk-method.md` | Likelihood/impact/velocity/detectability, inherent/residual, uncertainty, aggregation and review cadence. |
| `risk-register.md` | Complete legal/product/security/privacy/supply-chain/technical/operational/people/external risks. |
| `assumptions-dependencies-and-constraints.md` | Falsifiable assumptions, external dependencies, owners, deadlines, fallback and validation. |
| `open-questions-and-blockers.md` | Decision deadline, authority, affected scope, conservative behavior and unblock evidence. |
| `issue-and-pull-request-mapping.md` | Work→issue→branch→signed commits→PR→checks→squash→evidence cardinality. |
| `phase-exit-criteria.md` | Exact per-phase gates and invalidation; partial technical completion vocabulary. |
| `release-1.0.0-criteria.md` | Complete regulatory/product/quality/security/performance/integration/legal/operations checklist. |
| `scope-change-policy.md` | Authority, impact graph, version/roadmap/risk changes and prohibition on silent deferral. |
| `completion-dashboard-and-status-language.md` | Generated truthful states and evidence freshness; banned ambiguous completion labels. |

### Recommended implementation sequence

0. Perform the one-time signed+DCO bootstrap and prove GitHub protection.
1. Implement documentation/metadata/traceability/source/task policy and negatives.
2. Lock toolchain, dependency admission, workspace/build/package consumers and
   supply-chain evidence foundation.
3. Import complete official AEAT editions and generate independently verified
   structural contracts.
4. Implement domain/applicability/modes/records/events/validation/hash/evidence.
5. Implement exact XML/XSD, XAdES/certificates and QR providers/pipelines.
6. Implement host-atomic persistence, chains, states, CAS/fencing/outbox/recovery.
7. Implement AEAT transport, batching/results/retry/reconciliation and test peer.
8. Complete public library, CLI and adapter kit with every clean consumer.
9. Close security/privacy, coverage/mutation/fuzz, performance/stress/soak and
   recovery across packaged code.
10. Qualify Verification Engine, the versioned future-Facturacion boundary with
    its maintained synthetic host, and every claimed real available adapter/
    provider; complete external AEAT observations. A real Facturacion integration
    is future work in that repository and does not block VeriFactu `1.0.0`.
11. Execute full release rehearsal, legal/CRA/declaration review, audits and
    disaster/account recovery drills.
12. Prepare, publish and independently verify `1.0.0`; begin supported operation.

Every phase produces integration-ready evidence and leaves the repository green,
but only phase 12 may claim stable complete product. A critical upstream or
regulatory dependency is started early; lack of external access remains a visible
blocker rather than a mocked pass.

### Risk baseline

The register MUST include at least regulatory/AEAT drift and ambiguity; wrong
applicability/declaration; CRA role/reporting/support; integrity/signature/XML;
host non-atomicity/concurrency/data loss; indeterminate delivery; certificate/key/
account compromise; supply-chain/runner/registry/GitHub compromise; partial npm
publication; package/profile incompatibility; performance/resource/backlog;
privacy/support-data breach; unverified external portal; overstated claims;
single-maintainer incapacity; upstream Engine/provider/EOL; and evidence loss.

Risks carry inherent/residual likelihood/impact, velocity, trigger, leading
indicator, owner, treatment, contingency, evidence and next review. Critical
legal/integrity/secret risk cannot be accepted merely to meet a date. Unknown
material likelihood/impact is conservative and blocks release where falsification
could invalidate a public or legal claim.

### Area exit gate

The DAG has no orphan requirement/deliverable; every phase/work package has
ready/done/evidence/invalidation rules; risks and assumptions are current and
linked; all open questions have safe behavior/deadline; `1.0.0` maps every
capability to exact proof; and generated status cannot say complete when code,
external validation, publication or support readiness is absent.

## Area 18 — Assurance and audits

### Questions it must close

- Which evidence set is necessary and sufficient for each scoped claim, and who
  is competent/independent enough to make the conclusion?
- How are raw observations, reports, attestations, decisions and public claims
  stored, chained, retained, redacted and reproduced?
- How does every `REV-001`–`REV-084` obtain individual current disposition and
  regression without laundering old completion text?
- Which internal audits run per PR/candidate/release/period and what external
  legal, security, cryptographic or integration review remains required?
- How are findings/exceptions/postmortems closed only after effective corrective
  action, not document edits or scanner dismissal?

### Required documents

| Document | Mandatory content |
|---|---|
| `assurance-model.md` | Claim classes/levels, positive/falsifying evidence, competence, independence and residual uncertainty. |
| `evidence-schema.md` | Exact subject/tool/environment/source/result identities, completeness and deterministic serialization. |
| `evidence-store-and-chain-of-custody.md` | Immutable storage, ingest/digests/access/redaction/legal hold/export/restore and audit log. |
| `historical-findings-ledger.md` | 84 individual records, reproduction, current mapping/disposition/evidence and reopen triggers. |
| `finding-lifecycle.md` | Intake, dedupe, severity/ownership/SLA, root cause, fix, regression, verify/reopen and disclosure. |
| `control-assurance-mapping.md` | Requirements/threats/controls/tests/jobs/evidence and SSDF/SAMM/ASVS/OSPS scoped mappings. |
| `internal-audit-plan.md` | Independence limits, cadence, sampling/full populations, procedures, outputs and follow-up. |
| `external-verification-plan.md` | Legal/tax, cryptography/XML, security, privacy, accessibility of claims and Facturacion/adapter reviewers. |
| `independence-and-claim-language.md` | Self-assessment versus independent verification/certification/AEAT acceptance and approved wording. |
| `github-audit-evidence.md` | Effective settings/rules/workflows/apps/alerts/unknowns, raw API custody and read-back. |
| `regulatory-audit-evidence.md` | Source freshness, editions, requirement trace, external AEAT results and declaration inputs. |
| `security-and-privacy-audit-evidence.md` | Threat/control closure, vulnerabilities, data handling, workflows, incidents and residual risks. |
| `performance-and-reliability-audit-evidence.md` | Qualified workloads/environments/raw distributions/resources/stress/recovery and claim scope. |
| `supply-chain-and-release-audit-evidence.md` | Inputs/builds/packages/licences/SBOM/provenance/tags/OIDC/npm/GitHub verification. |
| `integration-conformance-evidence.md` | Engine/profile, synthetic future-Facturacion host-contract and capability-level adapter/provider results from exact artifacts. |
| `recovery-drill-evidence.md` | Scenario/injection, RPO/RTO, restored state, integrity, deviations and remediation. |
| `release-dossier-model.md` | Immutable index joining all release/legal/technical/operational evidence and public subset. |
| `exceptions-and-risk-acceptance.md` | Non-waivable rules, authority, scope/expiry/compensation, release policy and verification. |
| `postmortems.md` | Blameless timeline/impact/root/contributors/detection/response/actions/owners/effectiveness. |
| `evidence-retention-and-integrity.md` | Class-specific legal/support retention, cryptographic renewal, readability/migration and deletion. |

### Audit and claim model

Internal owner review is labelled self-assessment. Tool output is tool evidence.
An external professional opinion, penetration test, certificate/provider report,
future Facturacion acceptance when that product eventually exists, and AEAT
observation each retain their exact issuer/scope/date/limitations. Future
Facturacion acceptance is not a current VeriFactu release prerequisite. None is
called independent certification unless contractual and competence/independence
criteria prove it.

The release audit uses full populations for required checks, artifacts, packages,
sources, critical controls and all historical findings; sampling is allowed only
for explicitly lower-risk repetitive evidence with population/method/seed/error
recorded. Auditor exceptions cannot override law or alter raw evidence.

Finding closure requires root-cause correction, packaged regression, related-
variant search, exact-subject evidence and independent/owner verification as
defined. Scorecard badges, workflow green, alert dismissal, documentation edit or
absence of new report never closes a finding.

### Area exit gate

Schemas and custody are complete; all 84 historical findings have individual
current evidence/disposition; every requirement/control/risk/release claim has a
closed trace path; audits have scope/competence/independence and reproducible
procedures; exceptions are non-contradictory/expiring; drills/postmortems verify
corrective action; and one synthetic complete dossier is independently rebuilt
before any production release dossier is accepted.

## Area 99 — Final reference system

### Purpose and required documents

This area is informative navigation only. Every generated table identifies its
canonical source, generator/config/input digests and freshness. Manual reference
text cannot create a requirement or override a source/ADR/specification.

| Document | Mandatory content |
|---|---|
| `glossary.md` | Canonical fiscal/product/security/release terms, homonyms and authoritative owner links. |
| `acronyms.md` | Expansion, language, domain and first authoritative definition. |
| `standards-and-frameworks.md` | Exact editions/status/applicability/claim limitations and source IDs. |
| `bibliography.md` | Complete source metadata, consulted/pinned dates, URLs/digests and supersession. |
| `identifier-catalog.md` | All ID families, object/location/status/owner and collision/orphan report. |
| `package-and-product-names.md` | Legal/commercial/npm/binary/profile/edition names and prohibited ambiguous aliases. |
| `date-time-decimal-and-encoding-conventions.md` | Cross-document lexical/unit/UTC/Unicode/byte conventions with canonical specs. |
| `status-and-claim-vocabulary.md` | Planned/implemented/verified/published/supported and scoped public claim grammar. |
| `diagnostic-and-result-vocabulary.md` | Success/rejection/error/indeterminate/unsupported/blocked and stable diagnostic links. |
| `diagram-index.md` | Diagram/viewpoint/source model, owning spec and consistency result. |
| `cross-framework-mappings.md` | NIST SSDF/SAMM/ASVS/OSPS/SLSA/SPDX/CycloneDX applicability and gaps. |
| `document-index.md` | Every current document, authority/status/owner/review/dependencies and supersession. |
| `traceability-index.md` | Source→requirement→decision→implementation→test→job→evidence→release generated paths. |
| `historical-finding-index.md` | Every REV/FND, current disposition, owner, regression/evidence and reopen trigger. |
| `release-and-support-index.md` | Versions/packages/editions/Engine/profiles/runtimes/status/support/EOL/dossiers/advisories. |

### Area exit gate

All indexes reproduce from validated canonical registries; there are no duplicate/
unknown/orphan IDs, broken current links, inconsistent terms, stale reviews or
hand-edited generated output; the immutable archive is separately manifested;
and deleting/reordering generated reference files cannot alter normative meaning.

## Required decisions for Lot 4

| Proposed ADR | Recommended decision | Rejected shortcut/risk |
|---|---|---|
| `ADR-0039` | Three named public packages use lockstep SemVer; regulatory editions/profiles remain independent version axes. | Independent package versions create unsupported combinations; edition-as-package-version corrupts history. |
| `ADR-0040` | Typed durable release state machine with exact identities and partial/indeterminate states. | Inferring release from a tag/workflow hides cross-system partial failure. |
| `ADR-0041` | Annotated SSH-signed immutable release tags from protected main, with verifier trust roots protected independently. | Lightweight/mutable tag or candidate-owned signer file can authorize itself. |
| `ADR-0042` | Single-maintainer release authorization uses zero reviewers, no permanent bypass, protected tag/environment/OIDC and independent read-back. | Self-review or admin bypass creates theatre/audit privilege. |
| `ADR-0043` | npm publication uses trusted OIDC only, exact preflighted package identities and no persistent token. | Long-lived token broadens compromise and obscures workflow identity. |
| `ADR-0044` | Publish three stable packages under unique temporary tag, verify all, then move `latest`; partials are deprecated and replaced by new version. | npm publication/dist-tags are not transactional; pretending otherwise strands consumers. |
| `ADR-0045` | Stable rebuilds from its own signed source; RC/stable compare semantically, and post-publication verifier downloads public bytes independently. | Reusing RC with different version is impossible; trusting release-job artifacts is circular. |
| `ADR-0046` | GitHub Release remains draft until registry verification, then immutable with closed assets/dossier where platform support is verified. | Editable assets after publication destroy custody. |
| `ADR-0047` | Component dossier plus deterministic responsible-declaration handoff; integrated producer alone authorizes/signs final SIF declaration. | Repository template cannot certify an unknown deployment/producer. |
| `ADR-0048` | Five-year minimum major security support proposal, extended by applicable CRA/use/contract, with edition historical verification separated from new issuance. | Indefinite vague support is unmeasurable; short arbitrary EOL may violate commitments. |
| `ADR-0049` | NIST-aligned vulnerability/incident lifecycle with CVSS plus exploitation/reachability/legal context and coordinated advisory. | Scanner severity alone misses real urgency; security fix cannot skip release integrity. |
| `ADR-0050` | Immutable releases recover forward via new version, dist-tags, deprecation/advisory/revocation; unpublish is exceptional. | Overwriting/removing destroys evidence and may not reach installed consumers. |
| `ADR-0051` | Dependency-driven complete-product roadmap; phases are non-release increments and dates never close gates. | MVP/status pressure recreated false phase completion in the deleted system. |
| `ADR-0052` | Formal assurance distinguishes self, tool, independent and authority observations; dossiers use exact scoped claim language. | Badges/green CI/internal prose are not certification or AEAT approval. |
| `ADR-0053` | Evidence/audit/reference indexes derive from one append-only canonical graph with class-specific retention and restoration proof. | Hand-maintained matrices drift; raw artifact loss makes claims unverifiable. |

## Historical-finding closure strategy

`historical-findings-ledger.md` expands every ID individually; ranges here route
work and never imply group closure.

| Findings | Lot 4 closure obligation |
|---|---|
| `REV-001`–`REV-014` | Release edition/legal/format/signature evidence and external/independent vectors prove the complete current rules. |
| `REV-015`–`REV-027` | Engine/profile/identity/mode/state/public contract and historical verification are exercised from installed packages. |
| `REV-028`–`REV-036` | The synthetic future-Facturacion host proves joint atomicity, concurrency, crash/outbox/recovery and adapter levels with real durable evidence; the unbuilt application is not required. |
| `REV-037`–`REV-046` | Full AEAT WSDL/XSD/protocol/results/retry/TLS/QR scenarios plus available external observations. |
| `REV-047`–`REV-055` | Released CLI/library consumers prove grammar, streams, JSON, filesystem, exits and cancellation on supported OS/runtime. |
| `REV-056`–`REV-064` | Honest coverage/mutation/performance/fuzz/recovery/oracle/security results appear in the exact release dossier. |
| `REV-065`–`REV-072` | Three tarballs, clean consumers/builds, dual SBOM/licences/toolchain and module graph are independently checked. |
| `REV-073` | Every human commit/tag signature and DCO/co-author/bot/range/squash attribution passes negative-tested gates. |
| `REV-074` | Dashboard, changelog, package docs, public claims and release state reconcile with exact implementation/evidence. |
| `REV-075`–`REV-076` | SHA Action enforcement and complete effective GitHub audit/producer/pagination/unknown evidence enter the dossier. |
| `REV-077` | Zero approvals/no CODEOWNERS/self-review fiction is verified effective and usable through a complete protected rehearsal. |
| `REV-078` | Tag/environment/admin privileges have no routine bypass; emergency path is separately audited and exercised. |
| `REV-079` | Canonical local/CI/release tasks emit retained complete exact-SHA evidence and fail on missing/skip/cancel. |
| `REV-080` | Full Scorecard JSON/SARIF and each check disposition are retained; score/badge never substitutes direct control proof. |
| `REV-081` | Organization/private/platform surfaces are verified or explicitly unresolved with authorized evidence; inaccessible never passes. |
| `REV-082` | Real three-package OIDC workflows, strict tags, environments, stable publish and external verification replace scaffolding. |
| `REV-083` | Retention/legal hold/archive/key/backup/restore/migration drills prove historical availability and integrity. |
| `REV-084` | Strict clean consumers obtain edition IDs/assets and every public package surface without casts/private paths. |

No old item reaches `verified-prevented` until its current packaged regression and
release evidence exist. If architecture makes a premise inapplicable, the ledger
requires positive demonstration and a reopen trigger.

## Planned workflows and trust topology

| Workflow | Event/trust | Purpose and privilege |
|---|---|---|
| `release-readiness.yml` | protected PR/main/manual, no publish | Full graph closure, legal/source freshness, campaigns, dossiers and synthetic rehearsal. |
| `release-candidate.yml` | exact signed RC tag | Clean double build, all artifacts/attestations; optional OIDC `npm-prerelease` only. |
| `external-conformance.yml` | protected manual/schedule | Credentialled AEAT/provider scenarios with restricted evidence; no source publication. |
| `stable-release.yml` | exact signed stable tag | Rebuild, attest, temporary-tag npm publish; minimal OIDC/write job only. |
| `release-verification.yml` | registry/release event + manual | Protected independent harness downloads public bytes; no publication permission. |
| `channel-promotion.yml` | verified release ledger/manual | Move npm `latest` only for three already verified subjects; record before/after. |
| `github-release.yml` | verified channels/manual | Publish closed draft/assets/dossier and enable/verify immutability; no npm permission. |
| `regulatory-monitoring.yml` | daily/trusted | Safe source acquisition/diff/alert; cannot auto-adopt an edition. |
| `vulnerability-response.yml` | protected advisory/manual | Embargo-safe checks/advisory evidence; no untrusted issue/PR execution. |
| `continuity-drill.yml` | scheduled/manual isolated | Mirror/restore/rebuild/verification drills with no production destructive target. |

Publication is deliberately split from verification and channel/GitHub promotion.
Workflow chaining uses exact durable ledger subjects, not attacker-writable
artifacts. Every privileged job validates event/ref/SHA/environment anew, grants
minimum permissions, disables caches and records external effect before retry.

If GitHub immutable releases are unavailable or unverifiable for the repository,
publication does not pretend equivalent platform protection: the signed tag,
npm subjects, external evidence store and closed asset-digest manifest remain
canonical; GitHub assets are treated as monitored replicas, mutation/deletion is
forbidden and drift triggers an incident and corrective new release. Availability
of a feature is never converted into a security claim without effective read-back.

## Cross-area deliverables

Lot 4 must produce or precisely specify:

- package/version/edition/profile/support and release-state registries;
- release authorization, freeze, external-effect ledger and recovery schemas;
- npm scope/owner/trusted-publisher/dist-tag desired/effective-state audit;
- tag/signer/revocation and GitHub release/asset/immutability manifests;
- AEAT external scenario, certificate/test identity and observation registry;
- component dossier and integrated responsible-declaration handoff schema;
- support/EOL, vulnerability/advisory/CVSS/OSV and notification decision records;
- continuity/account/key/registry/GitHub/regulatory incident runbooks and drills;
- complete dependency/critical-path/work-package/readiness/done/status graph;
- risk, assumption, external dependency, blocker and scope-change registries;
- all 84 historical disposition records and current finding lifecycle;
- audit programme, competence/independence declarations and evidence procedures;
- immutable release dossier and evidence custody/retention/restoration schemas;
- generated glossary, standards, document, traceability, finding and release
  indexes with deterministic freshness evidence.

## Execution order

1. Revalidate Lots 1–3, all official sources, current CRA/AEAT/npm/GitHub/Node/
   Engine state and the complete historical archive; freeze research snapshot.
2. Approve `ADR-0039`–`ADR-0047`; complete version/release identity/state,
   authorization, tags, npm/GitHub/external/declaration specifications.
3. Approve `ADR-0048`–`ADR-0050`; complete support, vulnerability/incident,
   deprecation/recovery, regulatory operation, continuity and runbooks.
4. Approve `ADR-0051`; generate the complete dependency DAG, implementation
   roadmap, work definitions, risks/assumptions/blockers and `1.0.0` gates.
5. Approve `ADR-0052`–`ADR-0053`; define evidence custody, every audit domain,
   dossier, exceptions, findings, postmortems and retention.
6. Expand all 84 historical findings individually and reconcile every current
   requirement/decision/risk/test/job/evidence/release link.
7. Define the final non-authoritative reference generators and reject all drift/
   duplication/unknown identifiers and broken current links.
8. Threat-model every privileged release/recovery path and exercise modeled
   partial npm/GitHub/registry/platform failures using synthetic namespaces.
9. Conduct contradiction review against public claims, package names, support,
   responsible declaration, Verification Engine and future-Facturacion boundary contracts and
   inaccessible platform state.
10. Run documentation gates on one protected exact commit and produce area/lot
    approval reports only when their real evidence exists.

## Lot exit criteria

Lot 4 implementation exit requires all 82 documents to remain substantive and
consistent; `ADR-0039`–`ADR-0053` are accepted; the complete product roadmap has
no MVP deferrals/orphans; all release identities/transitions/partial failures are
closed; tags/environments/OIDC/package ownership/no-bypass policy are implementable
for one maintainer; legal/RRSIF/CRA/privacy/licence/support decisions are current
and scoped; external AEAT and declaration responsibilities are exact; incidents,
account/key recovery and continuity are executable; all 84 historical findings
have individual current disposition; audit/evidence/dossier custody is complete;
reference indexes are generated; and documentation CI passes for the exact
candidate SHA.

Planning completion is not source implementation, platform configuration,
external professional opinion, AEAT acceptance, CRA conformity assessment,
responsible declaration, publication or operational SLA attainment.

## Current elaboration state

As of 2026-09-12, the project owner has approved this plan and all 82
substantive documents exist as approved design specifications: 25
release/operations, 20 roadmap/risk, 22 assurance/audit and 15 reference
specifications. The fifteen accepted decision directions are recorded in
`ADR-0039` through `ADR-0053`; each area index reflects its complete inventory
and exit gate.

This closes the complete normative planning corpus, not implementation or formal
product release approval. No source tree, locked toolchain, tests, workflows,
effective GitHub/npm configuration, package/release, professional legal review,
AEAT observation, signed declaration or operational evidence is created by these
documents. Those execution artefacts remain future work governed by the
implementation roadmap.

## Sources

1. BOE/AEAT, [Royal Decree 1007/2023](https://www.boe.es/buscar/act.php?id=BOE-A-2023-24840), [Order HAC/1177/2024](https://www.boe.es/buscar/act.php?id=BOE-A-2024-22138) and [responsible-declaration examples](https://sede.agenciatributaria.gob.es/static_files/Sede/Tema/IVA/Verifactu/EjemplosDeclaracionResponsable%28V0.5.1%29.pdf), consulted 2026-09-12.
2. European Union, “[Regulation (EU) 2024/2847 — Cyber Resilience Act](https://eur-lex.europa.eu/eli/reg/2024/2847/oj),” Official Journal, 2024-11-20; phased applicability checked 2026-09-12.
3. Semantic Versioning, “[Semantic Versioning 2.0.0](https://semver.org/spec/v2.0.0.html).”
4. npm, “[Adding dist-tags](https://docs.npmjs.com/adding-dist-tags-to-packages),” “[Deprecating packages](https://docs.npmjs.com/deprecating-and-undeprecating-packages-or-package-versions)” and “[Unpublish policy](https://docs.npmjs.com/policies/unpublish),” consulted 2026-09-12.
5. npm, “[Trusted publishing](https://docs.npmjs.com/trusted-publishers/)” and “[Generating provenance statements](https://docs.npmjs.com/generating-provenance-statements),” consulted 2026-09-12.
6. GitHub, “[About releases](https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases)” and “[Immutable releases](https://docs.github.com/en/code-security/supply-chain-security/understanding-your-software-supply-chain/immutable-releases),” consulted 2026-09-12.
7. GitHub, “[Managing environments](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments),” consulted 2026-09-12.
8. NIST, “[SP 800-61 Rev. 3](https://csrc.nist.gov/pubs/sp/800/61/r3/final),” April 2025; FIRST, “[CVSS v4.0](https://www.first.org/cvss/v4.0/specification-document).”
9. GitHub, “[Private vulnerability reporting](https://docs.github.com/en/code-security/security-advisories/working-with-repository-security-advisories/configuring-private-vulnerability-reporting-for-a-repository)” and “[Repository security advisories](https://docs.github.com/en/code-security/security-advisories/working-with-repository-security-advisories/about-repository-security-advisories),” consulted 2026-09-12.
10. OpenSSF, “[OSV schema](https://ossf.github.io/osv-schema/),” “[OSPS Baseline](https://baseline.openssf.org/)” and “[Best Practices Badge](https://www.bestpractices.dev/en),” consulted 2026-09-12.
11. NIST, “[SP 800-30 Rev. 1](https://csrc.nist.gov/pubs/sp/800/30/r1/final)” and “[SP 800-161 Rev. 1](https://csrc.nist.gov/pubs/sp/800/161/r1/final).”
12. IETF, “[RFC 9116 — A File Format to Aid in Security Vulnerability Disclosure](https://www.rfc-editor.org/rfc/rfc9116),” April 2022.
13. CISA, “[Known Exploited Vulnerabilities Catalog](https://www.cisa.gov/known-exploited-vulnerabilities-catalog),” consulted 2026-09-12.
14. Keep a Changelog, “[Version 1.1.0](https://keepachangelog.com/en/1.1.0/),” informative format guidance.
15. Noeos, local Verification Engine repository, public releases/npm packages and effective GitHub state at commit `7df31cfb3ccc538c0ceab468e944172ed2480c95`, inspected 2026-09-12.
