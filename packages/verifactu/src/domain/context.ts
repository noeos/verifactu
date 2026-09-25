import { invalid, ok, type Result } from "../contracts/results.js";
import type { Identity } from "./identities.js";
import { identityKey, isIdentity } from "./identities.js";

export interface FiscalContext {
  readonly tenantId: Identity<"tenant">;
  readonly taxpayerId: Identity<"taxpayer">;
  readonly installationId: Identity<"installation">;
  readonly editionId: Identity<"edition">;
}
export function createFiscalContext(
  input: FiscalContext,
): Result<FiscalContext> {
  if (
    !input ||
    typeof input !== "object" ||
    !isIdentity(input.tenantId, "tenant") ||
    !isIdentity(input.taxpayerId, "taxpayer") ||
    !isIdentity(input.installationId, "installation") ||
    !isIdentity(input.editionId, "edition")
  )
    return invalid("DIAG-CONTEXT-MISSING", "domain");
  return ok(
    Object.freeze({
      tenantId: Object.freeze({ ...input.tenantId }),
      taxpayerId: Object.freeze({ ...input.taxpayerId }),
      installationId: Object.freeze({ ...input.installationId }),
      editionId: Object.freeze({ ...input.editionId }),
    }),
  );
}
export function sameContext(a: FiscalContext, b: FiscalContext): boolean {
  return (
    identityKey([a.tenantId, a.taxpayerId, a.installationId, a.editionId]) ===
    identityKey([b.tenantId, b.taxpayerId, b.installationId, b.editionId])
  );
}
export function requireSameContext(
  a: FiscalContext,
  b: FiscalContext,
): Result<true> {
  return sameContext(a, b)
    ? ok(true)
    : invalid("DIAG-CONTEXT-MISMATCH", "domain");
}
