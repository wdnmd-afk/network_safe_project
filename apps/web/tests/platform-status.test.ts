import { describe, expect, it } from "vitest";

import type { LabMetadata } from "../src/api/labs";
import type { CurrentUserLabEventLogSummary } from "../src/api/lab-records";
import {
  buildLabReadinessRows,
  getCategoryLabel,
  getStatusLabel,
  summarizeAutomationCoverage,
  summarizeCategories,
  summarizeEvents,
  summarizeStatusBuckets,
} from "../src/labs/platform-status";

type AutomationInput = {
  playwright?: boolean;
  apiTest?: boolean;
  scriptVerification?: boolean;
};

function createLab(
  overrides: Partial<LabMetadata> & {
    id: string;
    category: string;
    status: string;
  },
  automation: AutomationInput = {},
): LabMetadata {
  return {
    id: overrides.id,
    slug: overrides.slug ?? overrides.id,
    title: overrides.title ?? overrides.id,
    category: overrides.category,
    subcategory: overrides.subcategory ?? "scene",
    mode: overrides.mode ?? "simulation",
    severity: overrides.severity ?? "medium",
    difficulty: overrides.difficulty ?? "intermediate",
    summary: overrides.summary ?? "summary",
    status: overrides.status,
    tags: overrides.tags ?? [],
    knowledgePoints: overrides.knowledgePoints ?? [],
    variants: overrides.variants ?? [
      {
        key: "vuln",
        title: "漏洞版",
        enabled: true,
        description: "",
        entryKey: "vuln",
        expectedOutcome: "",
        supportsAutomation: false,
      },
      {
        key: "fixed",
        title: "修复版",
        enabled: true,
        description: "",
        entryKey: "fixed",
        expectedOutcome: "",
        supportsAutomation: false,
      },
    ],
    entrypoints: overrides.entrypoints ?? {
      web: [],
      api: [],
      scripts: [],
      docs: [],
    },
    verification: overrides.verification ?? {
      manual: {
        supported: true,
        stepsDocPath: "docs/manual-verification.md",
        expectedSignals: [],
      },
      automation: {
        supported:
          Boolean(automation.playwright) ||
          Boolean(automation.apiTest) ||
          Boolean(automation.scriptVerification),
        ...(automation.playwright
          ? { playwright: { enabled: true, specPath: "spec.mjs" } }
          : {}),
        ...(automation.apiTest
          ? { apiTest: { enabled: true, specPath: "api.test.ts" } }
          : {}),
        ...(automation.scriptVerification
          ? {
              scriptVerification: { enabled: true, scriptKeys: ["verify"] },
            }
          : {}),
      },
    },
    prerequisites: overrides.prerequisites ?? [],
    paths: overrides.paths ?? {
      root: "labs/x",
      readme: "labs/x/README.md",
      vuln: "labs/x/vuln",
      fixed: "labs/x/fixed",
      mock: "labs/x/mock",
      docs: "labs/x/docs",
      scripts: "tools/lab-scripts/x",
    },
  };
}

function createEvent(
  overrides: Partial<CurrentUserLabEventLogSummary> & { labKey: string },
): CurrentUserLabEventLogSummary {
  return {
    traceId: overrides.traceId ?? `trace-${Math.random()}`,
    labKey: overrides.labKey,
    title: overrides.title ?? overrides.labKey,
    variantKey: overrides.variantKey ?? "vuln",
    phase: overrides.phase ?? "attack",
    eventType: overrides.eventType ?? "success",
    actorPerspective: overrides.actorPerspective ?? "attacker",
    decision: overrides.decision ?? "accepted",
    signal: overrides.signal ?? "signal",
    statusCode: overrides.statusCode ?? 200,
    message: overrides.message ?? "message",
    riskLevel: overrides.riskLevel ?? "medium",
    createdAt: overrides.createdAt ?? "2026-07-20T08:00:00.000Z",
  };
}

describe("platform-status 标签工具", () => {
  it("已知 category / status 返回中文标签，未知回退原值", () => {
    expect(getCategoryLabel("web")).toBe("Web 漏洞");
    expect(getCategoryLabel("api")).toBe("API 安全");
    expect(getCategoryLabel("business-logic")).toBe("业务逻辑");
    expect(getCategoryLabel("crypto")).toBe("密码学与数据保护");
    expect(getCategoryLabel("detection")).toBe("检测与响应");
    expect(getCategoryLabel("social")).toBe("社会工程学");
    expect(getCategoryLabel("unknown-category")).toBe("unknown-category");
    expect(getStatusLabel("ready")).toBe("已就绪");
    expect(getStatusLabel("in-progress")).toBe("进行中");
    expect(getStatusLabel("weird")).toBe("weird");
  });
});

describe("summarizeStatusBuckets", () => {
  it("按固定顺序统计状态桶并计算百分比", () => {
    const labs = [
      createLab({ id: "a", category: "web", status: "ready" }),
      createLab({ id: "b", category: "web", status: "ready" }),
      createLab({ id: "c", category: "auth", status: "in-progress" }),
      createLab({ id: "d", category: "auth", status: "planned" }),
    ];

    const buckets = summarizeStatusBuckets(labs);

    expect(buckets.map((bucket) => bucket.key)).toEqual([
      "ready",
      "in-progress",
      "planned",
      "deprecated",
    ]);
    expect(buckets[0]).toMatchObject({ count: 2, percent: 50 });
    expect(buckets[1]).toMatchObject({ count: 1, percent: 25 });
    expect(buckets[2]).toMatchObject({ count: 1, percent: 25 });
    expect(buckets[3]).toMatchObject({ count: 0, percent: 0 });
  });

  it("空列表返回全零且不除零", () => {
    const buckets = summarizeStatusBuckets([]);

    expect(buckets.every((bucket) => bucket.count === 0)).toBe(true);
    expect(buckets.every((bucket) => bucket.percent === 0)).toBe(true);
  });
});

