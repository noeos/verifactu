import assert from "node:assert/strict";
import test from "node:test";

const api = await import(
  process.env.VERIFACTU_TEST_ENTRY ??
    "../../evidence/runs/artifacts/build/verifactu/dist/index.js"
);
const id = (kind, value) => api.identity(kind, value).value;

test("P4-CB-004 context scope rejects cross-tenant and cross-taxpayer substitution", () => {
  const context = api.defineContext({
    tenantId: id("tenant", "tenant-1"),
    taxpayerId: id("taxpayer", "taxpayer-1"),
    installationId: id("installation", "installation-1"),
    editionId: id("edition", "rrsif-2026-09-21"),
    operatingMode: "non-verifactu",
    tenureId: "tenure-1",
    clock: { instant: "2026-09-21T12:00:00Z" },
    correlationId: id("correlation", "correlation-1"),
    principalId: id("principal", "principal-1"),
  });
  const scope = {
    tenantId: context.tenantId,
    taxpayerId: context.taxpayerId,
    installationId: context.installationId,
    editionId: context.editionId,
  };
  assert.equal(api.validateContextScope(context, scope).status, "succeeded");
  const failure = api.validateContextScope(context, {
    ...scope,
    taxpayerId: id("taxpayer", "taxpayer-2"),
  });
  assert.equal(failure.status, "rejected");
  assert.deepEqual(failure.diagnostics[0].parameters, { field: "taxpayerId" });
  assert.equal(JSON.stringify(failure).includes("taxpayer-1"), false);
});
