import assert from "node:assert/strict";
import test from "node:test";

const api = await import(
  process.env.VERIFACTU_TEST_ENTRY ??
    "../../evidence/runs/artifacts/build/verifactu/dist/index.js"
);

test("current candidate configuration remains creation-disabled", () => {
  const edition = api.editionId("rrsif-2026-09-21").value;
  const configuration = api.defineConfiguration({
    editionPolicy: {
      edition,
      creationAllowed: false,
      allowedModes: ["non-verifactu", "verifactu"],
    },
    strictDecoding: true,
  });
  assert.equal(configuration.editionPolicy.creationAllowed, false);
  assert.equal(configuration.strictDecoding, true);
  assert.equal(Object.isFrozen(configuration.editionPolicy.allowedModes), true);
});
