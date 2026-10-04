import assert from "node:assert/strict";

const faultId = /^P5-FAULT-(?:0[0-9]{2}|056)$/u;

/** Emit a machine-censused fault only after its production-boundary oracle passes. */
export function recordP5FaultDetection(id, detected) {
  assert.match(id, faultId, "fault IDs must use the frozen P5 plan namespace");
  assert.equal(detected, true, `${id} escaped its expected fail-closed oracle`);
  console.log(`P5_FAULT_DETECTED ${id}`);
}
