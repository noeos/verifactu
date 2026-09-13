---
id: INTEGRATION-DOC-0004
title: Evidence profile compatibility
status: draft
authority: normative
owner: integration-owner
created: 2026-09-12
last-reviewed: 2026-09-12
decisions: [ADR-0009, ADR-0021, ADR-0038]
historical-inputs: [REV-015, REV-016, REV-019]
---

# Evidence profile compatibility

The `noeos.verifactu/<major>` profile has immutable schema, canonical encoding,
claim vocabulary, artifact relationships, algorithm identifiers, bounds and
official/Engine/verifactu claim separation. It references bytes by digest and
media/edition identity; it does not embed unnecessary fiscal/personal data.

Producers and verifiers negotiate an explicitly supported profile. Unknown major,
unknown critical field/claim, invalid encoding, duplicate identifier, digest
mismatch or unsupported algorithm fails/returns unsupported—not best-effort
valid. Minor additive evolution is allowed only when old verifiers safely ignore
noncritical fields and vectors prove it.

Golden/negative vectors are independently verified and retained for every
supported/historical profile. Migration creates a new evidence object linked to
the original; it never rewrites historic bytes or upgrades an old claim silently.
