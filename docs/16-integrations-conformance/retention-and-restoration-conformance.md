---
id: INTEGRATION-DOC-0010
title: Retention and restoration conformance
status: draft
authority: normative
owner: operations-owner
created: 2026-09-12
last-reviewed: 2026-09-12
decisions: [ADR-0009, ADR-0025, ADR-0038]
historical-inputs: [REV-060, REV-083]
---

# Retention and restoration conformance

Adapters declare retention policy, legal hold, archive/export, encryption/key
dependency, backup consistency, restore point/objectives, edition/tool/profile
custody and deletion authority. No universal legal period is invented; configured
policy is validated against current regulatory/privacy requirements before use.

A disposable full dataset spanning taxpayers, modalities, chains, events,
artifacts, AEAT attempts and historic editions is backed up, primary state
destroyed, and restored into an isolated target. Digests/relationships/chains,
query/export and Verification Engine claims must match; missing keys/edition/
schema produce explicit blocked recovery, never silent data loss.

Legal hold prevents expiry/deletion. Partial/corrupt backup, interrupted restore,
version migration and rollback are adversarial cases. Evidence records tools,
encrypted artifact digests, times/RPO/RTO measurements and cleanup; no live
customer data is used.
