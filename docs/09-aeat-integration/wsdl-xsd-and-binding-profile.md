---
id: AEAT-DOC-0002
title: AEAT WSDL XSD and binding profile
status: approved
authority: normative
owner: integration-owner
created: 2026-09-12
last-reviewed: 2026-09-12
decisions: [ADR-0018, ADR-0024]
sources: [SRC-0019, SRC-0020, SRC-0047]
historical-inputs: [REV-037, REV-039]
---

# AEAT WSDL XSD and binding profile

Import recursively pins every WSDL/XSD import/include, final URI and digest,
then resolves only from the closed local map. Generation selects the exact SOAP
binding/port/operation and records style/use, message/part, element QName,
SOAPAction, endpoint and faults. Unsupported constructs or ambiguous bindings
block the edition.

Generated structural models are reconciled with AEAT service prose,
validations/errors and examples. Manual overrides are forbidden; a sourced
semantic overlay records necessary constraints without changing generated
structure. Namespace, cardinality, element order and response identity coverage
are reported.

Two clean generation runs must match byte-for-byte. Binding tests validate
captured envelopes against pinned schemas and an independent SOAP/WSDL tool.
Mutations cover namespace/action/body wrapper/order/fault and imported-schema
changes. WSDL-valid is not equivalent to accepted business content.
