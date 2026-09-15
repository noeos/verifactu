# Source import component

Official acquisition has two non-interchangeable stages:

1. `acquire.mjs` uses the reviewed, digest-pinned plan, default TLS validation,
   exact origins, no redirects, identity encoding, a 30-second deadline and
   streaming byte limits. It incrementally hashes and synchronizes temporary
   files, then publishes the complete ignored quarantine atomically.
2. `promote.mjs` runs offline, rechecks both digests and regular-file identity,
   authenticates the acquisition implementation, and atomically copies the
   complete set into a new snapshot with a deterministic source manifest.

The acquisition plan records sources that cannot currently be obtained without
weakening authority or transport security. They remain explicit blockers; old
copies and permissive TLS are not substitutes. Production packages never import
either script and never perform regulatory network refresh.

The current canonical source snapshot is
`rrsif-2026-09-15+src.c0c6eb21f6d2`. `policy:regulatory-source-negative`
exercises 21 complete, boundary and falsifying cases.
The snapshot is blocked and may feed only bounded structural extraction; it
cannot approve an edition or authorize fiscal artifact creation.