describe("summarizeCategories", () => {
  it("按 category 分组并按总数降序排序", () => {
    const labs = [
      createLab({ id: "a", category: "web", status: "ready" }),
      createLab({ id: "b", category: "web", status: "in-progress" }),
      createLab({ id: "c", category: "web", status: "ready" }),
      createLab({ id: "d", category: "auth", status: "ready" }),
    ];

    const categories = summarizeCategories(labs);

    expect(categories[0]).toMatchObject({
      category: "web",
      label: "Web 漏洞",
      total: 3,
      ready: 2,
      inProgress: 1,
      readyPercent: 67,
    });
    expect(categories[1]).toMatchObject({
      category: "auth",
      total: 1,
      ready: 1,
      readyPercent: 100,
    });
  });
});

describe("summarizeAutomationCoverage", () => {
  it("统计各类自动化覆盖和三项全覆盖数量", () => {
    const labs = [
      createLab(
        { id: "a", category: "web", status: "ready" },
        { playwright: true, apiTest: true, scriptVerification: true },
      ),
      createLab(
        { id: "b", category: "web", status: "ready" },
        { apiTest: true },
      ),
      createLab({ id: "c", category: "auth", status: "planned" }, {}),
    ];

    const coverage = summarizeAutomationCoverage(labs);

    expect(coverage).toMatchObject({
      total: 3,
      withPlaywright: 1,
      withApiTest: 2,
      withScriptVerification: 1,
      withAnyAutomation: 2,
      fullyCoveredThreeWay: 1,
    });
    expect(coverage.anyAutomationPercent).toBe(67);
    expect(coverage.apiTestPercent).toBe(67);
  });
});

describe("buildLabReadinessRows", () => {
  it("展开每个实验的入口和自动化计数，并按分类 / 标题排序", () => {
    const labs = [
      createLab(
        {
          id: "web.b",
          category: "web",
          status: "ready",
          title: "Beta",
          subcategory: "beta",
          entrypoints: {
            web: [{ key: "w", path: "/w", description: "" }],
            api: [{ key: "a", path: "/a", description: "" }],
            scripts: [],
            docs: [{ key: "d", path: "docs", description: "" }],
          },
        },
        { playwright: true, apiTest: true },
      ),
      createLab({
        id: "web.a",
        category: "web",
        status: "planned",
        title: "Alpha",
        subcategory: "alpha",
      }),
    ];

    const rows = buildLabReadinessRows(labs);

    expect(rows.map((row) => row.title)).toEqual(["Alpha", "Beta"]);
    const beta = rows.find((row) => row.title === "Beta");
    expect(beta).toMatchObject({
      webEntryCount: 1,
      apiEntryCount: 1,
      docEntryCount: 1,
      scriptEntryCount: 0,
      hasPlaywright: true,
      hasApiTest: true,
      hasScriptVerification: false,
      automationTypes: 2,
      detailPath: "/labs/web/beta",
    });
  });

  it("未知状态回退为 planned", () => {
    const rows = buildLabReadinessRows([
      createLab({ id: "x", category: "web", status: "mystery" }),
    ]);

    expect(rows[0].status).toBe("planned");
  });
});

describe("summarizeEvents", () => {
  it("聚合阶段 / 风险 / 决策计数并按实验分组", () => {
    const events = [
      createEvent({
        labKey: "web.csrf",
        title: "CSRF",
        phase: "attack",
        riskLevel: "high",
        decision: "accepted",
        createdAt: "2026-07-20T08:00:00.000Z",
      }),
      createEvent({
        labKey: "web.csrf",
        title: "CSRF",
        phase: "defense",
        riskLevel: "critical",
        decision: "blocked",
        createdAt: "2026-07-21T08:00:00.000Z",
      }),
      createEvent({
        labKey: "auth.jwt",
        title: "JWT",
        phase: "normal",
        riskLevel: "low",
        decision: "failed",
        createdAt: "2026-07-19T08:00:00.000Z",
      }),
    ];

    const summary = summarizeEvents(events);

    expect(summary.total).toBe(3);
    expect(summary.phase).toEqual({ attack: 1, defense: 1, normal: 1 });
    expect(summary.risk).toEqual({ critical: 1, high: 1, medium: 0, low: 1 });
    expect(summary.decision).toEqual({ accepted: 1, blocked: 1, failed: 1 });

    expect(summary.byLab[0]).toMatchObject({
      labKey: "web.csrf",
      total: 2,
      attack: 1,
      defense: 1,
      highestRisk: "critical",
      lastCreatedAt: "2026-07-21T08:00:00.000Z",
    });
    expect(summary.byLab[1]).toMatchObject({
      labKey: "auth.jwt",
      total: 1,
      highestRisk: "low",
    });
  });

  it("空事件返回全零且分组为空", () => {
    const summary = summarizeEvents([]);

    expect(summary.total).toBe(0);
    expect(summary.byLab).toEqual([]);
    expect(summary.phase).toEqual({ attack: 0, defense: 0, normal: 0 });
  });
});
