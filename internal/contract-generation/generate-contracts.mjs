#!/usr/bin/env node
import { createHash } from "node:crypto";
import { link, lstat, mkdir, readFile, rename, rm, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { assert, main, stableJson, validateJsonFile } from "../../tooling/lib/policy.mjs";
import { attribute, descendants, parsePinnedXml } from "./xml-parser.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const XSD = "http://www.w3.org/2001/XMLSchema";
const WSDL = "http://schemas.xmlsoap.org/wsdl/";
const SOAP = "http://schemas.xmlsoap.org/wsdl/soap/";
const QNAME_COMPONENT = /^[A-Za-z_][A-Za-z0-9_.-]*$/;

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function sha512(bytes) {
  return createHash("sha512").update(bytes).digest("hex");
}

function sorted(values) {
  return [...values].sort((left, right) => left.localeCompare(right, "en"));
}

function attributes(node) {
  return Object.fromEntries(
    node.attributes
      .filter(({ namespace }) => namespace !== "http://www.w3.org/2000/xmlns/")
      .map(({ name, value }) => [name, value])
      .sort(([left], [right]) => left.localeCompare(right, "en")),
  );
}

function normalizedNode(node) {
  const normalized = {
    namespace: node.namespace,
    name: node.localName,
    namespaceDeclarations: node.namespaceDeclarations,
    attributes: attributes(node),
    children: node.children.map(normalizedNode),
  };
  const normalizedText = node.text.replace(/\s+/g, " ").trim();
  if (normalizedText) {
    if (node.namespace === XSD && node.localName === "documentation") {
      normalized.documentation = {
        utf8Bytes: Buffer.byteLength(normalizedText),
        sha256: sha256(Buffer.from(normalizedText)),
      };
    } else normalized.text = normalizedText;
  }
  return normalized;
}

function qname(node, value) {
  if (value === undefined) return null;
  const separator = value.indexOf(":");
  assert(separator === value.lastIndexOf(":"), "QNAME_LEXICAL_INVALID", `${value} has multiple separators`);
  const prefix = separator < 0 ? "" : value.slice(0, separator);
  const localName = separator < 0 ? value : value.slice(separator + 1);
  assert(
    (prefix === "" || QNAME_COMPONENT.test(prefix)) && QNAME_COMPONENT.test(localName),
    "QNAME_LEXICAL_INVALID",
    `${value} is not a supported QName`,
  );
  const namespace = node.namespaceBindings[prefix];
  assert(namespace !== undefined, "QNAME_NAMESPACE_UNBOUND", `${value} has no in-scope namespace`);
  return { lexical: value, namespace, localName };
}

function immediate(node, namespace, localName) {
  return node.children.filter((child) => child.namespace === namespace && child.localName === localName);
}

function firstDescendant(node, namespace, localName) {
  return descendants(node, (candidate) => candidate.namespace === namespace && candidate.localName === localName)[0];
}

function documentation(node) {
  return descendants(node, (candidate) => candidate.namespace === XSD && candidate.localName === "documentation").map(
    (candidate) => {
      const value = candidate.text.replace(/\s+/g, " ").trim();
      return { utf8Bytes: Buffer.byteLength(value), sha256: sha256(Buffer.from(value)) };
    },
  );
}

function facets(restriction) {
  if (!restriction) return [];
  const supported = new Set(["enumeration", "length", "maxLength", "minLength", "pattern"]);
  return restriction.children
    .filter((child) => child.namespace === XSD && supported.has(child.localName))
    .map((child) => ({ kind: child.localName, value: attribute(child, "value") }));
}

function schemaInventory(source, parsed) {
  const rootNode = parsed.root;
  const targetNamespace = attribute(rootNode, "targetNamespace");
  assert(targetNamespace, "XSD_TARGET_NAMESPACE_MISSING", `${source.id} has no target namespace`);
  const simpleTypes = immediate(rootNode, XSD, "simpleType").map((node) => {
    const restriction = immediate(node, XSD, "restriction")[0];
    return {
      name: attribute(node, "name"),
      base: restriction ? qname(restriction, attribute(restriction, "base")) : null,
      facets: facets(restriction),
      documentation: documentation(node),
    };
  });
  const elements = [];
  const visit = (node, context, choiceDepth) => {
    const nextChoiceDepth = choiceDepth + (node.namespace === XSD && node.localName === "choice" ? 1 : 0);
    let nextContext = context;
    if (node.namespace === XSD && ["complexType", "simpleType"].includes(node.localName)) {
      nextContext = [...context, `${node.localName}:${attribute(node, "name") ?? "inline"}`];
    }
    if (node.namespace === XSD && node.localName === "element") {
      const inlineSimpleType = immediate(node, XSD, "simpleType")[0];
      const restriction = inlineSimpleType ? immediate(inlineSimpleType, XSD, "restriction")[0] : undefined;
      elements.push({
        context: nextContext,
        name: attribute(node, "name") ?? null,
        ref: qname(node, attribute(node, "ref")),
        type: qname(node, attribute(node, "type")),
        minOccurs: attribute(node, "minOccurs") ?? "1",
        maxOccurs: attribute(node, "maxOccurs") ?? "1",
        choiceDepth: nextChoiceDepth,
        inlineFacets: facets(restriction),
        documentation: documentation(node),
      });
      nextContext = [...nextContext, `element:${attribute(node, "name") ?? attribute(node, "ref") ?? "anonymous"}`];
    }
    node.children.forEach((child) => visit(child, nextContext, nextChoiceDepth));
  };
  visit(rootNode, [`schema:${targetNamespace}`], 0);
  return {
    sourceId: source.id,
    sourceSha256: source.sha256,
    targetNamespace,
    elementFormDefault: attribute(rootNode, "elementFormDefault") ?? "unqualified",
    topLevelElements: immediate(rootNode, XSD, "element").map((node) => ({
      name: attribute(node, "name") ?? null,
      ref: qname(node, attribute(node, "ref")),
      type: qname(node, attribute(node, "type")),
    })),
    simpleTypes,
    complexTypes: immediate(rootNode, XSD, "complexType").map((node) => ({
      name: attribute(node, "name"),
      mixed: attribute(node, "mixed") ?? "false",
      documentation: documentation(node),
    })),
    elements,
  };
}

function soapInventory(source, parsed) {
  const definition = parsed.root;
  return {
    sourceId: source.id,
    sourceSha256: source.sha256,
    name: attribute(definition, "name") ?? null,
    targetNamespace: attribute(definition, "targetNamespace"),
    messages: immediate(definition, WSDL, "message").map((message) => ({
      name: attribute(message, "name"),
      parts: immediate(message, WSDL, "part").map((part) => ({
        name: attribute(part, "name"),
        element: qname(part, attribute(part, "element")),
        type: qname(part, attribute(part, "type")),
      })),
    })),
    portTypes: immediate(definition, WSDL, "portType").map((portType) => ({
      name: attribute(portType, "name"),
      operations: immediate(portType, WSDL, "operation").map((operation) => ({
        name: attribute(operation, "name"),
        input: qname(
          immediate(operation, WSDL, "input")[0],
          attribute(immediate(operation, WSDL, "input")[0], "message"),
        ),
        output: qname(
          immediate(operation, WSDL, "output")[0],
          attribute(immediate(operation, WSDL, "output")[0], "message"),
        ),
      })),
    })),
    bindings: immediate(definition, WSDL, "binding").map((binding) => ({
      name: attribute(binding, "name"),
      type: qname(binding, attribute(binding, "type")),
      soap: immediate(binding, SOAP, "binding").map((soap) => ({
        style: attribute(soap, "style") ?? null,
        transport: attribute(soap, "transport") ?? null,
      })),
      operations: immediate(binding, WSDL, "operation").map((operation) => ({
        name: attribute(operation, "name"),
        soapAction: attribute(immediate(operation, SOAP, "operation")[0] ?? { attributes: [] }, "soapAction") ?? null,
        inputUse:
          attribute(
            firstDescendant(immediate(operation, WSDL, "input")[0] ?? { children: [] }, SOAP, "body") ?? {
              attributes: [],
            },
            "use",
          ) ?? null,
        outputUse:
          attribute(
            firstDescendant(immediate(operation, WSDL, "output")[0] ?? { children: [] }, SOAP, "body") ?? {
              attributes: [],
            },
            "use",
          ) ?? null,
      })),
    })),
    services: immediate(definition, WSDL, "service").map((service) => ({
      name: attribute(service, "name"),
      ports: immediate(service, WSDL, "port").map((port) => ({
        name: attribute(port, "name"),
        binding: qname(port, attribute(port, "binding")),
        address: attribute(immediate(port, SOAP, "address")[0] ?? { attributes: [] }, "location") ?? null,
      })),
    })),
  };
}

function digestValueSchema() {
  return { type: "string", pattern: "^[0-9a-f]{64}$" };
}

function artifactIdentitySchema(pathPattern = "^[A-Za-z0-9][A-Za-z0-9._/-]+$") {
  return {
    type: "object",
    additionalProperties: false,
    required: ["path", "sha256"],
    properties: {
      path: { type: "string", pattern: pathPattern },
      sha256: digestValueSchema(),
    },
  };
}

function generatorIdentitySchema() {
  return {
    type: "object",
    additionalProperties: false,
    required: ["id", "artifacts", "configurationSha256", "primaryRuntime"],
    properties: {
      id: { type: "string", minLength: 1 },
      artifacts: { type: "array", minItems: 1, uniqueItems: true, items: artifactIdentitySchema() },
      configurationSha256: digestValueSchema(),
      primaryRuntime: { type: "string", pattern: "^node [0-9]+\\.[0-9]+\\.[0-9]+$" },
    },
  };
}

function qnameValueSchema() {
  return {
    type: ["object", "null"],
    additionalProperties: false,
    required: ["lexical", "namespace", "localName"],
    properties: {
      lexical: { type: "string", minLength: 1 },
      namespace: { type: "string" },
      localName: { type: "string", minLength: 1 },
    },
  };
}

function generatedOutputSchema(pathPattern) {
  return {
    type: "object",
    additionalProperties: false,
    required: ["path", "bytes", "sha256"],
    properties: {
      path: { type: "string", pattern: pathPattern },
      bytes: { type: "integer", minimum: 1 },
      sha256: digestValueSchema(),
    },
  };
}

function blockedSourceSchema() {
  return {
    type: "object",
    additionalProperties: false,
    required: ["id", "sourceId", "title", "url", "observedAt", "reasonCode", "diagnostic", "requiredFor", "blocks"],
    properties: {
      id: { type: "string", minLength: 1 },
      sourceId: { type: "string", pattern: "^SRC-[0-9]{4}$" },
      title: { type: "string", minLength: 1 },
      url: { type: "string", pattern: "^https://" },
      observedAt: { type: "string", format: "date-time" },
      reasonCode: {
        enum: [
          "TLS_CERTIFICATE_VALIDATION_FAILED",
          "OFFICIAL_PAGE_HAS_NO_ARTIFACT_LINK",
          "UNEXPECTED_OFFICIAL_RESPONSE",
        ],
      },
      diagnostic: { type: "string", minLength: 1 },
      requiredFor: {
        type: "array",
        minItems: 1,
        uniqueItems: true,
        items: { type: "string", pattern: "^(REG|SEC|PRIV|PROD|FUNC|OPS|PERF)-[0-9]{4}$" },
      },
      blocks: { type: "array", minItems: 1, uniqueItems: true, items: { type: "string", minLength: 1 } },
    },
  };
}

function publicBundleSchema() {
  return {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: "https://noeos.dev/schemas/regulatory-contract-bundle-v1.json",
    title: "Noeos VeriFactu generated regulatory contract bundle",
    type: "object",
    additionalProperties: false,
    required: ["schemaVersion", "bundleId", "sourceSnapshot", "generator", "stages", "coverage", "documents"],
    properties: {
      schemaVersion: { const: 1 },
      bundleId: { type: "string", minLength: 1 },
      sourceSnapshot: {
        type: "object",
        additionalProperties: false,
        required: ["id", "snapshotSha256", "sourceManifestSha256", "sourceClosureSha256"],
        properties: {
          id: { type: "string", minLength: 1 },
          snapshotSha256: { type: "string", pattern: "^[0-9a-f]{64}$" },
          sourceManifestSha256: { type: "string", pattern: "^[0-9a-f]{64}$" },
          sourceClosureSha256: { type: "string", pattern: "^[0-9a-f]{64}$" },
        },
      },
      generator: {
        ...generatorIdentitySchema(),
      },
      stages: {
        type: "array",
        minItems: 5,
        maxItems: 5,
        allOf: ["authenticated-bytes", "hostile-xml", "structural-contract", "semantic-overlay", "fiscal-domain"].map(
          (id) => ({
            contains: { type: "object", required: ["id"], properties: { id: { const: id } } },
            minContains: 1,
            maxContains: 1,
          }),
        ),
        items: {
          type: "object",
          additionalProperties: false,
          required: ["id", "status", "input", "output", "failureMode"],
          properties: {
            id: {
              enum: ["authenticated-bytes", "hostile-xml", "structural-contract", "semantic-overlay", "fiscal-domain"],
            },
            status: { enum: ["enforced", "blocked", "downstream"] },
            input: { type: "string", minLength: 1 },
            output: { type: "string", minLength: 1 },
            failureMode: { type: "string", minLength: 1 },
          },
        },
      },
      coverage: {
        type: "object",
        additionalProperties: false,
        required: ["structural", "semantic", "creationAllowed", "blockedSourceIds"],
        properties: {
          structural: { type: "string", minLength: 1 },
          semantic: { type: "string", minLength: 1 },
          creationAllowed: { const: false },
          blockedSourceIds: {
            type: "array",
            minItems: 1,
            uniqueItems: true,
            items: { type: "string", minLength: 1 },
          },
        },
      },
      documents: {
        type: "array",
        minItems: 1,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["sourceId", "kind", "sha256", "targetNamespace", "nodeCount", "doctypeNeutralized"],
          properties: {
            sourceId: { type: "string", minLength: 1 },
            kind: { enum: ["xsd", "wsdl"] },
            sha256: digestValueSchema(),
            targetNamespace: { type: "string", minLength: 1 },
            nodeCount: { type: "integer", minimum: 1 },
            doctypeNeutralized: { type: "boolean" },
          },
        },
      },
    },
  };
}

