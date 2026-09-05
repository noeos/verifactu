// SPDX-License-Identifier: Apache-2.0

import type { StoredRecord } from "../state/model.js";

export interface SubmissionBatch {
  readonly batchId: string;
  readonly environment: "test" | "production";
  readonly endpointId: string;
  readonly recordIds: readonly string[];
  readonly records: readonly StoredRecord[];
  readonly body: Uint8Array;
  readonly requestDigest: string;
  readonly createdAt: string;
}

export const MAX_BATCH_RECORDS = 1_000;
