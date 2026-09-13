---
id: PLAN-L3
title: Lot 3 engineering assurance and delivery documentation plan
status: draft
authority: normative
owner: project-owner
created: 2026-09-12
last-reviewed: 2026-09-13
dependencies: [PLAN-L1, PLAN-L2, QA-INDEX, REPO-INDEX, BUILD-INDEX, INTEGRATION-INDEX]
decisions: [ADR-0001, ADR-0003, ADR-0004, ADR-0006, ADR-0007, ADR-0009, ADR-0010, ADR-0012, ADR-0013, ADR-0015, ADR-0016, ADR-0017, ADR-0018, ADR-0019, ADR-0020, ADR-0021, ADR-0022, ADR-0023, ADR-0024, ADR-0025]
sources: [SRC-0029, SRC-0030, SRC-0032, SRC-0033, SRC-0034, SRC-0038, SRC-0041, SRC-0049, SRC-0050, SRC-0052, SRC-0053, SRC-0054, SRC-0055, SRC-0056, SRC-0057, SRC-0058, SRC-0059, SRC-0060, SRC-0061, SRC-0062, SRC-0063, SRC-0064, SRC-0065]
historical-inputs: [REV-056, REV-057, REV-058, REV-059, REV-060, REV-061, REV-062, REV-063, REV-064, REV-065, REV-066, REV-067, REV-068, REV-069, REV-070, REV-071, REV-072, REV-073, REV-074, REV-075, REV-076, REV-077, REV-078, REV-079, REV-080, REV-081, REV-082, REV-083, REV-084]
---

# Lot 3 engineering assurance and delivery documentation plan

## Purpose and approval boundary

This plan controls the complete documentation of how VeriFactu will be proved,
built, integrated and admitted into protected `main`. It connects the complete
product specifications from Lots 1 and 2 to future implementation and
exact-commit evidence:

```text
authority + requirements + architecture/contracts
                 |
                 v
       claim -> test -> independent oracle
                 |
                 v
 deterministic local task graph == protected CI
                 |
                 v
 clean build -> packages -> SBOM -> provenance
                 |
                 v
 installed consumers + real adapter/integration conformance
                 |
                 v
 exact-SHA evidence eligible for merge and later release review
```

This is not an MVP, prototype or “sufficient CI” plan. It specifies the final
assurance system for the complete product. Expensive campaigns may be scheduled
outside the ordinary PR critical path only with a safe impact policy and later
release gate; no claim, adapter, package or mode may be omitted, mocked
indefinitely or represented as passing when skipped.

The project owner approved all Lot 2 substantive content on 2026-09-12. That
approval fixes its intended design as input. Formal document status remains
separate until protected exact-commit gates exist, preventing the old confusion
between planned, implemented, locally verified and externally validated.

## Lot scope

Lot 3 contains four coupled areas:

1. `11-quality-testing`: claim-driven verification, test levels, official and
   independent oracles, property/fuzz/mutation/coverage, faults, recovery,
   compatibility, flakiness and evidence;
2. `13-repository-ci`: complete repository organization, toolchain, canonical
   local task graph, SSH+DCO flow, effective GitHub protections, workflow trust
   and required checks;
3. `14-supply-chain-build`: dependency/Action/tool admission, installation,
   build/package integrity, reproducibility, licences, CycloneDX/SPDX,
   provenance and artifact verification;
4. `16-integrations-conformance`: exact installed-package contracts with
   Verification Engine, the future-Facturacion boundary through a maintained
   synthetic host, and every real available adapter/provider.

Publication/support operations, global roadmap/risk closure, formal assurance
dossiers and reference indexes remain Lot 4. Lot 3 still designs their trusted
inputs and makes accidental publication impossible.

## Non-negotiable assurance principles

- A test proves one named claim for one subject, edition, environment and exact
  commit; it never grants general compliance.
- Production code cannot be its own sole oracle. Official bytes, independently
  implemented references and adversarial mutations provide challenge.
- Coverage measures execution, mutation measures detection of injected faults,
  and fuzz duration measures time. None alone proves completeness.
- Required jobs fail on failure, error, cancellation, timeout, missing report,
  unexpected skip/neutral conclusion, empty test discovery or incomplete matrix.
- Local and CI commands execute the same canonical locked task implementation;
  workflow YAML is orchestration, not a competing test suite.
- Every human-authored commit carries a verifiable SSH signature and canonical
  DCO trailer. Cryptographic identity and rights attestation are separate gates.
- Every change enters `main` through a protected PR with zero approvals and no
  `CODEOWNERS`, truthfully reflecting one human maintainer.
- Native GitHub squash creates a GitHub-authored, verified GPG-signed commit;
  branch commits remain SSH-signed and the squash message must retain DCO and
  exact PR/head attribution. Requiring the automated squash to bear the
  maintainer's SSH signature would require a new signing bot/key trust boundary.
- `main` has no ordinary bypass, force-push or deletion; source branches delete
  automatically after successful squash.
- Required checks are bound to their expected producer and current PR SHA; a
  context name alone is not evidence.
- Untrusted PR code receives no secrets or write/OIDC/attestation permission.
  Privileged jobs never execute or source untrusted code/artifacts.
- Every dependency, Action and external executable is exact, admitted,
  inventoried and replaceable. Popularity or a verified badge is not authority.
- Builds start clean from locked inputs, inspect closed package allowlists and
  test actual tarballs with the workspace unavailable.
- SBOMs validate structurally/semantically and reconcile with lock, install,
  tarballs and licence notices. A file merely named SBOM proves nothing.
- Provenance identifies exact subject digests and is independently verified.
  Signing, provenance, reproducibility and transparency are distinct claims.
- Integration qualification exercises exact installed artifacts and real
  claimed capabilities; empty adapters, mocks and adjacent source imports fail.