function publicSchemaGraphSchema() {
  return {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: "https://noeos.dev/schemas/regulatory-schema-graph-v1.json",
    title: "Noeos VeriFactu normalized regulatory schema graph",
    type: "object",
    additionalProperties: false,
    required: ["schemaVersion", "sourceSnapshotId", "imports", "documents"],
    properties: {
      schemaVersion: { const: 1 },
      sourceSnapshotId: { type: "string", minLength: 1 },
      imports: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["from", "location", "namespace", "sourceId"],
          properties: {
            from: { type: "string", minLength: 1 },
            location: { type: "string", minLength: 1 },
            namespace: { type: "string", minLength: 1 },
            sourceId: { type: "string", minLength: 1 },
          },
        },
      },
      documents: {
        type: "array",
        minItems: 1,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["sourceId", "sourceSha256", "document"],
          properties: {
            sourceId: { type: "string", minLength: 1 },
            sourceSha256: { type: "string", pattern: "^[0-9a-f]{64}$" },
            document: { $ref: "#/$defs/node" },
          },
        },
      },
    },
    $defs: {
      node: {
        type: "object",
        additionalProperties: false,
        required: ["namespace", "name", "namespaceDeclarations", "attributes", "children"],
        properties: {
          namespace: { type: "string" },
          name: { type: "string", minLength: 1 },
          namespaceDeclarations: { type: "object", additionalProperties: { type: "string" } },
          attributes: { type: "object", additionalProperties: { type: "string" } },
          children: { type: "array", items: { $ref: "#/$defs/node" } },
          text: { type: "string" },
          documentation: {
            type: "object",
            additionalProperties: false,
            required: ["utf8Bytes", "sha256"],
            properties: {
              utf8Bytes: { type: "integer", minimum: 0 },
              sha256: { type: "string", pattern: "^[0-9a-f]{64}$" },
            },
          },
        },
      },
    },
  };
}

