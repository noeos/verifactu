---
id: RELEASE-DOC-0025
title: Operations runbook catalog
status: draft
authority: normative
owner: operations-owner
created: 2026-09-12
last-reviewed: 2026-09-12
decisions: [ADR-0049, ADR-0050]
historical-inputs: [REV-037, REV-043, REV-060, REV-078, REV-082, REV-083]
---

# Operations runbook catalog

Each runbook has ID/version/owner, trigger/severity, safety/preconditions, exact
observations/actions, decision branches, stop/escalate, verification, recovery,
communications, evidence and last drill. Commands use placeholders/allowlists and
default to read-only/nonproduction.

Mandatory scenarios: AEAT outage/unknown response/backlog; expired/revoked cert;
disk/resource/store corruption; lost key/maintainer/workstation; GitHub/npm/
dependency/runner compromise; partial publish/wrong dist-tag; nonreproducible
build; source/edition change; privacy breach; restore/migration; bad release and
vulnerability embargo.

Runbooks never advise replay before reconciliation, delete evidence, disable TLS/
signature/checks, target production destructively or expose secrets/fiscal data.
Every critical runbook is exercised before GA and on material change.
