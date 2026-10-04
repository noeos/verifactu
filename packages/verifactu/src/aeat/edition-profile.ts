import { createHash } from "node:crypto";
import { invalid, ok, type Result } from "../contracts/results.js";
import type { FiscalContext } from "../domain/context.js";
import { createFiscalContext, sameContext } from "../domain/context.js";
import { isSafeStoreToken } from "../persistence/model.js";

export type AeatEnvironment = "test" | "production";
export type AeatOperationId =
  | "voluntary-submission"
  | "consultation"
  | "authority-requested-submission";

export interface AeatEndpoint {
  readonly id: string;
  readonly environment: AeatEnvironment;
  readonly url: string;
  readonly serviceId: string;
  readonly portId: string;
}

export interface SoapBindingProfile {
  readonly soapVersion: "1.1" | "1.2";
  readonly envelopeNamespace: string;
  readonly serviceNamespace: string;
  readonly soapAction: string;
  readonly method: "POST";
  readonly contentType: string;
  readonly headerQName: string;
  readonly requestQName: string;
  readonly responseQName: string;
  readonly namespaceBindings: readonly {
    readonly prefix: string;
    readonly namespace: string;
  }[];
  readonly headerFields: readonly {
    readonly name: string;
    readonly valueKind:
      | "taxpayer"
      | "installation"
      | "product"
      | "software-version"
      | "installation-number";
  }[];
  readonly maxRequestBytes: number;
  readonly maxResponseBytes: number;
  readonly maxBatchItems: number;
  readonly requiresMtls: boolean;
}

export interface AeatOperationProfile {
  readonly id: AeatOperationId;
  readonly purpose: "voluntary" | "consultation" | "authority-requested";
  readonly wsdlDigest: string;
  readonly requestSchemaDigest: string;
  readonly responseSchemaDigest: string;
  readonly endpoints: readonly AeatEndpoint[];
  readonly binding: SoapBindingProfile;
  readonly response: AeatResponseContract;
}

export interface AeatResponseContract {
  readonly responseQName: string;
  readonly soapFaultQName: string;
  readonly globalStatusQName: string | null;
  readonly waitTimeQName: string | null;
  readonly lineQName: string | null;
  readonly lineIdentityPaths: readonly string[];
  readonly lineStatusQName: string | null;
  readonly lineErrorCodeQName: string | null;
  readonly allowedResponseChildren: readonly string[];
  readonly allowedLineChildren: readonly string[];
  readonly acceptedGlobalValues: readonly string[];
  readonly partialGlobalValues: readonly string[];
  readonly rejectedGlobalValues: readonly string[];
  readonly acceptedLineValues: readonly string[];
  readonly qualifiedLineValues: readonly string[];
  readonly rejectedLineValues: readonly string[];
}

export interface EditionProfileInput {
  readonly editionId: string;
  readonly sourceManifestSha256: string;
  readonly generatedOutputSha256: string;
  readonly sourceClosureVerified: boolean;
  readonly lifecycle: "candidate" | "approved" | "active" | "retired";
  readonly creationAllowed: boolean;
  readonly activationEvidenceId: string | null;
  readonly operations: readonly AeatOperationProfile[];
}

export interface AeatEditionProfile extends EditionProfileInput {
  readonly digest: string;
}

export interface ResolvedAeatEndpoint {
  readonly endpointId: string;
  readonly environment: AeatEnvironment;
  readonly url: URL;
  readonly serviceId: string;
  readonly portId: string;
  readonly editionId: string;
  readonly editionDigest: string;
}

const sha256 = (value: unknown): value is string =>
  typeof value === "string" && /^[0-9a-f]{64}$/u.test(value);
const qname = (value: string): boolean =>
  /^[A-Za-z_][A-Za-z0-9_.-]*:[A-Za-z_][A-Za-z0-9_.-]*$/u.test(value);

