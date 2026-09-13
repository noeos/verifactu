---
id: RELEASE-DOC-0022
title: Maintainer, account and key recovery
status: draft
authority: normative
owner: project-owner
created: 2026-09-12
last-reviewed: 2026-09-12
decisions: [ADR-0041, ADR-0042, ADR-0043, ADR-0050]
historical-inputs: [REV-073, REV-078, REV-081]
---

# Maintainer, account and key recovery

Inventory GitHub/npm organization, email/domain/DNS, SSH signing, hardware MFA,
OIDC trusted publisher, certificates and evidence/mirror storage with owners,
recovery contacts, least privilege and last drill. Secret values/codes never enter
the public repository; encrypted custody and access events are separate.

Before GA prove recovery from workstation loss and maintainer incapacity without
routine bypass or persistent npm token. Compromise freezes publish, revokes
sessions/keys/owners/publisher, verifies history/tags/packages since last trusted
point and restores through independently authenticated channels.

Single-person risk remains explicit until a legitimate organizational custodian
exists; no fake second account. Quarterly access review and immediate drill after
owner/platform change prevent stale recovery assumptions.
