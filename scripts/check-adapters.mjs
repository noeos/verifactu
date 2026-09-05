// SPDX-License-Identifier: Apache-2.0
import {
  MemoryOutboxStore,
  MemoryRecordStore,
} from "../packages/verifactu/dist/esm/adapters/index.js";
import { runAdapterConformance } from "../packages/adapter-kit/dist/esm/index.js";

const result = await runAdapterConformance({
  name: "built-in-memory",
  version: "1",
  recordStore: new MemoryRecordStore(),
  outboxStore: new MemoryOutboxStore(),
});
if (!result.ok || result.value.status !== "passed") throw new Error("Adapter conformance failed");
if (result.value.scenarios.some((scenario) => scenario.status === "failed"))
  throw new Error("Adapter conformance scenario failed");
console.log(`Adapter conformance passed (${result.value.scenarios.length} scenarios).`);
