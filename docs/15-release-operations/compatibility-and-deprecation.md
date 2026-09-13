---
id: RELEASE-DOC-0018
title: Compatibility and deprecation
status: draft
authority: normative
owner: product-owner
created: 2026-09-12
last-reviewed: 2026-09-13
decisions: [ADR-0039, ADR-0048, ADR-0050]
historical-inputs: [REV-017, REV-066, REV-084]
---

# Compatibility and deprecation

Published matrix crosses package version, public API/schema/CLI, Node/OS/module,
edition, stored schema, Engine/profile, adapter/provider and versioned future-host
contract/synthetic-fixture versions.
Required cells have installed evidence; informational/unsupported are explicit.

Deprecation identifies affected surface, replacement, migration, warning period,
runtime diagnostic and EOL. It cannot silently disable legal behavior or historic
verification. Breaking removal needs major unless continued exposure is unsafe;
then advisory/risk/legal evidence and forward fix govern.

Upgrade/downgrade/mixed-version tests prevent unsafe fallback. Package docs for
every supported line remain available and match its bytes, not only `latest`.
