---
id: PLAN-L1
title: Lot 1 foundations documentation plan
status: approved
authority: normative
owner: project-owner
created: 2026-09-12
last-reviewed: 2026-09-13
decisions: [ADR-0001, ADR-0002, ADR-0003, ADR-0005, ADR-0006, ADR-0007, ADR-0008, ADR-0009, ADR-0010, ADR-0011, ADR-0012, ADR-0013, ADR-0014]
historical-inputs: [REV-001, REV-084]
---

# Lot 1 foundations documentation plan

## Purpose

This plan controls the complete elaboration of product, regulatory,
requirements, domain, security/privacy and performance/reliability foundations.
It defines what every document must decide and prove before architecture or
product implementation can be approved. It is not an MVP plan and does not
inherit any old completion claim.

The six areas are one coupled foundation:

```text
official authority + stakeholder need
                  |
                  v
             product scope
                  |
                  v
        atomic requirements <---- threats and quality model
                  |
                  v
       fiscal domain and invariants
                  |
                  v
 architecture constraints + security controls + measurable budgets
```

No area closes in isolation when a contradiction remains in another. Security,
privacy and performance constrain the domain before architecture; they are
revalidated when concrete contracts and deployment boundaries are designed.

## Fixed product assumptions

These assumptions follow the approved governance and ecosystem architecture.
Changing one requires an ADR:

- VeriFactu is a complete reusable regulatory component, not the commercial
  invoicing application and not a hosted tax service.
- It supports both legally valid operating modes: VERI*FACTU and non-verifiable
  SIF (called NO VERI*FACTU internally only when ambiguity is impossible).
- It owns RRSIF semantics, regulatory editions, records, events, official
  representations, AEAT exchange and conformance evidence.
- Facturacion is a future product. When built, it will own invoices as commercial
  documents, users, organizations, authorization, presentation, payments and
  customer workflows. Current VeriFactu planning proves that boundary with a
  synthetic host and does not require a real integration for `1.0.0`.
- Verification Engine remains tax-neutral and is consumed only through its
  versioned public API and evidence profile.
- Applicability is evaluated explicitly. Unsupported foral regimes, SII or
  excluded operations are not silently treated as compliant common-territory
  RRSIF cases.
- Offline capability never means eventual loss of chronology, identity,
  durability or legal evidence.
- No telemetry, network retrieval, schema refresh or mode change happens by
  hidden default.

## Current regulatory baseline

The planning baseline on 2026-09-12 comprises:

1. Law 58/2003 (General Tax Law), especially articles 29.2.j and 201 bis.
2. Royal Decree 1007/2023 and its RRSIF, including changes introduced by Royal
   Decree 254/2025 and Royal Decree-law 15/2025.
3. Order HAC/1177/2024 and its annex.
4. Royal Decree 1619/2012 on invoicing obligations, including its current
   amendments.
5. The versioned AEAT technical corpus: record designs, XSD, WSDL, validation
   and error catalogue, hash, signature, QR, services and examples.
6. GDPR, Organic Law 3/2018 and applicable tax retention/confidentiality rules.

The consolidated RRSIF currently sets adaptation dates before 1 January 2027
for article 3.1.a taxpayers and before 1 July 2027 for the other article 3.1
taxpayers.^1 These dates are volatile release inputs, not constants embedded in
business logic. Producer/commercializer obligations and maintained products
must be evaluated separately from taxpayer-use deadlines.

AEAT states that VERI*FACTU and non-verifiable SIF are two valid modes. The
former sends billing records immediately; the latter adds electronic signatures
and event records.^2 The product must model the actual asymmetric obligations,
not a boolean feature switch.

## Research rules for this lot

- BOE original publications and amendments authorize legal requirements;
  consolidated texts support reading but are not treated as original legal
  publication.
- AEAT normative/technical artifacts are pinned by retrieved bytes, source URI,
  retrieval time, media type, length and SHA-256/SHA-512.
- FAQ statements are interpretive inputs with publication/update date and exact
  scope; they cannot override higher authority.
- Standards and official platform documentation define adopted technical
  practice only through an ADR or mapped requirement.
- GitHub repositories, issues, Stack Overflow, Delphi/OCA discussions and Reddit
  reveal implementation hazards and test ideas. Their claims never establish
  legality, certification, compatibility or correctness.
- A source that changes opens impact analysis; it never mutates an approved
  regulatory edition in place.

