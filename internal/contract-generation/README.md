# Contract generation

`tooling/regulatory/generate-contracts.mjs` generates deterministic structural
metadata, staged public schemas, SOAP-binding discovery and catalogue access
from an immutable snapshot. It rejects unresolved/ambiguous inputs and emits a
blocked candidate when the authoritative payload graph is incomplete.
