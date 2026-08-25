import { describe, expect, it } from "vitest";

import type { LabMetadata } from "../src/api/labs";
import {
  createDefaultLabDirectoryFilters,
  deriveLabDepth,
  filterLabs,
  getLearningPathContexts,
  getLabFilterOptions,
  learningPaths,
  validateLearningPaths,
} from "../src/utils/lab-directory";

function createLab(overrides: Partial<LabMetadata> = {}): LabMetadata {
  return {
    id: "web.xss",
    slug: "xss",
    title: "XSS",
    category: "web",
    subcategory: "xss",
    mode: "interactive",
    severity: "high",
    difficulty: "beginner",
    summary: "输入输出边界学习",
    status: "ready",
    tags: ["web", "injection"],
    knowledgePoints: ["输出编码"],
    variants: [],
    entrypoints: { web: [], api: [], scripts: [], docs: [] },
    verification: { manual: { supported: true, stepsDocPath: "", expectedSignals: [] }, automation: { supported: false } },
    prerequisites: [],
    paths: { root: "", readme: "", vuln: "", fixed: "", mock: "", docs: "", scripts: "" },
    ...overrides,
  };
}

describe("实验目录筛选与学习路径", () => {
  it("按已确认字段组合筛选并搜索知识点", () => {
    const labs = [
      createLab(),
      createLab({
        id: "network.ddos",
        slug: "ddos",
        title: "DDoS",
        category: "network",
        subcategory: "ddos",
        mode: "simulation",
        severity: "critical",
        difficulty: "intermediate",
        tags: ["network"],
        knowledgePoints: ["限流"],
      }),
    ];

    expect(filterLabs(labs, { ...createDefaultLabDirectoryFilters(), query: "输出编码" }).map((lab) => lab.id)).toEqual(["web.xss"]);
    expect(filterLabs(labs, { ...createDefaultLabDirectoryFilters(), category: "network", depth: "D2" })).toHaveLength(1);
    expect(filterLabs(labs, { ...createDefaultLabDirectoryFilters(), severity: "critical", mode: "simulation" })).toHaveLength(1);
  });

  it("按引导目录和模式派生 D2/D3/D4", () => {
    expect(deriveLabDepth(createLab({ id: "network.ddos", mode: "simulation" }))).toBe("D2");
    expect(deriveLabDepth(createLab({ id: "web.xss", mode: "interactive" }))).toBe("D4");
    expect(deriveLabDepth(createLab({ id: "crypto.insecure-randomness", mode: "simulation" }))).toBe("D3");
  });

  it("提供稳定筛选选项和路径前后关系", () => {
    const options = getLabFilterOptions([createLab(), createLab({ id: "network.ddos", category: "network" })]);
    expect(options.categories).toEqual(["network", "web"]);
    const contexts = getLearningPathContexts("web.csrf");
    expect(contexts[0]?.previousLabId).toBe("web.xss");
    expect(contexts[0]?.nextLabId).toBe("web.sql-injection");
  });

  it("校验静态路径只引用已登记实验", () => {
    const labs = [...new Set(learningPaths.flatMap((path) => path.labIds))].map((id) => ({ id }));
    expect(validateLearningPaths(labs)).toEqual({ ok: true, errors: [] });
    expect(validateLearningPaths(labs.filter((lab) => lab.id !== "web.xss")).ok).toBe(false);
  });
});
