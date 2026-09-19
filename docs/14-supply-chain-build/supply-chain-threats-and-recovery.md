---
id: BUILD-DOC-0019
title: Supply-chain threats and recovery
status: approved
authority: normative
owner: security-owner
created: 2026-09-12
last-reviewed: 2026-09-12
sources: [SRC-0032, SRC-0062]
decisions: [ADR-0032, ADR-0034, ADR-0035, ADR-0037]
historical-inputs: [REV-069, REV-070, REV-071, REV-075, REV-080]
---

# Supply-chain threats and recovery

Threats include dependency confusion/typosquat, maintainer/repository transfer,
malicious release/script/native binary, compromised registry/Action/tag/cache/
artifact/runner/toolchain, credential/OIDC abuse, build contamination, forged
SBOM/provenance and deletion of historical verification material.

Controls are exact admission/integrity, least privilege/trust separation, clean
network-bounded builds, allowlists, dual inventory, independent verification,
monitoring and reproducible rebuild. Scorecard/scanners inform findings but do
not close them.

Response freezes publication, preserves evidence, revokes tokens/keys/inputs,
maps affected subjects through the graph, communicates scoped impact, selects a
known-good source/tool graph, rebuilds/reverifies and reissues only new immutable
subjects. Existing evidence is marked suspect, never overwritten.

Tabletop and technical exercises simulate each compromise and test containment,
consumer verification, historic lookup and recovery without production secrets.
