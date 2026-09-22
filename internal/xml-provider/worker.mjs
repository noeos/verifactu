import { spawnSync } from "node:child_process";

export const XML_WORKER_SOURCE = String.raw`
import base64
import json
import sys
from lxml import etree

try:
    import resource as process_resource
except ImportError:
    process_resource = None

class ClosedResolver(etree.Resolver):
    def __init__(self, resources):
        super().__init__()
        self.resources = resources
        self.external_attempts = 0

    def resolve(self, url, public_id, context):
        payload = self.resources.get(url)
        if payload is None:
            self.external_attempts += 1
            raise OSError("closed resolver rejected an unknown resource")
        return self.resolve_string(payload, context, base_url=url)

def parser(resolver):
    value = etree.XMLParser(
        attribute_defaults=False,
        collect_ids=False,
        dtd_validation=False,
        huge_tree=False,
        load_dtd=False,
        no_network=True,
        ns_clean=False,
        recover=False,
        remove_blank_text=False,
        resolve_entities=False,
        strip_cdata=False,
    )
    value.resolvers.add(resolver)
    return value

def main():
    request = json.loads(sys.stdin.buffer.read())
    cpu_seconds = request.get("cpuSeconds")
    if process_resource is not None and isinstance(cpu_seconds, int) and cpu_seconds > 0:
        process_resource.setrlimit(process_resource.RLIMIT_CPU, (cpu_seconds, cpu_seconds + 1))
    resources = {}
    for schema_resource in request["schemas"]:
        payload = base64.b64decode(schema_resource["base64"], validate=True)
        for alias in schema_resource["aliases"]:
            if alias in resources:
                raise ValueError("duplicate schema alias")
            resources[alias] = payload
    root_id = request["rootSchemaId"]
    root = resources.get(root_id)
    if root is None:
        raise ValueError("root schema is absent")
    resolver = ClosedResolver(resources)
    schema_document = etree.fromstring(root, parser(resolver), base_url=root_id)
    schema = etree.XMLSchema(schema_document)
    def validate_instance(encoded):
        try:
            document = etree.fromstring(
                base64.b64decode(encoded, validate=True),
                parser(resolver),
                base_url="memory:///instance.xml",
            )
            valid = schema.validate(document)
            return {
                "kind": "valid" if valid else "invalid",
                "diagnostics": [] if valid else ["DIAG-XSD-INVALID"],
            }
        except etree.XMLSyntaxError:
            return {"kind": "invalid", "diagnostics": ["DIAG-XML-SYNTAX"]}
    if "xmlBatchBase64" in request:
        result = {
            "kind": "batch",
            "results": [validate_instance(value) for value in request["xmlBatchBase64"]],
            "externalAttempts": resolver.external_attempts,
        }
    else:
        result = validate_instance(request["xmlBase64"])
        result["externalAttempts"] = resolver.external_attempts
    sys.stdout.write(json.dumps(result, sort_keys=True, separators=(",", ":")))

try:
    main()
except etree.XMLSyntaxError:
    sys.stdout.write('{"diagnostics":["DIAG-XML-SYNTAX"],"externalAttempts":0,"kind":"invalid"}')
except etree.DocumentInvalid:
    sys.stdout.write('{"diagnostics":["DIAG-XSD-INVALID"],"externalAttempts":0,"kind":"invalid"}')
except Exception:
    sys.stdout.write('{"diagnostics":["DIAG-XSD-PROVIDER"],"externalAttempts":0,"kind":"defect"}')
`;

export function runXmlWorker(request, options = {}) {
  return executeWorker(request, options, false);
}

export function runXmlWorkerBatch(request, options = {}) {
  return executeWorker(request, options, true);
}

export function normalizeXmlWorkerOptions(options = {}) {
  return Object.freeze({
    pythonExecutable:
      options.pythonExecutable ?? process.env.VERIFACTU_PYTHON ?? "python3",
    timeoutMs: options.timeoutMs ?? 5_000,
    maximumOutputBytes: options.maximumOutputBytes ?? 65_536,
  });
}

// Kept internal to the provider package: separating this total mapping from the
// synchronous process boundary makes every fail-closed worker result auditable.
export function interpretXmlWorkerExecution(execution, batch) {
  if (execution.error?.code === "ETIMEDOUT")
    return Object.freeze({ kind: "limit", diagnostics: ["DIAG-XML-DEADLINE"] });
  if (execution.signal === "SIGXCPU")
    return Object.freeze({ kind: "limit", diagnostics: ["DIAG-XML-CPU"] });
  if (execution.error?.code === "ENOENT")
    return Object.freeze({
      kind: "unavailable",
      diagnostics: ["DIAG-XSD-UNAVAILABLE"],
    });
  if (execution.error !== undefined || execution.status !== 0)
    return Object.freeze({
      kind: "defect",
      diagnostics: ["DIAG-XSD-PROVIDER"],
    });
  try {
    const result = JSON.parse(execution.stdout);
    const validOutcome = (outcome) =>
      ["valid", "invalid", "defect"].includes(outcome?.kind) &&
      Array.isArray(outcome.diagnostics) &&
      outcome.diagnostics.every((item) => typeof item === "string");
    if (
      (batch
        ? result.kind !== "batch" ||
          !Array.isArray(result.results) ||
          !result.results.every(validOutcome)
        : !validOutcome(result)) ||
      !Number.isSafeInteger(result.externalAttempts) ||
      result.externalAttempts < 0
    )
      throw new Error("invalid worker response");
    if (result.externalAttempts !== 0)
      return Object.freeze({
        kind: "defect",
        diagnostics: ["DIAG-XSD-CLOSED-RESOLVER"],
      });
    return batch
      ? Object.freeze({
          kind: "batch",
          results: Object.freeze(
            result.results.map((item) =>
              Object.freeze({
                kind: item.kind,
                diagnostics: Object.freeze([...item.diagnostics]),
              }),
            ),
          ),
        })
      : Object.freeze({
          kind: result.kind,
          diagnostics: Object.freeze([...result.diagnostics]),
        });
  } catch {
    return Object.freeze({
      kind: "defect",
      diagnostics: ["DIAG-XSD-PROVIDER"],
    });
  }
}

function executeWorker(request, options, batch) {
  const { pythonExecutable, timeoutMs, maximumOutputBytes } =
    normalizeXmlWorkerOptions(options);
  const execution = spawnSync(
    pythonExecutable,
    ["-I", "-c", XML_WORKER_SOURCE],
    {
      encoding: "utf8",
      env: {},
      input: JSON.stringify(request),
      killSignal: "SIGKILL",
      maxBuffer: maximumOutputBytes,
      timeout: timeoutMs,
      windowsHide: true,
    },
  );
  return interpretXmlWorkerExecution(execution, batch);
}
