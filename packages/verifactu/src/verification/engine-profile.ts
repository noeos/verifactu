/** Versioned, fiscal-plaintext-free projection registered with the generic Engine. */
export const VERIFACTU_EVIDENCE_PROFILE = Object.freeze({
  id: "es.noeos.verifactu.record",
  version: "1.0.0",
  inputKind: "json" as const,
  vectorSha256:
    "5bf0444de397e7f259ffa46fcb194278d8d73beae560b65be874a3dd61ff450c",
  license: "Apache-2.0",
});

export interface NoeosEvidenceProjection {
  readonly contextId: string;
  readonly sequenceId: string;
  readonly recordId: string;
  readonly editionId: string;
  readonly operation: "alta" | "anulacion" | "subsanacion" | "sustitucion";
  readonly officialArtifactDigests: readonly string[];
  readonly previousEvidenceDigest: string | null;
  readonly algorithm: "sha-256";
}
