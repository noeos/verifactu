import type { EditionPolicy } from "../contracts/configuration.js";
import {
  failed,
  succeeded,
  type OperationResult,
} from "../contracts/results.js";
import type { FiscalDate, FiscalInstant } from "./date-time.js";
import { diagnostic, type Diagnostic } from "./diagnostics.js";
import { addDecimals, compareDecimal, type ExactDecimal } from "./decimal.js";
import type {
  ArtifactId,
  EditionId,
  EvidenceId,
  IdempotencyKey,
  InstallationId,
  RecordId,
  TaxpayerId,
  TenantId,
} from "./identities.js";
import type { TenureId } from "./mode-tenure.js";

export type Presence<T> =
  | { readonly presence: "absent" }
  | { readonly presence: "present"; readonly value: T };

export const absent = Object.freeze({ presence: "absent" }) as Presence<never>;
export const present = <T>(value: T): Presence<T> =>
  Object.freeze({ presence: "present", value });

export interface FiscalDocumentIdentity {
  readonly issuerTaxpayerId: TaxpayerId;
  readonly series: string;
  readonly number: string;
  readonly issuedOn: FiscalDate;
}

export interface InputProvenance {
  readonly artifactId: ArtifactId;
  readonly digest: string;
  readonly mediaType: string;
}

export type InvoiceCategory =
  | "standard"
  | "simplified"
  | "corrective"
  | "substitution"
  | "summary";

export interface TaxBreakdown {
  readonly code: string;
  readonly base: ExactDecimal;
  readonly rate: ExactDecimal;
  readonly quota: ExactDecimal;
}

export interface InvoiceFact {
  readonly identity: FiscalDocumentIdentity;
  readonly category: InvoiceCategory;
  readonly recipientTaxpayerId: Presence<TaxpayerId>;
  readonly description: Presence<string>;
  readonly currency: string;
  readonly taxBreakdown: readonly TaxBreakdown[];
  readonly totalTax: ExactDecimal;
  readonly total: ExactDecimal;
  readonly corrects: readonly FiscalDocumentIdentity[];
  readonly substitutes: readonly FiscalDocumentIdentity[];
  readonly provenance: InputProvenance;
}

export interface RecordCommon {
  readonly id: RecordId;
  readonly tenantId: TenantId;
  readonly taxpayerId: TaxpayerId;
  readonly installationId: InstallationId;
  readonly editionId: EditionId;
  readonly tenureId: TenureId;
  readonly idempotencyKey: IdempotencyKey;
  readonly recordedAt: FiscalInstant;
}

export interface AltaRecord extends RecordCommon {
  readonly kind: "alta";
  readonly invoice: InvoiceFact;
}

export type TargetKnowledge =
  | "committed-local"
  | "verified-external"
  | "unknown";

export interface AnulacionRecord extends RecordCommon {
  readonly kind: "anulacion";
  readonly targetIdentity: FiscalDocumentIdentity;
  readonly targetRecordId: Presence<RecordId>;
  readonly targetKnowledge: Exclude<TargetKnowledge, "unknown">;
  readonly cause: string;
  readonly evidenceIds: readonly EvidenceId[];
}

export type FiscalRecord = AltaRecord | AnulacionRecord;

export interface EditionDomainRules extends EditionPolicy {
  readonly supportedInvoiceCategories: readonly InvoiceCategory[];
  readonly supportedCurrencies: readonly string[];
  readonly supportedTaxCodes: readonly string[];
  readonly supportedCancellationCauses: readonly string[];
  readonly permitExternalCancellation: boolean;
}

export type ConstructionResult<T> =
  | { readonly status: "accepted"; readonly record: T }
  | { readonly status: "rejected"; readonly diagnostics: readonly Diagnostic[] }
  | {
      readonly status: "indeterminate";
      readonly diagnostics: readonly Diagnostic[];
      readonly requiredEvidence: readonly string[];
    };

export function defineRecord(
  record: FiscalRecord,
): OperationResult<FiscalRecord> {
  const diagnostics = validateCommon(record);
  if (record.kind === "alta")
    diagnostics.push(...validateInvoice(record.invoice));
  else if (record.cause.length === 0 || record.evidenceIds.length === 0)
    diagnostics.push(
      diagnostic("DIAG-CANCELLATION-EVIDENCE", "input", "domain", "/record"),
    );
  return diagnostics.length === 0
    ? succeeded(deepFreeze(record))
    : failed("invalid", diagnostics);
}

export function constructAlta(
  record: AltaRecord,
  rules: EditionDomainRules,
): ConstructionResult<AltaRecord> {
  const availability = validateEdition(record, rules);
  if (availability !== null) return availability;
  const diagnostics = [
    ...validateCommon(record),
    ...validateInvoice(record.invoice),
  ];
  if (!rules.supportedInvoiceCategories.includes(record.invoice.category))
    diagnostics.push(
      diagnostic(
        "DIAG-INVOICE-CATEGORY",
        "input",
        "edition",
        "/invoice/category",
      ),
    );
  if (!rules.supportedCurrencies.includes(record.invoice.currency))
    diagnostics.push(
      diagnostic(
        "DIAG-INVOICE-CURRENCY",
        "input",
        "edition",
        "/invoice/currency",
      ),
    );
  for (const [index, line] of record.invoice.taxBreakdown.entries()) {
    if (!rules.supportedTaxCodes.includes(line.code))
      diagnostics.push(
        diagnostic(
          "DIAG-TAX-CODE",
          "input",
          "edition",
          `/invoice/taxBreakdown/${index}/code`,
        ),
      );
  }
  return diagnostics.length === 0
    ? Object.freeze({ status: "accepted", record: deepFreeze(record) })
    : Object.freeze({
        status: "rejected",
        diagnostics: Object.freeze(diagnostics),
      });
}

