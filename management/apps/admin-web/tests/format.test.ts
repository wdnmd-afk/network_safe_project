import { describe, expect, it } from "vitest";

import {
  auditActionLabel,
  decisionBadgeClass,
  decisionLabel,
  formatDateTime,
  formatDuration,
  formatPercent,
  phaseLabel,
  perspectiveLabel,
  riskBadgeClass,
  riskLabel,
} from "../src/modules/format";

describe("状态文案", () => {
  it("风险、结果与阶段都有中文文案", () => {
    expect(riskLabel("critical")).toBe("严重");
    expect(riskLabel("low")).toBe("低");
    expect(decisionLabel("blocked")).toBe("已阻断");
    expect(phaseLabel("defense")).toBe("防御阶段");
    expect(perspectiveLabel("attacker")).toBe("攻击者视角");
    expect(auditActionLabel("variant.disable")).toBe("停用变体");
  });

  it("徽标样式区分风险与结果，且不依赖颜色单独表达", () => {
    expect(riskBadgeClass("critical")).toContain("badge-danger");
    expect(riskBadgeClass("medium")).toContain("badge-warning");
    expect(decisionBadgeClass("blocked")).toContain("badge-success");
    expect(decisionBadgeClass("failed")).toContain("badge-danger");
  });
});

describe("格式化", () => {
  it("非法或空时间显示为占位符而不是 Invalid Date", () => {
    expect(formatDateTime(null)).toBe("—");
    expect(formatDateTime(undefined)).toBe("—");
    expect(formatDateTime("not-a-date")).toBe("—");
    expect(formatDateTime("2026-09-16T02:00:00.000Z")).not.toBe("—");
  });

  it("时长按量级切换单位", () => {
    expect(formatDuration(0)).toBe("0 ms");
    expect(formatDuration(999)).toBe("999 ms");
    expect(formatDuration(3000)).toBe("3.00 s");
    expect(formatDuration(120000)).toBe("2.0 min");
    expect(formatDuration(null)).toBe("—");
  });

  it("百分比对非法值不输出 NaN", () => {
    expect(formatPercent(0)).toBe("0%");
    expect(formatPercent(33.3)).toBe("33.3%");
    expect(formatPercent(Number.NaN)).toBe("—");
  });
});