function publicFieldConstraintsSchema() {
  const qname = {
    type: ["object", "null"],
    additionalProperties: false,
    required: ["lexical", "namespace", "localName"],
    properties: {
      lexical: { type: "string", minLength: 1 },
      namespace: { type: "string" },
      localName: { type: "string", minLength: 1 },
    },
  };
  const documentation = {
    type: "array",
    items: {
      type: "object",
      additionalProperties: false,
      required: ["utf8Bytes", "sha256"],
      properties: {
        utf8Bytes: { type: "integer", minimum: 0 },
        sha256: { type: "string", pattern: "^[0-9a-f]{64}$" },
      },
    },
  };
  const facets = {
    type: "array",
    items: {
      type: "object",
      additionalProperties: false,
      required: ["kind", "value"],
      properties: {
        kind: { enum: ["enumeration", "length", "maxLength", "minLength", "pattern"] },
        value: { type: "string" },
      },
    },
  };
  return {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: "https://noeos.dev/schemas/regulatory-field-constraints-v1.json",
    title: "Noeos VeriFactu generated XSD field constraints",
    type: "object",
    additionalProperties: false,
    required: ["schemaVersion", "sourceSnapshotId", "schemas"],
    properties: {
      schemaVersion: { const: 1 },
      sourceSnapshotId: { type: "string", minLength: 1 },
      schemas: {
        type: "array",
        minItems: 1,
        items: {
          type: "object",
          additionalProperties: false,
          required: [
            "sourceId",
            "sourceSha256",
            "targetNamespace",
            "elementFormDefault",
            "topLevelElements",
            "simpleTypes",
            "complexTypes",
            "elements",
          ],
          properties: {
            sourceId: { type: "string", minLength: 1 },
            sourceSha256: { type: "string", pattern: "^[0-9a-f]{64}$" },
            targetNamespace: { type: "string", minLength: 1 },
            elementFormDefault: { type: "string", minLength: 1 },
            topLevelElements: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                required: ["name", "ref", "type"],
                properties: { name: { type: ["string", "null"] }, ref: qname, type: qname },
              },
            },
            simpleTypes: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                required: ["name", "base", "facets", "documentation"],
                properties: { name: { type: "string" }, base: qname, facets, documentation },
              },
            },
            complexTypes: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                required: ["name", "mixed", "documentation"],
                properties: { name: { type: "string" }, mixed: { type: "string" }, documentation },
              },
            },
            elements: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                required: [
                  "context",
                  "name",
                  "ref",
                  "type",
                  "minOccurs",
                  "maxOccurs",
                  "choiceDepth",
                  "inlineFacets",
                  "documentation",
                ],
                properties: {
                  context: { type: "array", items: { type: "string" } },
                  name: { type: ["string", "null"] },
                  ref: qname,
                  type: qname,
                  minOccurs: { type: "string" },
                  maxOccurs: { type: "string" },
                  choiceDepth: { type: "integer", minimum: 0 },
                  inlineFacets: facets,
                  documentation,
                },
              },
            },
          },
        },
      },
    },
  };
}

