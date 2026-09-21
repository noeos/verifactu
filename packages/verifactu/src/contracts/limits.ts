export interface DecodeLimits {
  readonly maximumBytes: number;
  readonly maximumDepth: number;
  readonly maximumMembers: number;
  readonly maximumStringCodePoints: number;
}

export const DEFAULT_DECODE_LIMITS: DecodeLimits = Object.freeze({
  maximumBytes: 1_048_576,
  maximumDepth: 32,
  maximumMembers: 4096,
  maximumStringCodePoints: 65_536,
});

export function validDecodeLimits(limits: DecodeLimits): boolean {
  return (
    Number.isSafeInteger(limits.maximumBytes) &&
    limits.maximumBytes > 0 &&
    Number.isSafeInteger(limits.maximumDepth) &&
    limits.maximumDepth > 0 &&
    Number.isSafeInteger(limits.maximumMembers) &&
    limits.maximumMembers > 0 &&
    Number.isSafeInteger(limits.maximumStringCodePoints) &&
    limits.maximumStringCodePoints > 0
  );
}
