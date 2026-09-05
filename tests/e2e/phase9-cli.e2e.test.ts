// SPDX-License-Identifier: Apache-2.0

import assert from "node:assert/strict";
import { Writable } from "node:stream";
import { test } from "node:test";
import { runCli } from "../../packages/cli/src/cli.js";

void test("phase 9 CLI keeps stdout structured and rejects duplicate JSON", async () => {
  const duplicate = await invoke(["fingerprint", "calculate"], '{"a":1,"a":2}');
  assert.equal(duplicate.code, 3);
  assert.equal(duplicate.stdout, "");
  assert.match(duplicate.stderr, /JSON_DUPLICATE_KEY/u);
});

void test("phase 9 CLI supports input-free metadata commands", async () => {
  const version = await invoke(["version"], "");
  assert.equal(version.code, 0);
  assert.match(version.stdout, /"operation":"version"/u);
  const schema = await invoke(["schema", "print", "contract"], "");
  assert.equal(schema.code, 0);
  assert.match(schema.stdout, /"operation":"schema-print"/u);
  const queue = await invoke(["queue", "status"], "");
  assert.equal(queue.code, 2);
  assert.match(queue.stdout, /VF_INPUT_REQUIRED/u);
});

async function invoke(
  argv: readonly string[],
  input: string,
): Promise<{ code: number; stdout: string; stderr: string }> {
  const stdout = capture();
  const stderr = capture();
  const code = await runCli(argv, {
    stdin: (async function* () {
      await Promise.resolve();
      yield new TextEncoder().encode(input);
    })(),
    stdout,
    stderr,
  });
  return { code, stdout: stdout.text(), stderr: stderr.text() };
}

class CaptureWritable extends Writable {
  private readonly chunks: Buffer[] = [];

  constructor() {
    super({
      write: (chunk, _encoding, callback) => {
        // Node's Writable contract supplies a Buffer for this stream.
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        this.chunks.push(Buffer.from(chunk));
        callback();
      },
    });
  }

  text(): string {
    return Buffer.concat(this.chunks).toString("utf8");
  }
}

function capture(): CaptureWritable {
  return new CaptureWritable();
}
