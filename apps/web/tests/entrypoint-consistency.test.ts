import { describe, expect, it } from "vitest";

import type { LabMetadata } from "../../../packages/shared/src/lab-metadata.js";

import {
  matchRoutePath,
  verifyWebEntrypointConsistency,
} from "../src/router/entrypoint-consistency";
import { routes } from "../src/router/routes";

function createMetadata(): LabMetadata {
  return {
    id: "sample.demo",
    slug: "demo",
    title: "示例实验",
    category: "sample",
    subcategory: "demo",
    mode: "simulation",
    severity: "low",
    difficulty: "beginner",
    summary: "示例",
    status: "ready",
    tags: [],
    knowledgePoints: [],
    variants: [
      {
        key: "vuln",
        title: "漏洞版",
        enabled: true,
        description: "漏洞版",
        entryKey: "sample-demo-vuln",
        expectedOutcome: "风险",
        supportsAutomation: false,
      },
      {
        key: "fixed",
        title: "修复版",
        enabled: true,
        description: "修复版",
        entryKey: "sample-demo-fixed",
        expectedOutcome: "阻断",
        supportsAutomation: false,
      },
    ],
    entrypoints: {
      web: [
        {
          key: "sample-demo-vuln",
          variant: "vuln",
          path: "/labs/sample/demo/vuln",
          description: "漏洞版",
        },
        {
          key: "sample-demo-fixed",
          variant: "fixed",
          path: "/labs/sample/demo/fixed",
          description: "修复版",
        },
      ],
      api: [],
      scripts: [],
      docs: [],
    },
    verification: {
      manual: {
        supported: true,
        stepsDocPath: "labs/sample/demo/docs/manual-verification.md",
        expectedSignals: [],
      },
      automation: {
        supported: false,
      },
    },
    prerequisites: [],
    paths: {
      root: "labs/sample/demo",
      readme: "labs/sample/demo/README.md",
      vuln: "labs/sample/demo/vuln",
      fixed: "labs/sample/demo/fixed",
      mock: "labs/sample/demo/mock",
      docs: "labs/sample/demo/docs",
      scripts: "tools/lab-scripts/sample/demo",
    },
  };
}

describe("实验 Web 入口一致性", () => {
  it("按 Vue Router 参数语义匹配动态实验路由", () => {
    expect(
      matchRoutePath(
        "/labs/:category/:scene/:variant(vuln|fixed)",
        "/labs/network/ddos/vuln",
      ),
    ).toEqual({
      category: "network",
      scene: "ddos",
      variant: "vuln",
    });
    expect(
      matchRoutePath(
        "/labs/:category/:scene/:variant(vuln|fixed)",
        "/labs/network/ddos/planned",
      ),
    ).toBeNull();
  });

  it("接受入口与动态路由完全一致的启用变体", () => {
    const report = verifyWebEntrypointConsistency([createMetadata()], routes);

    expect(report.ok).toBe(true);
    expect(report.enabledVariantCount).toBe(2);
    expect(report.matchedEntrypointCount).toBe(2);
    expect(report.errors).toEqual([]);
  });

  it("报告缺失的变体 Web 入口", () => {
    const metadata = createMetadata();
    metadata.entrypoints.web = metadata.entrypoints.web.slice(1);

    const report = verifyWebEntrypointConsistency([metadata], routes);

    expect(report.ok).toBe(false);
    expect(report.errors.map((error) => error.code)).toContain(
      "missing-variant-web-entry",
    );
  });

  it("报告重复的入口键、路径和变体映射", () => {
    const metadata = createMetadata();
    metadata.entrypoints.web.push({ ...metadata.entrypoints.web[0] });

    const report = verifyWebEntrypointConsistency([metadata], routes);
    const codes = report.errors.map((error) => error.code);

    expect(codes).toContain("duplicate-web-entry-key");
    expect(codes).toContain("duplicate-web-entry-path");
    expect(codes).toContain("duplicate-variant-web-entry");
  });

  it("报告 entryKey 对应入口的变体错配", () => {
    const metadata = createMetadata();
    metadata.entrypoints.web[0].variant = "fixed";

    const report = verifyWebEntrypointConsistency([metadata], routes);

    expect(report.ok).toBe(false);
    expect(report.errors.map((error) => error.code)).toContain(
      "variant-entry-mismatch",
    );
  });
});