- Secrets, private keys, live certificates, personal/customer fiscal data,
  workstation paths and embargoed findings never enter public fixtures,
  caches, artifacts, logs or SBOMs.

## Research and authority method

### Source hierarchy

Regulatory authority from Lots 1 and 2 continues to govern product behavior.
Engineering decisions use, in order: official GitHub/npm/Node/TypeScript
documentation; SLSA/SPDX/CycloneDX/DCO and adopted NIST/OWASP/ISO specifications;
exact local/effective Verification Engine state; maintained upstream source and
security records; then issues/forums solely for failure hypotheses.

Adopted versions and executable inputs record date, upstream identity,
tag/release, full SHA or signed digest, licence and review trigger. A current web
page guides planning; implementation retains exact authenticated bytes.

### Observed Verification Engine baseline

Read-only inspection on 2026-09-12 observed Verification Engine workspace
`1.0.1` at commit `7df31cfb3ccc538c0ceab468e944172ed2480c95`.

| Observation | Reused invariant | VeriFactu treatment |
|---|---|---|
| Public repository; squash only; automatic branch deletion | Linear protected PR delivery and clean branches. | No merge/rebase merge; read-back after administrative mutation. |
| Active main ruleset: no bypass, signatures, PR, zero approvals, no code-owner review and strict checks | Matches the honest single-maintainer model. | No `CODEOWNERS`, last-push or unattributed-change approval. |
| Twelve required OS/runtime/reproducibility/security contexts | Stable explicit check contracts. | Add regulatory, traceability and integration-specific contexts plus closure proof. |
| Selected Action allowlist and `sha_pinning_required=true` | Platform enforcement plus code-side inventory. | Independently admit current SHAs rather than copy stale values. |
| Node 24.20/npm 11.19 primary; 22.14/22.23 compatible; 26.7 informational | Supported-major intent and Engine compatibility. | Plan current 24.21.0 primary, 22.14/22.23.2 compatibility and 26.8.2 informational.^1 |
| TypeScript 5.9.3, ESM/CJS, clean consumers, SBOM and attestations | Common Noeos tool/evidence vocabulary. | Extend to library, CLI, adapter kit, editions and provider toolchains. |
| Tag ruleset has OrganizationAdmin bypass; npm environments have reviewer controls | Treat as actual privileged exceptions. | Do not inherit blindly; resolve release/recovery in Lot 4. |
| Classic protection absent while ruleset is active | Ruleset is effective primary protection. | Auditor records absence/N/A distinctly, never invents redundancy. |

Node identifies 22 and 24 as supported LTS and 26 as Current on the research
date.^1 Exact versions remain volatile: the implementation ADR must verify
official checksums/signatures and security advisories before the first lockfile,
then coordinate any public matrix change with Verification Engine.

### Platform and supply-chain evidence

GitHub recommends explicit least-privilege permissions and full-SHA Action pins
because mutable tags and broad tokens increase compromise impact.^2 Rulesets can
require PRs, signed commits, linear/squash history and strict expected-source
checks.^3 These become versioned desired-state invariants and API fixtures, not
screenshots.

GitHub documents that `pull_request_target` carries elevated base-repository
trust and is dangerous when it executes untrusted PR code/artifacts.^4 VeriFactu
does not use it for builds or tests. GitHub also distinguishes commit signature
verification from sign-off,^5 while DCO requires one truthful trailer per actual
contributor.^6

npm trusted publishing uses short-lived OIDC and automatically supplies
provenance for eligible public packages on GitHub-hosted runners; current
requirements include Node 22.14+ and npm 11.5.1+.^7 Lot 3 prepares that boundary
but actual namespace/environment publication belongs to Lot 4.

SLSA 1.2 distinguishes signed hosted Build L2 provenance from Build L3's
additional hardened-platform isolation requirements.^8 The initial target is an
accurately scoped Build L2-compatible claim, never L3 without assessment.
GitHub artifact attestations must bind an exact subject digest and narrowly
scope OIDC/attestation permissions.^9

CycloneDX 1.7 and SPDX 3.0.1 serve different consumers. SPDX 3.0.1 specifies
both structural JSON Schema and semantic ontology/SHACL validation for
conforming JSON-LD.^10 Both outputs derive from one canonical resolved-component
graph and must reconcile.

## Cross-area assurance model

### Claim-to-evidence graph

Every material requirement/invariant maps through:

```text
claim + exact scope/subject
 -> implementation owner/path
 -> positive and falsifying obligations
 -> independent oracle or justified direct assertion
 -> test ID + fixture/seed
 -> canonical task
 -> CI job/context + expected producer
 -> validated report/artifact digest
 -> commit/package/edition/toolchain identity
 -> explicit disposition or blocker
```

Cardinality is machine validated. A referenced test that was not selected and
executed, a missing report, or evidence for another SHA remains unverified.
Deleting requirements/tests to improve a metric is a governed impact change.

### Result and report vocabulary

Checks report `passed`, `failed`, `error`, `cancelled`,
`not-applicable-demonstrated` or `blocked`. Missing, skipped, empty and unknown
never mean passed. Reports identify schema, subject SHA/tree/artifact, start/end,
tool/config/environment, selected/executed counts, omissions, input/output
digests and producer.

Negative fixtures require the exact expected control/diagnostic. A syntax error,
missing executable or killed runner cannot masquerade as correct rejection.

### Test-data classes

- exact official fixtures with source/digest/licence;
- reviewed synthetic fiscal data containing no real identities;
- derived adversarial mutations with parent/transformation/expected outcome;
- property/fuzz data with generator, seed, shrink path and coverage labels;
- ephemeral secret fixtures generated per run and never uploaded/cached;
- restricted live AEAT observations, never deterministic CI fixtures without a
  separate lawful sanitization decision.

