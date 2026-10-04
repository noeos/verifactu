import assert from "node:assert/strict";
import test from "node:test";
import { parseAeatResponse } from "../../evidence/runs/artifacts/build/verifactu/dist/aeat/response-parser.js";
import { acceptedResponse, profile } from "../support/p5-aeat-fixture.mjs";
import { recordP5FaultDetection } from "../support/p5-fault-evidence.mjs";

test("wire parser rejects external entities, namespace rebinding, duplicate status and malformed bytes", () => {
  const active = profile();
  const parse = (bytes) => parseAeatResponse({ profile: active, operationId: "voluntary-submission", httpStatus: 200, responseBytes: bytes });
  const base = '<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" xmlns:r="https://example.test/response"><s:Body><r:SubmitResponse><r:GlobalStatus>Correcto</r:GlobalStatus><r:Wait>1</r:Wait></r:SubmitResponse></s:Body></s:Envelope>';
  assert.equal(parse(Buffer.from(`<!DOCTYPE x [<!ENTITY ext SYSTEM "file:///etc/passwd">]>${base}`)).value.status, "malformed");
  assert.equal(parse(Buffer.from(base.replace('<s:Body>', '<s:Body xmlns:r="https://attacker.test/">'))).value.status, "malformed");
  assert.equal(parse(Buffer.from(base.replace('<r:Wait>1</r:Wait>', '<r:Wait>1</r:Wait><r:Wait>2</r:Wait>'))).value.status, "malformed");
  assert.equal(parse(Buffer.from([0xff, 0xfe, 0xc0])).value.status, "malformed");
  const malformed = parse(Buffer.from("<not-xml"));
  assert.equal(malformed.value.status, "malformed");
  recordP5FaultDetection("P5-FAULT-040", malformed.value.status === "malformed");
  const soapFault = parse(Buffer.from('<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" xmlns:r="https://example.test/response"><s:Body><s:Fault><faultcode>s:Server</faultcode><faultstring>synthetic failure</faultstring></s:Fault></s:Body></s:Envelope>'));
  assert.equal(soapFault.value.status, "soap-fault");
  assert.notEqual(soapFault.value.status, "accepted");
  recordP5FaultDetection("P5-FAULT-041", soapFault.value.status === "soap-fault");

  const entityResponse = parse(Buffer.from(
    acceptedResponse.toString().replace(
      "<r:Series>A</r:Series>",
      "<r:Series>A&amp;&lt;&gt;&quot;&apos;&#65;&#x42;</r:Series>",
    ),
  ));
  assert.equal(entityResponse.status, "ok");
  assert.equal(entityResponse.value.lines[0].identity[1], `A&<>\"'AB`);
  const unknownEntityResponse = parse(Buffer.from(
    acceptedResponse.toString().replace(
      "<r:Series>A</r:Series>",
      "<r:Series>A&unknown;</r:Series>",
    ),
  ));
  assert.equal(unknownEntityResponse.value.status, "malformed");
});
