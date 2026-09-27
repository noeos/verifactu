import { invalid, ok, type Result } from "../contracts/results.js";
import { RRSIF_2026_09_21_CANDIDATE } from "./rrsif-2026-09-21.js";

const editions = Object.freeze([RRSIF_2026_09_21_CANDIDATE]);

/** Lists immutable descriptors in canonical identifier order. */
export function listEditions() {
  return editions;
}

/**
 * Resolves a retained descriptor only when its source manifest digest matches.
 * Edition asset access remains unavailable until the assets are packaged and
 * their complete closure can be verified by the governed public API.
 */
export function openEdition(
  id: string,
  expectedSourceManifestSha256?: string,
): Result<(typeof editions)[number]> {
  const edition = editions.find((item) => item.id === id);
  if (
    !edition ||
    (expectedSourceManifestSha256 !== undefined &&
      expectedSourceManifestSha256 !== edition.sourceManifestSha256)
  ) {
    return invalid("DIAG-EDITION-UNAVAILABLE", "edition");
  }
  return ok(edition);
}
