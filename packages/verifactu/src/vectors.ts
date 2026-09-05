// SPDX-License-Identifier: Apache-2.0

export const VECTOR_SET = Object.freeze({
  $schema: "urn:noeos:verifactu:vector-set:1",
  version: "1.0.0",
  edition: "aeat-rrsif-1.0@2026-09-03",
  license: "Apache-2.0",
  files: Object.freeze([
    Object.freeze({
      path: "internal-evidence.v1.json",
      category: "internal-evidence",
      caseCount: 1,
      bytes: 1180,
      sha256: "9b9c70e7d5cc10ec5b756ec8142dfb07a2ebd7b849d22f0b109572265951f90d",
      sha512:
        "f2efbc79259504ffb2629f6c347bb5dbc001fbdb111040773a3a032b694ec8b09797a8ffb0a7ea780c9897a4b92e89573f96aa0e81baf71a3bf55da3bfe3418e",
    }),
    Object.freeze({
      path: "rrsif-fingerprint.v1.json",
      category: "rrsif-fingerprint",
      caseCount: 3,
      bytes: 2776,
      sha256: "a399ce5771d9c41aa7a86105985d852868d7f3e01c11dcbe7321d5fb7fc97328",
      sha512:
        "e489e20dbf58b67f1b60d98dea9ec41923e9ea5b6d31e565556d7fa496690e86957cc04823e3537e505743afecf23b1f1d2fb1efa9b764111bff21adad4cc8ed",
    }),
  ]),
});

export type VectorSet = typeof VECTOR_SET;
