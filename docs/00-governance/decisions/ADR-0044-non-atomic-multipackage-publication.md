---
id: ADR-0044
title: Non-atomic multi-package publication
status: accepted
authority: decision
owner: release-owner
created: 2026-09-12
last-reviewed: 2026-09-12
dependencies: [ADR-0039, ADR-0040, ADR-0043]
sources: [SRC-0069]
historical-inputs: [REV-066, REV-082]
---

# ADR-0044: Non-atomic multi-package publication

npm cannot transactionally publish three packages or move three dist-tags.
Publish library, adapter kit and CLI under unique `verification-X-Y-Z`, recording
the result of each irreversible call. `latest` remains unchanged until all three
registry tarballs/provenance/consumers pass independent verification.

Then move `latest` in dependency order and verify convergence before publishing
the GitHub Release. A partial version is never a release: stop, preserve evidence,
deprecate any visible partial packages with actionable warning, open an incident
and use a new patch/prerelease after repair. Never republish/reuse the version.

Fault tests fail each call and simulate timeout/unknown outcome, eventual registry
visibility and dist-tag split. Unpublish is exceptional under official policy and
legal/security review because installed bytes cannot be recalled.
