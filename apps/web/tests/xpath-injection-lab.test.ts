import { describe, expect, it } from "vitest";

import type { XpathInjectionResult } from "../src/api/xpath-injection-lab";
import {
  attackXpathKeyword,
  createXpathInjectionLearningProgress,
  createXpathInjectionVerificationRecord,
  formatXpathInjectionSignal,
  getXpathInjectionVariantConfig,
  normalXpathQueryTemplate,
  normalXpathScope,
} from "../src/labs/xpath-injection";

describe("XPath 注入纵向实验模型", () => {
  it("为漏洞版和修复版提供不同教学信号", () => {
    expect(getXpathInjectionVariantConfig("vuln")).toMatchObject({
      key: "vuln",
      badge: "虚拟 XML 产品目录查询器会接受固定受控样例",
    });
    expect(getXpathInjectionVariantConfig("fixed")).toMatchObject({
      key: "fixed",
      badge: "服务端固定查询模板与文本值边界",
    });
  });

  it("生成进入实验时的学习进度载荷", () => {
    expect(
      createXpathInjectionLearningProgress(
        getXpathInjectionVariantConfig("vuln"),
      ),
    ).toEqual({
      variantKey: "vuln",
      status: "in-progress",
      notes: "进入 XPath 注入漏洞版",
    });
  });

  it("生成漏洞版和修复版验证记录载荷", () => {
    const vulnerableResult: XpathInjectionResult = {
      status: "ok",
      variantKey: "vuln",
      queryTemplate: normalXpathQueryTemplate,
      scope: normalXpathScope,
      keywordLength: attackXpathKeyword.length,
      keywordPreview: "controlled-xpath-keyword",
      documents: [
        {
          id: "product-public-camera",
          name: "公开相机支架",
          category: "camera-accessories",
          visibility: "public",
          matchedBy: "keyword",
          teachingOnly: false,
        },
        {
          id: "product-internal-review",
          name: "虚拟内部审核产品",
          category: "internal-review",
          visibility: "internal",
          matchedBy: "controlled-expanded-scope",
          teachingOnly: true,
        },
      ],
      inspection: {
        queryTemplateAllowed: true,
        scopeAllowed: true,
        keywordLength: attackXpathKeyword.length,
        keywordPreview: "controlled-xpath-keyword",
        detectedRiskTypes: [
          "controlled-scope-expansion",
          "xpath-like-token",
        ],
        matchedControlledSample: true,
        resultScope: "expanded",
      },
      signal: "xpath-injection-result-scope-expanded",
      decision: "accepted",
      message: "virtual result scope expanded",
      nextStep: "compare fixed",
    };
    const fixedResult: XpathInjectionResult = {
      ...vulnerableResult,
      status: "blocked",
      variantKey: "fixed",
      documents: [],
      inspection: {
        ...vulnerableResult.inspection,
        resultScope: "blocked",
      },
      signal: "xpath-injection-controlled-sample-blocked",
      decision: "blocked",
      blockedReason: "controlled-sample-blocked",
    };

    expect(
      createXpathInjectionVerificationRecord(
        getXpathInjectionVariantConfig("vuln"),
        vulnerableResult,
      ),
    ).toEqual({
      variantKey: "vuln",
      result: "passed",
      summary: "漏洞版接受受控 XPath 样例，并展示虚拟结果范围扩大信号。",
      details: {
        signal: "xpath-injection-result-scope-expanded",
        resultScope: "expanded",
        detectedRiskTypes: [
          "controlled-scope-expansion",
          "xpath-like-token",
        ],
        matchedControlledSample: true,
        documentCount: 2,
      },
    });
    expect(
      createXpathInjectionVerificationRecord(
        getXpathInjectionVariantConfig("fixed"),
        fixedResult,
      ),
    ).toEqual({
      variantKey: "fixed",
      result: "passed",
      summary: "修复版检测到受控 XPath 样例，并通过服务端固定查询模板阻断请求。",
      details: {
        signal: "xpath-injection-controlled-sample-blocked",
        resultScope: "blocked",
        detectedRiskTypes: [
          "controlled-scope-expansion",
          "xpath-like-token",
        ],
        matchedControlledSample: true,
        documentCount: 0,
      },
    });
  });

  it("暴露本机受控关键词样例与信号文案", () => {
    expect(attackXpathKeyword).toBe(
      "LAB_CONTROLLED_XPATH:expand-product-catalog",
    );
    expect(
      formatXpathInjectionSignal("xpath-injection-result-scope-expanded"),
    ).toBe("漏洞版虚拟结果范围被扩大");
  });
});
