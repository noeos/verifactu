---
id: ROADMAP-DOC-0012
title: Issue and pull-request mapping
status: approved
authority: normative
owner: repository-owner
created: 2026-09-12
last-reviewed: 2026-09-12
decisions: [ADR-0031, ADR-0051]
historical-inputs: [REV-063, REV-073, REV-079]
---

# Issue and pull-request mapping

Canonical chain is work package→issue→branch→SSH+DCO commits→PR→final head checks/
reports→GitHub squash→main commit→evidence. Each link records IDs/SHA and scope;
co-authors/bots remain truthful.

One PR may satisfy several packages only with explicit closure per package; one
package may span PRs while remaining active. Auto-closing an issue does not mark
done until the graph validates. Rebase/new push invalidates head evidence and
merged branch deletion preserves PR/commit links.
