---
id: CRYPTO-DOC-0007
title: Official chaining
status: approved
authority: normative
owner: cryptography-owner
created: 2026-09-12
last-reviewed: 2026-09-12
dependencies: [DOM-DOC-0007, CRYPTO-DOC-0006]
historical-inputs: [REV-007, REV-018, REV-021, REV-029]
---

# Official chaining

The edition defines chain scope from explicit taxpayer, installation/system and
record-class dimensions. Genesis is a named state with no fabricated previous
record. Non-genesis links contain the official predecessor identity fields and
its verified fingerprint exactly as required; current and predecessor hashes
are never interchangeable.

Preparation captures a head token, but commit rereads and CAS-confirms it within
the atomic UoW. Chronology, duplicate record identity, sequence gap, fork,
wrong-context predecessor, stale prepare and out-of-order batch are rejected
with separate diagnostics. Events follow their official event chronology and
are not silently inserted into billing chains.

Chain verification enumerates a complete bounded range, verifies identity,
context, genesis count, order, predecessor fields, every recomputed fingerprint,
head agreement and declared completeness. A list of mutually matching hashes
without completeness/head evidence is not a verified chain.
