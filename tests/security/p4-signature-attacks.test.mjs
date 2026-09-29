import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { inflateRawSync } from "node:zlib";
import test from "node:test";
import {
  createXadesProvider,
  XADES_EDITION_ID,
  XADES_PROFILE_ID,
} from "../../internal/xades-provider/provider.mjs";
import { DSS_JVM_OPTIONS } from "../../internal/xades-provider/worker.mjs";

function rawWireRequest(artifactBytes) {
  const fields = [
    "VERIFACTU-DSS-1",
    "VERIFY",
    XADES_EDITION_ID,
    XADES_PROFILE_ID,
    "RegistroAlta",
    createHash("sha256").update(artifactBytes).digest("hex"),
    "1738620000000",
    "1738620000000",
    "86400",
    "",
    artifactBytes,
    new Uint8Array(),
    "0",
    new Uint8Array(),
    "0",
    "0",
    "0",
  ];
  return Buffer.from(
    fields
      .map((field) => Buffer.from(field).toString("base64") + "\n")
      .join(""),
    "ascii",
  );
}

function runRawBridge(input) {
  const java =
    process.env.VERIFACTU_JAVA ??
    (process.platform === "win32" ? "java.exe" : "java");
  const jar =
    process.env.VERIFACTU_DSS_JAR ??
    "internal/xades-provider/dss/target/verifactu-xades-provider-0.0.0-development.jar";
  return spawnSync(
    java,
    [...DSS_JVM_OPTIONS, "-cp", jar, "eu.noeos.verifactu.bridge.DssBridge"],
    { input, encoding: "utf8", timeout: 10_000, maxBuffer: 4_096 },
  );
}

function bridgeReport(result) {
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /^VERIFACTU-DSS-1\nINVALID\nNONE\n/u);
  return Buffer.from(result.stdout.trimEnd().split("\n")[3], "base64")
    .toString("ascii")
    .split("\t");
}

function assertJavaRejectsBeforeCrypto(artifactBytes, name) {
  const result = runRawBridge(rawWireRequest(artifactBytes));
  const report = bridgeReport(result);
  assert.equal(report[0], "INVALID", `${name}: Java profile`);
  assert.equal(report[1], "NOT_EVALUATED", `${name}: Java crypto`);
  assert.ok(
    ["DIAG-XADES-PROFILE", "DIAG-XADES-XML"].includes(report[12]),
    `${name}: Java must identify profile or XML failure, got ${report[12]}`,
  );
}

function zipEntry(archive, wantedName) {
  const end = archive.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  assert.notEqual(end, -1);
  const entries = archive.readUInt16LE(end + 10);
  let offset = archive.readUInt32LE(end + 16);
  for (let index = 0; index < entries; index += 1) {
    assert.equal(archive.readUInt32LE(offset), 0x02014b50);
    const compressedBytes = archive.readUInt32LE(offset + 20);
    const nameBytes = archive.readUInt16LE(offset + 28);
    const extraBytes = archive.readUInt16LE(offset + 30);
    const commentBytes = archive.readUInt16LE(offset + 32);
    const localOffset = archive.readUInt32LE(offset + 42);
    const name = archive.toString("utf8", offset + 46, offset + 46 + nameBytes);
    if (name === wantedName) {
      const dataStart =
        localOffset +
        30 +
        archive.readUInt16LE(localOffset + 26) +
        archive.readUInt16LE(localOffset + 28);
      assert.equal(archive.readUInt16LE(offset + 10), 8);
      return inflateRawSync(
        archive.subarray(dataStart, dataStart + compressedBytes),
      );
    }
    offset += 46 + nameBytes + extraBytes + commentBytes;
  }
  assert.fail(`missing vector ${wantedName}`);
}

