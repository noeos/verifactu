---
id: INTEGRATION-DOC-0001
title: Ecosystem boundaries
status: draft
authority: normative
owner: integration-owner
created: 2026-09-12
last-reviewed: 2026-09-13
decisions: [ADR-0002, ADR-0038]
historical-inputs: [REV-017, REV-028, REV-061]
---

# Ecosystem boundaries

Facturacion is a future product. When built, it will own users, authorization,
commercial invoice/domain/UI and the host transaction. VeriFactu owns RRSIF
applicability/configuration, fiscal records/
events, chains, exact artifacts, modes, AEAT orchestration and public contracts.
Verification Engine owns domain-neutral evidence/profile verification and must
not learn tax rules. Adapters/providers own capabilities, not fiscal decisions;
AEAT owns external acceptance and availability.

```text
Facturacion -> public VeriFactu library/CLI
                  | -> Verification Engine public package/profile
                  | -> host storage/UoW adapter
                  | -> admitted XML/XAdES/certificate/transport providers
                  ` -> edition-bound AEAT endpoint
```

The arrow is the target architecture, not a claim of current integration. Current
VeriFactu conformance uses a maintained synthetic host; real integration will be
implemented and evidenced in the future Facturacion repository.

Every datum/effect has one authoritative owner and explicit transfer, trust,
privacy, retry and retention boundary. Repositories do not import sibling source,
share private stores, publish each other or duplicate mutable rules. External
acceptance never proves internal compliance, and internal verification never
claims AEAT receipt.
