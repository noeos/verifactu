---
id: BUILD-DOC-0004
title: Lockfile and registry integrity
status: draft
authority: normative
owner: supply-chain-owner
created: 2026-09-12
last-reviewed: 2026-09-12
decisions: [ADR-0029, ADR-0034]
historical-inputs: [REV-067, REV-070, REV-071]
---

# Lockfile and registry integrity

One npm lockfile v3 is generated only by the primary admitted npm version.
Dependency specs are exact and resolved URLs belong to the canonical registry
allowlist; git/file/link/workspace references are limited to declared internal
workspaces and never published as external dependency resolution.

`npm ci --ignore-scripts --omit=optional` is the baseline installation and MUST
not mutate lock/manifest. Integrity fields, package identity/version, registry
TLS endpoint and npm audit-signature result are verified. Offline prepared cache
entries are content-addressed and rechecked; cache availability is not authority.

Negatives alter tarball/integrity/resolved source, add hidden registry config,
lock drift, unexpected peer/extraneous package and credential interpolation.
Registry outage yields explicit blocked/offline mode, never fallback to another
registry. Tokens are scoped, ephemeral and absent from config/artifacts.