function publicCataloguesSchema() {
  return {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: "https://noeos.dev/schemas/regulatory-catalogues-v1.json",
    title: "Noeos VeriFactu generated XSD catalogues",
    type: "object",
    additionalProperties: false,
    required: ["schemaVersion", "sourceSnapshotId", "catalogues"],
    properties: {
      schemaVersion: { const: 1 },
      sourceSnapshotId: { type: "string", minLength: 1 },
      catalogues: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["sourceId", "targetNamespace", "name", "values"],
          properties: {
            sourceId: { type: "string", minLength: 1 },
            targetNamespace: { type: "string", minLength: 1 },
            name: { type: "string", minLength: 1 },
            values: { type: "array", minItems: 1, uniqueItems: true, items: { type: "string" } },
          },
        },
      },
    },
  };
}

function publicSoapBindingsSchema() {
  const qname = qnameValueSchema();
  const nullableString = { type: ["string", "null"] };
  return {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: "https://noeos.dev/schemas/regulatory-soap-bindings-v1.json",
    title: "Noeos VeriFactu generated WSDL SOAP bindings",
    type: "object",
    additionalProperties: false,
    required: ["schemaVersion", "sourceSnapshotId", "wsdl"],
    properties: {
      schemaVersion: { const: 1 },
      sourceSnapshotId: { type: "string", minLength: 1 },
      wsdl: {
        type: "object",
        additionalProperties: false,
        required: [
          "sourceId",
          "sourceSha256",
          "name",
          "targetNamespace",
          "messages",
          "portTypes",
          "bindings",
          "services",
        ],
        properties: {
          sourceId: { type: "string", minLength: 1 },
          sourceSha256: digestValueSchema(),
          name: { type: ["string", "null"] },
          targetNamespace: { type: "string", minLength: 1 },
          messages: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["name", "parts"],
              properties: {
                name: { type: "string", minLength: 1 },
                parts: {
                  type: "array",
                  items: {
                    type: "object",
                    additionalProperties: false,
                    required: ["name", "element", "type"],
                    properties: { name: { type: "string", minLength: 1 }, element: qname, type: qname },
                  },
                },
              },
            },
          },
          portTypes: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["name", "operations"],
              properties: {
                name: { type: "string", minLength: 1 },
                operations: {
                  type: "array",
                  items: {
                    type: "object",
                    additionalProperties: false,
                    required: ["name", "input", "output"],
                    properties: { name: { type: "string", minLength: 1 }, input: qname, output: qname },
                  },
                },
              },
            },
          },
          bindings: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["name", "type", "soap", "operations"],
              properties: {
                name: { type: "string", minLength: 1 },
                type: qname,
                soap: {
                  type: "array",
                  items: {
                    type: "object",
                    additionalProperties: false,
                    required: ["style", "transport"],
                    properties: { style: nullableString, transport: nullableString },
                  },
                },
                operations: {
                  type: "array",
                  items: {
                    type: "object",
                    additionalProperties: false,
                    required: ["name", "soapAction", "inputUse", "outputUse"],
                    properties: {
                      name: { type: "string", minLength: 1 },
                      soapAction: nullableString,
                      inputUse: nullableString,
                      outputUse: nullableString,
                    },
                  },
                },
              },
            },
          },
          services: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["name", "ports"],
              properties: {
                name: { type: "string", minLength: 1 },
                ports: {
                  type: "array",
                  items: {
                    type: "object",
                    additionalProperties: false,
                    required: ["name", "binding", "address"],
                    properties: { name: { type: "string", minLength: 1 }, binding: qname, address: nullableString },
                  },
                },
              },
            },
          },
        },
      },
    },
  };
}

