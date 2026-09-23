/** Narrow package boundary for the exactly admitted generic verification engine. */
export { createEngine } from "@noeos/verification-engine";
export type {
  ByteSink,
  Engine,
  Limits,
  NormalizationProfile,
  NormalizationStats,
} from "@noeos/verification-engine";
export { BUILTIN_PROFILES as INSTALLED_BUILTIN_PROFILES } from "@noeos/verification-engine/profiles";
export { VECTOR_SET as INSTALLED_VECTOR_SET } from "@noeos/verification-engine/vectors";
