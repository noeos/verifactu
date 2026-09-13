---
id: REPO-DOC-0016
title: Workflow permissions and trust
status: approved
authority: normative
owner: security-owner
created: 2026-09-12
last-reviewed: 2026-09-12
sources: [SRC-0052, SRC-0058]
decisions: [ADR-0032]
historical-inputs: [REV-075, REV-078, REV-080]
---

# Workflow permissions and trust

Repository default and workflow top-level token permissions are empty/read-only.
Each job declares only necessary scopes: ordinary validation needs contents read;
security upload may receive security-events write under trusted applicable events;
attestation/release alone may receive `id-token` and attestations/packages write.

Secrets and protected environments are never available to fork/untrusted PR code,
Dependabot execution or a job that checks out mutable untrusted content. OIDC is
bound to repository, workflow file, protected ref/environment and subject. Tokens
are not persisted into checkout or exposed through command arguments/logs.

Reusable workflows declare typed inputs/secrets and pin external callers; called
workflow permissions cannot exceed the caller. Self-hosted runners are forbidden
for public untrusted changes unless a separately approved ephemeral isolation
architecture exists.

Policy statically derives effective permissions across reusable calls and tests
malicious event/ref/expression inputs. Unknown permission, secret reference or
privileged job dependency fails closed.