function publicEditionSchema() {
  const approvalSchema = {
    type: "object",
    additionalProperties: false,
    required: ["decisionId", "decidedAt", "approverRole", "evidence"],
    properties: {
      decisionId: { type: "string", minLength: 1 },
      decidedAt: { type: "string", format: "date-time" },
      approverRole: { type: "string", minLength: 1 },
      evidence: { type: "array", minItems: 1, uniqueItems: true, items: artifactIdentitySchema() },
    },
  };
  return {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: "https://noeos.dev/schemas/regulatory-edition-descriptor-v1.json",
    title: "Noeos VeriFactu immutable regulatory edition descriptor",
    type: "object",
    additionalProperties: false,
    required: [
      "schemaVersion",
      "editionId",
      "status",
      "immutable",
      "creationAllowed",
      "historicalVerificationAvailable",
      "sourceSnapshot",
      "generator",
      "contracts",
      "publicSchemas",
      "outputClosureSha256",
      "blockers",
      "approval",
      "reason",
    ],
    properties: {
      schemaVersion: { const: 1 },
      editionId: { type: "string", minLength: 1 },
      status: {
        enum: [
          "discovered",
          "imported",
          "generated-unverified",
          "candidate",
          "blocked",
          "approved",
          "active",
          "sunset",
          "historical",
          "revoked-for-generation",
        ],
      },
      immutable: { const: true },
      creationAllowed: { type: "boolean" },
      historicalVerificationAvailable: { type: "boolean" },
      sourceSnapshot: {
        type: "object",
        additionalProperties: false,
        required: ["id", "path", "snapshotSha256", "sourceManifestSha256", "sourceClosureSha256"],
        properties: {
          id: { type: "string", minLength: 1 },
          path: { type: "string", pattern: "^\\.\\./source-snapshots/[A-Za-z0-9.+_-]+/snapshot\\.json$" },
          snapshotSha256: digestValueSchema(),
          sourceManifestSha256: digestValueSchema(),
          sourceClosureSha256: digestValueSchema(),
        },
      },
      generator: generatorIdentitySchema(),
      contracts: {
        type: "array",
        minItems: 1,
        uniqueItems: true,
        items: generatedOutputSchema("^contracts/[A-Za-z0-9][A-Za-z0-9._/-]+\\.json$"),
      },
      publicSchemas: {
        type: "array",
        minItems: 1,
        uniqueItems: true,
        items: generatedOutputSchema("^\\.\\./\\.\\./schemas/[A-Za-z0-9][A-Za-z0-9._-]+\\.json$"),
      },
      outputClosureSha256: digestValueSchema(),
      blockers: { type: "array", uniqueItems: true, items: blockedSourceSchema() },
      approval: { oneOf: [{ type: "null" }, approvalSchema] },
      reason: { type: "string", minLength: 1 },
    },
    allOf: [
      {
        if: { properties: { status: { const: "active" } }, required: ["status"] },
        then: {
          properties: {
            creationAllowed: { const: true },
            approval: approvalSchema,
            blockers: { type: "array", maxItems: 0 },
          },
        },
      },
      {
        if: { properties: { status: { not: { const: "active" } } }, required: ["status"] },
        then: { properties: { creationAllowed: { const: false } } },
      },
      {
        if: {
          properties: {
            status: { enum: ["discovered", "imported", "generated-unverified", "candidate", "blocked"] },
          },
          required: ["status"],
        },
        then: { properties: { approval: { type: "null" } } },
      },
      {
        if: {
          properties: { status: { enum: ["approved", "active", "sunset", "historical", "revoked-for-generation"] } },
          required: ["status"],
        },
        then: { properties: { approval: approvalSchema } },
      },
    ],
  };
}

async function generatorIdentity(repositoryRoot, configuration) {
  const artifacts = [];
  for (const relative of [
    "internal/contract-generation/catalogue-access.mjs",
    "internal/contract-generation/generate-contracts.mjs",
    "internal/contract-generation/xml-parser.mjs",
  ]) {
    const bytes = await readFile(path.join(repositoryRoot, relative));
    artifacts.push({ path: relative, sha256: sha256(bytes) });
  }
  return {
    id: configuration.generatorId,
    artifacts,
    configurationSha256: sha256(Buffer.from(stableJson(configuration))),
    primaryRuntime: "node 24.21.0",
  };
}

function resolveImport(source, imported, manifestByPath, manifestById, aliasByLocation) {
  const location = attribute(imported, "schemaLocation");
  const expectedNamespace = attribute(imported, "namespace");
  assert(location && expectedNamespace, "SCHEMA_IMPORT_INCOMPLETE", `${source.id} has an incomplete import`);
  let dependency;
  if (/^[A-Za-z][A-Za-z0-9+.-]*:/.test(location)) {
    const alias = aliasByLocation.get(location);
    assert(alias, "SCHEMA_REMOTE_IMPORT_FORBIDDEN", `${source.id} requests unadmitted ${location}`);
    assert(
      alias.namespace === expectedNamespace,
      "SCHEMA_IMPORT_NAMESPACE_MISMATCH",
      `${source.id} alias namespace differs`,
    );
    dependency = manifestById.get(alias.sourceId);
  } else {
    assert(!location.includes("\\"), "SCHEMA_IMPORT_PATH_FORBIDDEN", `${source.id} uses a platform path`);
    const joined = path.posix.normalize(path.posix.join(path.posix.dirname(source.path), location));
    assert(
      joined.startsWith("sources/technical/") && !joined.includes("/../"),
      "SCHEMA_IMPORT_PATH_FORBIDDEN",
      `${source.id} escapes the source graph`,
    );
    dependency = manifestByPath.get(joined);
  }
  assert(dependency, "SCHEMA_IMPORT_UNRESOLVED", `${source.id} cannot resolve ${location}`);
  return { location, namespace: expectedNamespace, sourceId: dependency.id };
}

