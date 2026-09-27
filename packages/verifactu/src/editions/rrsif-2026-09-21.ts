/** Immutable metadata for the retained, verification-only RRSIF candidate. */
export const RRSIF_2026_09_21_CANDIDATE = Object.freeze({
  id: "rrsif-2026-09-21-authoritative-candidate",
  sourceSnapshot: "rrsif-2026-09-21-authoritative",
  sourceManifestSha256:
    "0856118bfb3d528ffa2acc6322c3484616ba6aff978f620db5e7aab916ba60c6",
  generatedOutputSha256:
    "561005c36d5c3ae0b00a98215f59e24769b7b4dec9b1a6cba878f00eacb90482",
  status: "candidate",
  verificationAllowed: true,
  creationAllowed: false,
});

export type RegulatoryEdition = typeof RRSIF_2026_09_21_CANDIDATE;
