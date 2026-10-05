import { createHash } from "node:crypto";
import { buildSoapRequest } from "../../evidence/runs/artifacts/build/verifactu/dist/aeat/soap-wire.js";
import { context, hash, identity, profile } from "./p5-aeat-profile-fixture.mjs";

export { context, hash, identity, profile } from "./p5-aeat-profile-fixture.mjs";
export { wireBatchPlan as batchPlan };
export {
  acceptedResponse,
  certificateAuthorization,
  p5TestPki,
  testCredentialHandle,
} from "./p5-aeat-profile-fixture.mjs";

export function wireBatchPlan(active = profile()) {
  const bytes = Buffer.from(
    '<f:Record xmlns:f="https://example.test/fiscal"><f:Value>synthetic</f:Value></f:Record>',
  );
  const record = {
    artifactId: "artifact-1",
    recordId: identity("record", "record-1"),
    context,
    editionId: identity("edition", active.editionId),
    sequence: 1,
    sha256: `sha256:${hash(bytes)}`,
    bytes,
  };
  const result = buildSoapRequest({
    profile: active,
    operationId: "voluntary-submission",
    endpointId: "voluntary-submission-test",
    header: {
      context,
      taxpayerId: context.taxpayerId.value,
      installationId: context.installationId.value,
      productId: "noeos",
      softwareVersion: "1.0",
      installationNumber: "install-1",
    },
    records: [record],
  });
  if (result.status !== "ok") throw new Error(JSON.stringify(result));
  const request = result.value;
  return Object.freeze({
    batchId: "wire-batch-1",
    context,
    operationId: request.operationId,
    environment: "test",
    endpointId: request.endpointId,
    editionId: request.editionId,
    orderedRecords: Object.freeze([
      Object.freeze({
        recordId: record.recordId.value,
        issuer: context.taxpayerId.value,
        series: "A",
        number: "1",
        issueDate: "2026-10-03",
        sequence: record.sequence,
      }),
    ]),
    request,
    manifestDigest: `sha256:${createHash("sha256")
      .update(request.bytes)
      .digest("hex")}`,
    eligibleAt: "2026-10-03T00:00:00.000Z",
  });
}
