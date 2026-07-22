import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const source = readFileSync(
  path.resolve(process.cwd(), "src/views/GuidedScenarioLabView.vue"),
  "utf8",
);

describe("guided scenario workbench", () => {
  it("uses fixed scenario and control selectors without freeform target input", () => {
    expect(source).toContain("固定学习案例");
    expect(source).toContain("固定控制策略");
    expect(source).toContain("运行固定评估");
    expect(source).toContain("workbench.scenarios");
    expect(source).toContain("workbench.controls");
    expect(source).not.toContain('type="text"');
    expect(source).not.toContain('type="url"');
    expect(source).not.toContain("textarea");
  });

  it("keeps progress, verification, event recap, and variant navigation in the workflow", () => {
    expect(source).toContain("recordLearningProgress");
    expect(source).toContain("recordVerificationRecord");
    expect(source).toContain("风险观察版");
    expect(source).toContain("防御复盘版");
    expect(source).toContain("实验事件日志");
    expect(source).toContain("安全边界");
  });
});