export function constructAnulacion(
  record: Omit<AnulacionRecord, "targetKnowledge"> & {
    readonly targetKnowledge: TargetKnowledge;
  },
  rules: EditionDomainRules,
): ConstructionResult<AnulacionRecord> {
  const availability = validateEdition(record, rules);
  if (availability !== null) return availability;
  if (record.targetKnowledge === "unknown") {
    return Object.freeze({
      status: "indeterminate",
      diagnostics: Object.freeze([
        diagnostic(
          "DIAG-CANCELLATION-TARGET-UNKNOWN",
          "availability",
          "domain",
          "/targetIdentity",
        ),
      ]),
      requiredEvidence: Object.freeze([
        "authenticated target existence and state",
      ]),
    });
  }
  const diagnostics = validateCommon(record);
  if (!rules.supportedCancellationCauses.includes(record.cause))
    diagnostics.push(
      diagnostic("DIAG-CANCELLATION-CAUSE", "input", "edition", "/cause"),
    );
  if (
    record.targetKnowledge === "verified-external" &&
    (!rules.permitExternalCancellation || record.evidenceIds.length === 0)
  )
    diagnostics.push(
      diagnostic(
        "DIAG-CANCELLATION-EXTERNAL",
        "input",
        "edition",
        "/targetKnowledge",
      ),
    );
  const accepted: AnulacionRecord = {
    ...record,
    targetKnowledge: record.targetKnowledge,
  };
  return diagnostics.length === 0
    ? Object.freeze({ status: "accepted", record: deepFreeze(accepted) })
    : Object.freeze({
        status: "rejected",
        diagnostics: Object.freeze(diagnostics),
      });
}

export function recordReference(record: FiscalRecord): RecordId | null {
  return record.kind === "anulacion" &&
    record.targetRecordId.presence === "present"
    ? record.targetRecordId.value
    : null;
}

function validateEdition(
  record: RecordCommon,
  rules: EditionDomainRules,
): ConstructionResult<never> | null {
  if (record.editionId !== rules.edition)
    return Object.freeze({
      status: "rejected",
      diagnostics: Object.freeze([
        diagnostic(
          "DIAG-EDITION-MISMATCH",
          "configuration",
          "edition",
          "/editionId",
        ),
      ]),
    });
  if (!rules.creationAllowed)
    return Object.freeze({
      status: "indeterminate",
      diagnostics: Object.freeze([
        diagnostic(
          "DIAG-EDITION-CREATION-DISABLED",
          "availability",
          "edition",
          "/editionId",
        ),
      ]),
      requiredEvidence: Object.freeze([
        "approved active edition lifecycle transition",
      ]),
    });
  return null;
}

function validateCommon(record: RecordCommon): Diagnostic[] {
  return record.id.length === 0 || record.idempotencyKey.length === 0
    ? [diagnostic("DIAG-RECORD-REQUIRED", "input", "domain", "/record")]
    : [];
}

function validateInvoice(invoice: InvoiceFact): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  if (
    invoice.identity.series.length === 0 ||
    invoice.identity.number.length === 0 ||
    !/^[A-Z]{3}$/u.test(invoice.currency) ||
    invoice.taxBreakdown.length === 0
  )
    diagnostics.push(
      diagnostic("DIAG-INVOICE-REQUIRED", "input", "domain", "/invoice"),
    );
  if (
    invoice.description.presence === "present" &&
    invoice.description.value.length === 0
  )
    diagnostics.push(
      diagnostic(
        "DIAG-INVOICE-EMPTY",
        "input",
        "domain",
        "/invoice/description",
      ),
    );
  const calculatedTax = addDecimals(
    invoice.taxBreakdown.map((line) => line.quota),
  );
  const bases = addDecimals(invoice.taxBreakdown.map((line) => line.base));
  if (compareDecimal(calculatedTax, invoice.totalTax) !== 0)
    diagnostics.push(
      diagnostic(
        "DIAG-INVOICE-TAX-TOTAL",
        "input",
        "domain",
        "/invoice/totalTax",
      ),
    );
  if (
    compareDecimal(addDecimals([bases, invoice.totalTax]), invoice.total) !== 0
  )
    diagnostics.push(
      diagnostic(
        "DIAG-INVOICE-GRAND-TOTAL",
        "input",
        "domain",
        "/invoice/total",
      ),
    );
  if (
    invoice.provenance.digest.length === 0 ||
    invoice.provenance.mediaType.length === 0
  )
    diagnostics.push(
      diagnostic(
        "DIAG-INVOICE-PROVENANCE",
        "input",
        "domain",
        "/invoice/provenance",
      ),
    );
  return diagnostics;
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}
