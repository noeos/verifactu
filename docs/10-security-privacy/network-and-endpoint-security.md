---
id: SEC-DOC-0007
title: Network and endpoint security
status: approved
authority: normative
owner: security-owner
created: 2026-09-12
last-reviewed: 2026-09-12
review-by: 2026-10-12
dependencies: [SEC-DOC-0005, REG-DOC-0005]
historical-inputs: [REV-010, REV-011, REV-012, REV-013, REV-014]
---

# Network and endpoint security

Core domain packages have no ambient network capability. Submission uses an
injected adapter and an immutable endpoint profile owned by the regulatory
edition and deployment environment. Arbitrary caller URLs are prohibited.

## Endpoint policy

The profile allowlists HTTPS scheme, normalized hostname, port, path/method,
environment and authority. It rejects credentials/fragments, noncanonical host
forms, IP literals unless explicitly official, loopback, link-local, private,
multicast and metadata ranges. DNS resolution is checked before connection and
each redirect; redirects are denied by default. Proxy use is explicit and
subject to equivalent destination policy.

TLS performs platform-supported secure protocol/cipher negotiation, hostname
verification and configured public/private trust validation. Disabling
verification is impossible in production contracts. Mutual TLS/private
certificate use is delegated to a custody adapter without exporting key bytes.
Pinning is used only when an official operational policy includes safe rotation.

## Bounded exchange

Connect, handshake, first-byte, idle and total deadlines are distinct. Request,
response, header, decompressed body and redirect counts are bounded. Compression
ratio attacks, slow responses and truncated bodies fail safely. Retry policy is
method/outcome aware, jittered and globally budgeted; uncertain outcomes require
reconciliation before replay.

## Evidence and privacy

Attempts record endpoint profile ID, resolved peer class (not unnecessary raw
data), TLS/trust outcome, request/response digests, safe authority identifiers,
timings and result. Payloads and credentials never enter ordinary logs. Network
tests use controlled DNS/TLS/redirect servers and prove no unintended socket.
