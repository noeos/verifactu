// SPDX-License-Identifier: Apache-2.0

import { createDiagnostic } from "../diagnostics/diagnostic.js";
import { failure, success, type Result } from "../diagnostics/result.js";
import type { SequenceHead } from "./model.js";

export function genesisHead(contextId: string, sequenceId: string): SequenceHead {
  return Object.freeze({ contextId, sequenceId, position: -1, linkDigest: undefined, version: 0 });
}

export function sameHead(expected: SequenceHead, actual: SequenceHead): boolean {
  return (
    expected.contextId === actual.contextId &&
    expected.sequenceId === actual.sequenceId &&
    expected.position === actual.position &&
    expected.linkDigest === actual.linkDigest &&
    expected.version === actual.version
  );
}

export function nextHead(previous: SequenceHead, linkDigest: string): Result<SequenceHead> {
  if (
    previous.contextId.length === 0 ||
    previous.sequenceId.length === 0 ||
    !Number.isInteger(previous.position) ||
    previous.position < -1 ||
    !Number.isInteger(previous.version) ||
    previous.version < 0 ||
    !/^[0-9A-F]{64}$/u.test(linkDigest)
  ) {
    return failure("INVALID_INPUT", [
      createDiagnostic({
        code: "VF_INPUT_VALUE_INVALID",
        severity: "error",
        phase: "state",
        path: "/linkDigest",
      }),
    ]);
  }
  return success(
    Object.freeze({
      contextId: previous.contextId,
      sequenceId: previous.sequenceId,
      position: previous.position + 1,
      linkDigest,
      version: previous.version + 1,
    }),
  );
}

export function assertFreshness(checkpoint: SequenceHead, actual: SequenceHead): Result<true> {
  if (
    actual.position < checkpoint.position ||
    (actual.position === checkpoint.position && actual.version < checkpoint.version)
  ) {
    return failure("INVALID_INPUT", [
      createDiagnostic({ code: "VF_STATE_ROLLBACK_DETECTED", severity: "error", phase: "state" }),
    ]);
  }
  return success(true);
}
