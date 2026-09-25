export interface DecodeLimits {
  readonly maxBytes: number;
  readonly maxDepth: number;
  readonly maxNodes: number;
  readonly maxStringLength: number;
}

export const DEFAULT_DECODE_LIMITS: DecodeLimits = Object.freeze({
  maxBytes: 1_048_576,
  maxDepth: 64,
  maxNodes: 100_000,
  maxStringLength: 262_144,
});
