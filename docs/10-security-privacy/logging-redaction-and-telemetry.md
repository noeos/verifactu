---
id: SEC-DOC-0012
title: Logging, redaction and telemetry
status: approved
authority: normative
owner: security-owner
created: 2026-09-12
last-reviewed: 2026-09-12
review-by: 2026-10-12
dependencies: [SEC-DOC-0011, DOM-DOC-0011]
historical-inputs: [REV-068, REV-069, REV-070, REV-075, REV-076]
---

# Logging, redaction and telemetry

Telemetry is structured and allowlist-based. Events contain stable event name,
safe diagnostic code, build/component version, bounded correlation token,
duration/outcome and low-cardinality dimensions. Arbitrary objects, payloads,
headers, URLs, certificate bodies, stack locals and adapter errors are never
serialized automatically.

## Redaction policy

Tax identifiers, invoice identities/descriptions, names/addresses, XML, authority
responses, signatures/certificates and secrets are prohibited. When correlation
is necessary, use a purpose-specific keyed token with rotation and access policy;
plain or unsalted hashes of guessable identifiers are prohibited. Fields are
classified at definition and unsafe unknown fields are dropped.

## Separation

Regulated event/evidence stores are not log sinks. Audit records privileged
security actions with protected actor/action/result references. Operational logs
diagnose service health. Metrics aggregate behavior. Traces propagate safe random
IDs. Each has distinct access, destination and retention; none backfills another.

## Failure behavior and proof

Telemetry exporter failure cannot corrupt fiscal work and is bounded by a small
queue; policy states whether security-audit failure must fail closed. Emergency
debug mode cannot disable redaction and has authorization, expiry and audit.

Tests inject canary secrets and representative P1/P2 values into every field,
exception and adapter boundary, then scan logs, traces, metrics, snapshots and CI
artifacts. Cardinality and byte-rate tests prevent identifiers or attacker data
from becoming labels. Production schemas reject unregistered event names/fields.
