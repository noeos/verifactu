---
id: CONTRACT-DOC-0004
title: Command-line interface contract
status: approved
authority: normative
owner: api-owner
created: 2026-09-12
last-reviewed: 2026-09-12
historical-inputs: [REV-047, REV-049, REV-050, REV-055]
---

# Command-line interface contract

Commands mirror real library operations: `edition list|inspect|verify`,
`record validate|prepare|commit|verify`, `chain verify`, `qr create|verify`,
`submission plan|run-once|reconcile|status`, `evidence export|verify`, and
`adapter verify`. Commands unavailable for the configured capability return a
stable failure; no placeholder reports success.

Input is exactly one of `--input <file>` or stdin, with explicit `--format
json|ndjson`; output is stdout data and stderr diagnostics. Machine mode is
UTF-8 canonical JSON/NDJSON, never mixed with progress. Human mode is explicit.
No interactive prompt occurs in CI/non-TTY mode; secrets use provider handles or
protected descriptors, never command-line values.

Common options include config, edition, context, deadline and output format.
`--dry-run` performs all deterministic validation/artifact planning but no
durable/network/key effect and states what remains unproved. SIGINT/SIGTERM
propagate cancellation and await bounded cleanup.

Exit codes: 0 success; 2 invalid invocation/input; 3 domain nonconformance; 4
conflict/stale state; 5 unavailable dependency; 6 external rejection; 7
indeterminate/reconciliation required; 8 internal defect. Help/version exit 0
and are generated/tested against the grammar and package identity.
