# Security policy

## Reporting a vulnerability

Do not disclose vulnerabilities, taxpayer data, certificates or private keys in public issues.
Use the repository's private security advisory form or contact `security@noeos.es` with a minimal
reproduction, affected commit, impact and suggested mitigation. Reports are acknowledged within
five business days and tracked with a redacted identifier.

## Supported versions

Only the latest `main` commit and the current release candidate receive security fixes. There is
no stable 1.0.0 release yet; portal interoperability and publication remain later roadmap phases.

## Security guarantees

The component is offline-first by default, rejects unsafe XML and untrusted paths, keeps private
keys behind opaque ports, and never intentionally emits fiscal payloads or secrets in logs.
These statements describe component controls and are not legal advice or a guarantee of regulatory
compliance for a host application.
