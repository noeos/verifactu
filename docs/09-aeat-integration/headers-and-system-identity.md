---
id: AEAT-DOC-0006
title: AEAT headers and system identity
status: draft
authority: normative
owner: integration-owner
created: 2026-09-12
last-reviewed: 2026-09-12
sources: [SRC-0018, SRC-0022]
historical-inputs: [REV-017, REV-038]
---

# AEAT headers and system identity

The edition defines every legal/system header field, QName, cardinality,
catalogue and relationship: obligation holder, representative where applicable,
system/product producer identity, installation and protocol/record identifiers.
Values derive from validated fiscal context and release/edition manifests, not
environment strings or record payload guesses.

Header construction is deterministic and returns its own semantic/byte digest.
Before envelope creation, all header/record/outbox/certificate contexts must
match taxpayer, installation, edition, mode and environment. Cross-context
batching or credentials are rejected before signing/network.

Tests mutate every identity, swap header/body taxpayers/installations, omit
required representation, use stale product/edition data and interleave tenants.
Diagnostics identify the safe field/path and never echo full identities. The
same canonical identity model drives official XML, storage and correlation.
