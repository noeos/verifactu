---
id: BUILD-DOC-0002
title: Dependency inventory and drift
status: draft
authority: normative
owner: supply-chain-owner
created: 2026-09-12
last-reviewed: 2026-09-12
decisions: [ADR-0034, ADR-0036]
historical-inputs: [REV-068, REV-069, REV-070]
---

# Dependency inventory and drift

One canonical resolved graph records workspace/package identity, ecosystem,
version, purl, source/resolved URI, integrity/digest, dependency relation/scope,
optional/peer/platform condition, licence evidence, scripts/native code,
advisories and admission ID.

Generation parses every manifest and complete lockfile, then reconciles a clean
installed tree, packed production contents, external tools, Actions and provider
runtimes. Alias, bundled, extraneous, missing, invalid peer, platform-pruned and
unresolved licence states remain explicit.

Hand editing generated inventory is forbidden. CI fails on manifest/lock/install/
tarball/SBOM divergence, unknown component, duplicate normalized identity,
integrity change or stale admission. Diffs are semantic and sorted; disappearance
requires proof that no output/runtime/evidence still contains the component.
