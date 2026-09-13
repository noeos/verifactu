---
id: AEAT-DOC-0003
title: SOAP binding and wire message
status: draft
authority: normative
owner: integration-owner
created: 2026-09-12
last-reviewed: 2026-09-12
sources: [SRC-0019, SRC-0047]
historical-inputs: [REV-037]
---

# SOAP binding and wire message

For each operation the binding profile fixes SOAP version, envelope namespace,
permitted header/body child QName, document/literal wrapper, record order,
SOAPAction, HTTP method, content type/charset and UTF-8 serialization. A batch
array or record fragment is not a SOAP request until the exact envelope/header
and operation wrapper exist and validate.

Request creation consumes committed eligible artifact IDs and produces one
immutable SOAP artifact with length/digests and correlation manifest. The
transport sends precisely those bytes; compression/chunking may change transfer
framing but not representation and must be declared/limited.

Inbound bytes are bounded before XML parsing, then classified as expected
response, SOAP Fault, non-SOAP HTTP representation, malformed/truncated or
unknown. Namespaces and QNames are authoritative, not local names. Fixtures
cover action/content-type mismatch, extra headers, wrong wrapper/order,
SOAP 1.2 substitution, XML declaration/encoding and hostile payloads.
