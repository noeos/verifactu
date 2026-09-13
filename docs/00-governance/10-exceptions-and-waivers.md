---
id: GOV-010
title: Exceptions and waivers
status: draft
authority: normative
owner: project-owner
created: 2026-09-11
last-reviewed: 2026-09-12
decisions: [ADR-0004]
historical-inputs: [REV-063, REV-073, REV-074]
---

# Exceptions and waivers

## Default rule

An exception is a controlled, temporary divergence from an approved internal
control. It cannot waive applicable law, falsify evidence, weaken immutable
history, expose secrets or authorize a release that contradicts its claims.
Convenience, a failing gate or schedule pressure is not sufficient cause.

## Required record

Every exception has an `EXC-NNNN` record created before use containing owner,
exact scope, rationale, affected requirements and assets, threat/risk analysis,
compensating controls, start time, hard expiry, detection and rollback plan,
evidence retained, approval and closure conditions.

Exceptions are narrow by commit, branch, environment, artifact and time. They
never use open-ended language such as “until convenient”. Renewal is a new
decision with fresh evidence; recurrence triggers correction of the underlying
design.

## Execution

Where an emergency makes prior recording impossible, the maintainer preserves
the event and opens the record at the first safe opportunity. Emergency access
is revoked immediately after stabilization. The affected result is not called
normally verified and cannot be promoted until full controls rerun.

Bypassing a GitHub rule, dismissing a finding, rerunning a flaky job, changing a
required check or manually publishing an artifact is always security-relevant
and auditable even if GitHub technically permits it.

## Closure

Closure requires expiry or removal of the divergence, verification of restored
controls, reconciliation of artifacts and repository state, risk disposition,
and a retrospective when impact was material. Closed records remain immutable.

## Bootstrap exception

The only pre-authorized exception is the one-time empty-repository bootstrap in
`GOV-004`. Its scope is minimal governance and enforcement; it expires when
`main` protection is read back and may never authorize product code.
