## Change

Describe the single responsibility and link its issue or approved decision.

## Traceability

- Requirement/control identifiers:
- Regulatory source and fragment:
- Compatibility impact:
- Security and privacy impact:
- Performance impact:
- Release impact:

## Evidence

- [ ] `npm ci --ignore-scripts --omit=optional` succeeds from a clean tree.
- [ ] `npm run ci` succeeds without changing tracked files.
- [ ] Negative and boundary tests cover the change.
- [ ] Generated artifacts, contracts and documentation are synchronized.
- [ ] No secrets, personal data, customer payloads or workstation paths are present.
- [ ] Every commit has DCO sign-off and a valid signature.

## Critical change gate

## Release conclusion

State the SemVer/changelog conclusion, including “none” when applicable.
