import {
  failed,
  succeeded,
  type OperationResult,
} from "../contracts/results.js";
import { diagnostic } from "../domain/diagnostics.js";
import type {
  OfficialProjection,
  ProjectedField,
} from "./official-projection.js";

export interface OfficialSerializationDescriptor {
  readonly projectionDescriptorId: string;
  readonly encoding: "UTF-8";
  readonly fieldSeparator: "&";
  readonly nameValueSeparator: "=";
  readonly absent: "omit" | "empty";
  readonly xsiNil: "omit" | "empty" | "xsi:nil";
}

export interface OfficialSerialization {
  readonly text: string;
  readonly bytes: readonly number[];
}

export function serializeOfficialProjection(
  projection: OfficialProjection,
  descriptor: OfficialSerializationDescriptor,
): OperationResult<OfficialSerialization> {
  if (
    descriptor.projectionDescriptorId !== projection.descriptorId ||
    descriptor.encoding !== "UTF-8" ||
    descriptor.fieldSeparator !== "&" ||
    descriptor.nameValueSeparator !== "="
  )
    return failed("invalid", [
      diagnostic(
        "DIAG-SERIALIZATION-DESCRIPTOR",
        "configuration",
        "edition",
        "/serialization",
      ),
    ]);
  const parts = projection.fields.flatMap((field) =>
    serializeField(field, descriptor),
  );
  const text = parts.join(descriptor.fieldSeparator);
  return succeeded(
    Object.freeze({
      text,
      bytes: Object.freeze([...new globalThis.TextEncoder().encode(text)]),
    }),
  );
}

function serializeField(
  field: ProjectedField,
  descriptor: OfficialSerializationDescriptor,
): readonly string[] {
  if (field.state === "absent" && descriptor.absent === "omit") return [];
  if (field.state === "xsi-nil" && descriptor.xsiNil === "omit") return [];
  const value =
    field.state === "value"
      ? field.lexical
      : field.state === "xsi-nil" && descriptor.xsiNil === "xsi:nil"
        ? "xsi:nil"
        : "";
  return [`${field.label}${descriptor.nameValueSeparator}${value}`];
}

export function officialSerializationBytes(
  serialization: OfficialSerialization,
): Uint8Array {
  return Uint8Array.from(serialization.bytes);
}
