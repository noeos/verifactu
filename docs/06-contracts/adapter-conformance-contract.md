---
id: CONTRACT-DOC-0015
title: Adapter conformance contract
status: draft
authority: normative
owner: api-owner
created: 2026-09-12
last-reviewed: 2026-09-12
decisions: [ADR-0022, ADR-0023, ADR-0024]
historical-inputs: [REV-043, REV-044, REV-053, REV-061]
---

# Adapter conformance contract

An adapter report names package/version/tarball digest, source commit,
capability/level, runtime/OS, configuration digest, harness version, fixture
digests and every test result. Empty discovery, skipped mandatory cases,
unexpected exception, timeout or harness uncertainty fails the report.

Mandatory suites cover contract/schema fidelity; context isolation; limits and
cancellation; ownership/cleanup; concurrency; idempotency; conflict semantics;
crash/restart; durability acknowledgment; CAS/fencing; exact bytes; malformed
provider/network output; and redaction. Store adapters additionally prove every
atomic/crash invariant. Transport adapters prove one observation/no hidden
retry. Signing/XML adapters prove hostile inputs and returned-output validation.

The suite runs against a real adapter and its supported backend, not only a mock
or in-memory substitute. Required fault controls are a qualification condition.
Passing establishes only the named contract level/environment; it is not legal,
security, AEAT or production certification. Reports are signed/retained as
release evidence and expire when code, backend or environment assumptions move.
