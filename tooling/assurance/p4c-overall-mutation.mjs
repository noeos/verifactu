#!/usr/bin/env node
process.env.P4C_MUTATION = "1";
await import("./p4a-overall-mutation.mjs");
