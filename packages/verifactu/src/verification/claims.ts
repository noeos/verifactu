import { invalid, ok, type Result } from "../contracts/results.js";

export const CLAIM_KINDS = Object.freeze([
  "official-format",
  "cryptographic",
  "certificate-authorization",
  "aeat",
  "noeos-evidence",
] as const);

export type ClaimKind = (typeof CLAIM_KINDS)[number];
export type ClaimStatus = "valid" | "invalid" | "indeterminate" | "unsupported";

export interface VerificationClaim {
  readonly kind: ClaimKind;
  readonly status: ClaimStatus;
  readonly evidenceDigest?: string;
  readonly diagnostics: readonly string[];
}

export interface VerificationClaimSet {
  readonly claims: readonly VerificationClaim[];
}

const digestPattern = /^sha256:[0-9a-f]{64}$/u;
const codePattern = /^[A-Z][A-Z0-9_.-]{1,63}$/u;
const claimKinds = new Set<string>(CLAIM_KINDS);
const statuses = new Set<string>([
  "valid",
  "invalid",
  "indeterminate",
  "unsupported",
]);

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value))
    return false;
  try {
    const prototype = Object.getPrototypeOf(value);
    return prototype === Object.prototype || prototype === null;
  } catch {
    return false;
  }
}

export function createVerificationClaim(
  input: unknown,
): Result<VerificationClaim> {
  try {
    if (!isPlainRecord(input)) return invalid("DIAG-CLAIM-INPUT", "domain");
    const keys = Object.keys(input).sort();
    const allowed = ["diagnostics", "evidenceDigest", "kind", "status"];
    if (
      keys.some((key) => !allowed.includes(key)) ||
      keys.length < 3 ||
      keys.length > 4 ||
      !claimKinds.has(String(input.kind)) ||
      !statuses.has(String(input.status)) ||
      !Array.isArray(input.diagnostics) ||
      input.diagnostics.length > 32 ||
      input.diagnostics.some(
        (code) => typeof code !== "string" || !codePattern.test(code),
      ) ||
      new Set(input.diagnostics).size !== input.diagnostics.length
    )
      return invalid("DIAG-CLAIM-INPUT", "domain");

    const kind = input.kind as ClaimKind;
    const status = input.status as ClaimStatus;
    const diagnostics = Object.freeze(
      [...(input.diagnostics as string[])].sort(),
    );
    const evidenceDigest = input.evidenceDigest;
    if (
      (evidenceDigest !== undefined &&
        (typeof evidenceDigest !== "string" ||
          !digestPattern.test(evidenceDigest))) ||
      (status === "valid" && evidenceDigest === undefined) ||
      (status !== "valid" && diagnostics.length === 0)
    )
      return invalid("DIAG-CLAIM-EVIDENCE", "domain");

    return ok(
      Object.freeze({
        kind,
        status,
        ...(evidenceDigest === undefined ? {} : { evidenceDigest }),
        diagnostics,
      }),
    );
  } catch {
    return invalid("DIAG-CLAIM-INPUT", "domain");
  }
}

export function createVerificationClaimSet(
  input: unknown,
): Result<VerificationClaimSet> {
  try {
    if (
      !Array.isArray(input) ||
      input.length !== CLAIM_KINDS.length ||
      input.some((claim) => !isPlainRecord(claim))
    )
      return invalid("DIAG-CLAIM-SET", "domain");

    const byKind = new Map<ClaimKind, VerificationClaim>();
    for (const rawClaim of input) {
      const claim = createVerificationClaim(rawClaim);
      if (claim.status !== "ok" || byKind.has(claim.value.kind))
        return invalid("DIAG-CLAIM-SET", "domain");
      byKind.set(claim.value.kind, claim.value);
    }
    if (CLAIM_KINDS.some((kind) => !byKind.has(kind)))
      return invalid("DIAG-CLAIM-SET", "domain");

    const claims = Object.freeze(
      CLAIM_KINDS.map((kind) => byKind.get(kind) as VerificationClaim),
    );
    return ok(Object.freeze({ claims }));
  } catch {
    return invalid("DIAG-CLAIM-SET", "domain");
  }
}

export function getVerificationClaim(
  claims: VerificationClaimSet,
  kind: ClaimKind,
): VerificationClaim | undefined {
  try {
    if (!claims || !Array.isArray(claims.claims)) return undefined;
    return claims.claims.find((claim) => claim.kind === kind);
  } catch {
    return undefined;
  }
}

export function replaceVerificationClaim(
  claims: VerificationClaimSet,
  replacement: unknown,
): Result<VerificationClaimSet> {
  try {
    const parsed = createVerificationClaim(replacement);
    if (parsed.status !== "ok" || !claims || !Array.isArray(claims.claims))
      return invalid("DIAG-CLAIM-SET", "domain");
    const next = claims.claims.map((claim) =>
      claim.kind === parsed.value.kind ? parsed.value : claim,
    );
    return createVerificationClaimSet(next);
  } catch {
    return invalid("DIAG-CLAIM-SET", "domain");
  }
}
