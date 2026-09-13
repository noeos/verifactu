---
id: DOCS-INDEX
title: VeriFactu documentation
status: approved
authority: normative
owner: project-owner
created: 2026-09-11
last-reviewed: 2026-09-13
---

# VeriFactu documentation

This directory is the planning and documentation authority for the new
implementation of `noeos/verifactu`.

The product is planned as a complete regulatory component, not as an MVP. Its
scope includes both VERI*FACTU and NO VERI*FACTU, the complete public
integration with Noeos Verification Engine, security, privacy, performance,
recovery, operability, packaging, release verification and regulatory
traceability.

Facturacion is a future product and is not currently implemented. VeriFactu
`1.0.0` MUST publish and prove the versioned host/UoW boundary, adapter kit and a
maintained synthetic host, but MUST NOT claim or require a real Facturacion
integration. That integration will be implemented and evidenced later in the
separate Facturacion repository.

The approved documentation map and the rules for developing it are recorded in
[`STRUCTURE.md`](STRUCTURE.md).

The cross-area research and elaboration contract for product, regulation,
requirements, domain, security/privacy and performance/reliability is recorded
in [`lot-1-foundations-plan.md`](lot-1-foundations-plan.md).

The cross-area research and elaboration contract for architecture, public
contracts, official formats and cryptography, persistence/consistency and AEAT
integration is recorded in
[`lot-2-executable-core-plan.md`](lot-2-executable-core-plan.md).

The cross-area research and elaboration contract for quality/testing,
repository engineering and CI, supply-chain/build assurance and installed
integration conformance is recorded in
[`lot-3-assurance-delivery-plan.md`](lot-3-assurance-delivery-plan.md).

The cross-area research and elaboration contract for release/operations,
dependency-driven delivery and risk, assurance/audits and final generated
reference indexes is recorded in
[`lot-4-release-assurance-closure-plan.md`](lot-4-release-assurance-closure-plan.md).

The canonical execution sequence from the documentation-only repository through
protected bootstrap, implementation, assurance, publication and supported
`1.0.0` is [`17-roadmap-risk/implementation-roadmap.md`](17-roadmap-risk/implementation-roadmap.md).
Phase-to-phase operational state is recorded in
[`17-roadmap-risk/handoff.md`](17-roadmap-risk/handoff.md), and the corresponding
Codex `/goal` execution prompts are
[`17-roadmap-risk/prompts.md`](17-roadmap-risk/prompts.md).

## Historical material

[`previous-docs/`](previous-docs/) is an immutable historical input copied from
the deleted implementation. It has no normative authority over the new
project, but it MUST be consulted while planning every affected area. Its
review findings, failed assumptions and regression reproductions are a
mandatory lessons-learned corpus.

New documents MUST NOT claim that an old phase, finding or remediation remains
valid merely because it appears in the archive. Each relevant lesson must be
re-evaluated, converted into a current requirement, risk, test or decision, and
verified against the new implementation.

## Documentation areas

| Area | Responsibility |
| --- | --- |
| [`00-governance`](00-governance/) | Authority, lifecycle, research, decisions and documentation controls. |
| [`01-product`](01-product/) | Product mission, complete scope, actors, capabilities and limitations. |
| [`02-regulatory`](02-regulatory/) | Legal authority, official sources, editions, applicability and regulatory change. |
| [`03-requirements`](03-requirements/) | Testable functional, non-functional, security, performance and operational requirements. |
| [`04-domain`](04-domain/) | RRSIF domain model, identities, records, events, modalities, rules and states. |
| [`05-architecture`](05-architecture/) | System structure, boundaries, dependencies, trust and evolution. |
| [`06-contracts`](06-contracts/) | Public API, CLI, schemas, ports, diagnostics, events and compatibility. |
| [`07-formats-cryptography`](07-formats-cryptography/) | Official bytes, XML, fingerprint, signatures, certificates, QR and evidence. |
| [`08-persistence-consistency`](08-persistence-consistency/) | Atomicity, stores, outbox, concurrency, idempotency and recovery. |
| [`09-aeat-integration`](09-aeat-integration/) | AEAT services, SOAP, mTLS, batches, responses, retries and reconciliation. |
| [`10-security-privacy`](10-security-privacy/) | Threats, controls, abuse cases, secrets, privacy and vulnerability response. |
| [`11-quality-testing`](11-quality-testing/) | Test strategy, independent oracles, coverage, mutation, fuzz and fault injection. |
| [`12-performance-reliability`](12-performance-reliability/) | Workloads, budgets, benchmarks, resources, stress and reliability. |
| [`13-repository-ci`](13-repository-ci/) | Future repository tree, engineering rules, GitHub, CI workflows and jobs. |
| [`14-supply-chain-build`](14-supply-chain-build/) | Dependencies, build, packaging, SBOM, provenance and artifact integrity. |
| [`15-release-operations`](15-release-operations/) | Versioning, publishing, verification, support, incidents and runbooks. |
| [`16-integrations-conformance`](16-integrations-conformance/) | Verification Engine, Facturacion host boundary, adapters and conformance. |
| [`17-roadmap-risk`](17-roadmap-risk/) | Dependency-driven execution plan, readiness, completion and risks. |
| [`18-assurance-audits`](18-assurance-audits/) | Findings, evidence model, audits, release dossiers and postmortems. |
| [`99-reference`](99-reference/) | Glossary, standards, identifiers and indexes without normative duplication. |
