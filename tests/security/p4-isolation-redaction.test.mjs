import assert from "node:assert/strict";
import test from "node:test";
import {
  createFiscalContext,
  requireSameContext,
} from "../../evidence/runs/artifacts/build/verifactu/dist/domain/context.js";
import { createIdentity } from "../../evidence/runs/artifacts/build/verifactu/dist/domain/identities.js";

const identity = (kind, value) => createIdentity(kind, value).value;
const context = (tenant, taxpayer) =>
  createFiscalContext({
    tenantId: identity("tenant", tenant),
    taxpayerId: identity("taxpayer", taxpayer),
    installationId: identity("installation", "installation-1"),
    editionId: identity("edition", "edition-1"),
  }).value;

test("cross-tenant and cross-taxpayer contexts are rejected without echoing identities", () => {
  const left = context("tenant-secret-111", "taxpayer-secret-222");
  const right = context("tenant-secret-333", "taxpayer-secret-444");
  const result = requireSameContext(left, right);
  assert.equal(result.status, "invalid");
  const serialized = JSON.stringify(result);
  assert.doesNotMatch(serialized, /tenant-secret|taxpayer-secret/u);
  assert.equal(result.diagnostics[0].code, "DIAG-CONTEXT-MISMATCH");
});

test("incomplete contexts fail closed before dependent work", () => {
  assert.equal(createFiscalContext(null).status, "invalid");
  assert.equal(createFiscalContext("not-an-object").status, "invalid");
  const result = createFiscalContext({
    tenantId: null,
    taxpayerId: null,
    installationId: null,
    editionId: null,
  });
  assert.equal(result.status, "invalid");
  assert.equal(result.diagnostics[0].path, "");
});

test("every fiscal context slot validates its own identity kind", () => {
  const good = context("tenant-1", "taxpayer-1");
  for (const [field, kind] of [
    ["tenantId", "taxpayer"],
    ["taxpayerId", "tenant"],
    ["installationId", "edition"],
    ["editionId", "installation"],
  ]) {
    assert.equal(
      createFiscalContext({
        ...good,
        [field]: identity(kind, "wrong-kind"),
      }).status,
      "invalid",
    );
  }
});