Snapshots are not auto-updated. Byte snapshots are used only where exact bytes
are contractual, always with semantic assertions and reviewed diffs.

## Area 11 — Quality and testing

### Questions it must close

- Which evidence proves every requirement, invariant, transition, format,
  security control, performance budget and compatibility promise?
- What independent oracle challenges each claim?
- Which behavior belongs to unit, contract, integration, real-process E2E,
  security, performance, compatibility or external testing?
- How do properties, fuzzers and real code mutation explore semantics and fail
  on zero work, unexpected exceptions or hangs?
- How is every production module included in coverage without gaming exclusions?
- How are real process/provider/store/network crashes injected and their trigger
  proved before restart inspection?
- How do deterministic schedule/time/randomness controls coexist with OS/runtime
  compatibility?
- How are flakes/infrastructure failures preserved and classified without
  rerun-until-green?
- What makes exact-SHA quality evidence merge/release eligible?

### Required documents

| Document | Mandatory content |
|---|---|
| `verification-strategy.md` | Complete claim/risk-driven strategy, assurance depth and prohibition on partial/MVP gaps. |
| `claim-evidence-and-oracle-model.md` | Canonical graph, claim/result taxonomy, oracle independence and evidence identity. |
| `test-levels-and-ownership.md` | Unit/contract/integration/process-E2E/security/performance/external scope and owners. |
| `fixtures-and-synthetic-data.md` | Provenance, privacy, builders, exact bytes, mutations, secrets and lifecycle. |
| `official-vectors-and-independent-oracles.md` | Official capture, independent references, disagreement and coverage. |
| `unit-contract-integration-e2e.md` | Required positive/negative scope, real processes/packages and completion matrices. |
| `property-testing.md` | Invariants, generators, preconditions, shrinking, labels, replay and evidence. |
| `fuzzing.md` | Target/corpus inventory, coverage guidance, watchdogs, minimum work, sanitization and campaigns. |
| `mutation-testing.md` | Real code mutation, critical catalogue, equivalent/error distinctions and killed-by proof. |
| `coverage-policy.md` | All production denominators, per-package reports, narrow exclusions and empty-report rejection. |
| `fault-injection.md` | Injection taxonomy/hooks, trigger proof and store/provider/network/filesystem/process faults. |
| `concurrency-and-recovery-testing.md` | Schedule exploration, races, CAS/lease/outbox/crash matrix, hard restart and post-state oracle. |
| `security-testing.md` | Threat/control boundary tests, SAST/CodeQL, secrets, dependencies and workflows. |
| `performance-and-resource-testing.md` | Correct workload/budget mapping, safety sentinels, calibrated regression/stress/soak. |
| `compatibility-testing.md` | Runtime/OS/module/API/schema/edition/storage/Engine/host/provider and tarball matrix. |
| `test-selection-and-impact.md` | Dependency/requirement impact, safe subsets, full-suite triggers and anti-label bypass. |
| `flakiness-and-infrastructure-failures.md` | Detection, classification, quarantine constraints, first-failure evidence and repair SLA. |
| `test-evidence-and-traceability.md` | Report schemas, exact identities, retention and requirement-to-job closure. |
| `quality-exit-criteria.md` | Merge/RC/stable thresholds, exceptions, zero unowned gaps and approval evidence. |

### Recommended decisions and thresholds

Coverage is at least 98% lines/functions and 95% branches per public package
over all production modules; registered critical fiscal/signature/atomicity/
state/correlation logic requires 100% condition/branch coverage unless
unreachable code is removed. Exclusions require exact reviewed IDs.

Real mutation testing kills 100% of registered critical mutants and at least
95% of non-equivalent in-scope mutants. Compile errors, timeouts and unexecuted
mutants are not killed. Property/fuzz runs declare targets, deterministic seeds,
minimum executions/coverage labels and shrinking; unexpected errors, hangs and
zero work fail.

PRs run bounded deterministic suites. Extended fuzz/mutation/soak and calibrated
performance run scheduled/on demand and for release; every confirmed minimal
counterexample becomes a required regression. A critical change triggers the
complete relevant campaign before merge or blocks; paths/labels can only add
work, never suppress semantically required tests.

### Completion gate

Every claim has positive and falsifying evidence; critical boundaries have
independent oracles/mutants; coverage is honest; Lot 2 crash/concurrency/protocol
matrices have executable plans; fixtures are lawful/reproducible; flakes are not
hidden; and every required job emits complete exact-SHA traceable evidence.

## Area 13 — Repository engineering and CI

### Questions it must close

- What is the exact complete root/workspace/source/generated/test/security/
  evidence tree and semantic owner of each file class?
- Which canonical commands exist and how do local and CI executions stay equal?
- Which runtime/reference/provider tools are supported, authenticated and
  updated?
- How are SSH, DCO, co-authors, bots, commit range and squash commit verified?
- What GitHub settings/rulesets/security controls match Verification Engine's
  intent while honoring one maintainer?
- Which events, permissions, tokens, caches, artifacts and environments are
  trusted, and how is untrusted code isolated?
- Which contexts are required, who produces them, and how is matrix/report
  closure proved?
- How does the state auditor distinguish absent, inaccessible, unknown and drift
  across pagination and inherited organization controls?
- How is bootstrap used once and irreversibly closed?

### Required documents

