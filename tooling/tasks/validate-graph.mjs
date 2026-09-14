import path from "node:path";

import { assert, fail } from "../lib/policy.mjs";

export function validateTaskGraph(registry) {
  const tasks = new Map();
  for (const task of registry.tasks) {
    assert(!tasks.has(task.id), "DUPLICATE_TASK", `duplicate task ID: ${task.id}`);
    tasks.set(task.id, task);
    assert(
      task.command.arguments.every((argument) => !/[\r\n\0]/.test(argument)),
      "UNSAFE_ARGUMENT",
      `task ${task.id} contains an unsafe argument`,
    );
    for (const entrypoint of task.command.childEntrypoints ?? []) {
      assert(
        entrypoint.length > 0 && !path.isAbsolute(entrypoint) && !entrypoint.split(/[\\/]/).includes(".."),
        "UNSAFE_CHILD_ENTRYPOINT",
        `task ${task.id} declares unsafe child entrypoint ${entrypoint}`,
      );
    }
    assert(
      task.network === "denied" || task.selectionClass === "bootstrap",
      "NETWORK_POLICY",
      `only bootstrap tasks may prepare network inputs: ${task.id}`,
    );
    assert(task.secrets === "denied", "SECRET_POLICY", `P2 task ${task.id} may not receive secrets`);
  }
  for (const task of tasks.values()) {
    for (const dependency of task.dependencies)
      assert(tasks.has(dependency), "MISSING_TASK_DEPENDENCY", `${task.id} depends on missing ${dependency}`);
  }
  const visiting = new Set();
  const visited = new Set();
  const visit = (id, trail = []) => {
    if (visiting.has(id)) fail("TASK_CYCLE", `task cycle: ${[...trail, id].join(" -> ")}`);
    if (visited.has(id)) return;
    visiting.add(id);
    for (const dependency of tasks.get(id).dependencies) visit(dependency, [...trail, id]);
    visiting.delete(id);
    visited.add(id);
  };
  for (const id of tasks.keys()) visit(id);
  const producers = new Map();
  for (const task of tasks.values()) {
    for (const output of task.outputs) {
      assert(
        !producers.has(output),
        "DUPLICATE_OUTPUT_PRODUCER",
        `${output} is produced by ${producers.get(output)} and ${task.id}`,
      );
      producers.set(output, task.id);
    }
  }
  for (const [profile, roots] of Object.entries(registry.profiles)) {
    for (const id of roots)
      assert(tasks.has(id), "MISSING_PROFILE_TASK", `profile ${profile} selects missing task ${id}`);
  }
  return tasks;
}

export function topologicalSelection(tasks, requested) {
  assert(tasks.has(requested), "UNKNOWN_TASK", `unknown task ${requested}`);
  const ordered = [];
  const selected = new Set();
  const visit = (id) => {
    if (selected.has(id)) return;
    for (const dependency of tasks.get(id).dependencies) visit(dependency);
    selected.add(id);
    ordered.push(tasks.get(id));
  };
  visit(requested);
  return ordered;
}
