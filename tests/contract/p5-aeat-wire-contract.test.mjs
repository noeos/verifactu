import assert from "node:assert/strict";
import test from "node:test";
import { buildSoapRequest, isSafeXmlElementFragment } from "../../evidence/runs/artifacts/build/verifactu/dist/aeat/soap-wire.js";
import { parseAeatResponse } from "../../evidence/runs/artifacts/build/verifactu/dist/aeat/response-parser.js";
import { batchPlan, context, hash, profile } from "../support/p5-aeat-fixture.mjs";

test("wire request binds the selected edition, endpoint and committed payload digest", () => {
  const batch = batchPlan();
  assert.equal(batch.request.editionDigest, profile().digest);
  assert.equal(batch.request.endpointId, "voluntary-submission-test");
  assert.equal(batch.request.sha256, `sha256:${hash(batch.request.bytes)}`);
  assert.equal(isSafeXmlElementFragment('<f:Record xmlns:f="urn:fiscal"><f:Text>&amp;</f:Text></f:Record>'), true);
  for (const hostile of ['<!DOCTYPE x><x/>', '<x>&external;</x>', '<x/><y/>', '<x a="1" a="2"/>', '<x>]]></x>'])
    assert.equal(isSafeXmlElementFragment(hostile), false);
  assert.equal(buildSoapRequest({ profile: profile({ lifecycle: "candidate", creationAllowed: false, activationEvidenceId: null }),
    operationId: "voluntary-submission", endpointId: "voluntary-submission-test", header: { context, taxpayerId: "ES123",
      installationId: "install-1", productId: "noeos", softwareVersion: "1.0", installationNumber: "install-1" },
    records: [{ ...batch.request, artifactId: "x" }] }).status, "invalid");
});

test("response parser rejects expanded-name confusion and hostile XML constructs", () => {
  const active = profile();
  const base = '<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" xmlns:r="https://example.test/response"><s:Body><r:SubmitResponse><r:GlobalStatus>Correcto</r:GlobalStatus><r:Wait>1</r:Wait></r:SubmitResponse></s:Body></s:Envelope>';
  const parse = (xml) => parseAeatResponse({ profile: active, operationId: "voluntary-submission", httpStatus: 200, responseBytes: Buffer.from(xml) });
  assert.equal(parse(base).value.status, "accepted");
  assert.equal(parse(base.replace("https://example.test/response", "https://other.test/response")).value.status, "malformed");
  assert.equal(parse(base.replace("<r:Wait>1", "<!DOCTYPE x><r:Wait>1")).value.status, "malformed");
});
