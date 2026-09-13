---
id: INTEGRATION-DOC-0014
title: Adapter conformance kit
status: approved
authority: normative
owner: integration-owner
created: 2026-09-12
last-reviewed: 2026-09-12
decisions: [ADR-0026, ADR-0038]
historical-inputs: [REV-060, REV-061, REV-062]
---

# Adapter conformance kit

The public kit accepts an adapter factory, disposable-resource controller,
declared conformance level/capabilities, fault controller and safe configuration.
It discovers a versioned scenario manifest and reports selected/executed results,
post-state, evidence and cleanup per capability.

Capabilities include storage/UoW, retention/restore, XML/XSD, signer/certificate
and transport levels. Each required level names mandatory scenarios/fault hooks;
claims cannot self-mark not applicable. Unsupported is an honest result and
prevents certification at that level. Zero adapters/tests/assertions fails.

Factories isolate every scenario and prove teardown. Destructive execution
requires double opt-in, random disposable namespace and production endpoint/
identifier denylist. Reports are deterministic, schema-valid and subject-bound;
the kit version alone never endorses an adapter.
