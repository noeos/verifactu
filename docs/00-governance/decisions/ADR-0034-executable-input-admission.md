---
id: ADR-0034
title: Exact executable-input admission
status: accepted
authority: decision
owner: supply-chain-owner
created: 2026-09-12
last-reviewed: 2026-09-12
dependencies: [ADR-0012, ADR-0029]
sources: [SRC-0032, SRC-0052, SRC-0062]
historical-inputs: [REV-069, REV-070, REV-071, REV-075, REV-080]
---

# ADR-0034: Exact executable-input admission

## Decision

Every dependency, GitHub Action, downloaded binary, native/prebuilt component
and provider runtime requires an admission record: need/alternatives, source,
exact version/digest/SHA, owner/maintainers, release provenance, licence,
permissions/network, install scripts, transitives, advisories, replacement and
review trigger. Manifests, lock, install, package and SBOM inventories reconcile.

Runtime dependency specs are exact. Actions use full commit SHA with a reviewed
release annotation and platform SHA enforcement. Baseline install disables
lifecycle scripts and optional code; exceptions are package/platform scoped and
sandboxed. Non-emergency versions cool for seven days; urgent fixes use a
recorded high-scrutiny exception.

## Consequences and verification

Admission slows dependency addition but reduces unexamined execution. Age,
popularity, Scorecard and signatures are signals, not proof. Negative fixtures
cover mutable Actions, registry/source confusion, integrity drift, hidden
scripts, unexpected native assets, missing licences and stale inventory.

Removal or replacement preserves public behavior and evidence readability;
compromise response revokes inputs, invalidates derived evidence and rebuilds
from a known-good source graph.
