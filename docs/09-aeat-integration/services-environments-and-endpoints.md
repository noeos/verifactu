---
id: AEAT-DOC-0001
title: AEAT services environments and endpoints
status: draft
authority: normative
owner: integration-owner
created: 2026-09-12
last-reviewed: 2026-09-12
review-by: 2026-10-12
decisions: [ADR-0009, ADR-0024]
sources: [SRC-0017, SRC-0019, SRC-0022, SRC-0025]
historical-inputs: [REV-038, REV-044]
---

# AEAT services environments and endpoints

Each regulatory edition contains an immutable service registry: operation ID,
purpose/applicability, WSDL service/port/binding/operation, namespaces,
SOAPAction, request/response schemas, production/test endpoint identities,
authentication class, limits and source digests. Voluntary submission,
consultation, authority-requested submission and QR comparison are not one
generic endpoint.

Environment is an explicit closed value bound to configuration, credentials,
artifacts and attempts. Production requires explicit activation and cannot be
selected by absence of `--test`. Endpoint resolution uses only the verified
edition allowlist; scheme/host/port/path and DNS/TLS authority are checked.
Caller URLs, HTTP, userinfo, fragments and cross-environment redirects fail.

Edition import detects WSDL/portal disagreement and records ambiguity rather
than rewriting an active endpoint. Endpoint health does not prove correct
identity or future availability. Drift review is monthly and event-driven;
change creates impact/new edition or an emergency security action with evidence.
