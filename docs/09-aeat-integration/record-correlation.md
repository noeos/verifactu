---
id: AEAT-DOC-0009
title: AEAT record correlation
status: draft
authority: normative
owner: integration-owner
created: 2026-09-12
last-reviewed: 2026-09-12
historical-inputs: [REV-039, REV-040]
---

# AEAT record correlation

The batch manifest stores each ordered local record/outbox identity, official
correlation fields and request artifact digest. Correlation uses the exact
edition-defined composite official identity, not array position alone and not a
single potentially repeated invoice value.

Every expected member must map to exactly one compatible response line unless
the official global outcome explicitly precludes line results. Missing,
duplicate, foreign, malformed or mutually ambiguous lines make affected scope
`indeterminate` and require retained evidence/reconciliation; they never default
to accepted. Extra lines are security/protocol incidents.

Line order is checked where specified but correlation remains identity-based.
Tests permute lines, duplicate identities across taxpayers/series, omit middle/
last entries, inject another batch/context, vary leading zeros/date/Unicode and
combine a global status with contradictory lines. Classification records both
raw observation and correlation proof.
