// SPDX-License-Identifier: Apache-2.0

import type { Result } from "../diagnostics/result.js";
import type { CertificateHandle, CertificateProvider } from "../certificates/index.js";
import type { SignatureProfile, SignatureResult, XadesBackend } from "../signatures/index.js";

export interface Clock {
  now(): Date;
}

export interface SignerPort {
  describe(): Readonly<{ readonly id: string; readonly profiles: readonly SignatureProfile[] }>;
  sign(
    recordXml: Uint8Array,
    recordId: string,
    profile: SignatureProfile,
    signal?: AbortSignal,
  ): Promise<Result<SignatureResult>>;
}

export interface CertificatePort extends CertificateProvider {
  readonly id: string;
  chain(
    handle: CertificateHandle,
    signal?: AbortSignal,
  ): Promise<Result<readonly CertificateHandle[]>>;
}

export interface XmlPort {
  serialize(record: unknown, signal?: AbortSignal): Result<Uint8Array>;
  parse(xml: Uint8Array, signal?: AbortSignal): Result<unknown>;
}

export type SignatureBackendPort = XadesBackend;
