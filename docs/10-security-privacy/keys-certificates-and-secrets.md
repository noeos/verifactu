---
id: SEC-DOC-0008
title: Keys, certificates and secrets
status: draft
authority: normative
owner: security-owner
created: 2026-09-12
last-reviewed: 2026-09-12
review-by: 2026-10-12
dependencies: [SEC-DOC-0005, SEC-DOC-0006]
historical-inputs: [REV-011, REV-012, REV-038, REV-053]
---

# Keys, certificates and secrets

Private keys are handles to a signing/certificate service, OS store, HSM or
equivalent custody boundary; the core API never accepts or returns raw private
key bytes. A handle binds tenant/context, purpose, algorithm policy, certificate
identity, environment, activation interval and revocation state.

## Lifecycle

Generation/import, authorization, activation, use, rotation, overlap, revocation,
expiry, archival of public verification material and destruction are explicit,
audited transitions. Rotation never rewrites historical signatures. Before each
use, policy checks context, purpose, algorithm, certificate usage/validity and
authorization. Clock uncertainty fails closed where validity cannot be decided.

## Secret handling

Secrets enter only through documented deployment secret channels, never source,
fixtures, CLI arguments, URLs, package metadata or generated evidence. They are
not stored in JavaScript strings longer than necessary where adapters can avoid
it, never serialized, compared in timing-safe form where relevant, and excluded
from errors, logs, traces, metrics and crash reports. Environment variables are
treated as exposed process-scoped input, not a high-assurance vault.

## Separation and recovery

Development/test keys and endpoints cannot satisfy production policy. Release
signing, commit signing, fiscal signing and transport credentials are distinct
purposes and keys. Backup/recovery is owned by the custody provider and tested
without exporting plaintext secrets. Loss or suspected compromise suspends the
affected capability, preserves evidence and follows an incident/edition-specific
recovery procedure; software must not create substitute signatures.

Secret scanning covers history, working tree, artifacts and logs with verified
test secrets. Scanner success complements, but does not replace, custody design.
