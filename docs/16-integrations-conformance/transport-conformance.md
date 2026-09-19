---
id: INTEGRATION-DOC-0013
title: Transport conformance
status: approved
authority: normative
owner: integration-owner
created: 2026-09-12
last-reviewed: 2026-09-12
sources: [SRC-0019, SRC-0022, SRC-0047, SRC-0048]
decisions: [ADR-0024, ADR-0038]
historical-inputs: [REV-037, REV-038, REV-039, REV-040, REV-041, REV-042, REV-043, REV-044]
---

# Transport conformance

Transport performs exactly one bounded observation: edition/environment endpoint,
mTLS identity, method/headers and exact envelope bytes in; status/headers and
exact response bytes or typed pre-observation/possibly-observed failure out. It
does not retry, reconcile or interpret business acceptance.

A strict local peer validates SOAP/WSDL namespaces/actions, TLS/mTLS chain/name/
time, request bytes, size/time limits, streaming/backpressure and cancellation.
Faults cover DNS/connect/TLS/write partial/timeout/reset, response truncation/
oversize/malformed and connection loss after request observation.

Reports preserve endpoint class (not secret), certificate identity metadata,
attempt ID, observed boundary and byte digests. Live AEAT tests are separate,
credentialled observations that cannot make deterministic CI green or generalize
availability. Hidden library retry and permissive TLS fail conformance.
