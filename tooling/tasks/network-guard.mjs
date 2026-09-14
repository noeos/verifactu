import http from "node:http";
import https from "node:https";
import net from "node:net";
import tls from "node:tls";
import childProcess from "node:child_process";
import path from "node:path";
import { syncBuiltinESMExports } from "node:module";

const deny = (operation) => {
  throw new Error(`UNDECLARED_NETWORK: ${operation} is denied by the canonical task contract`);
};

globalThis.fetch = () =>
  Promise.reject(new Error("UNDECLARED_NETWORK: fetch is denied by the canonical task contract"));
http.request = () => deny("http.request");
http.get = () => deny("http.get");
https.request = () => deny("https.request");
https.get = () => deny("https.get");
net.connect = () => deny("net.connect");
net.createConnection = () => deny("net.createConnection");
tls.connect = () => deny("tls.connect");

const allowedChildEntrypoints = new Set(
  JSON.parse(process.env.VERIFACTU_ALLOWED_CHILD_ENTRYPOINTS ?? "[]").map((entrypoint) => path.resolve(entrypoint)),
);
const childEntrypoint = (arguments_) => {
  for (let index = 0; index < arguments_.length; index += 1) {
    if (arguments_[index] === "--import" || arguments_[index] === "--require") {
      index += 1;
      continue;
    }
    if (!arguments_[index].startsWith("-")) return path.resolve(arguments_[index]);
  }
  return null;
};
const assertChild = (command, arguments_ = []) => {
  const target = childEntrypoint(arguments_);
  if (path.resolve(command) !== path.resolve(process.execPath) || !target || !allowedChildEntrypoints.has(target)) {
    throw new Error(`UNDECLARED_CHILD_PROCESS: ${command} ${arguments_.join(" ")}`);
  }
};
const originalSpawn = childProcess.spawn;
const originalSpawnSync = childProcess.spawnSync;
const originalExecFile = childProcess.execFile;
const originalExecFileSync = childProcess.execFileSync;
childProcess.spawn = (command, arguments_, options) => {
  assertChild(command, arguments_);
  return originalSpawn(command, arguments_, options);
};
childProcess.spawnSync = (command, arguments_, options) => {
  assertChild(command, arguments_);
  return originalSpawnSync(command, arguments_, options);
};
childProcess.execFile = (file, arguments_, options, callback) => {
  assertChild(file, arguments_);
  return originalExecFile(file, arguments_, options, callback);
};
childProcess.execFileSync = (file, arguments_, options) => {
  assertChild(file, arguments_);
  return originalExecFileSync(file, arguments_, options);
};
childProcess.exec = () => deny("child_process.exec");
childProcess.execSync = () => deny("child_process.execSync");
syncBuiltinESMExports();
