---
id: RELEASE-DOC-0015
title: Post-publication verification
status: draft
authority: normative
owner: assurance-owner
created: 2026-09-12
last-reviewed: 2026-09-12
decisions: [ADR-0045, ADR-0046]
historical-inputs: [REV-065, REV-066, REV-067, REV-079, REV-082, REV-084]
---

# Post-publication verification

A no-write protected verifier downloads npm metadata/tarballs/provenance and
GitHub tag/release/assets from public endpoints. Independent trust policy checks
tag/signer/ancestry, exact names/versions/digests, dist-tags, attestations,
checksums/SBOM/licences and byte equality to declared subjects.

Fresh consumers exercise ESM/CJS/TypeScript, CLI, editions/assets, adapter kit,
Engine profile and critical vectors with all workspaces unavailable. Release
notes/support/dossier claims are reconciled.

Bounded retry handles proven registry propagation; wrong bytes/identity or expiry
never retries to green. Failure prevents `supported`/promotion or opens incident,
freezes publication and starts forward recovery. Result is retained beyond CI.
