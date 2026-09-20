import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import {
  chmod,
  mkdir,
  readFile,
  readdir,
  rename,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { dirname, relative, resolve, sep } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export function canonicalJson(value) {
  const normalize = (entry) => {
    if (Array.isArray(entry)) return entry.map(normalize);
    if (entry && typeof entry === "object") {
      return Object.fromEntries(
        Object.keys(entry)
          .sort()
          .map((key) => [key, normalize(entry[key])]),
      );
    }
    return entry;
  };
  return `${JSON.stringify(normalize(value), null, 2)}\n`;
}

export function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

export async function sha256File(path) {
  return sha256(await readFile(path));
}

export async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

export async function writeJsonAtomic(path, value, mode = 0o644) {
  const target = resolve(path);
  await mkdir(dirname(target), { recursive: true, mode: 0o700 });
  const temporary = `${target}.tmp-${process.pid}-${Date.now()}`;
  await writeFile(temporary, canonicalJson(value), { mode });
  await rename(temporary, target);
  await chmod(target, mode);
}

export async function run(executable, args, options = {}) {
  try {
    const result = await execFileAsync(executable, args, {
      cwd: options.cwd,
      env: options.env ?? process.env,
      maxBuffer: options.maxBuffer ?? 16 * 1024 * 1024,
      timeout: options.timeoutMs,
      windowsHide: true,
    });
    return { code: 0, stdout: result.stdout, stderr: result.stderr };
  } catch (error) {
    return {
      code: Number.isInteger(error.code) ? error.code : 1,
      stdout: error.stdout ?? "",
      stderr: error.stderr ?? error.message,
    };
  }
}

export function assert(condition, code, message) {
  if (!condition) {
    const error = new Error(`${code}: ${message}`);
    error.code = code;
    throw error;
  }
}

export function relativePosix(root, path) {
  return relative(root, path).split(sep).join("/");
}

export function resolveContained(root, candidate) {
  const base = resolve(root);
  const target = resolve(base, candidate);
  assert(
    target === base || target.startsWith(`${base}${sep}`),
    "PATH_ESCAPE",
    `${candidate} resolves outside ${base}`,
  );
  return target;
}

export async function walk(root, options = {}) {
  const absoluteRoot = resolve(root);
  const excluded = new Set(options.exclude ?? []);
  const output = [];
  async function visit(directory) {
    let entries;
    try {
      entries = await readdir(directory, { withFileTypes: true });
    } catch (error) {
      if (error.code === "ENOENT") return;
      throw error;
    }
    entries.sort((a, b) => a.name.localeCompare(b.name, "en"));
    for (const entry of entries) {
      const path = resolve(directory, entry.name);
      const rel = relativePosix(absoluteRoot, path);
      if (
        [...excluded].some(
          (prefix) => rel === prefix || rel.startsWith(`${prefix}/`),
        )
      ) {
        continue;
      }
      if (entry.isSymbolicLink()) {
        output.push({ path, relative: rel, type: "symlink" });
      } else if (entry.isDirectory()) {
        await visit(path);
      } else if (entry.isFile()) {
        output.push({ path, relative: rel, type: "file" });
      } else {
        output.push({ path, relative: rel, type: "other" });
      }
    }
  }
  await visit(absoluteRoot);
  return output;
}

export async function snapshot(root) {
  const entries = await walk(root, { exclude: [".git", "node_modules"] });
  const records = [];
  for (const entry of entries) {
    const metadata = await stat(entry.path);
    records.push([
      entry.relative,
      entry.type,
      metadata.mode & 0o777,
      metadata.size,
      entry.type === "file" ? await sha256File(entry.path) : null,
    ]);
  }
  return new Map(records.map((record) => [record[0], record]));
}

export function globToRegExp(pattern) {
  let expression = "^";
  for (let index = 0; index < pattern.length; index += 1) {
    const character = pattern[index];
    if (character === "*") {
      if (pattern[index + 1] === "*") {
        index += 1;
        expression += ".*";
      } else {
        expression += "[^/]*";
      }
    } else if (character === "?") {
      expression += "[^/]";
    } else {
      expression += character.replace(/[|\\{}()[\]^$+?.]/g, "\\$&");
    }
  }
  return new RegExp(`${expression}$`, "u");
}

export function matchesAny(path, patterns) {
  return patterns.some((pattern) => {
    const normalized = pattern.endsWith("/**")
      ? `${pattern.slice(0, -3)}{,/**}`
      : pattern;
    if (normalized.endsWith("{,/**}")) {
      const prefix = normalized.slice(0, -6);
      return path === prefix || path.startsWith(`${prefix}/`);
    }
    return globToRegExp(normalized).test(path);
  });
}

export async function digestFiles(root, files) {
  const hash = createHash("sha256");
  for (const file of [...files].sort()) {
    hash.update(file);
    hash.update("\0");
    hash.update(await readFile(resolveContained(root, file)));
    hash.update("\0");
  }
  return hash.digest("hex");
}

export async function removeContained(root, candidate) {
  const target = resolveContained(root, candidate);
  assert(
    target !== resolve(root),
    "CLEAN_ROOT",
    "refusing to remove task root",
  );
  await rm(target, { recursive: true, force: true });
}
