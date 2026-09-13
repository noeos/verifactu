---
id: REF-DOC-0007
title: Date, time, decimal and encoding conventions
status: draft
authority: informative
owner: documentation-owner
created: 2026-09-12
last-reviewed: 2026-09-12
decisions: [ADR-0011, ADR-0025]
---

# Date, time, decimal and encoding conventions

Canonical specs own fiscal local date, offset-aware instant, explicit clock
quality, decimal lexeme/value/scale, UTF-8, Unicode validity/normalization policy,
XML declaration/canonicalization and byte digest casing. JSON numbers cannot carry
unsafe fiscal decimals; locale/platform formatting is forbidden.

Reference views list unit in field/type names, inclusive/exclusive bounds and
conversion owner. Examples are generated/tested against schemas and exact-byte
vectors; this summary never overrides edition-specific official lexical rules.