function moveSignatureValueBeforeSignedInfo(xml) {
  const valueStart = xml.indexOf("<ds:SignatureValue");
  const valueOpenEnd = xml.indexOf(">", valueStart) + 1;
  const valueEnd =
    xml.indexOf("</ds:SignatureValue>", valueOpenEnd) +
    "</ds:SignatureValue>".length;
  const infoStart = xml.indexOf("<ds:SignedInfo");
  assert.ok(valueStart >= 0 && valueOpenEnd > 0 && valueEnd > valueOpenEnd);
  assert.ok(infoStart >= 0 && infoStart < valueStart);
  const valueBlock = xml.slice(valueStart, valueEnd);
  return (
    xml.slice(0, infoStart) +
    valueBlock +
    xml.slice(infoStart, valueStart) +
    xml.slice(valueEnd)
  );
}

test("signed XML rejects wrapping, duplicate IDs, extra references, and entity attacks", async () => {
  const archive = readFileSync(
    "editions/source-snapshots/rrsif-2026-09-21-authoritative/sources/aeat/AnexosEjemplosFirmaRegFact.zip",
  );
  const source = zipEntry(
    archive,
    "ejemploRegistro-firmado-epes-xades4j.xml",
  ).toString("utf8");
  const provider = createXadesProvider();
  const base = {
    editionId: XADES_EDITION_ID,
    profileId: XADES_PROFILE_ID,
    targetName: "RegistroAlta",
    trustAnchorsDer: [],
    crlEvidence: [],
    ocspEvidence: [],
    validationTime: "2025-02-04T00:00:00Z",
    maximumRevocationAgeSeconds: 86_400,
  };
  const attacks = [
    {
      name: "wrapped signature",
      xml: source
        .replace("<ds:Signature", "<sum1:Wrapper><ds:Signature")
        .replace("</ds:Signature>", "</ds:Signature></sum1:Wrapper>"),
      expected: "invalid",
    },
    {
      name: "duplicate IDs",
      xml: source
        .replace("<sum1:IDVersion>", '<sum1:IDVersion Id="dup">')
        .replace("<sum1:IDFactura>", '<sum1:IDFactura Id="dup">'),
      expected: "invalid",
    },
    {
      name: "extra signed reference",
      xml: source.replace(
        "</ds:SignedInfo>",
        '<ds:Reference URI="https://example.invalid/attacker"><ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/><ds:DigestValue>AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=</ds:DigestValue></ds:Reference></ds:SignedInfo>',
      ),
      expected: "invalid",
    },
    {
      name: "unexpected transform",
      xml: source.replace(
        "</ds:Transforms>",
        '<ds:Transform Algorithm="http://www.w3.org/TR/1999/REC-xpath-19991116"/></ds:Transforms>',
      ),
      expected: "invalid",
    },
    {
      name: "altered signed record",
      xml: source.replace(
        "<sum1:IDVersion>1.0</sum1:IDVersion>",
        "<sum1:IDVersion>2.0</sum1:IDVersion>",
      ),
      expected: "invalid",
    },
    {
      name: "missing signature value",
      xml: source.replace(
        /(<ds:SignatureValue[^>]*>)[\s\S]*?(<\/ds:SignatureValue>)/u,
        "$1$2",
      ),
      expected: "invalid",
    },
    {
      name: "DTD and external entity",
      xml:
        '<!DOCTYPE x [<!ENTITY secret SYSTEM "file:///etc/passwd">]>' + source,
      expected: "invalid",
    },
  ];
  for (const attack of attacks) {
    assert.notEqual(attack.xml, source, `${attack.name} fixture changed`);
    const artifactBytes = new TextEncoder().encode(attack.xml);
    const result = await provider.verify({
      ...base,
      artifactBytes,
      artifactDigestSha256: createHash("sha256")
        .update(artifactBytes)
        .digest("hex"),
    });
    assert.equal(
      result.status,
      attack.expected,
      `${attack.name}: ${JSON.stringify(result)}`,
    );
    assert.notEqual(result.status, "valid", attack.name);
  }

  for (const attribute of ["ID", "id"]) {
    const xml = source.replace(
      "<sum1:IDVersion>",
      `<sum1:IDVersion ${attribute}="extra-${attribute}">`,
    );
    const artifactBytes = new TextEncoder().encode(xml);
    const result = await provider.verify({
      ...base,
      artifactBytes,
      artifactDigestSha256: createHash("sha256")
        .update(artifactBytes)
        .digest("hex"),
    });
    assert.equal(result.profile, "valid", attribute);
    assert.equal(result.cryptographic, "invalid", attribute);
  }

  const fingerprintFailure = await provider.verify({
    ...base,
    expectedSignerFingerprintSha256: "f".repeat(64),
    artifactBytes: new TextEncoder().encode(source),
    artifactDigestSha256: createHash("sha256").update(source).digest("hex"),
  });
  assert.equal(fingerprintFailure.profile, "valid");
  assert.equal(fingerprintFailure.cryptographic, "not-evaluated");
  assert.equal(fingerprintFailure.certificate, "invalid");
  assert.equal(fingerprintFailure.certificatePolicy.identity, "invalid");

  for (const validationTime of [
    "2000-01-01T00:00:00Z",
    "2027-01-01T00:00:00Z",
  ]) {
    const timeFailure = await provider.verify({
      ...base,
      validationTime,
      artifactBytes: new TextEncoder().encode(source),
      artifactDigestSha256: createHash("sha256").update(source).digest("hex"),
    });
    assert.equal(timeFailure.profile, "valid", validationTime);
    assert.equal(timeFailure.cryptographic, "valid", validationTime);
    assert.equal(timeFailure.certificate, "invalid", validationTime);
    assert.equal(timeFailure.certificatePolicy.time, "invalid", validationTime);
  }
});