| Document | Mandatory content |
|---|---|
| `repository-structure.md` | Complete intended root, packages, internal tools, editions, schemas, fixtures, tests, security and evidence tree. |
| `directory-and-file-ownership.md` | Semantic owner, permitted content, generated/source status, review triggers and forbidden dumps. |
| `module-boundaries-and-import-rules.md` | TypeScript/workspace/export graph and executable enforcement. |
| `naming-and-file-conventions.md` | File/module/test/script/workflow/job/package/schema/generated conventions. |
| `generated-vendored-and-temporary-files.md` | Placement, provenance, regeneration, licence, ignores, cleanup and secret-safe temp data. |
| `toolchain.md` | Runtime/reference/provider profiles, versions/digests, acquisition, PATH, consistency and update. |
| `local-development-workflow.md` | Clean setup, branch, edit/generate/test, pre-push, commit/push/PR and non-bypass troubleshooting. |
| `canonical-task-graph.md` | Single task registry, dependencies/I/O, local-CI parity, locks and no recursive duplicate builds. |
| `git-commits-branches-and-pull-requests.md` | Work item, branches, commit/PR content, squash, ancestry and branch deletion. |
| `ssh-signatures-and-dco.md` | Allowed signers, `git commit -S -s`, trailers/co-authors/bots/ranges and local/GitHub/post-squash negatives. |
| `single-maintainer-controls.md` | Zero approvals/no CODEOWNERS, honest role separation, compensating controls and bus factor. |
| `github-repository-settings.md` | Visibility/features/merge/security/Actions/default permission/retention desired state. |
| `branch-and-tag-rulesets.md` | Exact targets, main no-bypass, signatures, PR/squash/linear/no-force/delete and strict checks. |
| `workflow-architecture.md` | Events, trust classes, timeouts/concurrency, DAG, reusable boundaries and failure semantics. |
| `required-jobs-and-checks.md` | Stable contexts, trigger coverage, expected producer, matrix closure and required/informational/governed classes. |
| `workflow-permissions-and-trust.md` | Read default, job elevation, OIDC/attestation/write isolation, secrets and environments. |
| `untrusted-contributions-and-events.md` | Fork/Dependabot risks, `pull_request_target`, injection, artifact/cache and safe metadata automation. |
| `caches-artifacts-and-retention.md` | Cache trust/keys/revalidation, no secrets, release no-cache, artifact schemas/digests/retention. |
| `dependabot-and-automation.md` | npm/Actions schedules/groups/limits, bot DCO/attribution, update evidence and no auto-merge. |
| `policy-as-code.md` | Schemas/checkers/negative fixtures for repository, workflow, toolchain, docs, dependencies and generation. |
| `github-effective-state-audit.md` | Paginated read-only collection, normalization, expected producer, inheritance/private surface and unknown semantics. |
| `bootstrap-and-protection-rollout.md` | One signed+DCO minimal bootstrap, configure/read-back order, expiry and proof no product bypass. |

### Toolchain baseline

| Profile | Planned exact baseline | Purpose |
|---|---|---|
| Minimum | Node 22.14.0 and npm 10.9.2 | Public lower-bound compatibility/OIDC minimum. |
| Latest 22 | Node 22.23.2 | Final Node 22 LTS compatibility. |
| Primary | Node 24.21.0, npm 11.19.1, TypeScript 5.9.3 | Development, lock generation, complete gates/build. |
| Cross-platform | Node 24.21.0 on Ubuntu 24.04, Windows 2025, macOS 15 | Required runtime/CLI/filesystem compatibility. |
| Current | Node 26.8.2 with npm 12.0.2 | Informational future compatibility only. |
| Reference/provider | Exact Python/Java/WASM/native profiles selected by admission | Independent oracles and DSS/XML providers. |

Official signed checksums, bundled npm advisories and Engine compatibility must
be rechecked before implementation. `.node-version`, engines, `packageManager`,
`.npmrc`, lock, manifests, CI and docs must agree. Toolchain updates are focused
PRs with regeneration/compatibility impact, never incidental changes.

### Required PR contexts

- `Required · governance signatures and DCO`;
- `Required · documentation and traceability`;
- `Required · regulatory sources and generated contracts`;
- `Required · quality and policy`;
- `Required · ubuntu-24.04 · Node 22.14.0`;
- `Required · ubuntu-24.04 · Node 22.23.2`;
- `Required · ubuntu-24.04 · Node 24.21.0`;
- `Required · windows-2025 · Node 24.21.0`;
- `Required · macos-15 · Node 24.21.0`;
- `Required · package reproducibility`;
- `Required · integration conformance`;
- `Required · dependency review`;
- `Required · CodeQL`;
- `Required · secret scan`;
- `Required · OSV`;
- `Required · npm audit signatures and licenses`;
- `Required · required-check closure`.

The closure job uses `if: always()` and fails unless all prerequisites succeeded
for the same workflow/SHA and all reports validate. Leaf contexts also remain
required, preventing aggregator deletion from hiding absence. Contexts bind to
the expected GitHub App after their first trusted run.

Performance smoke is required for affected code. Governed budgets, extended
fuzz/mutation/soak and Scorecard run on their appropriate trusted cadence;
confirmed defects remain blockers even if their scheduling class is
informational.

### Single-maintainer target

`main` requires PR, squash only, linear history, signed commits, strict
up-to-date checks, resolved conversations and blocks deletion/force-push with no
bypass. Approval count is zero; `CODEOWNERS`, last-push and extra unattributed
approval are disabled. Direct push ends after bootstrap and merged branches are
deleted automatically.

This mirrors Verification Engine by security invariant, not stale literal
configuration. Release tags/environments are finalized in Lot 4; until then
release workflows cannot publish.

### Immutable historical-archive boundary

`previous-docs` is validated as immutable historical input by a complete
path/size/SHA-256/SHA-512 manifest and change detector. Normative metadata,
style, placeholder and live-link rules do not reinterpret or rewrite its old
bytes. Secret scanning and explicit archive-safety policy still apply.

