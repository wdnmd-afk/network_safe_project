import { guidedScenarioCatalog } from "../../packages/shared/src/guided-scenarios.js";

import { runGuidedScenarioVerification } from "./guided-scenario-verifier.mjs";

const reports = [];

for (const scenario of guidedScenarioCatalog) {
  reports.push(
    await runGuidedScenarioVerification(scenario.id, {
      silent: true,
    }),
  );
}

const failed = reports.filter((report) => !report.ok);
const summary = {
  scope: "all-guided-scenarios",
  total: reports.length,
  passed: reports.length - failed.length,
  failed: failed.map((report) => report.labKey),
  ok: failed.length === 0,
};

console.log(JSON.stringify(summary, null, 2));

if (!summary.ok) {
  process.exitCode = 1;
}
