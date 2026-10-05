import { generateKeyPairSync, randomBytes, sign } from "node:crypto";

function lengthBytes(length) {
  if (length < 0x80) return Buffer.from([length]);
  const bytes = [];
  let value = length;
  while (value > 0) {
    bytes.unshift(value & 0xff);
    value >>>= 8;
  }
  return Buffer.from([0x80 | bytes.length, ...bytes]);
}

function tlv(tag, content) {
  return Buffer.concat([
    Buffer.from([tag]),
    lengthBytes(content.length),
    content,
  ]);
}

const sequence = (...values) => tlv(0x30, Buffer.concat(values));
const set = (...values) => tlv(0x31, Buffer.concat(values));
const integer = (value) => {
  let bytes = Buffer.isBuffer(value)
    ? Buffer.from(value)
    : Buffer.from([value]);
  while (
    bytes.length > 1 &&
    bytes[0] === 0 &&
    (bytes[1] & 0x80) === 0
  ) {
    bytes = bytes.subarray(1);
  }
  return tlv(
    0x02,
    bytes[0] & 0x80 ? Buffer.concat([Buffer.from([0]), bytes]) : bytes,
  );
};
const nullValue = () => tlv(0x05, Buffer.alloc(0));
const boolean = (value) => tlv(0x01, Buffer.from([value ? 0xff : 0]));
const bitString = (value) =>
  tlv(0x03, Buffer.concat([Buffer.from([0]), value]));
const octetString = (value) => tlv(0x04, value);
const utf8 = (value) => tlv(0x0c, Buffer.from(value, "utf8"));
const utcTime = (value) => tlv(0x17, Buffer.from(value, "ascii"));

function oid(value) {
  const arcs = value.split(".").map(Number);
  const bytes = [40 * arcs[0] + arcs[1]];
  for (const arc of arcs.slice(2)) {
    const encoded = [arc & 0x7f];
    let rest = Math.floor(arc / 128);
    while (rest > 0) {
      encoded.unshift(0x80 | (rest & 0x7f));
      rest = Math.floor(rest / 128);
    }
    bytes.push(...encoded);
  }
  return tlv(0x06, Buffer.from(bytes));
}

const signatureAlgorithm = sequence(oid("1.2.840.113549.1.1.11"), nullValue());
const commonName = oid("2.5.4.3");
const name = (value) => sequence(set(sequence(commonName, utf8(value))));
const extension = (id, value, critical = false) =>
  sequence(oid(id), ...(critical ? [boolean(true)] : []), octetString(value));

function certificatePem(der) {
  const base64 = der
    .toString("base64")
    .match(/.{1,64}/gu)
    .join("\n");
  return Buffer.from(
    `-----BEGIN CERTIFICATE-----\n${base64}\n-----END CERTIFICATE-----\n`,
  );
}

function issueCertificate({
  subject,
  publicKey,
  issuerName,
  issuerKey,
  serial,
  ca = false,
  usages = [],
  names = [],
}) {
  const extensions = [
    extension("2.5.29.19", sequence(...(ca ? [boolean(true)] : [])), true),
  ];
  if (usages.length)
    extensions.push(extension("2.5.29.37", sequence(...usages.map(oid))));
  if (names.length) extensions.push(extension("2.5.29.17", sequence(...names)));
  const tbs = sequence(
    tlv(0xa0, integer(2)),
    integer(serial),
    signatureAlgorithm,
    issuerName,
    sequence(utcTime("260101000000Z"), utcTime("300101000000Z")),
    name(subject),
    publicKey.export({ type: "spki", format: "der" }),
    tlv(0xa3, sequence(...extensions)),
  );
  return certificatePem(
    sequence(
      tbs,
      signatureAlgorithm,
      bitString(sign("RSA-SHA256", tbs, issuerKey)),
    ),
  );
}

function keyPair() {
  return generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicExponent: 65537,
  });
}

export function createP5TestPki({ serialBytes = randomBytes } = {}) {
  const ca = keyPair();
  const server = keyPair();
  const wrongHost = keyPair();
  const client = keyPair();
  const caName = name("Noeos P5 ephemeral test CA");
  const caPem = issueCertificate({
    subject: "Noeos P5 ephemeral test CA",
    publicKey: ca.publicKey,
    issuerName: caName,
    issuerKey: ca.privateKey,
    serial: serialBytes(16),
    ca: true,
  });
  const serverCertificate = issueCertificate({
    subject: "localhost",
    publicKey: server.publicKey,
    issuerName: caName,
    issuerKey: ca.privateKey,
    serial: serialBytes(16),
    usages: ["1.3.6.1.5.5.7.3.1"],
    names: [
      tlv(0x82, Buffer.from("localhost")),
      tlv(0x87, Buffer.from([127, 0, 0, 1])),
    ],
  });
  const wrongHostCertificate = issueCertificate({
    subject: "wrong-host.invalid",
    publicKey: wrongHost.publicKey,
    issuerName: caName,
    issuerKey: ca.privateKey,
    serial: serialBytes(16),
    usages: ["1.3.6.1.5.5.7.3.1"],
    names: [tlv(0x82, Buffer.from("wrong-host.invalid"))],
  });
  const clientCertificate = issueCertificate({
    subject: "Noeos P5 ephemeral test client",
    publicKey: client.publicKey,
    issuerName: caName,
    issuerKey: ca.privateKey,
    serial: serialBytes(16),
    usages: ["1.3.6.1.5.5.7.3.2"],
  });
  const privateKeyPem = (key) =>
    Buffer.from(key.export({ type: "pkcs8", format: "pem" }));
  return Object.freeze({
    caPem,
    serverCertificate,
    serverKey: privateKeyPem(server.privateKey),
    wrongHostCertificate,
    wrongHostKey: privateKeyPem(wrongHost.privateKey),
    clientCertificate,
    clientKey: privateKeyPem(client.privateKey),
  });
}