export function createAeatEditionProfile(
  input: EditionProfileInput,
): Result<AeatEditionProfile> {
  if (
    !input ||
    !isSafeStoreToken(input.editionId) ||
    !sha256(input.sourceManifestSha256) ||
    !sha256(input.generatedOutputSha256) ||
    input.sourceClosureVerified !== true ||
    !["candidate", "approved", "active", "retired"].includes(input.lifecycle) ||
    typeof input.creationAllowed !== "boolean" ||
    (input.lifecycle === "active" &&
      (!input.creationAllowed ||
        !isSafeStoreToken(input.activationEvidenceId))) ||
    (input.lifecycle !== "active" && input.activationEvidenceId !== null) ||
    !Array.isArray(input.operations) ||
    input.operations.length === 0
  )
    return invalid("DIAG-AEAT-EDITION-INVALID", "edition");
  const operationIds = new Set<string>();
  for (const operation of input.operations) {
    if (
      !operation ||
      ![
        "voluntary-submission",
        "consultation",
        "authority-requested-submission",
      ].includes(operation.id) ||
      operationIds.has(operation.id) ||
      !["voluntary", "consultation", "authority-requested"].includes(
        operation.purpose,
      ) ||
      !sha256(operation.wsdlDigest) ||
      !sha256(operation.requestSchemaDigest) ||
      !sha256(operation.responseSchemaDigest) ||
      !Array.isArray(operation.endpoints) ||
      operation.endpoints.length !== 2 ||
      !operation.binding ||
      !operation.response ||
      (operation.id === "consultation" &&
        operation.purpose !== "consultation") ||
      (operation.id === "voluntary-submission" &&
        operation.purpose !== "voluntary") ||
      (operation.id === "authority-requested-submission" &&
        operation.purpose !== "authority-requested")
    )
      return invalid("DIAG-AEAT-OPERATION-INVALID", "edition");
    operationIds.add(operation.id);
    const environments = new Set<string>();
    for (const endpoint of operation.endpoints) {
      let url: URL;
      try {
        url = new URL(endpoint.url);
      } catch {
        return invalid("DIAG-AEAT-ENDPOINT-INVALID", "edition");
      }
      if (
        !isSafeStoreToken(endpoint.id) ||
        !isSafeStoreToken(endpoint.serviceId) ||
        !isSafeStoreToken(endpoint.portId) ||
        !["test", "production"].includes(endpoint.environment) ||
        environments.has(endpoint.environment) ||
        url.protocol !== "https:" ||
        url.username ||
        url.password ||
        url.hash ||
        url.search ||
        !url.hostname ||
        (url.port && url.port !== "443")
      )
        return invalid("DIAG-AEAT-ENDPOINT-INVALID", "edition");
      environments.add(endpoint.environment);
    }
    if (!environments.has("test") || !environments.has("production"))
      return invalid("DIAG-AEAT-ENDPOINTS-INCOMPLETE", "edition");
    const binding = operation.binding;
    const namespaceBindings: readonly {
      readonly prefix: string;
      readonly namespace: string;
    }[] = binding.namespaceBindings;
    const headerFields: readonly {
      readonly name: string;
      readonly valueKind: SoapBindingProfile["headerFields"][number]["valueKind"];
    }[] = binding.headerFields;
    if (
      !["1.1", "1.2"].includes(binding.soapVersion) ||
      (!binding.envelopeNamespace.startsWith("http://") &&
        !binding.envelopeNamespace.startsWith("https://")) ||
      !binding.serviceNamespace.startsWith("https://") ||
      !isSafeStoreToken(binding.soapAction, 1024) ||
      binding.method !== "POST" ||
      !/^(?:text\/xml|application\/(?:soap\+xml|xml))(; charset=utf-8)?$/iu.test(
        binding.contentType,
      ) ||
      !qname(binding.headerQName) ||
      !qname(binding.requestQName) ||
      !qname(binding.responseQName) ||
      !Array.isArray(binding.namespaceBindings) ||
      binding.namespaceBindings.length === 0 ||
      !Array.isArray(binding.headerFields) ||
      binding.headerFields.length === 0 ||
      new Set(namespaceBindings.map((entry) => entry.prefix)).size !==
        namespaceBindings.length ||
      new Set(headerFields.map((entry) => entry.name)).size !==
        headerFields.length ||
      namespaceBindings.some((entry) =>
        ["soapenv", "xml", "xmlns"].includes(entry.prefix),
      ) ||
      !Number.isSafeInteger(binding.maxRequestBytes) ||
      binding.maxRequestBytes < 1 ||
      binding.maxRequestBytes > 10_485_760 ||
      !Number.isSafeInteger(binding.maxResponseBytes) ||
      binding.maxResponseBytes < 1 ||
      binding.maxResponseBytes > 1_048_576 ||
      !Number.isSafeInteger(binding.maxBatchItems) ||
      binding.maxBatchItems < 1 ||
      binding.maxBatchItems > 500 ||
      typeof binding.requiresMtls !== "boolean"
    )
      return invalid("DIAG-AEAT-BINDING-INVALID", "edition");
    const namespaceMap = new Map(
      namespaceBindings.map(({ prefix, namespace }) => [prefix, namespace]),
    );
    if (
      namespaceBindings.some(
        (entry) =>
          !/^[A-Za-z_][A-Za-z0-9_.-]*$/u.test(entry.prefix) ||
          !/^https?:\/\//u.test(entry.namespace),
      ) ||
      [binding.headerQName, binding.requestQName, binding.responseQName].some(
        (name) => !namespaceMap.has(name.split(":", 1)[0]),
      )
    )
      return invalid("DIAG-AEAT-BINDING-NAMESPACE", "edition");
    if (
      headerFields.some(
        (field) =>
          !/^[A-Za-z_][A-Za-z0-9_.-]*$/u.test(field.name) ||
          ![
            "taxpayer",
            "installation",
            "product",
            "software-version",
            "installation-number",
          ].includes(field.valueKind),
      )
    )
      return invalid("DIAG-AEAT-BINDING-HEADER", "edition");
    const response: AeatResponseContract = operation.response;
    if (
      !Array.isArray(response.allowedResponseChildren) ||
      !Array.isArray(response.allowedLineChildren)
    )
      return invalid("DIAG-AEAT-RESPONSE-CONTRACT", "edition");
    const responseQNames = [
      response.responseQName,
      response.soapFaultQName,
      response.globalStatusQName,
      response.waitTimeQName,
      response.lineQName,
      response.lineStatusQName,
      response.lineErrorCodeQName,
      ...response.allowedResponseChildren,
      ...response.allowedLineChildren,
    ].filter((value): value is string => typeof value === "string");
    const lineIdentityPaths: readonly string[] = Array.isArray(
      response.lineIdentityPaths,
    )
      ? response.lineIdentityPaths
      : [];
    if (
      responseQNames.some(
        (name) => !qname(name) || !namespaceMap.has(name.split(":", 1)[0]!),
      ) ||
      !Array.isArray(response.lineIdentityPaths) ||
      lineIdentityPaths.some((path: string) =>
        path
          .split("/")
          .some(
            (name: string) =>
              !qname(name) || !namespaceMap.has(name.split(":", 1)[0]!),
          ),
      ) ||
      [
        response.acceptedGlobalValues,
        response.partialGlobalValues,
        response.rejectedGlobalValues,
        response.acceptedLineValues,
        response.qualifiedLineValues,
        response.rejectedLineValues,
      ].some(
        (values) =>
          !Array.isArray(values) ||
          values.some((value) => !isSafeStoreToken(value, 128)),
      )
    )
      return invalid("DIAG-AEAT-RESPONSE-CONTRACT", "edition");
    if (
      new Set(response.allowedResponseChildren).size !==
        response.allowedResponseChildren.length ||
      new Set(response.allowedLineChildren).size !==
        response.allowedLineChildren.length ||
      (response.lineQName !== null &&
        (response.lineIdentityPaths.length === 0 ||
          response.lineStatusQName === null)) ||
      (response.globalStatusQName !== null &&
        !response.allowedResponseChildren.includes(
          response.globalStatusQName,
        )) ||
      (response.waitTimeQName !== null &&
        !response.allowedResponseChildren.includes(response.waitTimeQName)) ||
      (response.lineQName !== null &&
        !response.allowedResponseChildren.includes(response.lineQName)) ||
      (response.lineStatusQName !== null &&
        !response.allowedLineChildren.includes(response.lineStatusQName)) ||
      (response.lineErrorCodeQName !== null &&
        !response.allowedLineChildren.includes(response.lineErrorCodeQName)) ||
      response.lineIdentityPaths.some(
        (path) => !response.allowedLineChildren.includes(path.split("/", 1)[0]),
      ) ||
      [
        ...response.acceptedGlobalValues,
        ...response.partialGlobalValues,
        ...response.rejectedGlobalValues,
      ].some((value, index, values) => values.indexOf(value) !== index) ||
      [
        ...response.acceptedLineValues,
        ...response.qualifiedLineValues,
        ...response.rejectedLineValues,
      ].some((value, index, values) => values.indexOf(value) !== index)
    )
      return invalid("DIAG-AEAT-RESPONSE-CONTRACT", "edition");
  }
  const operations: readonly AeatOperationProfile[] = input.operations;
  const frozen = Object.freeze({
    ...input,
    operations: Object.freeze(
      operations.map((operation) =>
        Object.freeze({
          ...operation,
          endpoints: Object.freeze(
            operation.endpoints.map((endpoint) =>
              Object.freeze({ ...endpoint }),
            ),
          ),
          binding: Object.freeze({ ...operation.binding }),
        }),
      ),
    ),
  });
  const canonical = JSON.stringify(sortJson(frozen));
  const digest = `sha256:${createHash("sha256").update(canonical).digest("hex")}`;
  return ok(Object.freeze({ ...frozen, digest }));
}

function sortJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortJson);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, sortJson((value as Record<string, unknown>)[key])]),
    );
  return value;
}

export function resolveAeatEndpoint(
  profile: AeatEditionProfile,
  operationId: AeatOperationId,
  environment: AeatEnvironment,
  context: FiscalContext,
  expectedContext: FiscalContext,
): Result<ResolvedAeatEndpoint> {
  if (
    !verifyAeatEditionProfile(profile) ||
    createFiscalContext(context).status !== "ok" ||
    createFiscalContext(expectedContext).status !== "ok" ||
    !sameContext(context, expectedContext)
  )
    return invalid("DIAG-AEAT-CONTEXT-MISMATCH", "domain");
  if (
    profile.lifecycle !== "active" ||
    !profile.creationAllowed ||
    !isSafeStoreToken(profile.activationEvidenceId)
  )
    return invalid("DIAG-AEAT-EDITION-INACTIVE", "edition");
  const operation = profile.operations.find(
    (candidate) => candidate.id === operationId,
  );
  const endpoint = operation?.endpoints.find(
    (candidate) => candidate.environment === environment,
  );
  if (!operation || !endpoint)
    return invalid("DIAG-AEAT-ENDPOINT-UNAVAILABLE", "edition");
  const url = new URL(endpoint.url);
  if (url.protocol !== "https:")
    return invalid("DIAG-AEAT-ENDPOINT-INVALID", "edition");
  return ok(
    Object.freeze({
      endpointId: endpoint.id,
      environment,
      url,
      serviceId: endpoint.serviceId,
      portId: endpoint.portId,
      editionId: profile.editionId,
      editionDigest: profile.digest,
    }),
  );
}

export function operationProfile(
  profile: AeatEditionProfile,
  operationId: AeatOperationId,
): AeatOperationProfile | null {
  return (
    profile.operations.find((candidate) => candidate.id === operationId) ?? null
  );
}

export function verifyAeatEditionProfile(profile: AeatEditionProfile): boolean {
  if (!profile || typeof profile !== "object") return false;
  try {
    const { digest, ...input } = profile;
    const rebuilt = createAeatEditionProfile(input);
    return rebuilt.status === "ok" && rebuilt.value.digest === digest;
  } catch {
    return false;
  }
}
