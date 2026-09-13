---
id: ADR-0015
title: Modular workspace and package boundaries
status: accepted
authority: decision
owner: project-owner
created: 2026-09-12
last-reviewed: 2026-09-12
dependencies: [ADR-0002, ADR-0007]
historical-inputs: [REV-050, REV-061, REV-072, REV-084]
---

# ADR-0015: Modular workspace and package boundaries

## Context

The deleted implementation mixed fiscal policy, I/O, CLI concerns and provider
code while exposing incomplete commands and inaccessible edition assets. A
single package would preserve those dependency leaks; many public packages
would create unsupported compatibility surfaces.

## Decision

Use a TypeScript npm workspace with these planned publishable surfaces:

- `@noeos/verifactu`: complete public library and pure regulatory/application
  behavior, with documented subpath exports only;
- `@noeos/verifactu-adapter-kit`: host/provider contracts, executable adapter
  conformance harness and supported fixtures;
- `@noeos/verifactu-cli`: complete CLI over the same public operations.

Private workspaces own official-source ingestion, contract generation,
standards/provider bridges, test oracles and build tooling. They are not public
APIs. Source modules follow domain/application/ports/adapters direction; core
code cannot import Node I/O, networking, process state or provider
implementations. Cross-repository use is only through a pinned published
Verification Engine package. ESM/CJS/type exports and the Node matrix must be
proved from packed clean-consumer installations before publication.

## Consequences and verification

`package-and-container-view.md` fixes the complete tree before code begins.
Architecture tests reject cycles, private deep imports, ambient effects and
undeclared exports. Package count may change only through a successor ADR with
a named independent consumer and migration plan.