test("DSS rejects each altered XAdES profile component before crypto validation", async () => {
  const archive = readFileSync(
    "editions/source-snapshots/rrsif-2026-09-21-authoritative/sources/aeat/AnexosEjemplosFirmaRegFact.zip",
  );
  const source = zipEntry(
    archive,
    "ejemploRegistro-firmado-epes-xades4j.xml",
  ).toString("utf8");
  const provider = createXadesProvider();
  const base = {
    editionId: XADES_EDITION_ID,
    profileId: XADES_PROFILE_ID,
    targetName: "RegistroAlta",
    trustAnchorsDer: [],
    crlEvidence: [],
    ocspEvidence: [],
    validationTime: "2025-02-04T00:00:00Z",
    maximumRevocationAgeSeconds: 86_400,
  };
  const directBaseline = runRawBridge(
    rawWireRequest(new TextEncoder().encode(source)),
  );
  assert.equal(directBaseline.status, 0, directBaseline.stderr);
  const baselineReport = Buffer.from(
    directBaseline.stdout.trimEnd().split("\n")[3],
    "base64",
  )
    .toString("ascii")
    .split("\t");
  assert.equal(
    baselineReport[0],
    "VALID",
    "Java accepts the official profile vector",
  );
  const replacements = [
    [
      "root namespace",
      "SuministroInformacion.xsd",
      "SuministroInformacion-wrong.xsd",
    ],
    ["signature child order", moveSignatureValueBeforeSignedInfo],
    [
      "extra signature child",
      "</ds:Signature>",
      "<ds:OtherSignatureChild/></ds:Signature>",
    ],
    [
      "canonicalization algorithm",
      "REC-xml-c14n-20010315",
      "REC-xml-c14n-20010314",
    ],
    ["signature algorithm", "rsa-sha256", "rsa-sha1"],
    ["root reference URI", ' URI="">', ' URI="#external">'],
    ["root digest algorithm", "xmlenc#sha256", "xmlenc#sha512"],
    ["enveloped transform", "xmldsig#enveloped-signature", "xmldsig#base64"],
    [
      "signed properties reference URI",
      "#xmldsig-90637596-e368-4bd0-bcf8-d9a7be617d9a-signedprops",
      "https://example.invalid/properties",
    ],
    [
      "signed properties reference type",
      "01903#SignedProperties",
      "01903#OtherProperties",
    ],
    [
      "signed properties transform",
      '<ds:Transform Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/>',
      '<ds:Transform Algorithm="http://www.w3.org/TR/1999/REC-xpath-19991116"/>',
    ],
    [
      "properties namespace",
      "<xades:SignedProperties ",
      '<xades:SignedProperties xmlns:xades="urn:wrong" ',
    ],
    ["KeyInfo child name", "<ds:X509Data>", "<ds:KeyName/><ds:X509Data>"],
    [
      "embedded certificate element",
      "<ds:X509Certificate>",
      "<ds:Other/><ds:X509Certificate>",
    ],
    ["policy identifier", "2.16.724.1.3.1.1.2.1.9", "1.2.3.4"],
    [
      "policy hash algorithm",
      '<xades:SigPolicyHash><ds:DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"/>',
      '<xades:SigPolicyHash><ds:DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha256"/>',
    ],
    [
      "policy hash digest",
      "G7roucf600+f03r/o0bAOQ6WAs0=",
      "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
    ],
    ["policy SPURI", "politica_de_firma_anexo_1.pdf", "wrong-policy.pdf"],
    [
      "signature policy target",
      'Target="#xmldsig-',
      'Target="https://example.invalid/#xmldsig-',
    ],
    [
      "signature target binding",
      'Id="xmldsig-90637596-e368-4bd0-bcf8-d9a7be617d9a">',
      'Id="different-signature-id">',
    ],
    [
      "signed properties content",
      "<xades:SignedDataObjectProperties>",
      "<xades:UnsignedSignatureProperties/><xades:SignedDataObjectProperties>",
    ],
    [
      "unsigned properties",
      "<xades:SignedDataObjectProperties>",
      "<xades:SignedDataObjectProperties><xades:UnsignedProperties/>",
    ],
    [
      "certificate digest value",
      "tSSDv7r41SAdEZ1/5u61PjmIYxo=",
      "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
    ],
    [
      "root reference ID",
      ' Id="xmldsig-90637596-e368-4bd0-bcf8-d9a7be617d9a-ref0" URI=""',
      ' URI=""',
    ],
    [
      "data object reference",
      'ObjectReference="#xmldsig-90637596-e368-4bd0-bcf8-d9a7be617d9a-ref0"',
      'ObjectReference="#wrong-reference"',
    ],
  ];
  for (const [name, before, after] of replacements) {
    const xml =
      typeof before === "function"
        ? before(source)
        : source.replace(before, after);
    assert.notEqual(
      xml,
      source,
      `${name} mutation must alter the official vector`,
    );
    const artifactBytes = new TextEncoder().encode(xml);
    const result = await provider.verify({
      ...base,
      artifactBytes,
      artifactDigestSha256: createHash("sha256")
        .update(artifactBytes)
        .digest("hex"),
    });
    assert.equal(
      result.profile,
      "invalid",
      `${name}: ${JSON.stringify(result)}`,
    );
    assert.equal(
      result.cryptographic,
      "not-evaluated",
      `${name} must be rejected by profile validation before cryptography`,
    );

    const directResult = runRawBridge(rawWireRequest(artifactBytes));
    const directReport = bridgeReport(directResult);
    assert.equal(directReport[0], "INVALID", `${name}: Java profile`);
    assert.equal(
      directReport[1],
      "NOT_EVALUATED",
      `${name} must be rejected by Java before cryptography`,
    );
    assert.equal(
      directReport[12],
      "DIAG-XADES-PROFILE",
      `${name}: Java diagnostic`,
    );
  }

  const replaceInside = (xml, anchor, before, after) => {
    const index = xml.indexOf(anchor);
    assert.notEqual(index, -1, `profile mutation anchor missing: ${anchor}`);
    const prefix = xml.slice(0, index);
    const suffix = xml.slice(index);
    assert.notEqual(
      suffix.indexOf(before),
      -1,
      `profile mutation span missing: ${before}`,
    );
    return prefix + suffix.replace(before, after);
  };
  const structuralMutations = [
    [
      "duplicate IDs",
      (xml) =>
        xml
          .replace("<sum1:IDVersion>", '<sum1:IDVersion Id="duplicate">')
          .replace("<sum1:IDFactura>", '<sum1:IDFactura Id="duplicate">'),
    ],
    [
      "wrong SignedInfo name with the child count preserved",
      (xml) =>
        xml
          .replaceAll("<ds:SignedInfo>", "<ds:OtherSignedInfo>")
          .replaceAll("</ds:SignedInfo>", "</ds:OtherSignedInfo>"),
    ],
    [
      "wrong SignatureValue name with the child count preserved",
      (xml) =>
        xml
          .replaceAll("<ds:SignatureValue>", "<ds:OtherSignatureValue>")
          .replaceAll("</ds:SignatureValue>", "</ds:OtherSignatureValue>"),
    ],
    [
      "signature value child name",
      (xml) => xml.replaceAll("SignatureValue", "OtherSignatureValue"),
    ],
    ["key info child name", (xml) => xml.replaceAll("KeyInfo", "OtherKeyInfo")],
    [
      "signature object child name",
      (xml) =>
        xml
          .replaceAll("<ds:Object>", "<ds:OtherObject>")
          .replaceAll("</ds:Object>", "</ds:OtherObject>"),
    ],
    [
      "signed info canonicalization child name",
      (xml) =>
        xml.replaceAll("CanonicalizationMethod", "OtherCanonicalizationMethod"),
    ],
    [
      "signed info signature method child name",
      (xml) => xml.replaceAll("SignatureMethod", "OtherSignatureMethod"),
    ],
    [
      "extra signed info reference",
      (xml) =>
        xml.replace(
          "</ds:SignedInfo>",
          '<ds:Reference URI=""/></ds:SignedInfo>',
        ),
    ],
    [
      "key info without an x509 data child",
      (xml) => xml.replaceAll("X509Data", "OtherX509Data"),
    ],
    [
      "x509 data child namespace",
      (xml) =>
        xml.replace("<ds:X509Data>", '<ds:X509Data xmlns:ds="urn:wrong">'),
    ],
    [
      "key info with three children",
      (xml) =>
        xml.replace("</ds:KeyInfo>", "<ds:KeyName/><ds:KeyName/></ds:KeyInfo>"),
    ],
    [
      "wrong KeyValue child name",
      (xml) =>
        xml
          .replace("<ds:KeyValue>", "<ds:OtherKeyValue>")
          .replace("</ds:KeyValue>", "</ds:OtherKeyValue>"),
    ],
    [
      "wrong KeyValue child namespace",
      (xml) =>
        xml.replace("<ds:KeyValue>", '<ds:KeyValue xmlns:ds="urn:wrong">'),
    ],
    [
      "missing canonicalization method",
      (xml) =>
        xml.replaceAll("CanonicalizationMethod", "WrongCanonicalizationMethod"),
    ],
    [
      "missing signature method",
      (xml) => xml.replaceAll("SignatureMethod", "WrongSignatureMethod"),
    ],
    [
      "missing root digest method",
      (xml) =>
        xml.replace(
          '<ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>',
          '<ds:OtherDigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>',
        ),
    ],
    [
      "empty root reference transforms",
      (xml) =>
        xml.replace(
          '<ds:Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/>',
          '<ds:OtherTransform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/>',
        ),
    ],
    [
      "empty signed properties transforms",
      (xml) =>
        xml.replace(
          '<ds:Transform Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/>',
          '<ds:OtherTransform Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/>',
        ),
    ],
    [
      "wrong signed properties digest",
      (xml) =>
        replaceInside(
          xml,
          '<ds:Reference Type="http://uri.etsi.org/01903#SignedProperties"',
          "xmlenc#sha256",
          "xmlenc#sha512",
        ),
    ],
    [
      "missing policy digest method",
      (xml) =>
        replaceInside(
          xml,
          "<xades:SigPolicyHash>",
          '<ds:DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"/>',
          '<ds:OtherDigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"/>',
        ),
    ],
    [
      "missing policy digest value",
      (xml) =>
        replaceInside(
          xml,
          "<xades:SigPolicyHash>",
          "<ds:DigestValue>G7roucf600+f03r/o0bAOQ6WAs0=</ds:DigestValue>",
          "<ds:OtherDigestValue>G7roucf600+f03r/o0bAOQ6WAs0=</ds:OtherDigestValue>",
        ),
    ],
    [
      "duplicate signing time",
      (xml) =>
        xml.replace(
          "</xades:SignedSignatureProperties>",
          "<xades:SigningTime>2025-02-03T16:15:55.105+01:00</xades:SigningTime></xades:SignedSignatureProperties>",
        ),
    ],
    [
      "duplicate policy identifier",
      (xml) =>
        xml.replace(
          "<xades:SignaturePolicyIdentifier>",
          "<xades:SignaturePolicyIdentifier/><xades:SignaturePolicyIdentifier>",
        ),
    ],
    [
      "unbound signed properties URI",
      (xml) =>
        xml.replace(
          'URI="#xmldsig-90637596-e368-4bd0-bcf8-d9a7be617d9a-signedprops"',
          'URI="#missing-properties"',
        ),
    ],
    [
      "wrong qualifying parent namespace",
      (xml) => xml.replace("<ds:Object>", '<ds:Object xmlns:ds="urn:wrong">'),
    ],
    [
      "extra qualifying property child",
      (xml) =>
        xml.replace(
          "</xades:QualifyingProperties>",
          "<xades:OtherProperty/></xades:QualifyingProperties>",
        ),
    ],
    [
      "extra object child",
      (xml) =>
        xml.replace(
          "</ds:Object>",
          '<xades:OtherProperty xmlns:xades="http://uri.etsi.org/01903/v1.3.2#"/></ds:Object>',
        ),
    ],
    [
      "second signature object",
      (xml) => xml.replace("</ds:Signature>", "<ds:Object/></ds:Signature>"),
    ],
    [
      "signed signature properties child name",
      (xml) =>
        xml.replaceAll("SignedSignatureProperties", "OtherSignatureProperties"),
    ],
    [
      "signed data object properties child name",
      (xml) =>
        xml.replaceAll(
          "SignedDataObjectProperties",
          "OtherDataObjectProperties",
        ),
    ],
    [
      "missing SignedInfo namespace binding",
      (xml) =>
        xml.replace("<ds:SignedInfo>", '<ds:SignedInfo xmlns:ds="urn:wrong">'),
    ],
    [
      "wrong SignedProperties local name",
      (xml) =>
        xml
          .replaceAll("<xades:SignedProperties ", "<xades:OtherProperties ")
          .replaceAll("</xades:SignedProperties>", "</xades:OtherProperties>"),
    ],
    [
      "wrong KeyInfo namespace binding",
      (xml) => xml.replace("<ds:KeyInfo>", '<ds:KeyInfo xmlns:ds="urn:wrong">'),
    ],
    [
      "duplicate signing certificate",
      (xml) =>
        xml.replace(
          "</xades:SignedSignatureProperties>",
          "<xades:SigningCertificate/></xades:SignedSignatureProperties>",
        ),
    ],
    [
      "duplicate signature policy hash",
      (xml) =>
        xml.replace(
          "</xades:SignaturePolicyIdentifier>",
          "<xades:SigPolicyHash/></xades:SignaturePolicyIdentifier>",
        ),
    ],
    [
      "wrong policy hash algorithm",
      (xml) =>
        replaceInside(
          xml,
          "<xades:SigPolicyHash>",
          "xmldsig#sha1",
          "xmldsig#sha256",
        ),
    ],
    ["missing policy SPURI", (xml) => xml.replaceAll("SPURI", "OtherSPURI")],
    [
      "duplicate qualifying properties",
      (xml) =>
        xml.replace(
          "</ds:Object>",
          '<xades:QualifyingProperties xmlns:xades="http://uri.etsi.org/01903/v1.3.2#"/></ds:Object>',
        ),
    ],
    [
      "wrong certificate digest algorithm",
      (xml) =>
        replaceInside(
          xml,
          "<xades:CertDigest>",
          "xmldsig#sha1",
          "xmldsig#sha256",
        ),
    ],
    [
      "missing certificate digest value",
      (xml) =>
        xml.replace(
          "<ds:DigestValue>tSSDv7r41SAdEZ1/5u61PjmIYxo=</ds:DigestValue>",
          "<ds:OtherDigestValue>tSSDv7r41SAdEZ1/5u61PjmIYxo=</ds:OtherDigestValue>",
        ),
    ],
    [
      "missing root reference ID",
      (xml) => xml.replace(/(<ds:Reference) Id="[^"]+"( URI="")/u, "$1$2"),
    ],
    [
      "missing data object format",
      (xml) => xml.replaceAll("DataObjectFormat", "OtherDataObjectFormat"),
    ],
    [
      "extra root transform",
      (xml) =>
        xml.replace(
          "</ds:Transforms>",
          '<ds:Transform Algorithm="http://www.w3.org/2000/09/xmldsig#base64"/></ds:Transforms>',
        ),
    ],
    [
      "key info unexpected second child",
      (xml) => xml.replace("</ds:KeyInfo>", "<ds:KeyName/></ds:KeyInfo>"),
    ],
    [
      "key info too many children",
      (xml) =>
        xml.replace("</ds:KeyInfo>", "<ds:KeyName/><ds:KeyName/></ds:KeyInfo>"),
    ],
    [
      "key value wrong namespace",
      (xml) =>
        xml.replace(
          "</ds:KeyInfo>",
          '<ds:KeyValue xmlns:ds="urn:wrong"/></ds:KeyInfo>',
        ),
    ],
    [
      "empty X509Data",
      (xml) =>
        xml.replace(/<ds:X509Certificate>[\s\S]*?<\/ds:X509Certificate>/u, ""),
    ],
    [
      "wrong X509 certificate namespace",
      (xml) =>
        xml.replace(
          "<ds:X509Certificate>",
          '<ds:X509Certificate xmlns:ds="urn:wrong">',
        ),
    ],
    [
      "identifier missing",
      (xml) =>
        xml.replace(
          "<xades:Identifier>urn:oid:2.16.724.1.3.1.1.2.1.9</xades:Identifier>",
          "",
        ),
    ],
    [
      "duplicate policy SPURI",
      (xml) =>
        xml.replace(
          "</xades:SigPolicyQualifiers>",
          "<xades:SPURI>https://sede.administracion.gob.es/politica_de_firma_anexo_1.pdf</xades:SPURI></xades:SigPolicyQualifiers>",
        ),
    ],
    [
      "invalid root reference ID syntax",
      (xml) =>
        xml.replace(/(<ds:Reference) Id="[^"]+"( URI="")/u, '$1 Id="bad id"$2'),
    ],
    [
      "qualifying target signature mismatch",
      (xml) =>
        xml.replace(
          'Target="#xmldsig-90637596-e368-4bd0-bcf8-d9a7be617d9a"',
          'Target="#different-signature"',
        ),
    ],
  ];
  for (const [name, mutate] of structuralMutations) {
    const xml = mutate(source);
    assert.notEqual(
      xml,
      source,
      `${name} mutation must alter the official vector`,
    );
    const artifactBytes = new TextEncoder().encode(xml);
    const result = await provider.verify({
      ...base,
      artifactBytes,
      artifactDigestSha256: createHash("sha256")
        .update(artifactBytes)
        .digest("hex"),
    });
    assert.equal(
      result.profile,
      "invalid",
      `${name}: ${JSON.stringify(result)}`,
    );
    assert.equal(
      result.cryptographic,
      "not-evaluated",
      `${name} must be rejected by profile validation before cryptography`,
    );
    assertJavaRejectsBeforeCrypto(artifactBytes, name);
  }
  const signingCertificateStart = source.indexOf("<xades:SigningCertificate>");
  const signingCertificateEnd =
    source.indexOf("</xades:SigningCertificate>", signingCertificateStart) +
    "</xades:SigningCertificate>".length;
  assert.ok(signingCertificateStart >= 0 && signingCertificateEnd > 0);
  const missingCertificateDigestMethod =
    source.slice(0, signingCertificateStart) +
    source
      .slice(signingCertificateStart, signingCertificateEnd)
      .replaceAll(
        '<ds:DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"/>',
        '<ds:OtherDigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"/>',
      ) +
    source.slice(signingCertificateEnd);
  assert.notEqual(missingCertificateDigestMethod, source);
  assertJavaRejectsBeforeCrypto(
    new TextEncoder().encode(missingCertificateDigestMethod),
    "missing certificate digest method",
  );
});

