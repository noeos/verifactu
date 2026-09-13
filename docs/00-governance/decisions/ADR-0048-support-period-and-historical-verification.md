---
id: ADR-0048
title: Support period and historical verification
status: proposed
authority: decision
owner: product-owner
created: 2026-09-12
last-reviewed: 2026-09-12
sources: [SRC-0063, SRC-0077]
historical-inputs: [REV-017, REV-074, REV-083, REV-084]
---

# ADR-0048: Support period and historical verification

Propose at least five years of security support for each stable major from GA,
extended where applicable CRA expected-use, contract or legal assessment demands.
The commitment is published only after capacity/legal review before GA. Current
major receives functional/regulatory/security support; older supported lines
receive stated security and critical legal compatibility.

Creation support and historical verification are separate. An edition/runtime/
provider may cease new issuance while its exact artifacts, schemas, keys/trust
policy and verifier remain readable for the evidence-retention obligation.
Supported runtime claims never include upstream-EOL Node without an explicit
maintained security plan.

EOL is versioned, announced with migration and tested archival access; urgent
unsafe withdrawal may shorten notice but requires advisory/risk evidence. Vague
“best effort” and indefinite unresourced support were rejected.
