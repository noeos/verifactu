#!/usr/bin/env node
// SPDX-License-Identifier: Apache-2.0

import { runCli } from "./cli.js";

const code = await runCli(process.argv.slice(2), {
  stdin: process.stdin,
  stdout: process.stdout,
  stderr: process.stderr,
});
process.exitCode = code;
