import { assert } from "../lib/policy.mjs";

export function validateClosureReports(task, reports) {
  const byTask = new Map();
  for (const report of reports) {
    assert(!byTask.has(report.task), "DUPLICATE_TASK_REPORT", `duplicate task report: ${report.task}`);
    byTask.set(report.task, report);
    assert(report.result === "passed", "FAILED_TASK_REPORT", `${report.task} did not pass`);
  }
  for (const dependency of task.dependencies) {
    assert(byTask.has(dependency), "MISSING_TASK_REPORT", `${task.id} is missing report for ${dependency}`);
  }
  const subjects = new Set(task.dependencies.map((dependency) => byTask.get(dependency).subject));
  assert(subjects.size === 1, "REPORT_SUBJECT_DRIFT", `${task.id} dependency reports do not bind one subject`);
  return { dependencyReportCount: task.dependencies.length, subject: [...subjects][0] };
}
