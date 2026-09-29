import { describe, expect, it } from "vitest";

import type { AdminLab } from "@nsm/shared";

import { describeToggle, groupLabsByCategory, summarizeLabCounts } from "../src/modules/labs";

function createLab(overrides: Partial<AdminLab> = {}): AdminLab {
  return {
    labKey: "web.xss",
    title: "XSS",
    categoryCode: "web",
    categoryName: "Web 漏洞",
    severity: "high",
    mode: "interactive",
    status: "ready",
    isEnabled: true,
    variants: [
      { variantKey: "vuln", title: "漏洞版", isEnabled: true },
      { variantKey: "fixed", title: "修复版", isEnabled: true },
    ],
    ...overrides,
  };
}

describe("按分类分组", () => {
  it("同分类归并并按 labKey 排序", () => {
    const groups = groupLabsByCategory([
      createLab({ labKey: "web.xxe", title: "XXE" }),
      createLab({ labKey: "auth.idor", title: "IDOR", categoryCode: "auth", categoryName: "认证授权" }),
      createLab({ labKey: "web.xss", title: "XSS" }),
    ]);

    expect(groups.map((group) => group.categoryCode)).toEqual(["auth", "web"]);
    expect(groups[1].categoryName).toBe("Web 漏洞");
    // localeCompare 下 s < x，因此 web.xss 在前
    expect(groups[1].labs.map((lab) => lab.labKey)).toEqual(["web.xss", "web.xxe"]);
  });

  it("空输入返回空数组", () => {
    expect(groupLabsByCategory([])).toEqual([]);
  });
});

describe("启停确认文案", () => {
  it("停用带后果说明并标记为危险操作", () => {
    const intent = describeToggle("lab", false);

    expect(intent.nextEnabled).toBe(false);
    expect(intent.danger).toBe(true);
    expect(intent.confirmLabel).toBe("确认停用");
    expect(intent.message).toContain("403");
  });

  it("停用变体时说明另一个变体不受影响", () => {
    const intent = describeToggle("variant", false);

    expect(intent.message).toContain("另一个变体不受影响");
  });

  it("启用是恢复操作，不标记为危险", () => {
    const intent = describeToggle("variant", true);

    expect(intent.nextEnabled).toBe(true);
    expect(intent.danger).toBe(false);
    expect(intent.confirmLabel).toBe("确认启用");
  });
});

describe("实验计数", () => {
  it("同时统计实验与变体", () => {
    const counts = summarizeLabCounts([
      createLab(),
      createLab({
        labKey: "auth.idor",
        categoryCode: "auth",
        isEnabled: false,
        variants: [{ variantKey: "vuln", title: "漏洞版", isEnabled: false }],
      }),
    ]);

    expect(counts).toEqual({
      labs: 2,
      enabledLabs: 1,
      variants: 3,
      enabledVariants: 2,
    });
  });
});
