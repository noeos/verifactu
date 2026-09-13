---
id: BUILD-DOC-0001
title: Dependency admission
status: draft
authority: normative
owner: supply-chain-owner
created: 2026-09-12
last-reviewed: 2026-09-12
decisions: [ADR-0034]
historical-inputs: [REV-069, REV-070, REV-071]
---

# Dependency admission

Every direct dependency needs purpose, alternatives including standard-library/
owned code, exact version/source/integrity, maintainer/repository identity,
release age/provenance, licence, funding/abandonment risk, advisories, install
scripts/native/optional code, transitive graph, permissions/network and exit plan.

Runtime dependencies are minimized and exact; development dependencies receive
the same execution scrutiny. A seven-day cooling period applies to non-emergency
versions. Security urgency uses a recorded exception with higher source/diff/
behavior review, never an unpinned update.

Admission requires representative behavioral/negative tests, clean install and
licence/SBOM integration. Popularity, zero known CVEs, signature or Scorecard is
only a signal. Unsupported maintenance, opaque binary, incompatible licence,
unbounded privilege or missing origin blocks. Review recurs on update, owner/
licence/repository change, advisory or inactivity threshold.
