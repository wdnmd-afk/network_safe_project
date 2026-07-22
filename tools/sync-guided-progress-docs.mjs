import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { guidedScenarioCatalog } from "../packages/shared/src/guided-scenarios.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const scenarioByTitle = new Map(
  guidedScenarioCatalog.map((scenario) => [scenario.title, scenario]),
);

const modeLabels = {
  interactive: "本机受控交互 / 固定案例 / 漏洞版与修复版 / 统一事件日志",
  simulation: "本机状态模拟 / 固定案例 / 漏洞版与修复版 / 统一事件日志",
  "case-study": "固定案例化演示 / 漏洞视角与防御视角 / 统一事件日志",
};

function currentLocations(scenario) {
  return [
    `labs/${scenario.category}/${scenario.subcategory}/meta.json`,
    "apps/web/src/views/GuidedScenarioLabView.vue",
    "apps/web/src/api/guided-scenario-lab.ts",
    "apps/server/src/services/guided-scenario-lab.ts",
    "apps/server/tests/guided-scenario-lab.test.ts",
    `tools/lab-scripts/${scenario.category}/${scenario.subcategory}/verify.ts`,
    `docs/execution/2026-07-20-${scenario.category}-${scenario.subcategory}-guided-lab.md`,
  ]
    .map((item) => `\`${item}\``)
    .join("、");
}

function updateTableRows(relativePath) {
  const absolutePath = path.join(repoRoot, relativePath);
  const lines = readFileSync(absolutePath, "utf8").split(/\r?\n/);
  let updated = 0;

  const nextLines = lines.map((line) => {
    if (!line.startsWith("|") || line.startsWith("|---")) {
      return line;
    }

    const cells = line
      .split("|")
      .slice(1, -1)
      .map((cell) => cell.trim());
    const scenario = scenarioByTitle.get(cells[0]);

    if (!scenario || cells.length !== 5) {
      return line;
    }

    updated += 1;

    return `| ${scenario.title} | ready | ${modeLabels[scenario.mode]} / 只读一致性验证 | ${currentLocations(scenario)} | \`labs/${scenario.category}/${scenario.subcategory}/\` |`;
  });

  writeFileSync(absolutePath, `${nextLines.join("\n").replace(/\n+$/, "")}\n`, "utf8");
  return updated;
}

const result = {
  todoRows: updateTableRows("docs/TODO.md"),
  nextWaveRows: updateTableRows("docs/design/next-wave-security-labs.md"),
};

console.log(JSON.stringify(result, null, 2));