The initial read-only link scan found three legacy relative targets that no
longer exist: two references to `regulatory/sources.json` and one to the deleted
root `package.json`. They are retained as observed archive state, not accepted
as current links. The checker must report/baseline them distinctly, reject any
new archive drift and require every link introduced outside the archive to
resolve. This reconciles `GOV-006` immutability with `GOV-011` link integrity
without silently excluding the historical corpus.

### Completion gate

The tree/task DAG is fixed; tools are pinned/authenticated; local/CI parity is
defined; signature/DCO/checks have negative fixtures; untrusted code cannot gain
privilege; desired GitHub state has a full read-only auditor; and bootstrap
establishes protection without a reusable exception.

## Area 14 — Supply chain and build

### Questions it must close

- Why is each dependency, Action and external binary needed, trustworthy enough
  and replaceable?
- How are versions, sources, integrity, release age, licences, maintainers,
  scripts/native code, permissions, advisories and transitives evaluated?
- Can a clean network-bounded build run only from authenticated prepared inputs
  without global/workstation state?
- Are ESM, CJS, types, CLI, kit, schemas and editions built once from the same
  verified graph?
- What exact reproducibility is required across directories/runners/platforms?
- Does each tarball contain exactly its allowlist and all required notices?
- Do CycloneDX/SPDX validate and reconcile with lock/install/tarballs?
- Which provenance/signature protects each subject, and can a clean consumer
  verify without trusting the producing report?
- How are registry/action/cache/runner/tool compromises recovered?

### Required documents

| Document | Mandatory content |
|---|---|
| `dependency-admission.md` | Need/alternatives, version/source/integrity, maintenance, licence, scripts/native, transitives, security and exit. |
| `dependency-inventory-and-drift.md` | Canonical resolved graph, purls/digests/licences and manifest/lock/install/tarball reconciliation. |
| `github-action-admission.md` | Owner/repository/tag-to-SHA, source review, permissions/network/runtime/licence/update and allowlist. |
| `lockfile-and-registry-integrity.md` | Registry allowlist, lock v3/integrity, exact specs, signature/audit, cache and outage behavior. |
| `install-scripts-native-and-optional-code.md` | Ignore/omit baseline, scoped sandbox exceptions, native/prebuild provenance and platform matrix. |
| `external-tool-downloads.md` | Official source, signature/checksum, extraction limits, platform assets, licence and offline cache. |
| `build-system.md` | Canonical DAG, generated inputs, one compilation, outputs, locks, stale detection and report. |
| `clean-and-hermetic-builds.md` | Clean room, declared environment, post-preparation network denial, locale/time/path and contamination. |
| `reproducibility.md` | Epoch/order/metadata/path normalization, isolated directories/runners and diff diagnosis. |
| `package-content-allowlists.md` | Per-package exact paths/types/modes/sizes/digests and forbidden internal/sensitive content. |
| `tarball-consumers.md` | Actual pack/install for ESM/CJS/TS/CLI/assets/exports and negative deep imports. |
| `licenses-and-attribution.md` | Code/dependency/tool/Action/vendored/generated/data licences, notices and conflicts. |
| `cyclonedx-sbom.md` | CycloneDX 1.7 components/dependencies/services/properties, validation and subject link. |
| `spdx-sbom.md` | SPDX 3.0.1 model, structural/semantic validation, relationships/licences/integrity and subject. |
| `sbom-reconciliation.md` | One canonical graph, dual-format and lock/install/tarball/runtime/provider discrepancy blocking. |
| `provenance-and-attestations.md` | SLSA scope/level, builder/source/parameters/materials/subjects and GitHub/npm verification. |
| `artifact-signing-and-verification.md` | SSH tag, GitHub/Sigstore/npm evidence, roots, digest binding, offline verification and rotation. |
| `build-evidence-manifest.md` | Commit/tree/toolchain/inputs/tasks/tests/packages/SBOM/digests/attestations and completeness. |
| `supply-chain-threats-and-recovery.md` | Confusion, maintainer/action/registry/cache/runner/tool compromise, containment and rebuild/reissue. |

### Recommended decisions

Runtime dependencies remain minimal and direct specs exact. CI installs with
`npm ci --ignore-scripts --omit=optional` against the canonical npm registry and
lockfile v3. Any required lifecycle script/native/optional component receives a
scoped sandboxed admission and platform matrix, never a repository-wide switch.

Non-emergency new versions observe a seven-day cooling period plus provenance,
maintainer, repository, licence and security review. Security fixes can use a
recorded high-scrutiny exception. Cooling reduces immediate compromise exposure
but is not a safety proof.

Actions use full SHA plus reviewed version comment and effective platform
pinning/allowlist. Dependabot opens reviewed PRs and never auto-merges; updates
regenerate inventory/SBOM/licences and prove the SHA belongs to the expected
upstream release.

Two clean builds in distinct absolute directories produce identical normalized
trees and byte-identical tarballs where tooling permits. Later release uses a
separate hosted rebuild/verifier. Caches are revalidated accelerators and are
disabled for authoritative release construction.

### Completion gate

Every executable input is admitted/immutable; drift fails; clean builds have no
hidden network/global/workspace input; tarballs match allowlists and installed
consumers; SBOMs validate/reconcile; licences/notices are complete; and
subject-bound provenance/signature verification and recovery have negatives.

## Area 16 — Integrations and conformance

### Questions it must close

- Who owns every semantic/data/durable/operational concern across Facturacion,
  VeriFactu, Verification Engine, providers and AEAT?
- Which exact Engine package/API/profile versions interoperate and remain
  historically verifiable?
- How does Facturacion construct public edition/configuration, provide one UoW
  and publish only after atomic VeriFactu success?
- Which real fault controls qualify stores, retention, XML/XSD, signer/
  certificate and transport levels?
