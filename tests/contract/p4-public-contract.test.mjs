import assert from "node:assert/strict";
import test from "node:test";

const api = await import(
  process.env.VERIFACTU_TEST_ENTRY ??
    "../../evidence/runs/artifacts/build/verifactu/dist/index.js"
);

test("P4-A public contract exposes only explicit pure capabilities", () => {
  for (const name of [
    "decodeJson",
    "parseDecimal",
    "parseFiscalInstant",
    "defineRecord",
    "transitionInstallation",
    "buildChain",
    "verifyChain",
  ]) {
    assert.equal(typeof api[name], "function", name);
  }
  assert.equal(
    "createRecord" in api,
    false,
    "candidate edition does not expose creation",
  );
});

test("P4-B public contract exposes pure planning and artifact capabilities", () => {
  for (const name of [
    "projectOfficialFields",
    "serializeOfficialProjection",
    "computeFingerprint",
    "verifyFingerprint",
    "createByteArtifact",
    "transitionByteArtifact",
    "defineOperationPlan",
    "planRecord",
  ]) {
    assert.equal(typeof api[name], "function", name);
  }
});
