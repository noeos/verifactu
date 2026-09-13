---
id: BUILD-DOC-0015
title: SBOM reconciliation
status: approved
authority: normative
owner: supply-chain-owner
created: 2026-09-12
last-reviewed: 2026-09-12
decisions: [ADR-0036]
historical-inputs: [REV-068, REV-069, REV-070]
---

# SBOM reconciliation

CycloneDX and SPDX are projections of one graph, not independently guessed
inventories. Reconciliation maps every canonical component/relation/licence/
digest/scope to both format identities and to manifest, lock, clean install,
tarball, runtime/provider and notice evidence.

Format-specific absence is permitted only with a named semantic mapping and no
loss of the underlying fact. Missing/extra component, version/source/hash drift,
scope mismatch, dangling edge, licence disagreement or wrong package subject
blocks. Counts alone are insufficient.

The report includes graph and document digests, validators, mapping version,
differences and disposition. It is recomputed after dependency, tool, Action,
package or edition changes. Deliberately divergent golden fixtures prove both
directions are checked.
