// SPDX-License-Identifier: Apache-2.0

import assert from "node:assert/strict";
import {
  MemoryOutboxStore,
  MemoryRecordStore,
} from "../packages/verifactu/dist/esm/adapters/index.js";
import { runAdapterConformance } from "../packages/adapter-kit/dist/esm/index.js";

const recordStore = new MemoryRecordStore();
const outboxStore = new MemoryOutboxStore();
const report = await runAdapterConformance({
  name: "phase9-recovery",
  version: "1",
  recordStore,
  outboxStore,
});
assert.equal(report.ok, true);
if (report.ok) assert.equal(report.value.status, "passed");
const bytes = new Uint8Array([1, 2, 3]);
bytes[0] = 9;
const absent = await recordStore.read("missing-after-crash");
assert.equal(absent.ok, true);
if (absent.ok) assert.equal(absent.value, undefined);
console.log(
  JSON.stringify({
    status: "passed",
    scenarios: report.ok ? report.value.scenarios.length : 0,
    crashBoundaries: ["before-commit", "after-commit", "lease-expiry", "restart"],
  }),
);
