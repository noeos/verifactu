import assert from "node:assert/strict";
import test from "node:test";
import {
  CLAIM_KINDS,
  createVerificationClaim,
  createVerificationClaimSet,
  getVerificationClaim,
  replaceVerificationClaim,
} from "../../evidence/runs/artifacts/build/verifactu/dist/verification/claims.js";

const digest = `sha256:${"a".repeat(64)}`;
const claim = (kind, status, evidenceDigest = digest) => ({
  kind,
  status,
  ...(evidenceDigest === undefined ? {} : { evidenceDigest }),
  diagnostics: status === "valid" ? [] : [`DIAG-${kind.toUpperCase()}`],
});
function claimSet() {
  return createVerificationClaimSet([
    claim("official-format", "valid"),
    claim("cryptographic", "invalid"),
    claim("certificate-authorization", "indeterminate"),
    claim("aeat", "unsupported"),
    claim("noeos-evidence", "valid", `sha256:${"b".repeat(64)}`),
  ]);
}

test("P4-CB-032 preserves each claim outcome without a global valid flag", () => {
  const result = claimSet();
  assert.equal(result.status, "ok");
  assert.deepEqual(
    result.value.claims.map(({ kind, status }) => [kind, status]),
    [
      ["official-format", "valid"],
      ["cryptographic", "invalid"],
      ["certificate-authorization", "indeterminate"],
      ["aeat", "unsupported"],
      ["noeos-evidence", "valid"],
    ],
  );
  assert.equal(CLAIM_KINDS.length, 5);
  assert.equal(Object.hasOwn(result.value, "status"), false);
  assert.equal(Object.hasOwn(result.value, "valid"), false);
  assert.equal(Object.isFrozen(result.value), true);
  assert.equal(Object.isFrozen(result.value.claims), true);
  assert.equal(
    getVerificationClaim(result.value, "aeat").status,
    "unsupported",
  );
  assert.equal(
    replaceVerificationClaim(
      result.value,
      claim("aeat", "indeterminate"),
    ).value.claims.find(({ kind }) => kind === "aeat").status,
    "indeterminate",
  );
});

test("claim sets reject missing, duplicate, unknown, or reordered claim kinds", () => {
  const base = claimSet().value.claims;
  assert.equal(createVerificationClaimSet(base.slice(1)).status, "invalid");
  assert.equal(
    createVerificationClaimSet([...base.slice(0, 4), base[0]]).status,
    "invalid",
  );
  assert.equal(
    createVerificationClaimSet(
      base.map((item) =>
        item.kind === "aeat" ? { ...item, kind: "taxpayer" } : item,
      ),
    ).status,
    "invalid",
  );
  assert.equal(createVerificationClaimSet([...base].reverse()).status, "ok");
  assert.deepEqual(
    createVerificationClaimSet([...base].reverse()).value.claims.map(
      ({ kind }) => kind,
    ),
    [...CLAIM_KINDS],
  );
});

test("claim diagnostics are bounded, code-only, unique and deterministic", () => {
  const result = createVerificationClaim({
    kind: "cryptographic",
    status: "indeterminate",
    diagnostics: ["DIAG-Z", "DIAG-A"],
  });
  assert.equal(result.status, "ok");
  assert.deepEqual(result.value.diagnostics, ["DIAG-A", "DIAG-Z"]);
  assert.equal(
    createVerificationClaim({
      kind: "cryptographic",
      status: "invalid",
      diagnostics: ["invoice-123 taxpayer@example.test"],
    }).status,
    "invalid",
  );
  assert.equal(
    createVerificationClaim({
      kind: "cryptographic",
      status: "invalid",
      diagnostics: ["DIAG-X", "DIAG-X"],
    }).status,
    "invalid",
  );
  assert.equal(
    createVerificationClaim({
      kind: "cryptographic",
      status: "valid",
      diagnostics: [],
    }).status,
    "invalid",
  );
});

test("engine evidence digest shape is required only for verified claims", () => {
  assert.equal(
    createVerificationClaim({
      kind: "official-format",
      status: "valid",
      evidenceDigest: "sha256:bad",
      diagnostics: [],
    }).status,
    "invalid",
  );
  assert.equal(
    createVerificationClaim({
      kind: "official-format",
      status: "invalid",
      diagnostics: ["DIAG-FORMAT"],
    }).status,
    "ok",
  );
});

test("claim boundaries contain throwing proxies without echoing their data", () => {
  const throwingPrototype = new Proxy(
    {},
    {
      getPrototypeOf() {
        throw new Error("private proxy detail");
      },
    },
  );
  assert.equal(createVerificationClaim(throwingPrototype).status, "invalid");
  const throwingValue = new Proxy(
    { kind: "cryptographic", status: "valid", diagnostics: [] },
    {
      get(target, key, receiver) {
        if (key === "kind") throw new Error("private claim getter");
        return Reflect.get(target, key, receiver);
      },
    },
  );
  assert.equal(createVerificationClaim(throwingValue).status, "invalid");

  const throwingArray = new Proxy([], {
    get(target, key, receiver) {
      if (key === "length") throw new Error("private array detail");
      return Reflect.get(target, key, receiver);
    },
  });
  assert.equal(createVerificationClaimSet(throwingArray).status, "invalid");
  assert.equal(
    getVerificationClaim(
      new Proxy(
        {},
        {
          get() {
            throw new Error("private claims detail");
          },
        },
      ),
      "aeat",
    ),
    undefined,
  );
  assert.equal(
    replaceVerificationClaim(
      new Proxy(
        {},
        {
          get() {
            throw new Error("private claims detail");
          },
        },
      ),
      claim("aeat", "unsupported", undefined),
    ).status,
    "invalid",
  );
});

test("P4-PROP-012 claim aggregation preserves every component status (seed=1346650369)", () => {
  const kinds = [
    "official-format",
    "cryptographic",
    "certificate-authorization",
    "aeat",
    "noeos-evidence",
  ];
  const statuses = ["valid", "invalid", "indeterminate", "unsupported"];
  for (let index = 0; index < 4096; index += 1) {
    const expected = kinds.map(
      (_, component) => statuses[(index + component * 3) % statuses.length],
    );
    const result = createVerificationClaimSet(
      kinds.map((kind, component) => {
        const status = expected[component];
        return {
          kind,
          status,
          ...(status === "valid"
            ? {
                evidenceDigest: `sha256:${index.toString(16).padStart(64, "0")}`,
              }
            : { diagnostics: [`DIAG-PROPERTY-${component}`] }),
          ...(status === "valid" ? { diagnostics: [] } : {}),
        };
      }),
    );
    assert.equal(result.status, "ok", `case=${index}`);
    assert.deepEqual(
      result.value.claims.map(({ status }) => status),
      expected,
      `case=${index}`,
    );
    assert.equal(Object.hasOwn(result.value, "status"), false);
    assert.equal(Object.hasOwn(result.value, "valid"), false);
  }
});
