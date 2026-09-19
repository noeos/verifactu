---
id: CRYPTO-DOC-0005
title: XSD validation
status: approved
authority: normative
owner: cryptography-owner
created: 2026-09-12
last-reviewed: 2026-09-12
decisions: [ADR-0018, ADR-0019]
sources: [SRC-0020, SRC-0035]
historical-inputs: [REV-008, REV-009]
---

# XSD validation

Validation uses the selected edition's complete digest-verified local schema
closure and a standards-conforming XSD engine. URI resolution is a closed map;
DTD, external entities, XInclude and all network/files outside the mounted
edition are denied. Source and expanded bytes, depth, nodes, attributes,
namespace declarations, text and wall/CPU time are bounded before/during parse.

The validator returns valid/invalid/unavailable/limit/cancelled/defect plus
stable diagnostics mapped to safe paths and schema source IDs. Engine crash or
unsupported construct fails closed and invalidates its worker; it never becomes
“valid”. XSD success is recorded separately from semantic validation.

Conformance compares positive and minimally mutated official fixtures against
an independent backend. Negative cases include wrong namespace/order/type/
cardinality/facet, missing imports, poisoned resolver, XXE, huge declarations,
deep nesting, invalid encodings and cancellation. CI runs offline and asserts
zero external resolution attempts.
