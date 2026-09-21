# Regulatory editions

P3 introduced the retained `rrsif-2026-09-21-observed-candidate`. P3-B then
closed its missing-source edges with the immutable
`rrsif-2026-09-21-authoritative` snapshot and generated the current
`rrsif-2026-09-21-authoritative-candidate` contracts. The current candidate is
content-addressed and verification-only (`creationAllowed=false`) because it has
not been approved and activated. Generation is offline and deterministic;
runtime never performs network refresh. The superseded observed candidate stays
available only as historical custody evidence and is not a current selector.
