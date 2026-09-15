import { assert } from "../../tooling/lib/policy.mjs";

function deepFreeze(value) {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}

function validateDocument(document) {
  assert(
    document?.schemaVersion === 1 && Array.isArray(document.catalogues),
    "CATALOGUE_DOCUMENT_INVALID",
    "catalogue document is invalid",
  );
  const identities = new Set();
  for (const catalogue of document.catalogues) {
    assert(
      typeof catalogue.sourceId === "string" &&
        typeof catalogue.targetNamespace === "string" &&
        typeof catalogue.name === "string" &&
        Array.isArray(catalogue.values),
      "CATALOGUE_ENTRY_INVALID",
      "catalogue entry is malformed",
    );
    const identity = `${catalogue.targetNamespace}\0${catalogue.name}`;
    assert(!identities.has(identity), "CATALOGUE_IDENTITY_DUPLICATE", `${catalogue.name} is duplicated`);
    identities.add(identity);
    assert(
      new Set(catalogue.values).size === catalogue.values.length,
      "CATALOGUE_VALUE_DUPLICATE",
      `${catalogue.name} repeats a value`,
    );
  }
}

export function listCatalogues(document) {
  validateDocument(document);
  return deepFreeze(
    structuredClone(
      [...document.catalogues]
        .sort((left, right) =>
          `${left.targetNamespace}\0${left.name}`.localeCompare(`${right.targetNamespace}\0${right.name}`, "en"),
        )
        .map(({ sourceId, targetNamespace, name, values }) => ({
          sourceId,
          targetNamespace,
          name,
          valueCount: values.length,
        })),
    ),
  );
}

export function openCatalogue(document, targetNamespace, name) {
  validateDocument(document);
  assert(
    typeof targetNamespace === "string" && targetNamespace.length > 0,
    "CATALOGUE_NAMESPACE_REQUIRED",
    "target namespace is required",
  );
  assert(typeof name === "string" && name.length > 0, "CATALOGUE_NAME_REQUIRED", "catalogue name is required");
  const matches = document.catalogues.filter(
    (catalogue) => catalogue.targetNamespace === targetNamespace && catalogue.name === name,
  );
  assert(
    matches.length === 1,
    "CATALOGUE_UNKNOWN",
    `expected one ${targetNamespace}#${name}; observed ${matches.length}`,
  );
  return deepFreeze(structuredClone(matches[0]));
}
