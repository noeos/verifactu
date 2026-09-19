---
id: ASSURANCE-DOC-0003
title: Evidence store and chain of custody
status: approved
authority: normative
owner: assurance-owner
created: 2026-09-12
last-reviewed: 2026-09-12
decisions: [ADR-0025, ADR-0053]
historical-inputs: [REV-079, REV-083]
---

# Evidence store and chain of custody

Ingest recomputes digest/media/size/schema, malware/content limits and subject;
stores immutable content-addressed bytes with source/collector, time, access,
sensitivity, encryption/key, retention/legal hold and append-only custody events.

Public, internal, restricted fiscal/personal and embargoed security classes have
separate access/export/redaction. Redaction creates linked derivative, never edits
original. Quarterly integrity sampling and periodic full restore prove readability;
corruption/lost key creates finding and invalidates dependent claims.
