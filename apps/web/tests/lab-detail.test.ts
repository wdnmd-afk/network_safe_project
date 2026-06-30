import { describe, expect, it } from "vitest";

import {
  createLabEventRecapQuestions,
  filterLabEventLogsForLab,
  filterLabRecordsForLab,
  findVariantWebEntrypoint,
} from "../src/labs/lab-detail";
import type { LabMetadata } from "../src/api/labs";
import type {
  CurrentUserLabEventLogsResponse,
  CurrentUserLabRecordsResponse,
} from "../src/api/lab-records";

const lab = {
  id: "web.xss",
  slug: "xss",
  title: "XSS",
  category: "web",
  subcategory: "xss",
  mode: "interactive",
  severity: "high",
  difficulty: "beginner",
  summary: "对比未转义输出与文本渲染。",
  status: "ready",
  tags: ["web", "xss"],
  knowledgePoints: ["用户输入不应直接作为 HTML 输出"],
  variants: [
    {
      key: "vuln",
      title: "漏洞版",
      enabled: true,
      description: "HTML 渲染",
      entryKey: "vuln-entry",
      expectedOutcome: "出现模拟信号",
      supportsAutomation: true,
    },
    {
      key: "fixed",
      title: "修复版",
      enabled: true,
      description: "文本渲染",
      entryKey: "fixed-entry",
      expectedOutcome: "原样显示字符串",
      supportsAutomation: true,
    },
  ],
  entrypoints: {
    web: [
      {
        key: "vuln-entry",
        path: "/labs/web/xss/vuln",
        description: "漏洞版入口",
        variant: "vuln",
      },
      {
        key: "fixed-entry",
        path: "/labs/web/xss/fixed",
        description: "修复版入口",
        variant: "fixed",
      },
    ],
    api: [],
    scripts: [],
    docs: [],
  },
  verification: {
    manual: {
      supported: true,
      stepsDocPath: "labs/web/xss/docs/manual-verification.md",
      expectedSignals: ["漏洞版会出现黄色 XSS 模拟信号"],
    },
    automation: {
      supported: true,
    },
  },
  prerequisites: [],
  paths: {
    root: "labs/web/xss",
    readme: "labs/web/xss/README.md",
    vuln: "labs/web/xss/vuln",
    fixed: "labs/web/xss/fixed",
    mock: "labs/web/xss/mock",
    docs: "labs/web/xss/docs",
    scripts: "tools/lab-scripts/web/xss",
  },
} satisfies LabMetadata;

describe("实验详情页数据整理", () => {
  it("按 variant.entryKey 精确找到变体页面入口", () => {
    expect(findVariantWebEntrypoint(lab, lab.variants[0]!)).toEqual({
      key: "vuln-entry",
      path: "/labs/web/xss/vuln",
      description: "漏洞版入口",
      variant: "vuln",
    });
  });

  it("按 labKey 过滤当前实验学习进度和验证记录", () => {
    const records: CurrentUserLabRecordsResponse["records"] = {
      progress: [
        {
          labKey: "web.xss",
          title: "XSS",
          variantKey: "fixed",
          status: "completed",
          updatedAt: "2026-06-22T09:00:00.000Z",
        },
        {
          labKey: "auth.jwt",
          title: "JWT",
          variantKey: "vuln",
          status: "in-progress",
          updatedAt: "2026-06-22T08:00:00.000Z",
        },
      ],
      verifications: [
        {
          labKey: "web.xss",
          title: "XSS",
          variantKey: "fixed",
          result: "passed",
          summary: "修复版原样显示 HTML 字符串",
          createdAt: "2026-06-22T09:01:00.000Z",
        },
      ],
    };

    expect(filterLabRecordsForLab(records, "web.xss")).toEqual({
      progress: [records.progress[0]],
      verifications: [records.verifications[0]],
    });
  });

  it("按 labKey 过滤当前实验事件日志", () => {
    const events: CurrentUserLabEventLogsResponse["events"] = [
      {
        traceId: "trace-xss-fixed",
        labKey: "web.xss",
        title: "XSS",
        variantKey: "fixed",
        phase: "defense",
        eventType: "success",
        actorPerspective: "user",
        decision: "accepted",
        signal: "xss-payload-rendered-as-text",
        statusCode: 200,
        message: "修复版按文本显示输入",
        riskLevel: "low",
        createdAt: "2026-06-25T08:00:00.000Z",
      },
      {
        traceId: "trace-jwt-vuln",
        labKey: "auth.jwt",
        title: "JWT 攻击",
        variantKey: "vuln",
        phase: "attack",
        eventType: "success",
        actorPerspective: "attacker",
        decision: "accepted",
        signal: "jwt-none-admin-accepted",
        statusCode: 200,
        message: "漏洞版接受了无签名 admin token",
        riskLevel: "high",
        createdAt: "2026-06-25T08:01:00.000Z",
      },
    ];

    expect(filterLabEventLogsForLab(events, "web.xss")).toEqual([events[0]]);
  });

  it("根据事件阶段和决策生成引导式复盘问题", () => {
    expect(
      createLabEventRecapQuestions({
        traceId: "trace-csrf-fixed",
        labKey: "web.csrf",
        title: "CSRF",
        variantKey: "fixed",
        phase: "defense",
        eventType: "blocked",
        actorPerspective: "attacker",
        decision: "blocked",
        signal: "csrf-token-required",
        statusCode: 403,
        message: "修复版阻断了缺少 token 的请求",
        riskLevel: "medium",
        createdAt: "2026-06-25T08:02:00.000Z",
      }),
    ).toEqual([
      "这条事件的后端决策是什么，为什么是这个决策？",
      "同样动作切换到另一个变体时，预期信号会如何变化？",
      "修复版依靠哪个校验或边界阻断？",
      "阻断发生在哪个边界？是否影响正常业务？",
    ]);
  });
});