function assertSupported(parsedById, configuration) {
  const supported = new Map(
    Object.entries(configuration.supportedElements).map(([namespace, names]) => [namespace, new Set(names)]),
  );
  for (const [sourceId, parsed] of parsedById) {
    for (const node of descendants(parsed.root, () => true)) {
      const names = supported.get(node.namespace);
      assert(
        names?.has(node.localName),
        "SCHEMA_CONSTRUCT_UNSUPPORTED",
        `${sourceId} uses {${node.namespace}}${node.localName}`,
      );
    }
  }
}

export async function generateContracts(repositoryRoot = root) {
  const configuration = await validateJsonFile(
    repositoryRoot,
    "config/regulatory/contract-generation.json",
    "config/regulatory/contract-generation.schema.json",
  );
  const snapshotDirectory = path.join(repositoryRoot, "editions/source-snapshots", configuration.sourceSnapshotId);
  const snapshotBytes = await readFile(path.join(snapshotDirectory, "snapshot.json"));
  const sourceManifestBytes = await readFile(path.join(snapshotDirectory, "source-manifest.json"));
  const snapshot = JSON.parse(snapshotBytes);
  const sourceManifest = JSON.parse(sourceManifestBytes);
  assert(
    snapshotBytes.equals(Buffer.from(stableJson(snapshot))) &&
      sourceManifestBytes.equals(Buffer.from(stableJson(sourceManifest))),
    "GENERATOR_SOURCE_METADATA_NONCANONICAL",
    "source snapshot metadata must be canonical JSON",
  );
  assert(
    snapshot.snapshotId === configuration.sourceSnapshotId,
    "GENERATOR_SNAPSHOT_MISMATCH",
    "configured snapshot identity differs",
  );
  assert(snapshot.immutable === true, "GENERATOR_SNAPSHOT_MUTABLE", "generator requires an immutable source snapshot");
  assert(
    snapshot.creationAllowed === false,
    "GENERATOR_SOURCE_CREATION_STATE_INVALID",
    "source snapshots cannot authorize fiscal creation",
  );
  assert(
    snapshot.sourceManifest?.sha256 === sha256(sourceManifestBytes),
    "GENERATOR_SOURCE_MANIFEST_DRIFT",
    "source manifest digest differs from the snapshot",
  );
  const sourceClosure = sourceManifest.sources.map(({ id, sha256: sourceSha256, dependencies }) => ({
    id,
    sha256: sourceSha256,
    dependencies,
  }));
  assert(
    snapshot.sourceClosureSha256 === sha256(Buffer.from(stableJson(sourceClosure))),
    "GENERATOR_SOURCE_CLOSURE_DRIFT",
    "source closure digest differs from the snapshot",
  );
  const manifestById = new Map(sourceManifest.sources.map((source) => [source.id, source]));
  const manifestByPath = new Map(sourceManifest.sources.map((source) => [source.path, source]));
  assert(
    manifestById.size === sourceManifest.sources.length && manifestByPath.size === sourceManifest.sources.length,
    "GENERATOR_SOURCE_IDENTITY_DUPLICATE",
    "source manifest repeats an ID or path",
  );
  assert(
    stableJson(sorted(sourceManifest.blockedSources.map(({ id }) => id))) ===
      stableJson(sorted(snapshot.blockedSourceIds)),
    "GENERATOR_SOURCE_BLOCKERS_DRIFT",
    "source manifest and snapshot blockers differ",
  );
  const sourceBytesById = new Map();
  for (const source of sourceManifest.sources) {
    assert(
      source.path.startsWith("sources/") &&
        !source.path.includes("\\") &&
        !source.path.split("/").some((segment) => segment === "" || segment === "." || segment === ".."),
      "GENERATOR_SOURCE_PATH_INVALID",
      `${source.id} source path is unsafe`,
    );
    const absolute = path.join(snapshotDirectory, source.path);
    const stat = await lstat(absolute).catch(() => null);
    assert(
      stat?.isFile() && !stat.isSymbolicLink(),
      "GENERATOR_SOURCE_FILE_UNSAFE",
      `${source.id} is not a regular file`,
    );
    const bytes = await readFile(absolute);
    assert(
      bytes.length === source.bytes && sha256(bytes) === source.sha256 && sha512(bytes) === source.sha512,
      "GENERATOR_SOURCE_DRIFT",
      `${source.id} bytes differ`,
    );
    sourceBytesById.set(source.id, bytes);
  }
  const aliasByLocation = new Map(configuration.importAliases.map((alias) => [alias.location, alias]));
  assert(
    manifestById.get(configuration.doctypeNeutralization.sourceId)?.sha256 ===
      configuration.doctypeNeutralization.sha256,
    "DOCTYPE_ALLOWLIST_MISMATCH",
    "DTD neutralization identity differs from the admitted source",
  );
  const technicalSources = sourceManifest.sources.filter((source) => ["xsd", "wsdl"].includes(source.kind));
  const parsedById = new Map();
  for (const source of technicalSources) {
    const bytes = sourceBytesById.get(source.id);
    parsedById.set(source.id, parsePinnedXml(source, bytes, { limits: configuration.limits }));
  }
  assertSupported(parsedById, configuration);

  const targetNamespaceById = new Map();
  for (const source of technicalSources) {
    const parsed = parsedById.get(source.id);
    const rootNode = parsed.root;
    assert(
      (source.kind === "xsd" && rootNode.namespace === XSD && rootNode.localName === "schema") ||
        (source.kind === "wsdl" && rootNode.namespace === WSDL && rootNode.localName === "definitions"),
      "SCHEMA_ROOT_UNSUPPORTED",
      `${source.id} root does not match its media role`,
    );
    const namespace = attribute(rootNode, "targetNamespace");
    assert(
      namespace && ![...targetNamespaceById.values()].includes(namespace),
      "SCHEMA_NAMESPACE_DUPLICATE",
      `${source.id} namespace is absent or duplicated`,
    );
    targetNamespaceById.set(source.id, namespace);
  }

  const imports = [];
  for (const source of technicalSources) {
    const importedNodes = descendants(
      parsedById.get(source.id).root,
      (node) => node.namespace === XSD && node.localName === "import",
    );
    const resolved = importedNodes.map((node) =>
      resolveImport(source, node, manifestByPath, manifestById, aliasByLocation),
    );
    for (const dependency of resolved) {
      assert(
        targetNamespaceById.get(dependency.sourceId) === dependency.namespace,
        "SCHEMA_IMPORT_NAMESPACE_MISMATCH",
        `${source.id} import namespace differs from ${dependency.sourceId}`,
      );
      imports.push({ from: source.id, ...dependency });
    }
    assert(
      stableJson(sorted(resolved.map(({ sourceId }) => sourceId))) === stableJson(sorted(source.dependencies)),
      "SCHEMA_DEPENDENCY_MANIFEST_MISMATCH",
      `${source.id} parsed imports differ from custody dependencies`,
    );
  }

  const generator = await generatorIdentity(repositoryRoot, configuration);
  const schemaDocuments = technicalSources
    .filter(({ kind }) => kind === "xsd")
    .map((source) => schemaInventory(source, parsedById.get(source.id)));
  const wsdlSource = technicalSources.find(({ kind }) => kind === "wsdl");
  assert(wsdlSource, "WSDL_SOURCE_MISSING", "no WSDL is admitted");
  const soap = soapInventory(wsdlSource, parsedById.get(wsdlSource.id));
  const documents = technicalSources.map((source) => ({
    sourceId: source.id,
    kind: source.kind,
    sha256: source.sha256,
    targetNamespace: targetNamespaceById.get(source.id),
    nodeCount: parsedById.get(source.id).nodeCount,
    doctypeNeutralized: parsedById.get(source.id).doctypeNeutralized,
  }));
  const bundle = {
    schemaVersion: 1,
    bundleId: `contracts.${configuration.sourceSnapshotId}`,
    sourceSnapshot: {
      id: configuration.sourceSnapshotId,
      snapshotSha256: sha256(snapshotBytes),
      sourceManifestSha256: sha256(sourceManifestBytes),
      sourceClosureSha256: snapshot.sourceClosureSha256,
    },
    generator,
    stages: [
      {
        id: "authenticated-bytes",
        status: "enforced",
        input: "immutable-source-snapshot",
        output: "digest-verified-technical-documents",
        failureMode: "reject-length-or-sha256-drift",
      },
      {
        id: "hostile-xml",
        status: "enforced",
        input: "digest-verified-technical-documents",
        output: "bounded-namespace-aware-trees",
        failureMode: "reject-active-content-ambiguity-or-resource-overflow",
      },
      {
        id: "structural-contract",
        status: "enforced",
        input: "closed-offline-xsd-wsdl-graph",
        output: "field-catalogue-and-soap-contracts",
        failureMode: "reject-unsupported-or-unresolved-structure",
      },
      {
        id: "semantic-overlay",
        status: "blocked",
        input: "mandatory-aeat-record-design-and-validation-catalogue",
        output: "no-output",
        failureMode: "block-while-official-authority-is-unavailable",
      },
      {
        id: "fiscal-domain",
        status: "downstream",
        input: "approved-regulatory-edition",
        output: "p4-runtime-domain-contracts",
        failureMode: "not-implemented-before-p3-readiness",
      },
    ],
    coverage: {
      structural: "complete-for-admitted-xsd-wsdl-graph",
      semantic: "blocked-mandatory-aeat-record-design-and-validation-catalogue-unavailable",
      creationAllowed: false,
      blockedSourceIds: snapshot.blockedSourceIds,
    },
    documents,
  };
  const schemaGraph = {
    schemaVersion: 1,
    sourceSnapshotId: configuration.sourceSnapshotId,
    imports,
    documents: technicalSources.map((source) => ({
      sourceId: source.id,
      sourceSha256: source.sha256,
      document: normalizedNode(parsedById.get(source.id).root),
    })),
  };
  const fieldConstraints = {
    schemaVersion: 1,
    sourceSnapshotId: configuration.sourceSnapshotId,
    schemas: schemaDocuments,
  };
  const catalogues = {
    schemaVersion: 1,
    sourceSnapshotId: configuration.sourceSnapshotId,
    catalogues: schemaDocuments.flatMap((schema) =>
      schema.simpleTypes
        .filter((type) => type.facets.some(({ kind }) => kind === "enumeration"))
        .map((type) => ({
          sourceId: schema.sourceId,
          targetNamespace: schema.targetNamespace,
          name: type.name,
          values: type.facets.filter(({ kind }) => kind === "enumeration").map(({ value }) => value),
        })),
    ),
  };
  const soapBindings = { schemaVersion: 1, sourceSnapshotId: configuration.sourceSnapshotId, wsdl: soap };
  const contractValues = {
    "contracts/runtime-contracts.json": bundle,
    "contracts/schema-graph.json": schemaGraph,
    "contracts/field-constraints.json": fieldConstraints,
    "contracts/catalogues.json": catalogues,
    "contracts/soap-bindings.json": soapBindings,
  };
  const contracts = Object.entries(contractValues).map(([relative, value]) => {
    const bytes = Buffer.from(stableJson(value));
    return { path: relative, bytes: bytes.length, sha256: sha256(bytes) };
  });
  const publicSchemaValues = {
    "schemas/regulatory-contract-bundle-v1.schema.json": publicBundleSchema(),
    "schemas/regulatory-edition-descriptor-v1.schema.json": publicEditionSchema(),
    "schemas/regulatory-schema-graph-v1.schema.json": publicSchemaGraphSchema(),
    "schemas/regulatory-field-constraints-v1.schema.json": publicFieldConstraintsSchema(),
    "schemas/regulatory-catalogues-v1.schema.json": publicCataloguesSchema(),
    "schemas/regulatory-soap-bindings-v1.schema.json": publicSoapBindingsSchema(),
  };
  const publicSchemas = Object.entries(publicSchemaValues).map(([relative, value]) => {
    const bytes = Buffer.from(stableJson(value));
    return { path: `../../${relative}`, bytes: bytes.length, sha256: sha256(bytes) };
  });
  const outputClosureSha256 = sha256(Buffer.from(stableJson([...contracts, ...publicSchemas])));
  const edition = {
    schemaVersion: 1,
    editionId: configuration.candidateEditionId,
    status: "candidate",
    immutable: true,
    creationAllowed: false,
    historicalVerificationAvailable: true,
    sourceSnapshot: {
      id: configuration.sourceSnapshotId,
      path: `../source-snapshots/${configuration.sourceSnapshotId}/snapshot.json`,
      snapshotSha256: sha256(snapshotBytes),
      sourceManifestSha256: sha256(sourceManifestBytes),
      sourceClosureSha256: snapshot.sourceClosureSha256,
    },
    generator,
    contracts,
    publicSchemas,
    outputClosureSha256,
    blockers: sourceManifest.blockedSources,
    approval: null,
    reason:
      "Structural contracts are generated from the closed official XSD/WSDL graph, but mandatory semantic, hash, signature and QR authorities remain unavailable. This candidate cannot create fiscal artifacts.",
  };
  return {
    editionId: configuration.candidateEditionId,
    files: new Map([
      ...Object.entries(contractValues).map(([relative, value]) => [relative, Buffer.from(stableJson(value))]),
      ["edition.json", Buffer.from(stableJson(edition))],
      ...Object.entries(publicSchemaValues).map(([relative, value]) => [relative, Buffer.from(stableJson(value))]),
    ]),
    evidence: {
      sourceSnapshotId: configuration.sourceSnapshotId,
      candidateEditionId: configuration.candidateEditionId,
      technicalDocumentCount: technicalSources.length,
      schemaCount: schemaDocuments.length,
      importCount: imports.length,
      fieldDeclarationCount: schemaDocuments.reduce((count, schema) => count + schema.elements.length, 0),
      catalogueCount: catalogues.catalogues.length,
      soapServiceCount: soap.services.length,
      creationAllowed: false,
    },
  };
}

