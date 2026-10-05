import { createHash } from "node:crypto";
import { createFiscalContext } from "../../evidence/runs/artifacts/build/verifactu/dist/domain/context.js";
import { createIdentity } from "../../evidence/runs/artifacts/build/verifactu/dist/domain/identities.js";

export const hash = (value) => createHash("sha256").update(value).digest("hex");
export const identity = (kind, value) => createIdentity(kind, value).value;
export const context = createFiscalContext({
  tenantId: identity("tenant", "tenant-a"),
  taxpayerId: identity("taxpayer", "ES123"),
  installationId: identity("installation", "install-1"),
  editionId: identity("edition", "test-edition"),
}).value;
