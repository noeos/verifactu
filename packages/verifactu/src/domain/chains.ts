import { invalid, ok, type Result } from "../contracts/results.js";
import type { FiscalContext } from "./context.js";
import { sameContext } from "./context.js";
import type { Identity } from "./identities.js";
import { isIdentity } from "./identities.js";
import { createFiscalContext } from "./context.js";

export interface ChainLink {
  readonly context: FiscalContext;
  readonly recordId: Identity<"record">;
  readonly previousDigest: string | null;
  readonly currentDigest: string;
}
export type DigestFunction = (orderedBytes: Uint8Array) => string;
export type ChainVerification =
  | { readonly status: "verified"; readonly headDigest: string | null }
  | {
      readonly status: "broken";
      readonly code: "DIAG-CHAIN-FORK" | "DIAG-CHAIN-LINK" | "DIAG-CHAIN-HEAD";
    }
  | {
      readonly status: "indeterminate";
      readonly code: "DIAG-CHAIN-UNAVAILABLE";
    };
export function createChainLink(
  context: FiscalContext,
  recordId: Identity<"record">,
  previousDigest: string | null,
  orderedFingerprintInput: Uint8Array,
  digest: DigestFunction,
): Result<ChainLink> {
  const validatedContext = createFiscalContext(context);
  if (
    !isIdentity(recordId, "record") ||
    validatedContext.status !== "ok" ||
    typeof digest !== "function" ||
    (previousDigest !== null && !/^sha256:[0-9a-f]{64}$/u.test(previousDigest))
  )
    return invalid("DIAG-CHAIN-INPUT", "domain");
  let currentDigest: string;
  try {
    currentDigest = digest(orderedFingerprintInput);
  } catch {
    return invalid("DIAG-CHAIN-DIGEST", "domain");
  }
  if (!/^sha256:[0-9a-f]{64}$/u.test(currentDigest))
    return invalid("DIAG-CHAIN-DIGEST", "domain");
  if (currentDigest === previousDigest)
    return invalid("DIAG-CHAIN-ALIAS", "domain");
  return ok(
    Object.freeze({
      context: validatedContext.value,
      recordId,
      previousDigest,
      currentDigest,
    }),
  );
}
export function verifyChainLink(
  link: ChainLink,
  expectedContext: FiscalContext,
  expectedPrevious: string | null,
  input: Uint8Array,
  digest: DigestFunction,
): Result<true> {
  if (
    createFiscalContext(link.context).status !== "ok" ||
    createFiscalContext(expectedContext).status !== "ok" ||
    (expectedPrevious !== null &&
      !/^sha256:[0-9a-f]{64}$/u.test(expectedPrevious)) ||
    typeof digest !== "function"
  )
    return invalid("DIAG-CHAIN-INVALID", "domain");
  let actual: string;
  try {
    actual = digest(input);
  } catch {
    return invalid("DIAG-CHAIN-DIGEST", "domain");
  }
  if (
    !sameContext(link.context, expectedContext) ||
    link.previousDigest !== expectedPrevious ||
    link.currentDigest !== actual
  )
    return invalid("DIAG-CHAIN-INVALID", "domain");
  return ok(true);
}

export function verifyCompleteChain(
  links: readonly ChainLink[],
  payloads: ReadonlyMap<string, Uint8Array>,
  expectedContext: FiscalContext,
  expectedHead: string | null,
  digest: DigestFunction,
): ChainVerification {
  const records = new Set<string>();
  let prior: string | null = null;
  for (const link of links) {
    const key = `${link.recordId.kind}:${link.recordId.value}`;
    if (records.has(key)) return { status: "broken", code: "DIAG-CHAIN-FORK" };
    records.add(key);
    if (
      !sameContext(link.context, expectedContext) ||
      link.previousDigest !== prior
    )
      return { status: "broken", code: "DIAG-CHAIN-LINK" };
    const payload = payloads.get(link.recordId.value);
    if (!payload)
      return { status: "indeterminate", code: "DIAG-CHAIN-UNAVAILABLE" };
    if (
      verifyChainLink(link, expectedContext, prior, payload, digest).status !==
      "ok"
    )
      return { status: "broken", code: "DIAG-CHAIN-LINK" };
    prior = link.currentDigest;
  }
  if (prior !== expectedHead)
    return { status: "broken", code: "DIAG-CHAIN-HEAD" };
  return { status: "verified", headDigest: prior };
}
