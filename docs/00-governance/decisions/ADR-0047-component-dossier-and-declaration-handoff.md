---
id: ADR-0047
title: Component dossier and responsible-declaration handoff
status: accepted
authority: decision
owner: regulatory-owner
created: 2026-09-12
last-reviewed: 2026-09-12
dependencies: [ADR-0002, ADR-0009, ADR-0045]
sources: [SRC-0011, SRC-0014, SRC-0026]
historical-inputs: [REV-063, REV-074, REV-082]
---

# ADR-0047: Component dossier and responsible-declaration handoff

Each release produces an immutable component assurance dossier and deterministic
draft/handoff containing exact product/package/edition/evidence inputs. It is
clearly not the final declaration of an unknown integrated SIF.

Only the legally responsible producer, after confirming Facturacion deployment,
identity/address, version/components, modes/multi-taxpayer/signature behavior and
complete evidence, may authorize/sign/publish the official responsible
declaration. VeriFactu provides validation and third-party declarations without
impersonating that role or claiming AEAT approval.

Missing/placeholder/stale field, wrong official order, digest/version mismatch,
unsupported exclusive-mode claim or unresolved contradictory finding blocks the
handoff. Every material release/integration change creates a new immutable
declaration candidate; historical versions remain accessible.
