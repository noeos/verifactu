---
id: ADR-0036
title: Reconciled CycloneDX and SPDX from one component graph
status: accepted
authority: decision
owner: supply-chain-owner
created: 2026-09-12
last-reviewed: 2026-09-12
dependencies: [ADR-0034, ADR-0035]
sources: [SRC-0059, SRC-0060]
historical-inputs: [REV-068, REV-069, REV-070]
---

# ADR-0036: Reconciled CycloneDX and SPDX from one component graph

## Decision

Generate CycloneDX 1.7 and SPDX 3.0.1 from one canonical resolved component
graph covering root/workspaces, runtime/development/optional components,
tarballs, vendored/generated data, Actions, external tools and providers with
scope clearly distinguished. Components carry identity/purl where applicable,
version, source, digest, licence evidence and dependency relationships.

CycloneDX validates against its exact schema. SPDX JSON-LD passes both structural
and semantic validation. A reconciliation report proves the two serializations
and manifest/lock/install/tarball/runtime inventories agree; unexplained missing,
extra or ambiguous components block the artifact.

## Consequences and verification

Two formats serve different consumers but increase validator/tool maintenance.
A filename or schema-only success is insufficient. Golden and negative graphs
exercise transitives, aliases, peer/optional/platform packages, no-assertion
licences, tools and deliberate divergence. Format upgrades are versioned and
must retain verification of historical release SBOMs.
