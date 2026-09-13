---
id: PROD-DOC-0009
title: Product support and lifecycle
status: draft
authority: normative
owner: product-owner
created: 2026-09-12
last-reviewed: 2026-09-12
decisions: [ADR-0007, ADR-0009]
requirements: [PROD-0040, PROD-0041, PROD-0042, PROD-0043]
historical-inputs: [REV-004, REV-006, REV-066, REV-067, REV-070, REV-082, REV-083, REV-084]
---

# Product support and lifecycle

## Independent version dimensions

Product package version, public API version, regulatory edition, Verification
Engine/profile version, adapter contract version and evidence schema version are
separate. Compatibility is an explicit matrix; one semver cannot encode them all.

## Product lifecycle

`development -> release-candidate -> stable -> maintenance -> deprecated ->
end-of-support -> revoked`.

- Development artifacts carry no stable compliance claim.
- A release candidate has complete intended scope but awaits final evidence.
- Stable requires all release gates, signed artifacts and responsible declaration.
- Maintenance accepts security, defect, compatibility and regulatory updates.
- Deprecation identifies successor, migration, dates and retained verification.
- End-of-support never deletes required fiscal evidence or declarations.
- Revocation is reserved for compromised/misrepresented artifacts and includes
  impact, consumer action and preserved history.

## Regulatory lifecycle

Edition states are `candidate`, `approved`, `active`, `sunset`, `historical` and
`revoked-for-new-generation`. Historical verification remains supported for the
required preservation horizon. An old edition may be prohibited for generating
new records while remaining mandatory for verification/export.

## Compatibility policy

Breaking public changes require a major product version; additions cannot
weaken exhaustive handling silently. Regulatory breaking changes may require a
new edition without a package major when public types already model editions.
Consumers receive machine-readable compatibility and migration reports.

## Support commitments

Published support tables name exact Node/npm/platform combinations and do not
use floating “LTS”. Security response, critical regulatory updates and data
recovery take priority over features. Support cannot promise AEAT resolution or
legal advice, but must provide actionable evidence and safe failure guidance.

## Migration and rollback

Every upgrade preflights persisted schema, edition, adapters, provider and host
conformance; backs up recoverably; migrates atomically/idempotently; validates
post-state; and documents rollback limits. Rollback is forbidden when it would
interpret new fiscal facts under an incompatible old edition or lose durable
attempt history.

## Discontinuation

Before EOL, consumers can export complete scoped records, events, sources,
editions, verification material, declarations and evidence in documented open
formats. Restoration drills prove the export is usable without the discontinued
runtime where law and licensing permit.
