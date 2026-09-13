---
id: REF-DOC-0008
title: Status and claim vocabulary
status: draft
authority: informative
owner: documentation-owner
created: 2026-09-12
last-reviewed: 2026-09-12
decisions: [ADR-0040, ADR-0052]
historical-inputs: [REV-074, REV-080]
---

# Status and claim vocabulary

Planning states: proposed/draft/approved. Delivery states: planned/ready/active/
blocked/implemented/locally-verified/CI-verified/externally-observed. Release
states follow `RELEASE-DOC-0002`; lifecycle adds supported/deprecated/EOL and
historical-verification-only.

Each state names required exact evidence and invalidation. `complete`, `secure`,
`compliant`, `certified`, `verified`, `published` and `AEAT-approved` are scoped
claims, never synonyms. Missing/unknown/expired evidence cannot promote state.
