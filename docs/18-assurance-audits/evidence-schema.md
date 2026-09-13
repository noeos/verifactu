---
id: ASSURANCE-DOC-0002
title: Evidence schema
status: approved
authority: normative
owner: assurance-owner
created: 2026-09-12
last-reviewed: 2026-09-12
decisions: [ADR-0026, ADR-0053]
historical-inputs: [REV-063, REV-079]
---

# Evidence schema

Evidence records immutable ID/schema, claim/test/control/finding, repository/
commit/tree/tag/package digest, edition/toolchain/lock/config/environment, producer/
workflow/job/run/attempt, selected/executed/results/omissions, timestamps, raw/
derived digests, custody/sensitivity/retention and conclusion/limitations.

Canonical JSON has defined ordering/number/time/Unicode and semantic validation.
Missing, wrong subject, unknown enum, count mismatch, stale input, unsigned digest
or inaccessible required artifact fails. Migrations preserve original bytes and
validator versions; human summaries are generated views.
