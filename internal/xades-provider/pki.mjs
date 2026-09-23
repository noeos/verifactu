import { createHash, X509Certificate } from "node:crypto";

const SHA256 = /^[a-f0-9]{64}$/u;

export function validateCertificateChain(request) {
  if (!validRequest(request))
    return result(
      "defect",
      "not-evaluated",
      "not-evaluated",
      "not-evaluated",
      "not-evaluated",
      ["DIAG-XADES-CERTIFICATE-REQUEST"],
    );
  let certificates;
  let anchor;
  try {
    certificates = request.certificateChainDer.map(
      (item) => new X509Certificate(item),
    );
    anchor = new X509Certificate(request.trustAnchorDer);
  } catch {
    return result(
      "invalid",
      "invalid",
      "not-evaluated",
      "not-evaluated",
      "not-evaluated",
      ["DIAG-XADES-CERTIFICATE-PARSE"],
    );
  }
  const leaf = certificates[0];
  if (leaf === undefined)
    return result(
      "invalid",
      "invalid",
      "not-evaluated",
      "not-evaluated",
      "not-evaluated",
      ["DIAG-XADES-CERTIFICATE-CHAIN"],
    );
  const fingerprint = digest(leaf.raw);
  if (fingerprint !== request.certificateFingerprintSha256)
    return result(
      "invalid",
      "invalid",
      "not-evaluated",
      "not-evaluated",
      "not-evaluated",
      ["DIAG-XADES-CERTIFICATE-FINGERPRINT"],
    );
  const full = [...certificates, anchor];
  for (let index = 0; index < full.length - 1; index += 1) {
    const child = full[index];
    const issuer = full[index + 1];
    if (
      child === undefined ||
      issuer === undefined ||
      !child.checkIssued(issuer) ||
      !child.verify(issuer.publicKey)
    )
      return result(
        "invalid",
        "invalid",
        "not-evaluated",
        "not-evaluated",
        "not-evaluated",
        ["DIAG-XADES-CERTIFICATE-CHAIN"],
      );
  }
  if (digest(full.at(-1).raw) !== digest(anchor.raw))
    return result(
      "invalid",
      "invalid",
      "not-evaluated",
      "not-evaluated",
      "not-evaluated",
      ["DIAG-XADES-CERTIFICATE-ANCHOR"],
    );
  const instant = Date.parse(request.validationInstant);
  if (
    !Number.isFinite(instant) ||
    certificates.some(
      (certificate) =>
        instant < Date.parse(certificate.validFrom) ||
        instant > Date.parse(certificate.validTo),
    )
  )
    return result(
      "invalid",
      "valid",
      "invalid",
      "not-evaluated",
      "not-evaluated",
      ["DIAG-XADES-CERTIFICATE-TIME"],
    );
  const details = leaf.publicKey.asymmetricKeyDetails;
  if (
    leaf.publicKey.asymmetricKeyType !== "rsa" ||
    details?.modulusLength === undefined ||
    details.modulusLength < request.minimumRsaBits
  )
    return result(
      "invalid",
      "valid",
      "valid",
      "not-evaluated",
      "not-evaluated",
      ["DIAG-XADES-CERTIFICATE-ALGORITHM"],
    );
  if (!leaf.subject.includes(request.requiredSubject))
    return result("invalid", "valid", "valid", "not-evaluated", "invalid", [
      "DIAG-XADES-CERTIFICATE-SUBJECT",
    ]);
  if (
    request.requiredKeyUsages.some(
      (usage) => !(leaf.keyUsage ?? []).includes(usage),
    )
  )
    return result("invalid", "valid", "valid", "not-evaluated", "invalid", [
      "DIAG-XADES-CERTIFICATE-USAGE",
    ]);
  if (request.requireRevocationEvidence)
    return result("indeterminate", "valid", "valid", "indeterminate", "valid", [
      "DIAG-XADES-REVOCATION-EVIDENCE",
    ]);
  return result(
    "valid",
    "valid",
    "valid",
    "not-evaluated",
    "valid",
    [],
    fingerprint,
  );
}

function validRequest(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    Array.isArray(value.certificateChainDer) &&
    value.certificateChainDer.length > 0 &&
    value.certificateChainDer.every((item) => item instanceof Uint8Array) &&
    value.trustAnchorDer instanceof Uint8Array &&
    SHA256.test(value.certificateFingerprintSha256) &&
    typeof value.validationInstant === "string" &&
    typeof value.requiredSubject === "string" &&
    value.requiredSubject.length > 0 &&
    Array.isArray(value.requiredKeyUsages) &&
    value.requiredKeyUsages.every(
      (usage) => typeof usage === "string" && usage.length > 0,
    ) &&
    new Set(value.requiredKeyUsages).size === value.requiredKeyUsages.length &&
    Number.isSafeInteger(value.minimumRsaBits) &&
    value.minimumRsaBits >= 2048 &&
    typeof value.requireRevocationEvidence === "boolean"
  );
}

function digest(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function result(
  status,
  chain,
  time,
  revocation,
  authorization,
  diagnostics,
  certificateFingerprintSha256 = "",
) {
  return Object.freeze({
    status,
    certificateFingerprintSha256,
    chain,
    time,
    revocation,
    authorization,
    diagnostics: Object.freeze([...diagnostics]),
  });
}
