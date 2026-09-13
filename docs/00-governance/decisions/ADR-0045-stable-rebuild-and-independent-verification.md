---
id: ADR-0045
title: Stable rebuild and independent public verification
status: proposed
authority: decision
owner: assurance-owner
created: 2026-09-12
last-reviewed: 2026-09-12
dependencies: [ADR-0035, ADR-0037, ADR-0040]
historical-inputs: [REV-065, REV-066, REV-067, REV-079, REV-082, REV-084]
---

# ADR-0045: Stable rebuild and independent public verification

Stable packages are rebuilt from zero from their own signed stable commit on an
approved hosted builder; RC tarballs cannot be promoted because stable versions
necessarily differ. RC/stable normalized semantic trees may differ only in
declared version/provenance material and reviewed changes.

After npm/GitHub publication, a protected verifier downloads public bytes and
uses independently pinned policy/trust roots. It checks byte equality to attested
subjects, provenance, SBOM/licences, manifests, signatures/tags, all three clean
consumers and critical regulatory/integration vectors. It has no publish/write
permission and trusts no executable release-job artifact.

Registry propagation retries are bounded and distinguish absent from wrong.
Mismatch creates incident and prevents channel/GitHub promotion or supported
status. Verification policy changes use their own protected PR/evidence.
