---
id: CRYPTO-DOC-0003
title: Byte artifact lifecycle
status: draft
authority: normative
owner: cryptography-owner
created: 2026-09-12
last-reviewed: 2026-09-12
decisions: [ADR-0025]
historical-inputs: [REV-015, REV-016, REV-019, REV-042]
---

# Byte artifact lifecycle

Artifact kinds are fingerprint preimage, unsigned record/event XML, signed XML,
SOAP envelope/request, raw response, normalized report and export manifest. Each
immutable descriptor contains unique ID, parent IDs/transformation, context,
edition/profile, producer, creation-time source, media type, bytes/length,
SHA-256/SHA-512, validation claims, custodian and retention class.

States are `produced -> bounded-and-digested -> validated -> eligible` and,
where applicable, `signed -> signature-verified -> committed -> transmitted ->
retained`. A state transition never changes bytes; a changed representation is
a new child artifact. Unknown provider/remote bytes begin untrusted.

Commit binds descriptors and bytes atomically. Transmission reads the committed
request artifact and verifies its digest immediately before I/O. Response bytes
are retained before classification when permitted. Export proves inclusion and
order. Regeneration can detect drift but cannot replace the historical artifact.
