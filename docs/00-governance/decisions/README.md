---
id: ADR-INDEX
title: Governance decision records
status: approved
authority: normative
owner: project-owner
created: 2026-09-11
last-reviewed: 2026-09-25
---

# Governance decision records

These records capture the material choices underlying governance. Their prose
has been read and accepted as the project's design authority. Acceptance records
the decision; it does not claim that the corresponding controls or product
capabilities have been implemented.

| Record | Decision |
| --- | --- |
| [ADR-0001](ADR-0001-complete-product-planning.md) | Plan a complete product, never an MVP. |
| [ADR-0002](ADR-0002-ecosystem-boundaries.md) | Preserve repository ownership and public contracts. |
| [ADR-0003](ADR-0003-docs-as-code-governance.md) | Govern through versioned, traceable docs as code. |
| [ADR-0004](ADR-0004-single-maintainer-protected-flow.md) | Use a zero-approval protected PR flow with compensating controls. |
| [ADR-0005](ADR-0005-historical-archive-policy.md) | Preserve old material as mandatory non-authoritative input. |
| [ADR-0006](ADR-0006-source-authority-and-research.md) | Apply explicit source authority and reproducible research. |
| [ADR-0007](ADR-0007-product-form-and-release-surface.md) | Publish library, CLI and adapter conformance surfaces. |
| [ADR-0008](ADR-0008-applicability-and-jurisdiction-policy.md) | Evaluate common-territory RRSIF applicability explicitly. |
| [ADR-0009](ADR-0009-immutable-regulatory-editions.md) | Preserve immutable reproducible regulatory editions. |
| [ADR-0010](ADR-0010-canonical-atomic-requirements.md) | Store atomic requirements once and generate their views. |
| [ADR-0011](ADR-0011-explicit-fiscal-identities.md) | Separate fiscal identities, bytes, evidence and exchanges. |
| [ADR-0012](ADR-0012-threat-driven-security-baseline.md) | Use threat-driven controls and scoped framework mappings. |
| [ADR-0013](ADR-0013-evidence-calibrated-performance-budgets.md) | Calibrate performance budgets with complete evidence. |
| [ADR-0014](ADR-0014-explicit-mode-tenure.md) | Model explicit dated mode tenure per taxpayer. |
| [ADR-0015](ADR-0015-modular-workspace-and-package-boundaries.md) | Use a modular workspace with narrow public package surfaces. |
| [ADR-0016](ADR-0016-architecture-description-and-conformance.md) | Bind architectural views to executable conformance rules. |
| [ADR-0017](ADR-0017-runtime-validated-staged-contracts.md) | Use runtime-validated staged public contracts. |
| [ADR-0018](ADR-0018-generated-official-structure-semantic-overlay.md) | Generate pinned official structure and maintain sourced semantic rules separately. |
| [ADR-0019](ADR-0019-hardened-xml-xsd-backend-admission.md) | Admit only a hardened standards-conforming XML/XSD backend. |
| [ADR-0020](ADR-0020-xades-pki-provider-boundary.md) | Place XAdES and PKI behind a verified provider boundary. |
| [ADR-0021](ADR-0021-separated-integrity-claims.md) | Keep every official, cryptographic and internal integrity claim separate. |
| [ADR-0022](ADR-0022-atomic-host-record-outbox-commit.md) | Atomically commit host state, record, evidence, head and outbox. |
| [ADR-0023](ADR-0023-cas-fencing-and-reconciliation.md) | Use CAS, fencing and reconciliation before uncertain resend. |
| [ADR-0024](ADR-0024-edition-bound-aeat-transport.md) | Bind one-shot transport to pinned AEAT editions and durable orchestration. |
| [ADR-0025](ADR-0025-exact-byte-artifact-custody.md) | Preserve separate exact digest-addressed byte artifacts. |
| [ADR-0026](ADR-0026-claim-evidence-graph.md) | Bind every assurance claim to exact executable evidence. |
| [ADR-0027](ADR-0027-independent-oracles-and-adversarial-testing.md) | Require independent oracles and genuine property, fuzz and mutation testing. |
| [ADR-0028](ADR-0028-deterministic-tests-and-flake-policy.md) | Make tests replayable and prohibit rerun-to-green. |
| [ADR-0029](ADR-0029-versioned-toolchain-profiles.md) | Govern exact runtime, compiler and provider toolchain profiles. |
| [ADR-0030](ADR-0030-repository-tree-and-canonical-task-graph.md) | Fix one owned repository tree and one local/CI task graph. |
| [ADR-0031](ADR-0031-single-maintainer-github-protection.md) | Enforce strict signed squash PRs without fictional reviewers. |
| [ADR-0032](ADR-0032-workflow-trust-domain-separation.md) | Separate untrusted validation from privileged automation. |
| [ADR-0033](ADR-0033-required-leaf-checks-and-closure.md) | Require stable leaf checks and fail-closed evidence closure. |
| [ADR-0034](ADR-0034-executable-input-admission.md) | Admit exact dependencies, Actions and external executables. |
| [ADR-0035](ADR-0035-clean-reproducible-builds-and-package-allowlists.md) | Build cleanly and enforce closed package contents. |
| [ADR-0036](ADR-0036-dual-sbom-from-one-component-graph.md) | Generate reconciled CycloneDX and SPDX from one graph. |
| [ADR-0037](ADR-0037-honest-provenance-and-attestation.md) | Claim only verified Build L2-compatible provenance. |
| [ADR-0038](ADR-0038-installed-artifact-integration-conformance.md) | Qualify integrations through installed artifacts and real capabilities. |
| [ADR-0039](ADR-0039-lockstep-package-versioning.md) | Version three public packages together while preserving independent edition/profile axes. |
| [ADR-0040](ADR-0040-release-state-machine.md) | Model release as durable exact-subject transitions including partial failure. |
| [ADR-0041](ADR-0041-signed-immutable-release-tags.md) | Use annotated SSH-signed protected tags and independent trust roots. |
| [ADR-0042](ADR-0042-single-maintainer-release-authorization.md) | Authorize releases without fictional reviewers or permanent bypass. |
| [ADR-0043](ADR-0043-npm-oidc-only-publication.md) | Publish exact packages through npm trusted OIDC only. |
| [ADR-0044](ADR-0044-non-atomic-multipackage-publication.md) | Stage and recover the inherently non-atomic three-package publication. |
| [ADR-0045](ADR-0045-stable-rebuild-and-independent-verification.md) | Rebuild stable subjects and verify downloaded public bytes independently. |
| [ADR-0046](ADR-0046-immutable-github-release.md) | Publish a closed immutable GitHub release or an explicitly weaker monitored replica. |
| [ADR-0047](ADR-0047-component-dossier-and-declaration-handoff.md) | Separate component evidence from the integrated SIF responsible declaration. |
| [ADR-0048](ADR-0048-support-period-and-historical-verification.md) | Commit to measurable support while preserving historical verification. |
| [ADR-0049](ADR-0049-vulnerability-and-incident-lifecycle.md) | Combine technical severity with exploitation, reachability and legal context. |
| [ADR-0050](ADR-0050-forward-recovery-and-revocation.md) | Recover immutable releases forward without erasing evidence. |
| [ADR-0051](ADR-0051-complete-product-roadmap.md) | Deliver by dependency-driven increments without an MVP release. |
| [ADR-0052](ADR-0052-assurance-independence-and-claim-language.md) | Distinguish self, tool, independent and authority evidence in every claim. |
| [ADR-0053](ADR-0053-canonical-evidence-and-reference-graph.md) | Generate audits and references from one retained evidence graph. |
| [ADR-0054](ADR-0054-apache-2.0-project-license.md) | Use Apache License 2.0 for project-owned material with explicit third-party license boundaries. |
| [ADR-0055](ADR-0055-offline-revocation-evidence-boundary.md) | Keep CRL/OCSP retrieval in the commercial host and validate supplied evidence offline. |
| [ADR-0056](ADR-0056-edition-bound-qr-codec-and-rendering.md) | Bind QR payload/rendering to immutable editions and verify output with an independent decoder. |
| [ADR-0057](ADR-0057-local-eu-dss-provider.md) | Use local EU DSS 6.5 behind a private, fully admitted XAdES/PKI provider boundary. |
| [ADR-0058](ADR-0058-p4-order-and-exhaustive-assurance.md) | Enforce serial P4-A→G delivery and frozen whole-population quality gates. |