test("DSS distinguishes optional and malformed embedded KeyValue data", async () => {
  const archive = readFileSync(
    "editions/source-snapshots/rrsif-2026-09-21-authoritative/sources/aeat/AnexosEjemplosFirmaRegFact.zip",
  );
  const source = zipEntry(
    archive,
    "ejemploRegistro-firmado-epes-xades4j.xml",
  ).toString("utf8");
  const provider = createXadesProvider();
  const base = {
    editionId: XADES_EDITION_ID,
    profileId: XADES_PROFILE_ID,
    targetName: "RegistroAlta",
    trustAnchorsDer: [],
    crlEvidence: [],
    ocspEvidence: [],
    validationTime: "2025-02-04T00:00:00Z",
    maximumRevocationAgeSeconds: 86_400,
  };
  const keyValue = /<ds:KeyValue(?:\s[^>]*)?>[\s\S]*?<\/ds:KeyValue>/u.exec(
    source,
  )?.[0];
  assert.ok(keyValue, "official XAdES vector includes its optional KeyValue");
  const malformed = [
    ["non-RSA key value", source.replaceAll("RSAKeyValue", "ECKeyValue")],
    [
      "multiple embedded key values",
      source.replace("</ds:KeyValue>", "<ds:KeyValue/></ds:KeyValue>"),
    ],
    [
      "multiple RSA key values",
      source.replace(
        "</ds:KeyValue>",
        "<ds:RSAKeyValue/><ds:RSAKeyValue/></ds:KeyValue>",
      ),
    ],
    [
      "extra RSA key component",
      source.replace("</ds:RSAKeyValue>", "<ds:Other/></ds:RSAKeyValue>"),
    ],
    [
      "wrong RSA modulus",
      source.replace(
        /<ds:Modulus>[\s\S]*?<\/ds:Modulus>/u,
        "<ds:Modulus>AAAA</ds:Modulus>",
      ),
    ],
    [
      "wrong RSA exponent",
      source.replace(
        /<ds:Exponent>[\s\S]*?<\/ds:Exponent>/u,
        "<ds:Exponent>Aw==</ds:Exponent>",
      ),
    ],
    [
      "malformed modulus encoding",
      source.replace(
        /<ds:Modulus>[\s\S]*?<\/ds:Modulus>/u,
        "<ds:Modulus>A===</ds:Modulus>",
      ),
    ],
    [
      "RSA key component order",
      (() => {
        const modulus = /<ds:Modulus>[\s\S]*?<\/ds:Modulus>/u.exec(source)?.[0];
        const exponent = /<ds:Exponent>[\s\S]*?<\/ds:Exponent>/u.exec(
          source,
        )?.[0];
        assert.ok(
          modulus && exponent,
          "official KeyValue has modulus and exponent",
        );
        return source
          .replace(modulus, "__P4_MODULUS__")
          .replace(exponent, modulus)
          .replace("__P4_MODULUS__", exponent);
      })(),
    ],
  ];
  for (const [name, xml] of malformed) {
    assert.notEqual(xml, source, `${name} fixture must change`);
    const artifactBytes = new TextEncoder().encode(xml);
    const result = await provider.verify({
      ...base,
      artifactBytes,
      artifactDigestSha256: createHash("sha256")
        .update(artifactBytes)
        .digest("hex"),
    });
    assert.equal(result.profile, "valid", name);
    assert.equal(result.cryptographic, "not-evaluated", name);
    assert.equal(result.diagnostics[0], "DIAG-XADES-KEYINFO", name);
  }

  const withoutKeyValue = source.replace(keyValue, "");
  const artifactBytes = new TextEncoder().encode(withoutKeyValue);
  const optionalResult = await provider.verify({
    ...base,
    artifactBytes,
    artifactDigestSha256: createHash("sha256")
      .update(artifactBytes)
      .digest("hex"),
  });
  assert.equal(optionalResult.profile, "valid");
  assert.equal(optionalResult.cryptographic, "valid");
});
