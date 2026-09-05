// SPDX-License-Identifier: Apache-2.0

import { createHash } from "node:crypto";
import { createDiagnostic } from "../diagnostics/diagnostic.js";
import { failure, success, type Result } from "../diagnostics/result.js";
import { parseSecureXml } from "../xml/codec.js";
import type { CertificateHandle } from "../certificates/index.js";

export const VERIFACTU_SIGNATURE_POLICY = Object.freeze({
  oid: "2.16.724.1.3.1.1.2.1.9",
  uri: "https://sede.administracion.gob.es/politica_de_firma_anexo_1.pdf",
  sha1Base64: "G7roucf600+f03r/o0bAOQ6WAs0=",
});

export type SignatureProfile = "xades-epes";

export interface SignatureRequest {
  readonly recordXml: Uint8Array;
  readonly recordId: string;
  readonly profile?: SignatureProfile;
  readonly certificate: CertificateHandle;
  readonly signal?: AbortSignal;
}

export interface SignatureResult {
  readonly xml: Uint8Array;
  readonly profile: SignatureProfile;
  readonly signedRecordId: string;
  readonly certificateId: string;
  readonly recordSha256: string;
}

/**
 * Adapter boundary for DSS/HSM implementations. The library never handles private
 * key bytes; a production adapter must perform XAdES-EPES enveloped signing.
 */
export interface XadesBackend {
  readonly id: string;
  sign(request: SignatureRequest): Promise<Result<SignatureResult>>;
  verify(xml: Uint8Array, signal?: AbortSignal): Promise<Result<boolean>>;
}

export interface DssBridge {
  readonly sign: (request: SignatureRequest) => Promise<Result<SignatureResult>>;
  readonly verify: (xml: Uint8Array, signal?: AbortSignal) => Promise<Result<boolean>>;
}

/**
 * Creates the narrow adapter used by the DSS reference process (or an HSM
 * service). Keeping callbacks at this boundary prevents key material and
 * process handles from entering the domain package.
 */
export function createDssBackend(bridge: DssBridge): XadesBackend {
  return Object.freeze({ id: "dss-6.4", sign: bridge.sign, verify: bridge.verify });
}

export function createSignatureRequest(input: Omit<SignatureRequest, "profile">): SignatureRequest {
  return Object.freeze({ ...input, profile: "xades-epes" as const });
}

export function validateXadesEnvelope(
  xml: Uint8Array,
): Result<{ readonly recordSha256: string; readonly hasPolicy: true }> {
  const parsed = parseSecureXml(xml);
  if (!parsed.ok) return parsed;
  const root = parsed.value;
  const signature = findElement(root, "Signature");
  if (signature === undefined) return signatureFailure("Signature");
  const signedInfo = findElement(signature, "SignedInfo");
  const reference = signedInfo === undefined ? undefined : findElement(signedInfo, "Reference");
  const policy = findElement(signature, "SignaturePolicyIdentifier");
  const digest = reference === undefined ? undefined : findElement(reference, "DigestValue");
  if (
    signedInfo === undefined ||
    reference === undefined ||
    digest === undefined ||
    policy === undefined
  )
    return signatureFailure("XAdES-EPES");
  if (
    !containsText(policy, VERIFACTU_SIGNATURE_POLICY.oid) ||
    !containsText(policy, VERIFACTU_SIGNATURE_POLICY.uri)
  )
    return signatureFailure("policy");
  return success({ recordSha256: createHash("sha256").update(xml).digest("hex"), hasPolicy: true });
}

interface XmlLike {
  readonly name: string;
  readonly children: readonly unknown[];
}

function findElement(
  root: XmlLike,
  name: string,
): { readonly name: string; readonly children: readonly unknown[] } | undefined {
  if (root.name === name || root.name.endsWith(`:${name}`)) return root;
  for (const child of root.children) {
    if (isXmlLike(child)) {
      const found = findElement(child, name);
      if (found !== undefined) return found;
    }
  }
  return undefined;
}

function containsText(root: XmlLike, expected: string): boolean {
  return root.children.some((child) =>
    typeof child === "string"
      ? child.includes(expected)
      : isXmlLike(child) && containsText(child, expected),
  );
}

function isXmlLike(value: unknown): value is XmlLike {
  if (typeof value !== "object" || value === null) return false;
  return (
    "name" in value &&
    typeof value.name === "string" &&
    "children" in value &&
    Array.isArray(value.children)
  );
}

function signatureFailure(path: string): Result<never> {
  return failure("INVALID_INPUT", [
    createDiagnostic({ code: "VF_SIGNATURE_INVALID", severity: "error", phase: "security", path }),
  ]);
}
