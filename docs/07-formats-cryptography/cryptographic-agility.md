---
id: CRYPTO-DOC-0017
title: Cryptographic agility
status: approved
authority: normative
owner: security-owner
created: 2026-09-12
last-reviewed: 2026-09-12
dependencies: [ADR-0009, ADR-0020, ADR-0021]
---

# Cryptographic agility

Algorithm suites are immutable edition/profile records containing identifier/
URI, purpose, parameters, key constraints, permitted provider versions,
activation/deprecation dates and verification support. Callers cannot select
arbitrary algorithms; unknown, disabled or weaker-than-required choices fail.

Creation and historical verification policies are distinct: new artifacts stop
using a deprecated suite at activation, while retained artifacts remain
verifiable with their original suite and validation-time evidence. Migration
creates new linked evidence where authorized and never rewrites official bytes
or pretends a new signature existed historically.

Provider capability discovery is authenticated and compared to the edition
allowlist before work. Downgrade, algorithm-confusion, URI alias, parameter
substitution and key-size boundary tests are mandatory. Emergency deactivation
requires impact analysis, affected-artifact inventory, communication and an
explicit exception only where law and evidence permit continued operation.
