---
id: RELEASE-DOC-0009
title: npm package ownership and preflight
status: approved
authority: normative
owner: release-owner
created: 2026-09-12
last-reviewed: 2026-09-12
sources: [SRC-0056, SRC-0070]
decisions: [ADR-0039, ADR-0043]
historical-inputs: [REV-069, REV-078, REV-081, REV-082]
---

# npm package ownership and preflight

Audit exact package names, public access, organization/owners, 2FA/session policy,
trusted publisher repository/workflow/environment, existing versions/dist-tags/
deprecations and absence of legacy automation tokens. Values are read back through
registry/API and sensitive owner details stay restricted.

Preflight packs/inspects/installs exact tarballs, checks name/version/licence/
repository/exports/bin/files/internal exact dependencies, size and provenance
eligibility. A dry-run cannot reserve or prove ownership.

Unknown owner, namespace conflict/transfer, stale publisher, token, unexpected
version/tag or inaccessible critical setting blocks. Account/organization recovery
and contacts are exercised before first publication.
