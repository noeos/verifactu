---
id: AEAT-DOC-0010
title: AEAT faults and transport errors
status: approved
authority: normative
owner: integration-owner
created: 2026-09-12
last-reviewed: 2026-09-12
sources: [SRC-0021, SRC-0047, SRC-0048]
historical-inputs: [REV-039, REV-042, REV-043]
---

# AEAT faults and transport errors

Failure classes are local preflight; DNS/proxy/connect; TLS authentication;
request-not-started; request-partially/fully-written; timeout/cancel by phase;
HTTP status/headers; response truncation/limit/encoding; SOAP Fault; schema/
parse; correlation; AEAT global/line business result; and result-persistence
failure. Class and observed facts are never collapsed into “network error.”

Retryability is not a parser property. The durable policy consumes operation,
edition, attempt phase, proof request was not applied, SOAP/AEAT code, wait and
history. Once bytes may have reached AEAT without a complete attributable
response, outcome is indeterminate.

Diagnostics record endpoint identity, safe TLS/protocol metadata, byte counts,
attempt and response digest—not credentials or payload. The harness injects
each class, HTTP bodies including HTML, SOAP faults with hostile detail,
disconnect at every write/read boundary, malformed XML and storage failure
after valid response.