async function writeAtomic(destination, bytes) {
  await mkdir(path.dirname(destination), { recursive: true });
  const temporary = `${destination}.${process.pid}.tmp`;
  await writeFile(temporary, bytes, { flag: "wx", mode: 0o644 });
  try {
    await link(temporary, destination);
  } finally {
    await unlink(temporary).catch(() => undefined);
  }
}

export async function writeGeneratedContracts(repositoryRoot = root) {
  const generated = await generateContracts(repositoryRoot);
  const editionDirectory = path.join(repositoryRoot, "editions", generated.editionId);
  const stagingDirectory = `${editionDirectory}.${process.pid}.tmp`;
  const lockPath = `${editionDirectory}.materialize.lock`;
  const existing = await lstat(editionDirectory).catch(() => null);
  assert(existing === null, "IMMUTABLE_EDITION_EXISTS", `${generated.editionId} already exists`);

  const editionFiles = [];
  const publicSchemas = [];
  for (const [relative, bytes] of generated.files) {
    const destination = relative.startsWith("schemas/")
      ? path.join(repositoryRoot, relative)
      : path.join(editionDirectory, relative);
    assert(
      (await lstat(destination).catch(() => null)) === null,
      "GENERATED_DESTINATION_EXISTS",
      `${relative} already exists`,
    );
    if (relative.startsWith("schemas/")) publicSchemas.push({ destination, bytes });
    else editionFiles.push({ relative, bytes });
  }

  await writeFile(lockPath, `${process.pid}\n`, { flag: "wx", mode: 0o600 }).catch((error) => {
    assert(
      false,
      "GENERATOR_MATERIALIZATION_LOCKED",
      `${generated.editionId} is already being materialized: ${error.code}`,
    );
  });
  const publishedSchemas = [];
  try {
    assert((await lstat(stagingDirectory).catch(() => null)) === null, "GENERATOR_STAGING_EXISTS", stagingDirectory);
    await mkdir(stagingDirectory, { recursive: false, mode: 0o755 });
    for (const { relative, bytes } of editionFiles) {
      await writeAtomic(path.join(stagingDirectory, relative), bytes);
    }
    for (const { destination, bytes } of publicSchemas) {
      await writeAtomic(destination, bytes);
      publishedSchemas.push(destination);
    }
    assert(
      (await lstat(editionDirectory).catch(() => null)) === null,
      "IMMUTABLE_EDITION_EXISTS",
      `${generated.editionId} appeared during materialization`,
    );
    await rename(stagingDirectory, editionDirectory);
  } catch (error) {
    await rm(stagingDirectory, { recursive: true, force: true });
    for (const published of publishedSchemas) await rm(published, { force: true });
    throw error;
  } finally {
    await unlink(lockPath).catch(() => undefined);
  }
  return generated.evidence;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const write = process.argv.includes("--write");
  await main("regulatory-contract-generation", async () => {
    assert(write, "WRITE_MODE_REQUIRED", "use --write for the initial immutable candidate materialization");
    return writeGeneratedContracts(root);
  });
}