- How does the kit prevent an empty/not-applicable adapter from passing?
- Do clean consumers install only tarballs under every runtime/module system?
- How do upgrades/migrations resume, verify and refuse incompatible mixes?
- Which responsibilities/limitations remain with host/operator/provider/AEAT?

### Required documents

| Document | Mandatory content |
|---|---|
| `ecosystem-boundaries.md` | Ownership and data/control diagram for all repositories/providers/AEAT. |
| `verification-engine-contract.md` | Public imports/operations/results/evidence, forbidden tax leakage/internal access and failures. |
| `verification-engine-version-matrix.md` | Tarball/API/profile/Node/module support, upgrade/downgrade and evidence. |
| `evidence-profile-compatibility.md` | Profile schema/bytes/vectors, negotiation, privacy, history and claim separation. |
| `verification-engine-tarball-conformance.md` | Packed/published dual consumers, API reports, vectors, malformed evidence and rebuild proof. |
| `facturacion-host-contract.md` | Fiscal command/context/config, results/QR/evidence/state, authorization and no rule duplication. |
| `facturacion-publication-lifecycle.md` | Draft/issue/correct/cancel, commit point, invalid/unavailable/indeterminate handling and UX duty. |
| `host-atomicity-contract.md` | Real joint UoW and invoice+record+artifact+head+outbox crash/unknown-commit matrix. |
| `storage-adapter-conformance.md` | Durability levels, constraints, CAS/fencing/idempotency/crash/backup/migration. |
| `retention-and-restoration-conformance.md` | Policy/hold/archive/export/key/edition/backup/restore and historical access. |
| `xml-xsd-provider-conformance.md` | Backend, offline sources, hostile resources, isolation/cancel and oracle. |
| `signer-and-certificate-conformance.md` | XAdES, key handles, returned bytes, trust/revocation/authorization and faults. |
| `transport-conformance.md` | One observation, mTLS/endpoint/exact bytes, limits/cancel, faults and no hidden retry. |
| `adapter-kit.md` | Discovery, required/claimed capability, factories/lifecycle/fault hooks, evidence and statuses. |
| `clean-consumer-scenarios.md` | Installed library/CLI/kit, ESM/CJS/TS, editions, host fixture and forbidden private imports. |
| `migration-and-upgrade.md` | Product/Engine/profile/edition/storage/provider compatibility, resume/rollback and fencing. |
| `integration-limitations-and-responsibilities.md` | Guarantees, prerequisites, ownership, unsupported topologies and claim language. |

### Recommended decisions

The initial Engine baseline is `1.0.1`, but the dependency subject is its exact
verified npm tarball, not `../verification-engine`. Only declared exports and
the Lot 2 namespaced profile are allowed. Cross-repository CI may test candidates
but neither repository publishes/mutates the other or shares private stores.

Future-Facturacion boundary conformance uses a maintained synthetic host fixture
implementing the specified joint UoW/lifecycle. Hard process/backend faults prove
invoice-record atomicity and indeterminate handling. The future Facturacion
product will own invoices/users/UI and must not duplicate VeriFactu rules. Its
real implementation is not available and is not a VeriFactu release gate.

Adapter conformance cannot pass when no required claimed capability executes.
The scenario selects its required level; unsupported is honest nonconformance.
Destructive tests require disposable isolated namespaces and never target
production by default.

### Completion gate

All boundaries/versions are explicit; exact installed artifacts interoperate;
synthetic future-host atomic publication and provider/store levels have real fault plans;
empty adapters cannot pass; migrations preserve historical evidence; and public
limitations assign every remaining responsibility accurately.

## Required decisions for Lot 3

| Proposed ADR | Recommended decision | Rejected shortcut/risk |
|---|---|---|
| `ADR-0026` | Canonical claim-to-evidence graph with exact subjects/results. | Test filenames/coverage do not prove execution or traceability. |
| `ADR-0027` | Independent oracles plus real property/fuzz/code mutation and critical catalogues. | Repeated production builders and printed mutation counts recreate `REV-057/062`. |
| `ADR-0028` | Seeded deterministic tests, strict flake/infrastructure classes and no rerun-to-green. | Ambient time/random/network makes evidence irreproducible. |
| `ADR-0029` | Versioned runtime/reference/provider profiles with current admitted primary and compatible/informational matrices. | Floating latest destroys reproduction; stale literal parity misses security patches. |
| `ADR-0030` | One predeclared repository tree and canonical task DAG for local/CI. | Workflow-specific scripts and dumping grounds create drift/rebuild loops. |
| `ADR-0031` | GitHub parity by invariant: zero approvals/no CODEOWNERS, no main bypass, signed strict squash PR and branch deletion. | Copying impossible human controls creates deadlock/fiction. |
| `ADR-0032` | Separate untrusted PR, trusted main/schedule and privileged release trust domains. | Executing PR code/artifacts under `pull_request_target`/privileged follow-up is unsafe. |
| `ADR-0033` | Stable leaf checks plus fail-closed closure/evidence job bound to producer/SHA. | Aggregate-only can be removed; leaf-only cannot prove matrix/report closure. |
| `ADR-0034` | Exact dependency/Action/tool admission, SHA Actions, scripts/optional disabled and update cooling. | Lock/scanner alone cannot prove origin or safe execution. |
| `ADR-0035` | Clean network-bounded isolated rebuilds and closed tarball allowlists. | Two packs from one dirty build repeat contamination. |
| `ADR-0036` | CycloneDX 1.7 and SPDX 3.0.1 from one graph, validated/reconciled. | Two nominal JSON files may both be incomplete. |
| `ADR-0037` | Honest SLSA Build L2-compatible provenance plus GitHub/npm attestations and consumer verification. | Attestation without verification or an unsupported L3 claim misleads. |
| `ADR-0038` | Integration qualification only from exact installed artifacts, real capabilities and fault injection. | Workspace imports, mocks and empty adapters do not model consumers. |

