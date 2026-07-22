import assert from "node:assert/strict";
import test from "node:test";

import {
  getLabCategoryProfile,
  syncLabMetadataToDatabase,
  type LabMetadataSyncRepository,
} from "../src/services/lab-metadata-sync.js";

const xssMetadata = {
  id: "web.xss",
  slug: "xss",
  title: "XSS",
  category: "web",
  subcategory: "xss",
  mode: "interactive",
  severity: "high",
  difficulty: "beginner",
  summary: "在客服留言业务上下文中对比 XSS 风险差异。",
  status: "in-progress",
  phase: "phase-1",
  tags: ["web", "xss"],
  knowledgePoints: [],
  variants: [
    {
      key: "vuln",
      title: "漏洞版",
      enabled: true,
      description: "客服留言内容被当作 HTML 渲染。",
      entryKey: "vuln-entry",
      expectedOutcome: "出现 XSS 模拟信号。",
      supportsAutomation: true,
    },
    {
      key: "fixed",
      title: "修复版",
      enabled: true,
      description: "客服留言内容以文本方式展示。",
      entryKey: "fixed-entry",
      expectedOutcome: "HTML 字符串原样显示。",
      supportsAutomation: true,
    },
  ],
  entrypoints: {
    web: [],
    api: [],
    scripts: [],
    docs: [],
  },
  verification: {
    manual: {
      supported: true,
      stepsDocPath: "labs/web/xss/docs/manual-verification.md",
      expectedSignals: [],
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
  sortOrder: 10,
  estimatedMinutes: 25,
};

test("getLabCategoryProfile returns documented labels for phase-one categories", () => {
  assert.deepEqual(getLabCategoryProfile("web"), {
    code: "web",
    name: "Web 漏洞",
    description: "Web 漏洞靶场实验",
  });
  assert.deepEqual(getLabCategoryProfile("auth"), {
    code: "auth",
    name: "认证授权",
    description: "认证授权与业务逻辑实验",
  });
  assert.deepEqual(getLabCategoryProfile("malware"), {
    code: "malware",
    name: "恶意软件",
    description: "恶意行为时间线与防御策略案例实验",
  });
  assert.deepEqual(getLabCategoryProfile("client"), {
    code: "client",
    name: "客户端攻击",
    description: "固定浏览器行为与客户端防护实验",
  });
});

test("syncLabMetadataToDatabase upserts category, lab and variants from metadata", async () => {
  const calls: Array<{ name: string; input: unknown }> = [];
  const repository: LabMetadataSyncRepository = {
    async upsertCategory(input) {
      calls.push({
        name: "upsertCategory",
        input,
      });
      return {
        id: 101n,
      };
    },
    async upsertLab(input) {
      calls.push({
        name: "upsertLab",
        input,
      });
      return {
        id: 202n,
      };
    },
    async upsertVariant(input) {
      calls.push({
        name: "upsertVariant",
        input,
      });
    },
  };

  const result = await syncLabMetadataToDatabase([xssMetadata], repository);

  assert.deepEqual(result, {
    categories: 1,
    labs: 1,
    variants: 2,
  });
  assert.deepEqual(calls, [
    {
      name: "upsertCategory",
      input: {
        code: "web",
        name: "Web 漏洞",
        description: "Web 漏洞靶场实验",
        sortOrder: 0,
      },
    },
    {
      name: "upsertLab",
      input: {
        labKey: "web.xss",
        slug: "xss",
        title: "XSS",
        categoryId: 101n,
        subcategoryCode: "xss",
        mode: "interactive",
        severity: "high",
        difficulty: "beginner",
        summary: "在客服留言业务上下文中对比 XSS 风险差异。",
        status: "in-progress",
        phase: "phase-1",
        sortOrder: 10,
        estimatedMinutes: 25,
        metaPath: "labs/web/xss/meta.json",
        readmePath: "labs/web/xss/README.md",
        rootPath: "labs/web/xss",
        isEnabled: true,
      },
    },
    {
      name: "upsertVariant",
      input: {
        labId: 202n,
        variantKey: "vuln",
        title: "漏洞版",
        description: "客服留言内容被当作 HTML 渲染。",
        entryKey: "vuln-entry",
        expectedOutcome: "出现 XSS 模拟信号。",
        supportsAutomation: true,
        isEnabled: true,
      },
    },
    {
      name: "upsertVariant",
      input: {
        labId: 202n,
        variantKey: "fixed",
        title: "修复版",
        description: "客服留言内容以文本方式展示。",
        entryKey: "fixed-entry",
        expectedOutcome: "HTML 字符串原样显示。",
        supportsAutomation: true,
        isEnabled: true,
      },
    },
  ]);
});
