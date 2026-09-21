# Regulatory editions

P3 introduces immutable source snapshots and candidate contract outputs. The
current `rrsif-2026-09-21-observed-candidate` is content-addressed and blocked:
it is verification-only (`creationAllowed=false`) because six linked AEAT
payload authorities remain unavailable through normal TLS/authority custody.
Generation is offline and deterministic; runtime never performs network refresh.
