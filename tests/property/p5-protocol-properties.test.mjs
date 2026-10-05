import assert from "node:assert/strict";
import test from "node:test";
import { isSafeXmlElementFragment } from "../../evidence/runs/artifacts/build/verifactu/dist/aeat/soap-wire.js";

const seeds = [1346651009, 1346651010, 1346651011, 1346651012];
function rng(seed) { let state = seed >>> 0; return () => { state = (Math.imul(state, 22695477) + 1) >>> 0; return state; }; }

test("four frozen protocol campaigns accept escaped XML content and reject entity/markup injection", (t) => {
  let executions = 0;
  for (let campaignIndex = 0; campaignIndex < seeds.length; campaignIndex += 1) {
    const seed = seeds[campaignIndex];
    t.diagnostic(`P5-PROP-${String(campaignIndex + 9).padStart(3, "0")} seed=${seed} executions=4096`);
    const next = rng(seed);
    for (let index = 0; index < 4096; index += 1) {
      const text = `${seed}-${index}-${next()}&<>`;
      const escaped = text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
      assert.equal(isSafeXmlElementFragment(`<f:Record xmlns:f="urn:fiscal"><f:Value>${escaped}</f:Value></f:Record>`), true);
      assert.equal(isSafeXmlElementFragment(`<f:Record xmlns:f="urn:fiscal"><f:Value>&external-${index};</f:Value></f:Record>`), false);
      executions += 1;
    }
  }
  assert.equal(executions, 16_384);
});
