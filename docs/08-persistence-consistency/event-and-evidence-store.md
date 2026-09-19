---
id: PERSIST-DOC-0004
title: Event and evidence store
status: approved
authority: normative
owner: persistence-owner
created: 2026-09-12
last-reviewed: 2026-09-12
decisions: [ADR-0021]
historical-inputs: [REV-020, REV-022]
---

# Event and evidence store

The journal stores immutable transition facts with event ID, aggregate/context,
sequence/version, prior/new state, command/causation/correlation, explicit
instant source, edition, artifact/claim references and safe diagnostics. Unique
aggregate-version prevents parallel histories; journal order is not inferred
from wall clock.

Evidence objects store separate official-hash/chain, XML/XSD, XAdES/reference,
certificate trust/authorization, Noeos profile and AEAT observation claims.
Each records subject digest, verifier/tool/profile, policy/validation instant,
result and supporting artifact references. A combined report references these
objects and cannot overwrite them.

Writes occur with the transition they attest. Queries provide consistent
bounded history and surface gaps/duplicates. Redaction and access are enforced
by evidence class. Tamper, missing support artifact, unknown profile and
cross-context reference make verification incomplete and release/export fail.