Approval of this plan approves the inventory and decision direction, not future
dependency/Action SHAs, provider versions, npm trusted-publisher state or GitHub
mutations before admission/read-back evidence.

## Historical-finding closure matrix

| Finding | Mandatory Lot 3 treatment |
|---|---|
| `REV-056` | All-production-module coverage, denominators and module-added negative. |
| `REV-057` | Real code mutation, critical catalogue and killed/equivalent/error distinctions. |
| `REV-058` | Every `PERF-*` maps to its true workload, measurement and enforcing job. |
| `REV-059` | Semantic fuzz targets, minimum work, seed/shrink/watchdog and unexpected-error failure. |
| `REV-060` | Real streams/resources and separate-process durable restart at crash boundaries. |
| `REV-061` | Capability-required adapter kit; empty/no-adapter never passes. |
| `REV-062` | Independent format/protocol/evidence oracles and installed process E2E. |
| `REV-063` | Requirement→implementation→executed test→job→report→SHA cardinality. |
| `REV-064` | AST/dependency plus behavioral security negatives, never word presence. |
| `REV-065` | Extract/inspect all tarball paths/types/modes/sizes/digests against allowlist. |
| `REV-066` | Temporary consumers install tarballs with workspace inaccessible. |
| `REV-067` | Isolated builds/runs cover all three public packages and raw/normalized comparisons. |
| `REV-068` | Real CycloneDX/SPDX validation and complete reconciliation. |
| `REV-069` | Transitive licences and distributed notices for dependencies/Actions/tools/data. |
| `REV-070` | Generated inventory reconciles manifests, lock, install and tarballs. |
| `REV-071` | Each tool really executes with exact version/path/digest; npm is verified. |
| `REV-072` | Lot 2 tree/exports/import rules become repository/build conformance. |
| `REV-073` | Trailer-aware DCO/co-author/bot/range and separate cryptographic signature checks. |
| `REV-074` | Claim/status docs reconcile with real implementation/evidence. |
| `REV-075` | Effective SHA pin enforcement plus parsed workflow inventory/upstream proof. |
| `REV-076` | Paginated schema-valid GitHub audit with absent/inaccessible/unknown and producer binding. |
| `REV-077` | Zero approvals, no CODEOWNERS/last-push/unattributed approval; no fictional reviewer. |
| `REV-078` | Tag/environment bypass/recovery stays a visible privileged Lot 4 decision. |
| `REV-079` | Canonical task/check registry, exact-SHA artifacts, closure and durable evidence handoff. |
| `REV-080` | Scorecard JSON/SARIF is one signal; green workflow never closes findings automatically. |
| `REV-081` | Every repository/org/private surface has verified/inaccessible/unknown/N/A state. |
| `REV-082` | Release workflows cannot publish until Lot 4 prerequisites are verified. |
| `REV-083` | Real retention/archive/restore conformance in isolated destructive scenarios. |
| `REV-084` | Packed consumers obtain validated editions/assets/public surfaces without casts/private paths. |

Earlier findings remain linked wherever they define a test, security boundary,
performance workload, API/package behavior or integration fault.

## Planned workflow architecture

| Workflow | Trust/event | Responsibility |
|---|---|---|
| `ci.yml` | untrusted-safe PR; trusted push/main/manual | Policy/docs/generated, tests, OS/runtime consumers, reproducibility and closure. |
| `conformance.yml` | safe PR/push/schedule | Regulatory vectors, formats, states/crashes, adapters and cross-package contracts. |
| `security.yml` | PR/push/schedule | Dependency review, CodeQL incl. Actions, secrets, OSV, npm audit/signatures/licences, extended fuzz. |
| `performance.yml` | PR smoke; trusted schedule/manual | Correctness-guarded smoke and governed calibrated budgets/stress/soak. |
| `github-audit.yml` | trusted schedule/manual/policy change | Read-only effective-state/alerts; never privileged PR code. |
| `scorecard.yml` | schedule/policy change | Pinned JSON/SARIF and honest findings, not a perfection claim. |
| `release-candidate.yml` | guarded, non-publishing until Lot 4 | Candidate construction/evidence rehearsal. |
| `release.yml` | Lot 4 only | Future protected OIDC publication/attestation. |
| `release-verification.yml` | independent trusted trigger | Future registry/GitHub/artifact verification. |

All workflows use read-only default permissions, exact job elevation, explicit
shells/timeouts/concurrency and full-SHA Actions. Release jobs never consume
PR-writable caches. Workflow names/files are stable security contracts for
rulesets, npm OIDC and evidence.

## Cross-area deliverables

Lot 3 must produce or precisely specify:

- claim/evidence/oracle and requirement-test-job-report registries;
- test/fixture/critical-mutant/fuzz-target/coverage manifests;
- fault/crash/concurrency/performance/compatibility matrices;
- complete repository ownership and module/import graphs;
- toolchain/provider and canonical task-DAG manifests;
- workflow/action/permission/trigger/required-context registries;
- desired GitHub schema, paginated API fixtures and normalized audit reports;
- immutable historical-archive manifest and separately classified legacy-link
  baseline;
- dependency admission/inventory/licence/external-tool manifests;
- package allowlists and clean-consumer matrix;
- canonical component graph and reconciled CycloneDX/SPDX outputs;
- build evidence/reproducibility/provenance/attestation verification schemas;
- Engine/profile/adapter compatibility matrices and versioned future-Facturacion
  host-contract/synthetic-fixture matrix;
- individual `REV-056`–`REV-084` dispositions and regression obligations.

