---
id: DOCS-INDEX
title: VeriFactu documentation
status: approved
authority: normative
owner: project-owner
created: 2026-09-11
last-reviewed: 2026-10-05
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

Protected P1–P3-B foundation work is evidence-complete at its recorded subjects.
P4-A…P4-G implementation is merged on protected `main`, while P4 phase closure
remains `blocked` by its exact required-check findings. Under ADR-0060, P5
implementation is active on issue #113's `work/p5-implementation` branch and
may continue while P4 closure remains open. The local P5 synthetic campaign has
passed; it does not establish production-backend qualification, external AEAT
acceptance, a compliance claim, publication or release authorization. See the
[current handoff](17-roadmap-risk/handoff.md) for exact subjects, checks and
remaining blockers. To start or resume P5, use the P5 section in
[`prompts.md`](17-roadmap-risk/prompts.md): it directs the session to proceed
with authorized branch implementation while carrying P4's unresolved closure
rows forward. ADR-0060 amends the general predecessor-closure rule for P5
implementation entry; normal protected checks and the documented P5 exit
criteria remain in force.

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

The historical quality rebaseline is recorded in
[`previous-docs/00-gobierno/07-registro-rebaseline-calidad-p3-p7.md`](previous-docs/00-gobierno/07-registro-rebaseline-calidad-p3-p7.md).
Its mandatory operational consequence is the normative P3-B gate before P4.

## Documentation areas

| Area                                                          | Responsibility                                                                           |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| [`00-governance`](00-governance/)                             | Authority, lifecycle, research, decisions and documentation controls.                    |
| [`01-product`](01-product/)                                   | Product mission, complete scope, actors, capabilities and limitations.                   |
| [`02-regulatory`](02-regulatory/)                             | Legal authority, official sources, editions, applicability and regulatory change.        |
| [`03-requirements`](03-requirements/)                         | Testable functional, non-functional, security, performance and operational requirements. |
| [`04-domain`](04-domain/)                                     | RRSIF domain model, identities, records, events, modalities, rules and states.           |
| [`05-architecture`](05-architecture/)                         | System structure, boundaries, dependencies, trust and evolution.                         |
| [`06-contracts`](06-contracts/)                               | Public API, CLI, schemas, ports, diagnostics, events and compatibility.                  |
| [`07-formats-cryptography`](07-formats-cryptography/)         | Official bytes, XML, fingerprint, signatures, certificates, QR and evidence.             |
| [`08-persistence-consistency`](08-persistence-consistency/)   | Atomicity, stores, outbox, concurrency, idempotency and recovery.                        |
| [`09-aeat-integration`](09-aeat-integration/)                 | AEAT services, SOAP, mTLS, batches, responses, retries and reconciliation.               |
| [`10-security-privacy`](10-security-privacy/)                 | Threats, controls, abuse cases, secrets, privacy and vulnerability response.             |
| [`11-quality-testing`](11-quality-testing/)                   | Test strategy, independent oracles, coverage, mutation, fuzz and fault injection.        |
| [`12-performance-reliability`](12-performance-reliability/)   | Workloads, budgets, benchmarks, resources, stress and reliability.                       |
| [`13-repository-ci`](13-repository-ci/)                       | Future repository tree, engineering rules, GitHub, CI workflows and jobs.                |
| [`14-supply-chain-build`](14-supply-chain-build/)             | Dependencies, build, packaging, SBOM, provenance and artifact integrity.                 |
| [`15-release-operations`](15-release-operations/)             | Versioning, publishing, verification, support, incidents and runbooks.                   |
| [`16-integrations-conformance`](16-integrations-conformance/) | Verification Engine, Facturacion host boundary, adapters and conformance.                |
| [`17-roadmap-risk`](17-roadmap-risk/)                         | Dependency-driven execution plan, readiness, completion and risks.                       |
| [`18-assurance-audits`](18-assurance-audits/)                 | Findings, evidence model, audits, release dossiers and postmortems.                      |
| [`99-reference`](99-reference/)                               | Glossary, standards, identifiers and indexes without normative duplication.              |
