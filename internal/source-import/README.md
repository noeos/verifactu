# Source import

P3 source custody is implemented by `tooling/regulatory/import-snapshot.mjs`.
Acquisition is deliberately separate from offline promotion: the checked-in
snapshot contains only bounded captured bytes and a manifest; generation tasks
run with network denied. Blocked source edges remain explicit and prevent
activation.
