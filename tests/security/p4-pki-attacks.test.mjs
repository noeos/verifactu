import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const { validateCertificateChain } = await import(
  new URL("../../internal/xades-provider/pki.mjs", import.meta.url).href
);

async function certificate() {
  const directory = await mkdtemp(join(tmpdir(), "verifactu-p4d-pki-"));
  try {
    const key = join(directory, "key.pem");
    const pem = join(directory, "certificate.pem");
    const execution = spawnSync(
      "openssl",
      [
        "req",
        "-x509",
        "-newkey",
        "rsa:2048",
        "-nodes",
        "-keyout",
        key,
        "-out",
        pem,
        "-subj",
        "/CN=Noeos Test",
        "-days",
        "2",
      ],
      { encoding: "utf8" },
    );
    assert.equal(execution.status, 0, execution.stderr);
    const derExecution = spawnSync(
      "openssl",
      ["x509", "-in", pem, "-outform", "der"],
      { encoding: null },
    );
    assert.equal(derExecution.status, 0, derExecution.stderr?.toString());
    return Uint8Array.from(derExecution.stdout);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

test("P4-D validates an explicit local RSA trust anchor and refuses missing revocation evidence", async () => {
  const der = await certificate();
  const fingerprint = createHash("sha256").update(der).digest("hex");
  const base = {
    certificateChainDer: [der],
    trustAnchorDer: der,
    certificateFingerprintSha256: fingerprint,
    validationInstant: new Date().toISOString(),
    requiredSubject: "CN=Noeos Test",
    requiredKeyUsages: [],
    minimumRsaBits: 2048,
  };
  assert.deepEqual(
    validateCertificateChain({ ...base, requireRevocationEvidence: false }),
    {
      status: "valid",
      certificateFingerprintSha256: fingerprint,
      chain: "valid",
      time: "valid",
      revocation: "not-evaluated",
      authorization: "valid",
      diagnostics: [],
    },
  );
  assert.equal(
    validateCertificateChain({ ...base, requireRevocationEvidence: true })
      .status,
    "indeterminate",
  );
  assert.equal(
    validateCertificateChain({
      ...base,
      certificateFingerprintSha256: "0".repeat(64),
      requireRevocationEvidence: false,
    }).status,
    "invalid",
  );
  assert.equal(
    validateCertificateChain({
      ...base,
      requiredSubject: "CN=other",
      requireRevocationEvidence: false,
    }).authorization,
    "invalid",
  );
  assert.equal(
    validateCertificateChain({
      ...base,
      requiredKeyUsages: ["digitalSignature"],
      requireRevocationEvidence: false,
    }).authorization,
    "invalid",
  );
});
