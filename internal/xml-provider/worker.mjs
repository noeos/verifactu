import { spawn } from "node:child_process";

export const XML_WORKER_SOURCE = String.raw`
import base64
import ctypes
import hashlib
import json
import os
import re
import sys
import threading

from lxml import etree

AEAT = "https://www2.agenciatributaria.gob.es/static_files/common/internet/dep/aplicaciones/es/aeat/tike/cont/ws/"
XMLDSIG = "http://www.w3.org/TR/xmldsig-core/xmldsig-core-schema.xsd"
PINS = {
    "xsd-suministro-lr": ("cbdac8d427cc5ab5d77ca48974cab0f35d6bb819c4c66db361681e3710aeba36", AEAT + "SuministroLR.xsd"),
    "xsd-respuesta-suministro": ("82acf80f785643caac13087aae66808ed721a13f08ca5218cf8ae81b695549ef", AEAT + "RespuestaSuministro.xsd"),
    "xsd-consulta-lr": ("bf2cdb8fc4b95b291757a72b76d8fffca06a6d30d9329122ca2fd6b2d5f8f1b1", AEAT + "ConsultaLR.xsd"),
    "xsd-respuesta-consulta-lr": ("de35063acb8d9ba0d6ae51acc6b595de9c2b12333250e95e13108ef5f2670d45", AEAT + "RespuestaConsultaLR.xsd"),
    "xsd-suministro-informacion": ("ee4c1655175644de44c4c25055ffeb8e5f4bb4bc3834ce8254d4222ef18c8aa1", AEAT + "SuministroInformacion.xsd"),
    "xsd-eventos-sif": ("cc7347c6a9a57a0c8edbc6b9ddcce55176452d0db0e68369477e207e9fbdd7e7", AEAT + "EventosSIF.xsd"),
    "xsd-respuesta-validacion-no-verifactu": ("8f47af4f3c49d29b6a62aed261c09f171e855ad6d6bb72ef3fc0b147dc9572f0", AEAT + "RespuestaValRegistNoVeriFactu.xsd"),
    "xmldsig-schema": ("d102ad3df7664c307e0c2c776ba4a90513b1969974d8a940bae1a77f9f21e15d", XMLDSIG),
}
CLOSURES = {
    "xsd-suministro-lr": {"xsd-suministro-lr", "xsd-suministro-informacion", "xmldsig-schema"},
    "xsd-respuesta-suministro": {"xsd-respuesta-suministro", "xsd-suministro-informacion", "xsd-suministro-lr", "xmldsig-schema"},
    "xsd-consulta-lr": {"xsd-consulta-lr", "xsd-suministro-informacion", "xmldsig-schema"},
    "xsd-respuesta-consulta-lr": {"xsd-respuesta-consulta-lr", "xsd-suministro-informacion", "xmldsig-schema"},
    "xsd-suministro-informacion": {"xsd-suministro-informacion", "xmldsig-schema"},
    "xsd-eventos-sif": {"xsd-eventos-sif", "xmldsig-schema"},
    "xsd-respuesta-validacion-no-verifactu": {"xsd-respuesta-validacion-no-verifactu", "xsd-suministro-informacion", "xmldsig-schema"},
    "xmldsig-schema": {"xmldsig-schema"},
}
XINCLUDE = "http://www.w3.org/2001/XInclude"
MAX_WIRE_BYTES = 18_000_000
HARD_LIMITS = {
    "maximumXmlBytes": 4194304,
    "maximumSchemaBytes": 8388608,
    "maximumSchemas": 8,
    "maximumDepth": 64,
    "maximumNodes": 100000,
    "maximumAttributes": 4096,
    "maximumNamespaces": 256,
    "maximumTextBytes": 2097152,
    "maximumOutputBytes": 65536,
    "deadlineMs": 5000,
    "maximumCpuSeconds": 5,
    "maximumMemoryBytes": 536870912,
}

class DeniedResource(Exception):
    pass

class ClosedResolver(etree.Resolver):
    def __init__(self, resources):
        super().__init__()
        self.resources = resources
        self.denied = 0

    def resolve(self, url, public_id, context):
        payload = self.resources.get(url)
        if payload is None:
            self.denied += 1
            raise DeniedResource("closed XML resource map rejected a URI")
        return self.resolve_string(payload, context, base_url=url)

class ResourceLimit(Exception):
    def __init__(self, code):
        self.code = code

class InvalidInput(Exception):
    def __init__(self, code):
        self.code = code

MEMORY_GUARD_STOP = None

def write_result(kind, code=None):
    if MEMORY_GUARD_STOP is not None:
        MEMORY_GUARD_STOP.set()
    result = {"kind": kind, "diagnostics": [] if code is None else [code]}
    sys.stdout.write(json.dumps(result, sort_keys=True, separators=(",", ":")))

def set_process_limits(limits):
    memory = limits["maximumMemoryBytes"]
    if os.name == "nt":
        kernel = ctypes.WinDLL("kernel32", use_last_error=True)
        class BASIC_LIMITS(ctypes.Structure):
            _fields_ = [("PerProcessUserTimeLimit", ctypes.c_longlong), ("PerJobUserTimeLimit", ctypes.c_longlong), ("LimitFlags", ctypes.c_ulong), ("MinimumWorkingSetSize", ctypes.c_size_t), ("MaximumWorkingSetSize", ctypes.c_size_t), ("ActiveProcessLimit", ctypes.c_ulong), ("Affinity", ctypes.c_size_t), ("PriorityClass", ctypes.c_ulong), ("SchedulingClass", ctypes.c_ulong)]
        class IO_COUNTERS(ctypes.Structure):
            _fields_ = [("ReadOperationCount", ctypes.c_ulonglong), ("WriteOperationCount", ctypes.c_ulonglong), ("OtherOperationCount", ctypes.c_ulonglong), ("ReadTransferCount", ctypes.c_ulonglong), ("WriteTransferCount", ctypes.c_ulonglong), ("OtherTransferCount", ctypes.c_ulonglong)]
        class EXTENDED_LIMITS(ctypes.Structure):
            _fields_ = [("BasicLimitInformation", BASIC_LIMITS), ("IoInfo", IO_COUNTERS), ("ProcessMemoryLimit", ctypes.c_size_t), ("JobMemoryLimit", ctypes.c_size_t), ("PeakProcessMemoryUsed", ctypes.c_size_t), ("PeakJobMemoryUsed", ctypes.c_size_t)]
        handle_type = ctypes.c_void_p
        kernel.CreateJobObjectW.argtypes = [handle_type, ctypes.c_wchar_p]
        kernel.CreateJobObjectW.restype = ctypes.c_void_p
        kernel.SetInformationJobObject.argtypes = [handle_type, ctypes.c_int, handle_type, ctypes.c_uint32]
        kernel.SetInformationJobObject.restype = ctypes.c_int
        kernel.GetCurrentProcess.argtypes = []
        kernel.GetCurrentProcess.restype = handle_type
        kernel.AssignProcessToJobObject.argtypes = [handle_type, handle_type]
        kernel.AssignProcessToJobObject.restype = ctypes.c_int
        job = kernel.CreateJobObjectW(None, None)
        if not job:
            raise ResourceLimit("DIAG-XML-MEMORY")
        info = EXTENDED_LIMITS()
        info.BasicLimitInformation.LimitFlags = 0x100 | 0x2000
        info.ProcessMemoryLimit = memory
        if not kernel.SetInformationJobObject(job, 9, ctypes.byref(info), ctypes.sizeof(info)):
            raise ResourceLimit("DIAG-XML-MEMORY")
        if not kernel.AssignProcessToJobObject(job, kernel.GetCurrentProcess()):
            raise ResourceLimit("DIAG-XML-MEMORY")
        return job
    try:
        import resource
        resource.setrlimit(resource.RLIMIT_CPU, (limits["maximumCpuSeconds"], limits["maximumCpuSeconds"] + 1))
        memory_limit_set = False
        for limit_name in ("RLIMIT_AS", "RLIMIT_DATA", "RLIMIT_RSS"):
            limit_kind = getattr(resource, limit_name, None)
            if limit_kind is None:
                continue
            try:
                _, hard_limit = resource.getrlimit(limit_kind)
                target_limit = (
                    memory
                    if hard_limit == resource.RLIM_INFINITY
                    else min(memory, hard_limit)
                )
                resource.setrlimit(limit_kind, (target_limit, hard_limit))
                memory_limit_set = True
                break
            except (OSError, ValueError):
                continue
        if not memory_limit_set:
            if sys.platform == "darwin":
                return "rss-monitor"
            raise ResourceLimit("DIAG-XML-MEMORY")
    except (ImportError, OSError, ValueError):
        if os.name != "nt":
            raise ResourceLimit("DIAG-XML-MEMORY")
    return None

def start_peak_rss_guard(maximum_memory_bytes):
    global MEMORY_GUARD_STOP
    MEMORY_GUARD_STOP = threading.Event()
    def monitor():
        import resource
        while not MEMORY_GUARD_STOP.is_set():
            if resource.getrusage(resource.RUSAGE_SELF).ru_maxrss > maximum_memory_bytes:
                write_result("limit", "DIAG-XML-MEMORY")
                sys.stdout.flush()
                os._exit(0)
            MEMORY_GUARD_STOP.wait(0.01)
    guard = threading.Thread(target=monitor, name="xml-rss-guard", daemon=True)
    guard.start()

def decode_request():
    wire = sys.stdin.buffer.read(MAX_WIRE_BYTES + 1)
    if len(wire) > MAX_WIRE_BYTES:
        raise ResourceLimit("DIAG-XSD-REQUEST-BYTES")
    return json.loads(wire)

def valid_limits(limits):
    if not isinstance(limits, dict) or set(limits) != set(HARD_LIMITS):
        return False
    return all(isinstance(value, int) and not isinstance(value, bool) and 0 < value <= HARD_LIMITS[key] for key, value in limits.items())

def prepare_resources(request, limits):
    if request.get("editionId") != "rrsif-2026-09-21-authoritative-candidate":
        raise ValueError("unknown edition")
    schemas = request.get("schemas")
    root_id = request.get("rootSchemaId")
    if not isinstance(schemas, list) or root_id not in CLOSURES:
        raise ValueError("schema request")
    if {entry.get("id") for entry in schemas} != CLOSURES[root_id]:
        raise ValueError("schema closure")
    if len(schemas) > limits["maximumSchemas"]:
        raise ResourceLimit("DIAG-XSD-RESOURCES")
    resources = {}
    total_bytes = 0
    for entry in schemas:
        schema_id = entry.get("id")
        pin = PINS.get(schema_id)
        if not pin or entry.get("sha256") != pin[0]:
            raise ValueError("schema pin")
        payload = base64.b64decode(entry["base64"], validate=True)
        total_bytes += len(payload)
        if len(payload) > limits["maximumSchemaBytes"] or total_bytes > limits["maximumSchemaBytes"]:
            raise ResourceLimit("DIAG-XSD-RESOURCES")
        if hashlib.sha256(payload).hexdigest() != pin[0]:
            raise ValueError("schema digest")
        if schema_id == "xmldsig-schema":
            payload = re.sub(rb"<!DOCTYPE schema\b.*?\]\s*>\s*", b"", payload, count=1, flags=re.S)
            if b"<!DOCTYPE" in payload.upper() or b"<!ENTITY" in payload.upper():
                raise ValueError("derived trusted schema")
        resources[pin[1]] = payload
    return resources, PINS[root_id][1]

def secure_parser(resolver):
    parser = etree.XMLPullParser(
        events=("start", "end", "comment", "pi", "start-ns"),
        attribute_defaults=False,
        collect_ids=False,
        huge_tree=False,
        load_dtd=False,
        no_network=True,
        recover=False,
        remove_blank_text=False,
        resolve_entities=False,
        strip_cdata=False,
    )
    parser.resolvers.add(resolver)
    return parser

def parse_bounded(xml_bytes, resolver, limits):
    parser = secure_parser(resolver)
    depth = nodes = attributes = namespaces = text_bytes = 0
    root = None
    chunk_size = 16_384
    for offset in range(0, len(xml_bytes), chunk_size):
        parser.feed(xml_bytes[offset:offset + chunk_size])
        for event, item in parser.read_events():
            if event == "start":
                depth += 1
                nodes += 1
                attributes += len(item.attrib)
                if item.tag.startswith("{" + XINCLUDE + "}"):
                    raise InvalidInput("DIAG-XML-XINCLUDE")
                if depth > limits["maximumDepth"]:
                    raise ResourceLimit("DIAG-XML-DEPTH")
                if nodes > limits["maximumNodes"]:
                    raise ResourceLimit("DIAG-XML-NODES")
                if attributes > limits["maximumAttributes"]:
                    raise ResourceLimit("DIAG-XML-ATTRIBUTES")
                if root is None:
                    root = item
            elif event == "end":
                text = item.text or ""
                tail = item.tail or ""
                text_bytes += len(text.encode("utf-8"))
                text_bytes += len(tail.encode("utf-8"))
                nodes += int(bool(text)) + int(bool(tail))
                if text_bytes > limits["maximumTextBytes"]:
                    raise ResourceLimit("DIAG-XML-TEXT")
                if nodes > limits["maximumNodes"]:
                    raise ResourceLimit("DIAG-XML-NODES")
                depth -= 1
            elif event == "start-ns":
                namespaces += 1
                if namespaces > limits["maximumNamespaces"]:
                    raise ResourceLimit("DIAG-XML-NAMESPACES")
            else:
                nodes += 1
                if nodes > limits["maximumNodes"]:
                    raise ResourceLimit("DIAG-XML-NODES")
    root = parser.close()
    if root is None:
        raise ValueError("empty XML")
    tree = root.getroottree()
    docinfo = tree.docinfo
    if docinfo.doctype or docinfo.internalDTD is not None or docinfo.externalDTD is not None:
        raise InvalidInput("DIAG-XML-DOCTYPE")
    if resolver.denied:
        raise DeniedResource("instance attempted external resource access")
    return tree

def main():
    hard_limits_job = set_process_limits(HARD_LIMITS)
    if hard_limits_job == "rss-monitor":
        start_peak_rss_guard(HARD_LIMITS["maximumMemoryBytes"])
    request = decode_request()
    limits = request.get("limits")
    if not valid_limits(limits):
        raise ValueError("limits")
    xml_bytes = base64.b64decode(request["xmlBase64"], validate=True)
    if len(xml_bytes) > limits["maximumXmlBytes"]:
        raise ResourceLimit("DIAG-XML-BYTES")
    resources, root_uri = prepare_resources(request, limits)
    schema_resolver = ClosedResolver(resources)
    schema_parser = etree.XMLParser(attribute_defaults=False, collect_ids=False, huge_tree=False, load_dtd=False, no_network=True, recover=False, resolve_entities=False)
    schema_parser.resolvers.add(schema_resolver)
    schema_root = etree.fromstring(resources[root_uri], schema_parser, base_url=root_uri)
    if schema_root.getroottree().docinfo.doctype:
        raise ValueError("schema DTD")
    schema = etree.XMLSchema(schema_root)
    if schema_resolver.denied:
        raise DeniedResource("schema attempted an unknown resource")
    instance_resolver = ClosedResolver({})
    tree = parse_bounded(xml_bytes, instance_resolver, limits)
    if not schema.validate(tree):
        write_result("invalid", "DIAG-XSD-INVALID")
        return
    if instance_resolver.denied:
        raise DeniedResource("instance attempted an unknown resource")
    write_result("valid")
    if hard_limits_job:
        job_handle = hard_limits_job

try:
    main()
except ResourceLimit as error:
    write_result("limit", error.code)
except InvalidInput as error:
    write_result("invalid", error.code)
except (etree.XMLSyntaxError, etree.DocumentInvalid):
    write_result("invalid", "DIAG-XML-SYNTAX")
except DeniedResource:
    write_result("invalid", "DIAG-XML-RESOURCE")
except MemoryError:
    write_result("limit", "DIAG-XML-MEMORY")
except Exception:
    write_result("defect", "DIAG-XSD-PROVIDER")
`;

