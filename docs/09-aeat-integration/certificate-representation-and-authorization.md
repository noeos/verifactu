---
id: AEAT-DOC-0005
title: AEAT certificate representation and authorization
status: approved
authority: normative
owner: integration-owner
created: 2026-09-12
last-reviewed: 2026-09-12
dependencies: [CRYPTO-DOC-0011, SEC-DOC-0007]
historical-inputs: [REV-014, REV-044]
---

# AEAT certificate representation and authorization

TLS authentication identity and XML signing identity are separate uses even
when backed by the same certificate. A credential binding records opaque handle,
safe certificate fingerprint/subject summary, provider, permitted purpose,
taxpayer/representative relation, environment, validity policy and activation/
revocation interval.

Before an operation, certificate parsing/path/time/key-usage and acting-party
authorization are evaluated under the edition/policy. The system does not infer
authorization from certificate dates, possession of a private key or successful
TLS handshake. Delegation/representation evidence and responsibility boundaries
are explicit host/regulatory inputs.

Private keys/PFX/passphrases are never DTO fields, CLI arguments, logs or stored
artifacts. Provider handles must prevent cross-context substitution. Rotation
does not alter prior attempts/evidence. Tests cover direct taxpayer,
representative and unsupported identities, wrong environment/purpose, expired/
revoked/unknown status, provider swap and concurrent tenant use.