Community evidence already identifies useful adversarial cases: remote schema
fetches causing rate limits, TLS failures returning HTML rather than SOAP,
certificate/endpoint uncertainty, XSD-valid combinations rejected by business
validation, and disagreement about whether rejected records affect chaining.
Each becomes a test question resolved against official sources, not a copied
answer.^3

## External implementation comparison

Public implementations are used to challenge our design, never as conformance
oracles. Their documentation exposes useful trade-offs:

| Project or discussion | Observable approach | Lesson carried into this plan |
| --- | --- | --- |
| Local Noeos Verification Engine 1.0.1 | Domain-neutral, deterministic offline engine; zero runtime dependencies; conformance vectors, clean consumers, reproducibility and evidence gates. | Reuse only its public evidence protocol. Match its assurance discipline without leaking tax semantics into it. |
| [`eloi24/verifactu-sdk`](https://github.com/eloi24/verifactu-sdk) | TypeScript alpha advertising XSD-shaped types, hash vectors, SOAP/mTLS, QR and 23 business rules. | Typed XSD coverage and a counted rule list are useful, but neither demonstrates complete AEAT semantic coverage or stable readiness. |
| [`inoguerols/verifactu`](https://github.com/inoguerols/verifactu) | Reports one end-to-end AEAT preproduction acceptance and supports XML, hashes, QR and XAdES. | Preserve real external test evidence, while refusing to generalize one accepted fixture into all records, modes, errors or recovery paths. |
| [`OCA/l10n-spain` certificate/endpoint discussion](https://github.com/OCA/l10n-spain/discussions/4597) | Practitioners discuss certificate types and distinct AEAT endpoints. | Treat endpoint, environment, delegated identity and certificate authorization as explicit edition/configuration dimensions. |
| [`AichaDigital/lara-verifactu`](https://github.com/aichadigital/lara-verifactu) | Bundles schemas for offline validation and forces endpoints by environment/type. | Evaluate offline digest-pinned schemas and closed endpoints, while independently verifying licence, freshness and completeness. |

Repository claims such as “fully compliant”, “certified” or “end-to-end” are not
accepted without scope and evidence. This directly addresses the earlier failure
pattern in which a green job or a small catalogue was mistaken for complete
coverage.

<a id="area-01-product"></a>

## Area 01 — Product

### Questions it must close

- Which actors consume, operate, inspect, audit, maintain and regulate the
  component, and what authority does each have?
- What complete capability set is mandatory for each mode, edition and public
  surface?
- What belongs to the host, VeriFactu, Verification Engine, a certificate
  provider and AEAT?
- What can the product truthfully guarantee, and what requires host, operator,
  AEAT or legal-review evidence?
- What lifecycle, compatibility, migration and support commitments bind stable
  releases?

### Required documents

| Document | Mandatory content |
| --- | --- |
| `vision-and-success.md` | Mission, complete-product definition, success measures and prohibited partial-completion claims. |
| `actors-and-stakeholders.md` | Taxpayer, producer, commercializer, host, operator, representative, recipient, auditor, AEAT and maintainer responsibilities/RACI without inventing extra people. |
| `complete-scope.md` | Full capability inventory by mode, edition, surface and lifecycle, including administration, evidence and recovery. |
| `use-cases.md` | Normal, negative, recovery, inspection, migration, export, discontinuation and regulatory-change journeys with pre/postconditions. |
| `compliance-modes.md` | Common and asymmetric mode capabilities, adoption/renunciation and forbidden transitions. |
| `capability-map.md` | Capability → owner → requirements → contracts → verification → evidence. |
| `boundaries-and-exclusions.md` | Explicit repository/service/jurisdiction boundaries and fail-closed behavior for unsupported scope. |
| `claims-and-guarantees.md` | Allowed vocabulary, claim evidence, disclaimers, certification language and residual limitations. |
| `support-and-lifecycle.md` | Editions, semver relationship, compatibility, migration, deprecation, EOL, vulnerability and legal-change support. |

### Completion gate

Every capability has an owner and at least one success/failure use case. No
mandatory mode, actor, operational path or release obligation is unnamed. The
product does not claim that installing a library makes a host compliant.

<a id="area-02-regulatory-foundations"></a>

## Area 02 — Regulatory foundations

### Questions it must close

- Who and which operations fall within RRSIF, by tax regime, territory, SII
  status, invoicing obligation, producer role and effective date?
- Which exact publication and technical bytes authorize every requirement?
- How are contradictions, ambiguous cases and AEAT drift handled?
- What constitutes one immutable regulatory edition and how can old evidence be
  reproduced after sources change?
- Which declaration, retention and inspection materials must accompany a
  released product version?

### Required documents

| Document | Mandatory content |
| --- | --- |
| `source-hierarchy.md` | Legal/technical precedence, applicability and conflict algorithm specialized from `GOV-002`. |
| `legal-framework.md` | Article-level baseline, amendments, dates and obligation owners; no unactionable summaries. |
| `applicability-and-exclusions.md` | Decision table for taxpayer, producer, territory, SII, operation, delegation and exceptional authorization. |
| `official-source-register.md` | Stable IDs, version/date, URI, provenance, licence, digest, dependencies and review trigger. |
| `regulatory-editions.md` | Immutable edition manifest, activation rules, coexistence, migration and historical verification. |
| `interpretation-method.md` | Fact/inference separation, ambiguity, external legal review and fail-closed outcomes. |
| `ambiguities-and-open-questions.md` | Bounded questions, affected requirements, owner, evidence needed and blocking effect; no hidden TBDs. |
| `regulatory-monitoring.md` | Sources, cadence, authenticated acquisition, drift classification, alerting and response SLA. |
| `retention-and-evidence.md` | Tax/privacy reconciliation, exact retained objects, access, export, deletion restrictions and restoration proof. |
| `responsible-declaration.md` | Required contents, product/version scope, evidence dossier, signature/publication and invalidation triggers. |
| `related-regimes.md` | RRSIF versus invoice law, e-invoicing B2B, SII, TicketBAI/foral systems, GDPR and host responsibilities. |
| `source-import-and-snapshots.md` | Bounded offline acquisition, media validation, decompression limits, manifest and reproducible generation. |

### Completion gate

Each regulatory claim maps to article/technical artifact and edition. The
applicability table has no default-compliant branch. Every source byte that can
change emitted, signed or accepted behavior is reproducibly pinned.

<a id="area-03-requirements"></a>

## Area 03 — Requirements

### Requirement model

Requirements follow ISO/IEC/IEEE 29148 process concepts and use versioned BCP 14
terms only for testable obligation strength.^4 ISO/IEC 25010:2023 supplies a
completeness checklist for product quality, not a claim of certification.^5

Every atomic requirement contains: immutable ID; one subject and action;
applicability predicate; source/rationale; priority based on authority and risk,
not delivery convenience; positive and forbidden outcomes; boundaries; failure
semantics; verification oracle; downstream owner; evidence; lifecycle and
change triggers.

### Required documents

| Document | Mandatory content |
| --- | --- |
| `product-requirements.md` | Outcomes and full capabilities independent of implementation. |
| `regulatory-requirements.md` | Atomic sourced obligations and applicability predicates. |
| `functional-requirements.md` | Records, events, modes, validation, chain, signature, QR, exchange, export and verification behavior. |
| `non-functional-requirements.md` | Quality-model coverage: functional suitability, performance efficiency, compatibility, interaction capability, reliability, security, maintainability, flexibility and safety. |
| `security-requirements.md` | Threat-derived and standard-mapped requirements with product-specific verification. |
| `performance-requirements.md` | Workload-qualified latency, throughput, memory, resource, cancellation and regression limits. |
| `operational-requirements.md` | Configuration, diagnostics, observation, backup/restore, reconciliation, support, incident and evidence duties. |
| `negative-and-abuse-requirements.md` | Malformed, hostile, ambiguous, stale, replayed, cross-context, oversized and partial-failure behavior. |
| `acceptance-criteria.md` | Package/release gates and proof required for each claim. |
| `traceability-model.md` | Canonical record schema and generated bidirectional matrices. |

### Quality gate

CI will reject compound, unverifiable, orphaned, source-less regulatory or
security requirements; ambiguous adjectives without a measure; implementation
choices disguised as needs; duplicate truth; and a `satisfied` requirement
without applicable negative evidence.

<a id="area-04-fiscal-domain"></a>

## Area 04 — Fiscal domain

### Required model

The model distinguishes commercial invoice, billing record, official wire
representation, chain evidence, event record, submission attempt, AEAT response
and compliance evidence. Treating these as one object caused several previous
P0 failures.

Required aggregate candidates are `RegulatoryEdition`, `ProducerRelease`,
`TaxpayerContext`, `Installation`, `ComplianceModeTenure`, `BillingSequence`,
`BillingRecord`, `EventSequence`, `EventRecord`, `Submission`, `Exchange` and
`ComplianceEvidence`. Their final boundaries require ADRs and concurrency proof.

### Required documents

| Document | Mandatory content |
| --- | --- |
| `ubiquitous-language.md` | Legal, AEAT, product and host terms; forbidden aliases and translation rules. |
| `domain-model.md` | Aggregates, value objects, commands, events, policies, ownership and consistency boundaries. |
| `identities-and-context.md` | Producer, release, taxpayer, installation, system, generator, sequence, invoice and record identity. |
| `invoice-record-boundary.md` | Simultaneity/atomicity contract between host invoice action, record, sequence and durable outbox. |
| `alta-and-anulacion.md` | Complete semantic fields, conditional groups, references and validation without reducing the XSD to a DTO subset. |
| `events.md` | Complete non-verifiable event catalogue, triggers, chronology, summaries, signatures and retention. |
| `compliance-mode-lifecycle.md` | Per-taxpayer mode tenure, adoption, renunciation, effective dates and mixed-mode prohibitions. |
| `sequences-and-chaining.md` | Genesis, predecessor selection, ordering, clock semantics, concurrency and rejected/indeterminate outcomes. |
| `states-corrections-and-substitution.md` | Generated, durable, queued, submitted, accepted-with-errors, rejected, indeterminate, reconciled, corrected and annulled semantics. |
| `catalogs-and-rules.md` | Edition-owned enumerations and complete AEAT/business rule catalogue with generated coverage. |
| `diagnostics.md` | Stable codes, severity, retryability, responsibility, redaction and mapping of AEAT errors. |
| `domain-invariants.md` | Machine-readable invariant catalogue and proof obligations across aggregates. |

### Non-negotiable invariants

- Context, taxpayer, installation, edition and mode tenure never cross silently.
- Official bytes are derived from validated immutable semantic input and are
  tied to exactly the evidence that is committed.
- A chain advances atomically once; CAS failure, duplicate identity or uncertain
  durability cannot be translated into success.
- Correction and annulment preserve history; they do not overwrite a prior
  fiscal fact.
- Remote acceptance does not define local generation order, and a missing
  response never proves rejection or delivery.

<a id="area-10-security-and-privacy"></a>

## Area 10 — Security and privacy

### Assurance baseline

Security uses NIST SSDF for lifecycle coverage, OWASP SAMM for practice
coverage, OWASP ASVS 5.0.0 as an applicable control catalogue, STRIDE for threat
prompts and LINDDUN-style privacy prompts. No framework name is a compliance
claim without a versioned mapping and evidence.^6

The threat model covers malicious input, dishonest host/operator, compromised
dependency or workflow, certificate misuse, schema poisoning, SSRF/XXE,
signature wrapping, replay, cross-taxpayer access, chain tampering, clock
manipulation, resource exhaustion, diagnostic exfiltration, rollback, stale
configuration and AEAT/network ambiguity. Accidental races and partial failures
are treated as threats to integrity even without an attacker.

### Required documents

| Document | Mandatory content |
| --- | --- |
| `security-objectives.md` | Assets, confidentiality/integrity/availability/authenticity/non-repudiation/privacy objectives and claim limits. |
| `threat-model.md` | Versioned system/data-flow models, threats, entry points, trust boundaries and review triggers. |
| `assets-actors-and-trust-boundaries.md` | Data/control assets, adversary capabilities, privileged roles and boundary crossings. |
| `abuse-cases.md` | Misuse stories with preconditions, impact, prevention, detection, recovery and tests. |
| `control-catalog.md` | `CTL-*` preventive/detective/corrective controls, owners, threats, verification and residual risk. |
| `xml-signature-and-parser-security.md` | Offline trusted schemas, DTD/entity/network prohibition, size/depth/count limits, namespace and signature-wrapping defenses. |
| `network-and-endpoint-security.md` | Immutable allowlists, environment separation, TLS/mTLS, redirects, proxy/DNS behavior, timeouts and response limits. |
| `keys-certificates-and-secrets.md` | Provider boundary, non-exportability, authorization, rotation, expiry/revocation policy, zeroization and redaction. |
| `resource-exhaustion-and-limits.md` | Per-boundary byte/count/depth/time/concurrency budgets and early rejection. |
| `tenant-and-context-isolation.md` | Taxpayer/installation/sequence isolation in types, storage, concurrency, cache, logs and tests. |
| `data-classification-and-privacy.md` | Data inventory, purposes, controller/processor split, minimization, retention, rights and transfer constraints. |
| `logging-redaction-and-telemetry.md` | Safe structured diagnostics, forbidden fields, pseudonymous correlation and telemetry-off default. |
| `vulnerability-management.md` | Private intake, triage, CVSS plus fiscal impact, embargo, correction, disclosure and support windows. |
| `security-verification-plan.md` | SAST, dependency/code provenance, properties, fuzz, mutation, adversarial integration, manual review and release evidence. |
| `residual-risk.md` | Explicit risks, owner, treatment, acceptance authority, expiry and release effect. |

OWASP recommends disabling DTD/external entities and using trusted local schemas;
the plan adopts both and adds digest pinning because official schema drift affects
fiscal behavior.^7 GDPR data minimization and protection by design apply to the
host/product processing boundary even though this repository is a library.^8

<a id="area-12-performance-and-reliability"></a>

## Area 12 — Performance and reliability

### Measurement principles

Correctness and security gates run before and after measurement. Performance can
never be improved by removing validation, evidence, durability, cancellation or
limits. Each result names exact code, package, fixture digest, toolchain,
hardware, OS, power state, configuration, sample count and uncertainty.

Latency is a distribution. Reports include p50, p95, p99, p99.9 where sample
size permits, maximum, error latency and throughput under named load; averages
alone are forbidden. Open-loop load or coordinated-omission correction is used
where request scheduling can hide stalls.^9

### Required documents

| Document | Mandatory content |
| --- | --- |
| `workload-model.md` | Typical, boundary, maximum, hostile and recovery workloads by operation and mode. |
| `performance-budgets.md` | Exact absolute and relative budgets, safety precedence and exception process. |
| `benchmark-methodology.md` | Harness, warm-up, samples, randomization, statistics, correctness sentinels and anti-gaming. |
| `official-benchmark-environment.md` | Immutable runner/toolchain/hardware/OS profile, calibration and contamination checks. |
| `latency-throughput-and-percentiles.md` | Measurement boundaries, clocks, percentiles, open/closed loop and failure latency. |
| `memory-and-resource-limits.md` | Heap/RSS/external memory, allocations, descriptors, temp/disk/network, XML/signature/provider limits. |
| `streaming-and-backpressure.md` | Bounded buffering, high-water marks, demand propagation, cancellation and cleanup. |
| `concurrency-and-capacity.md` | Contention domains, safe parallelism, queue limits, overload and capacity model. |
| `stress-soak-and-recovery.md` | Long run, burst, restart, leak, disk-full, clock, network/provider failure and reconciliation scenarios. |
| `baselines-and-regression-policy.md` | Statistical/absolute blockers, baseline provenance, intentional change and bisect procedure. |
| `profiling.md` | CPU, allocation, heap, GC, I/O, flame graph and event-loop investigation playbooks. |
| `reliability-indicators-and-objectives.md` | Component SLIs and host-facing objective templates without inventing a hosted-service SLA. |
| `performance-evidence.md` | Evidence schema, signing/retention, comparison and release dossier integration. |

Node's own backpressure guidance demonstrates that ignoring writable pressure can
turn bounded streaming into dramatic memory growth; therefore throughput and
memory are always measured together.^10 Google SRE guidance informs percentile,
error, saturation and user-visible SLI definitions, but the library does not
claim an availability percentage for infrastructure it does not operate.^11

Initial historical budgets `P-01`–`P-12` are hypotheses, not inherited gates.
Each must be reproduced with the new complete workload and either adopted with
measured feasibility or superseded through evidence. `REV-058` cannot close
until CI is proved to execute and enforce every adopted budget.

## Required lot decisions

The following proposed decisions must be recorded before their dependent
specifications can become `approved`:

| Proposed ADR | Recommended decision | Main alternative rejected |
| --- | --- | --- |
| `ADR-0007` | Ship an independently consumable library, CLI and adapter conformance kit; no Noeos-hosted tax service in this repository. | A mandatory service would expand privacy, availability and operational ownership beyond the established ecosystem boundary. |
| `ADR-0008` | Evaluate applicability explicitly and fail closed for unsupported/indeterminate regimes; target common-territory RRSIF while documenting boundaries to SII and foral systems. | Pretending one Spanish boolean covers all taxpayers and operations. |
| `ADR-0009` | Package immutable regulatory editions whose manifests pin every behavior-affecting source and generated contract. | A mutable “latest rules” singleton destroys historical reproducibility. |
| `ADR-0010` | Store atomic requirements as canonical validated records and generate prose/matrices from them. | Hand-maintained duplicate requirement tables inevitably drift. |
| `ADR-0011` | Separate invoice, record, official bytes, evidence, submission and response identities, with taxpayer/installation/edition context mandatory. | One broad DTO recreates the prior semantic and integrity failures. |
| `ADR-0012` | Apply threat-model-driven controls plus versioned NIST SSDF, OWASP SAMM/ASVS mappings, with no blanket framework claim. | A scanner checklist cannot prove product-specific trust boundaries. |
| `ADR-0013` | Adopt exact performance budgets only after complete deterministic fixtures and calibrated benchmark evidence; until then safety/resource ceilings are requirements and old values remain hypotheses. | Reusing attractive old numbers would repeat `REV-058` and reward incomplete work. |
| `ADR-0014` | Require explicit per-taxpayer mode tenure; provide no permissive implicit default and model adoption/renunciation as dated domain transitions. | A configuration boolean cannot express the normative lifecycle. |

The project owner approved these decisions on 2026-09-12. Their records remain
`proposed` until accepted through the protected repository path; explicit design
approval is recorded without fabricating process evidence that does not yet
exist.

## Cross-area historical coverage

| Findings | Required current treatment |
| --- | --- |
| `REV-001`–`REV-006` | Rebuild full model/rule/source/edition coverage; never infer completeness from a small catalogue. |
| `REV-007`–`REV-014` | Establish product and security requirements for official XML, XSD, canonicalization, signature and certificate verification before format design. |
| `REV-015`–`REV-021` | Domain identities and invariants must bind semantic input, bytes, evidence, head and chronology. |
| `REV-022`–`REV-027` | Specify complete event/mode/export/API failure behavior and runtime boundaries. |
| `REV-028`–`REV-036` | Require atomic host integration, CAS, durable attempt state, leases, idempotency and honest failure. |
| `REV-037`–`REV-046` | Source complete AEAT/QR protocol requirements and hostile network/response behavior. |
| `REV-047`–`REV-055` | Define CLI/API quality, streaming, serialization, filesystem and diagnostic requirements. |
| `REV-056`–`REV-064` | Define truthful test, performance and security proof obligations with independent oracles. |
| `REV-065`–`REV-072` | Carry package, dependency, toolchain, reproducibility and modularity constraints into product/NFR/security requirements. |
| `REV-073`–`REV-081` | Use governance controls already adopted; do not count a green platform badge as product evidence. |
| `REV-082`–`REV-084` | Require real release blocking, retention/restoration proof and public edition usability. |

The detailed disposition ledger will contain one machine-readable record per
finding; ranges in this plan only show coverage ownership.

## Lot execution sequence

1. Pin the official source register and snapshot manifest.
2. Approve product boundaries, modes, claim vocabulary and actor ownership.
3. Complete applicability and article/technical-source mapping.
4. Build the atomic requirement registry and quality-model coverage report.
5. Approve fiscal vocabulary, aggregate boundaries, state machines and
   invariants.
6. Complete data-flow/threat/privacy models and control catalogue.
7. Define workloads, budgets, measurement/reliability contracts and historical
   budget dispositions.
8. Generate cross-area matrices and run all negative documentation fixtures.
9. Conduct contradiction review against governance, the three Noeos master
   documents, Verification Engine public contracts and all 84 findings.
10. Record one lot approval report for an exact commit and evidence set.

## Lot exit criteria

The lot is approvable only when all planned documents exist as substantive
content; every material choice is accepted or explicitly blocked; every
regulatory requirement has an applicability predicate and source; every threat
has treatment; every quality characteristic has measures; every domain state
and forbidden transition is testable; every `REV-*` has an individual current
disposition; generated matrices are fresh; negative fixtures pass; and no claim
confuses plan, implementation, AEAT acceptance, responsible declaration or
independent certification.

## Current elaboration state

As of 2026-09-12, all 71 planned normative documents exist as substantive
drafts: 9 product, 12 regulatory, 10 requirements, 12 domain, 15 security/privacy
and 13 performance/reliability documents, in addition to their six area indexes.
The approved design choices are recorded in `ADR-0007` through `ADR-0014` and
their traceability is declared in this plan's metadata.

The project owner completed substantive review and approved the content of the
71 documents on 2026-09-12 as the intended complete-product foundation for Lot
2. This records a real design decision; it does not fabricate the independent
exact-commit gates required for formal status promotion.

This is completion of the **planning content**, not approval of the lot and not
evidence of implementation. Promotion from `draft`/`proposed` requires the
remaining execution evidence named above: imported digest-pinned official source
bytes, canonical machine registries and generated matrices, negative
documentation fixtures, contradiction review, the protected repository/CI path
and one approval report bound to an exact commit. Those gates are deliberately
left unsatisfied rather than represented as green before their toolchain exists.

## Sources

1. Spain, “[Royal Decree 1007/2023, consolidated text](https://www.boe.es/buscar/act.php?id=BOE-A-2023-24840),” including Royal Decree 254/2025 and Royal Decree-law 15/2025, consulted 2026-09-12.
2. AEAT, “[Modalities for compliance by billing systems](https://sede.agenciatributaria.gob.es/Sede/iva/sistemas-informaticos-facturacion-verifactu/cuestiones-generales/modalidades-cumplimiento-obligaciones.html),” consulted 2026-09-12.
3. Club Delphi, “[Ley antifraude / VERI*FACTU developer discussion](https://www.clubdelphi.com/foros/showthread.php?t=95235),” and Stack Overflow, “[AEAT sandbox error 1207](https://stackoverflow.com/questions/79817230/verifactu-aeat-sandbox-always-returns-error-1207-error-interno-en-el-servidor),” used only for failure-mode discovery, consulted 2026-09-12.
4. ISO, “[ISO/IEC/IEEE 29148:2018 Requirements engineering](https://www.iso.org/standard/72089.html),” confirmed current in 2024; IETF, “[BCP 14 / RFC 8174](https://www.rfc-editor.org/rfc/rfc8174.html).”
5. ISO, “[ISO/IEC 25010:2023 Product quality model](https://www.iso.org/standard/78176.html).”
6. NIST, “[SP 800-218 SSDF 1.1](https://csrc.nist.gov/pubs/sp/800/218/final)”; OWASP, “[SAMM model](https://owaspsamm.org/model/)” and “[ASVS 5.0.0](https://github.com/OWASP/ASVS/releases/tag/v5.0.0).”
7. OWASP, “[XML Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/XML_Security_Cheat_Sheet.html)” and “[XXE Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/XML_External_Entity_Prevention_Cheat_Sheet.html).”
8. European Union, “[Regulation (EU) 2016/679](https://eur-lex.europa.eu/eli/reg/2016/679/oj),” especially articles 5, 25 and 32; Spain, “[Organic Law 3/2018](https://www.boe.es/eli/es/lo/2018/12/05/3/con).”
9. HdrHistogram, “[coordinated omission guidance](https://github.com/HdrHistogram/HdrHistogram),” consulted 2026-09-12.
10. Node.js, “[Backpressuring in Streams](https://nodejs.org/learn/modules/backpressuring-in-streams),” consulted 2026-09-12.
11. Google, “[Service Level Objectives](https://sre.google/sre-book/service-level-objectives/)” and “[Monitoring Distributed Systems](https://sre.google/sre-book/monitoring-distributed-systems/).”

Additional primary inputs include [Order HAC/1177/2024](https://www.boe.es/buscar/act.php?id=BOE-A-2024-22138), the [AEAT technical index](https://sede.agenciatributaria.gob.es/Sede/iva/sistemas-informaticos-facturacion-verifactu/informacion-tecnica.html), [AEAT FAQ updated 21 July 2026](https://sede.agenciatributaria.gob.es/Sede/iva/sistemas-informaticos-facturacion-verifactu/preguntas-frecuentes.html), [Law 58/2003](https://www.boe.es/eli/es/l/2003/12/17/58/con) and [Royal Decree 1619/2012](https://www.boe.es/eli/es/rd/2012/11/30/1619/con).
