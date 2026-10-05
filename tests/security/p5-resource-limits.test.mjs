import assert from "node:assert/strict";
import test from "node:test";
import { parseAeatResponse } from "../../evidence/runs/artifacts/build/verifactu/dist/aeat/response-parser.js";
import { collectAeatConsultation } from "../../evidence/runs/artifacts/build/verifactu/dist/aeat/consultation.js";
import { context, hash, profile } from "../support/p5-aeat-fixture.mjs";

test("response bytes are bounded before XML parsing and retained output is bounded by configured pages", async () => {
  const active = profile();
  const huge = parseAeatResponse({ profile: active, operationId: "voluntary-submission", httpStatus: 200, responseBytes: Buffer.alloc(1_048_577, 32) });
  assert.equal(huge.value.status, "malformed");
  assert.equal(huge.value.diagnostics[0], "DIAG-AEAT-RESPONSE-OVERSIZED");
  const query = { period: "2026" };
  const queryDigest = `sha256:${hash(JSON.stringify(query))}`;
  let calls = 0;
  const result = await collectAeatConsultation({ profile: active, operationId: "consultation", context, query,
    maximumPages: 1, maximumRecords: 1, maximumPageBytes: 32,
    pagePort: { async fetch({ cursor }) { calls += 1; return { context, editionDigest: active.digest, queryDigest, snapshotId: "snap",
      cursor, nextCursor: "more", complete: false, responseBytes: Buffer.from("one page"), records: [] }; } },
    retention: { async retain() { return true; } },
  });
  assert.equal(result.status, "indeterminate");
  assert.equal(result.diagnostic, "DIAG-AEAT-CONSULTATION-PAGE-LIMIT");
  assert.equal(calls, 1);
});
