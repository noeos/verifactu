# Security policy

## Supported versions

There is currently no released or implemented VeriFactu product version, so no
runtime or package version is supported. Security-relevant findings in the
repository's documentation, governance scripts, workflows or GitHub
configuration are nevertheless in scope and should be reported privately.

Support ranges, acknowledgement/triage objectives and the minimum major-version
security-support period will be published before general availability after the
required capacity and legal review. No unpublished target overrides an
applicable legal deadline.

## Reporting a vulnerability

Use [GitHub private vulnerability reporting](https://github.com/noeos/verifactu/security/advisories/new)
as the primary channel. If that channel is unavailable, open a public issue that
contains only a request for a private contact method—no vulnerability detail or
sensitive material. Agree the encrypted transfer method before sending evidence.

Never publish or attach real fiscal/customer records, taxpayer identities,
credentials, certificates, private keys, production XML, exploit details or
other personal/confidential data. Use the smallest synthetic reproduction. Do
not perform destructive testing, denial of service, social engineering,
credential attacks, privacy intrusion or testing against AEAT/third-party
systems without their explicit authorization.

## Handling and disclosure

Reports are handled confidentially on a need-to-know basis. Triage records exact
affected versions/commits and editions, reachability, CVSS 4.0, observed
exploitation, fiscal/privacy/legal impact, mitigations and related variants.
Scanner output alone neither proves nor closes a vulnerability.

Fixes must pass the complete protected path, include regression and
related-variant coverage, and preserve release integrity. Coordinated disclosure,
reporter credit, GHSA/CVE assignment, OSV-compatible ranges, mitigations and
consumer instructions are determined from the validated impact; no unsafe
publication date is promised. See the normative
[vulnerability disclosure policy](docs/15-release-operations/vulnerability-disclosure-and-advisories.md)
and [incident response plan](docs/15-release-operations/incident-response.md).

Good-faith research within these boundaries will not be intentionally pursued
by this project merely for reporting. This statement cannot authorize access to
third-party systems, waive applicable law or bind third parties.