Specifying schemas does not claim their generators, reports, workflows or
evidence already exist.

## Execution order

1. Revalidate Lots 1/2, source freshness and `REV-056`–`REV-084`; freeze research.
2. Approve `ADR-0026`–`ADR-0028`; define claims/oracles/data/results.
3. Complete all quality, meta-testing, fault, security, performance and
   compatibility specifications.
4. Approve `ADR-0029`–`ADR-0033`; freeze toolchains, tree/task DAG, GitHub and
   workflow/check trust topology.
5. Complete local flow, SSH/DCO, settings/rulesets/audit, untrusted events,
   caches, Dependabot, policy and bootstrap specifications.
6. Approve `ADR-0034`–`ADR-0037`; complete supply-chain/build/package/SBOM/
   provenance specifications.
7. Approve `ADR-0038`; complete all ecosystem/adapter conformance contracts.
8. Reconcile tests with every earlier requirement/state/threat/budget/artifact/
   protocol/public contract.
9. Prove the planned CI cannot skip, gain privilege, publish or report green on
   absent work.
10. Complete historical dispositions and contradiction review against the
    deleted implementation and exact Verification Engine/source/platform state.
11. Run documentation gates on one commit and create approval reports only once
    the protected path exists.

## Lot exit criteria

Lot 3 is formally approvable only when all 77 planned documents are substantive
and consistent; `ADR-0026`–`ADR-0038` are accepted; all claims have positive/
negative exact-SHA evidence plans; coverage/mutation/property/fuzz/fault/crash/
security/performance/compatibility cannot pass empty; the tree/toolchain/task
DAG is fixed; the single-maintainer signed+DCO strict-squash flow is enforceable;
untrusted workflows cannot gain privilege; all required contexts have producer/
trigger/report closure; executable inputs and packages are admitted/reproducible;
dual SBOM/licence/provenance evidence reconciles; installed Engine/adapter and
synthetic future-Facturacion host contracts have real fault plans; every
`REV-056`–`REV-084` has an
individual disposition; and documentation CI passes on the exact candidate SHA.

This planning completion is not implementation, green CI, GitHub mutation,
publication, SLSA attainment, external validation or product compliance.

## Current elaboration state

As of 2026-09-12, the project owner has reviewed and approved the intended
normative content of this plan and all 77 substantive documents: 19 quality/
testing, 22 repository/CI, 19 supply-chain/build and 17 integration/conformance
specifications. The owner has also approved the thirteen decision directions
recorded in `ADR-0026` through `ADR-0038`, and each area index reflects its
complete inventory and exit gate. This approval establishes authoritative Lot 4
input; it does not fabricate executable evidence.

This completes the normative planning content, not implementation or formal area
approval. The source tree, schemas/registries, locked toolchain, tests/oracles,
workflows/checks, GitHub protections, package builds, SBOMs/attestations, adapters,
external observations and exact-commit evidence do not yet exist. Documents
therefore remain `draft` and ADRs `proposed` until the one-time bootstrap creates
the protected SSH+DCO/squash path and their evidence satisfies `GOV-003`,
`GOV-011` and `GOV-012`.

## Sources

1. Node.js, “[Node.js releases](https://nodejs.org/en/about/previous-releases),” and official latest indexes for [24.x](https://nodejs.org/download/release/latest-v24.x/), [22.x](https://nodejs.org/download/release/latest-v22.x/) and [Current](https://nodejs.org/dist/latest/), consulted 2026-09-12.
2. GitHub, “[Protecting against security threats](https://docs.github.com/en/code-security/tutorials/secure-your-organization/protect-against-threats),” consulted 2026-09-12.
3. GitHub, “[Available rules for rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets),” consulted 2026-09-12.
4. GitHub, “[Securely using `pull_request_target`](https://docs.github.com/en/actions/reference/security/securely-using-pull_request_target),” consulted 2026-09-12.
5. GitHub, “[About commit signature verification](https://docs.github.com/en/authentication/managing-commit-signature-verification/about-commit-signature-verification),” consulted 2026-09-12.
6. Developer Certificate of Origin, “[DCO 1.1](https://developercertificate.org/),” and [DCO App](https://github.com/apps/dco), consulted 2026-09-12.
7. npm, “[Trusted publishing](https://docs.npmjs.com/trusted-publishers/),” consulted 2026-09-12.
8. SLSA, “[Specification 1.2](https://slsa.dev/spec/v1.2/)” and “[Build track](https://slsa.dev/spec/v1.2/build-track-basics),” consulted 2026-09-12.
9. GitHub, “[Artifact attestations](https://docs.github.com/en/actions/how-tos/secure-your-work/use-artifact-attestations/use-artifact-attestations),” consulted 2026-09-12.
10. SPDX, “[Specification 3.0.1 serializations](https://spdx.github.io/spdx-spec/v3.0.1/serializations/),” consulted 2026-09-12.
11. CycloneDX, “[JSON schema 1.7](https://cyclonedx.org/docs/1.7/json/)” and “[SBOM lifecycle resources](https://cyclonedx.org/guides/sbom/lifecycle_phases/),” consulted 2026-09-12.
12. Reproducible Builds, “[Documentation](https://reproducible-builds.org/docs/),” consulted 2026-09-12.
13. OpenSSF, “[Scorecard](https://github.com/ossf/scorecard),” consulted 2026-09-12.
14. TypeScript, “[TypeScript 5.9](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-9.html),” consulted 2026-09-12.
15. Stryker Mutator, “[StrykerJS](https://github.com/stryker-mutator/stryker-js),” candidate tooling, consulted 2026-09-12.
16. Noeos, local `verification-engine` and read-only GitHub effective state, commit `7df31cfb3ccc538c0ceab468e944172ed2480c95`, inspected 2026-09-12.
