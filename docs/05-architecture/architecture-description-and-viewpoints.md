---
id: ARCH-DOC-0001
title: Architecture description and viewpoints
status: approved
authority: normative
owner: architecture-owner
created: 2026-09-12
last-reviewed: 2026-09-12
decisions: [ADR-0016]
sources: [SRC-0039, SRC-0040]
---

# Architecture description and viewpoints

## System and stakeholders

The system of interest is the complete published VeriFactu component and its
supported provider boundary. Stakeholders are the project maintainer,
Facturacion/other host developers, taxpayer operators, security and regulatory
reviewers, adapter implementers, incident responders and auditors. AEAT and
Verification Engine are external systems, not components owned here.

| Viewpoint | Concerns answered | Canonical model |
|---|---|---|
| Context | responsibility, authority, trust | actors/systems and contracts |
| Module | ownership, imports, change isolation | workspace/module graph |
| Runtime | processes, effects, resources, failure | deployment profiles and ports |
| Information | identity, custody, retention | entity/artifact registry |
| Dynamic | order, atomicity, recovery | operation/state transition registry |
| Security | threats, privilege, data crossing | DFD/control mapping |
| Evolution | editions, schemas, migrations | compatibility registry |

Each view declares scope, notation, version and correspondence rules. A view is
invalid if it contains an unnamed component, dependency, trust boundary or
state absent from its canonical registry. Generated views show provenance; hand
drawings are explanatory only.

## Required correspondences

Every public operation maps to a component, port, state transition and evidence
obligation. Every stored datum maps to one owner, classification and lifecycle.
Every trust crossing maps to validation, limits and threat controls. Every
package dependency maps to an allowed graph edge and clean-consumer test.
