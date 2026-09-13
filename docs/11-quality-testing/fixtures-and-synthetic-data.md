---
id: QA-DOC-0004
title: Fixtures and synthetic data
status: approved
authority: normative
owner: quality-owner
created: 2026-09-12
last-reviewed: 2026-09-12
decisions: [ADR-0009, ADR-0027, ADR-0028]
historical-inputs: [REV-062]
---

# Fixtures and synthetic data

Fixture classes are official exact bytes, reviewed synthetic fiscal cases,
derived adversarial mutations, generated property/fuzz cases and ephemeral
secret material. Each records ID, purpose, source/parent, licence, edition,
generator/transformation, expected semantics, sensitivity and SHA-256/SHA-512.

Synthetic identities MUST be unmistakably fictitious and pass a privacy review;
no production/customer record, real certificate, private key or endpoint token
may enter git, logs, caches or uploaded artifacts. Secret fixtures are generated
per isolated run, least-lived and destroyed on every exit path.

Exact-byte snapshots are allowed only where bytes are contractual and MUST pair
with semantic assertions. Snapshot updates are explicit reviewed generation,
never automatic acceptance. Mutations record parent and one intended violation
so an unrelated parser error cannot count as correct rejection.

Fixture manifests sort canonically, detect duplicates/collisions and fail on
missing bytes, unknown provenance, stale edition, forbidden data or unreviewed
change. Builders themselves have golden and adversarial tests.
