---
id: REPO-DOC-0020
title: Repository policy as code
status: approved
authority: normative
owner: repository-owner
created: 2026-09-12
last-reviewed: 2026-09-12
decisions: [ADR-0026, ADR-0030, ADR-0033, ADR-0034]
historical-inputs: [REV-063, REV-064, REV-071, REV-074, REV-075, REV-076, REV-079]
---

# Repository policy as code

Versioned schemas/registries cover documents and lifecycle, IDs/traceability,
historical dispositions, sources/editions, tree/ownership/imports/exports,
toolchain/tasks, dependencies/Actions/tools/licences, workflows/permissions/
checks, fixtures/tests/reports, packages/SBOM/provenance and GitHub desired state.

Checkers parse language/YAML/JSON/lock/tar structures rather than grep words.
They fail on parse error, unknown schema/version/path, empty discovery, duplicate
truth, stale generated view or incomplete pagination. Diagnostics carry policy
ID, subject and remediation without leaking data.

Every critical checker has a positive fixture and one mutation per named failure
class. Its own deletion, exclusion, configuration weakening or report omission
must be caught by an independent bootstrap/closure control. Baselines can classify
legacy observations but cannot hide new normative violations.

Local and CI use the same locked tasks offline; live drift checks are separate.
Exceptions are exact, expiring and machine enforced through `EXC-*`.
