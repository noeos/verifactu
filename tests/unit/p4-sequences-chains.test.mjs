import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { createIdentity } from "../../evidence/runs/artifacts/build/verifactu/dist/domain/identities.js";
import { createFiscalContext } from "../../evidence/runs/artifacts/build/verifactu/dist/domain/context.js";
import { appendSequence } from "../../evidence/runs/artifacts/build/verifactu/dist/domain/sequences.js";
import {
  createChainLink,
  verifyChainLink,
  verifyCompleteChain,
} from "../../evidence/runs/artifacts/build/verifactu/dist/domain/chains.js";

function fixture() {
  const id = (kind, value) => createIdentity(kind, value).value;
  const context = createFiscalContext({
    tenantId: id("tenant", "t"),
    taxpayerId: id("taxpayer", "p"),
    installationId: id("installation", "i"),
    editionId: id("edition", "e"),
  }).value;
  return { id, context };
}
const digest = (bytes) =>
  `sha256:${createHash("sha256").update(bytes).digest("hex")}`;

test("billing sequence rejects duplicate, gap and wrong-scope predecessor", () => {
  const f = fixture();
  const at = "2025-01-01T00:00:00Z";
  const first = {
    id: f.id("record", "r1"),
    context: f.context,
    occurredAt: at,
    predecessorId: null,
  };
  const empty = { context: f.context, records: [] };
  const one = appendSequence(empty, first);
  assert.equal(one.status, "ok");
  assert.equal(appendSequence(one.value, first).status, "invalid");
  assert.equal(
    appendSequence(one.value, {
      ...first,
      id: f.id("record", "r2-same-instant"),
      predecessorId: first.id,
    }).status,
    "ok",
    "sequence timestamps may be equal while still remaining nondecreasing",
  );
  assert.equal(
    appendSequence(one.value, {
      ...first,
      id: f.id("record", "r2"),
      predecessorId: null,
    }).status,
    "invalid",
  );
  assert.equal(
    appendSequence(one.value, {
      ...first,
      id: f.id("record", "r2"),
      predecessorId: first.id,
      occurredAt: "2024-12-31T00:00:00Z",
    }).status,
    "invalid",
  );
});

test("billing sequence rejects malformed record data and foreign context", () => {
  const f = fixture();
  const valid = {
    id: f.id("record", "r1"),
    context: f.context,
    occurredAt: "2025-01-01T00:00:00Z",
    predecessorId: null,
  };
  const sequence = { context: f.context, records: [] };
  for (const item of [
    { ...valid, id: f.id("tenant", "wrong-kind") },
    { ...valid, occurredAt: "not-an-instant" },
    {
      ...valid,
      context: {
        ...f.context,
        tenantId: f.id("tenant", "foreign-tenant"),
      },
    },
  ])
    assert.equal(appendSequence(sequence, item).status, "invalid");
});

test("chain link keeps predecessor and current digest distinct and verifies scope", () => {
  const f = fixture();
  const id = f.id("record", "r1");
  const input = new TextEncoder().encode("ordered=fields");
  const link = createChainLink(f.context, id, null, input, digest);
  assert.equal(link.status, "ok");
  assert.equal(
    createChainLink(null, id, null, input, digest).status,
    "invalid",
  );
  assert.match(link.value.currentDigest, /^sha256:[0-9a-f]{64}$/u);
  assert.equal(link.value.previousDigest, null);
  assert.equal(
    verifyChainLink(link.value, null, null, input, digest).status,
    "invalid",
  );
  assert.equal(
    verifyChainLink(link.value, f.context, null, input, digest).status,
    "ok",
  );
  assert.equal(
    verifyChainLink(
      { ...link.value, previousDigest: "bad-digest" },
      f.context,
      "bad-digest",
      input,
      digest,
    ).status,
    "invalid",
  );
  const otherContext = createFiscalContext({
    ...f.context,
    tenantId: f.id("tenant", "other-context"),
  }).value;
  assert.equal(
    verifyChainLink(
      { ...link.value, context: otherContext },
      f.context,
      null,
      input,
      digest,
    ).status,
    "invalid",
  );
  assert.equal(
    verifyChainLink(link.value, f.context, null, input, digest).value,
    true,
  );
  assert.equal(
    verifyChainLink(
      { ...link.value, context: null },
      f.context,
      null,
      input,
      digest,
    ).status,
    "invalid",
  );
  assert.equal(
    createChainLink(
      f.context,
      f.id("record", "r2"),
      link.value.currentDigest,
      input,
      digest,
    ).status,
    "invalid",
  );
  assert.equal(
    createChainLink(f.context, id, "bad-digest", input, digest).status,
    "invalid",
  );
  assert.equal(
    createChainLink(
      f.context,
      f.id("tenant", "wrong-kind"),
      null,
      input,
      digest,
    ).status,
    "invalid",
  );
  assert.equal(
    createChainLink(f.context, id, null, input, () => {
      throw new Error("secret");
    }).status,
    "invalid",
  );
  assert.equal(
    createChainLink(f.context, id, null, input, () => "bad").status,
    "invalid",
  );
  assert.equal(
    createChainLink(
      f.context,
      id,
      link.value.currentDigest,
      input,
      () => link.value.currentDigest,
    ).status,
    "invalid",
  );
  assert.equal(
    createChainLink(f.context, id, null, input, null).status,
    "invalid",
  );
  assert.equal(
    verifyChainLink(link.value, f.context, null, input, () => {
      throw new Error("secret");
    }).status,
    "invalid",
  );
  assert.equal(
    verifyChainLink(link.value, f.context, "bad-digest", input, digest).status,
    "invalid",
  );
  assert.equal(
    verifyChainLink(
      { ...link.value, currentDigest: `sha256:${"0".repeat(64)}` },
      f.context,
      null,
      input,
      digest,
    ).status,
    "invalid",
  );
  assert.deepEqual(
    verifyCompleteChain(
      [link.value],
      new Map([[id.value, input]]),
      f.context,
      link.value.currentDigest,
      digest,
    ),
    { status: "verified", headDigest: link.value.currentDigest },
  );
  assert.deepEqual(
    verifyCompleteChain(
      [{ ...link.value, context: otherContext }],
      new Map(),
      f.context,
      link.value.currentDigest,
      digest,
    ),
    { status: "broken", code: "DIAG-CHAIN-LINK" },
  );
  assert.equal(
    verifyCompleteChain(
      [link.value],
      new Map(),
      f.context,
      link.value.currentDigest,
      digest,
    ).status,
    "indeterminate",
  );
  assert.equal(
    verifyCompleteChain(
      [link.value],
      new Map([[id.value, input]]),
      f.context,
      "sha256:" + "0".repeat(64),
      digest,
    ).status,
    "broken",
  );
  assert.equal(
    verifyCompleteChain(
      [link.value, link.value],
      new Map([[id.value, input]]),
      f.context,
      link.value.currentDigest,
      digest,
    ).status,
    "broken",
  );
  assert.equal(
    verifyCompleteChain(
      [{ ...link.value, previousDigest: `sha256:${"1".repeat(64)}` }],
      new Map([[id.value, input]]),
      f.context,
      link.value.currentDigest,
      digest,
    ).status,
    "broken",
  );
  assert.deepEqual(
    verifyCompleteChain([], new Map(), f.context, null, digest),
    { status: "verified", headDigest: null },
  );
});