const VALID_WORKER_KINDS = new Set([
  "valid",
  "invalid",
  "limit",
  "cancelled",
  "unavailable",
  "defect",
]);

export async function spawnXmlWorker(request, options = {}) {
  if (options.signal?.aborted)
    return Object.freeze({
      kind: "cancelled",
      diagnostics: ["DIAG-XML-CANCELLED"],
    });
  const pythonExecutable =
    options.pythonExecutable ?? process.env.VERIFACTU_PYTHON ?? "python3";
  const timeoutMs = options.timeoutMs ?? 5_000;
  const maximumOutputBytes = options.maximumOutputBytes ?? 65_536;
  const payload = JSON.stringify(request);
  if (Buffer.byteLength(payload, "utf8") > 18_000_000)
    return Object.freeze({
      kind: "limit",
      diagnostics: ["DIAG-XSD-REQUEST-BYTES"],
    });

  return new Promise((resolve) => {
    let child;
    let settled = false;
    let stoppedAs = null;
    let stdout = Buffer.alloc(0);
    let stderrBytes = 0;
    const cleanup = () => {
      clearTimeout(timer);
      options.signal?.removeEventListener("abort", abort);
    };
    const finish = (result) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(result);
    };
    const stop = (reason) => {
      if (settled) return;
      stoppedAs = reason;
      child?.kill();
    };
    const abort = () => stop("cancelled");
    const timer = setTimeout(() => stop("timeout"), timeoutMs);
    timer.unref?.();
    options.signal?.addEventListener("abort", abort, { once: true });
    try {
      const env = { PATH: process.env.PATH ?? "" };
      if (process.platform === "win32") {
        if (process.env.SystemRoot) env.SystemRoot = process.env.SystemRoot;
        if (process.env.WINDIR) env.WINDIR = process.env.WINDIR;
      }
      child = spawn(pythonExecutable, ["-I", "-c", XML_WORKER_SOURCE], {
        cwd: options.cwd ?? process.cwd(),
        env,
        shell: false,
        stdio: ["pipe", "pipe", "pipe"],
        windowsHide: true,
      });
      child.stdout.on("data", (chunk) => {
        if (stdout.length + chunk.length > maximumOutputBytes) {
          stop("output");
          return;
        }
        stdout = Buffer.concat([stdout, chunk]);
      });
      child.stderr.on("data", (chunk) => {
        stderrBytes += chunk.length;
        if (stderrBytes > maximumOutputBytes) stop("output");
      });
      child.on("error", (error) => {
        finish(
          error.code === "ENOENT"
            ? { kind: "unavailable", diagnostics: ["DIAG-XSD-UNAVAILABLE"] }
            : { kind: "defect", diagnostics: ["DIAG-XSD-PROVIDER"] },
        );
      });
      child.on("close", (code, signal) => {
        if (stoppedAs === "cancelled") {
          finish({ kind: "cancelled", diagnostics: ["DIAG-XML-CANCELLED"] });
          return;
        }
        if (stoppedAs === "timeout") {
          finish({ kind: "limit", diagnostics: ["DIAG-XML-DEADLINE"] });
          return;
        }
        if (stoppedAs === "output") {
          finish({ kind: "limit", diagnostics: ["DIAG-XML-OUTPUT"] });
          return;
        }
        if (code !== 0 || signal !== null) {
          finish({ kind: "defect", diagnostics: ["DIAG-XSD-PROVIDER"] });
          return;
        }
        finish(parseWorkerOutput(stdout));
      });
      child.stdin.on("error", () => undefined);
      child.stdin.end(payload);
    } catch {
      finish({ kind: "unavailable", diagnostics: ["DIAG-XSD-UNAVAILABLE"] });
    }
  });
}

function parseWorkerOutput(stdout) {
  try {
    const result = JSON.parse(stdout.toString("utf8"));
    if (
      !VALID_WORKER_KINDS.has(result?.kind) ||
      !Array.isArray(result.diagnostics) ||
      result.diagnostics.some(
        (item) => typeof item !== "string" || !/^DIAG-[A-Z0-9-]+$/u.test(item),
      )
    )
      throw new TypeError("invalid worker result");
    return Object.freeze({
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
