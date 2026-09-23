import assert from "node:assert/strict";
import test from "node:test";

const api = await import(
  process.env.VERIFACTU_TEST_ENTRY ??
    new URL(
      "../../evidence/runs/artifacts/build/verifactu/dist/index.js",
      import.meta.url,
    ).href
);

test("P4-F keeps official, crypto, AEAT and Noeos claims distinct", () => {
  const claims = {
    official: "valid",
    cryptographic: "valid",
    aeat: "unavailable",
    noeosEvidence: "valid",
  };
  assert.equal(api.defineVerificationClaims(claims).status, "succeeded");
  assert.equal(api.aggregateVerificationClaims(claims), "unavailable");
  assert.equal(
    api.aggregateVerificationClaims({ ...claims, cryptographic: "invalid" }),
    "invalid",
  );
  assert.equal(
    api.aggregateVerificationClaims({ ...claims, official: "indeterminate" }),
    "indeterminate",
  );
});
