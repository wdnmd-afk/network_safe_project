import { describe, expect, it } from "vitest";

import type { SstiPreviewResult } from "../src/api/ssti-lab";
import {
  attackSstiDebugTemplateSample,
  attackSstiMathTemplateSample,
  createSstiLearningProgress,
  createSstiVerificationRecord,
  formatSstiSignal,
  getSstiVariantConfig,
  normalSstiTemplateSample,
} from "../src/labs/ssti";

describe("SSTI 纵向实验模型", () => {
  it("为漏洞版和修复版提供不同教学信号", () => {
    expect(getSstiVariantConfig("vuln")).toMatchObject({
      key: "vuln",
      badge: "教学模拟器会解释固定受控表达式",
    });
    expect(getSstiVariantConfig("fixed")).toMatchObject({
      key: "fixed",
      badge: "系统模板与变量允许列表",
    });
  });

  it("生成进入实验时的学习进度载荷", () => {
    expect(createSstiLearningProgress(getSstiVariantConfig("vuln"))).toEqual({
      variantKey: "vuln",
      status: "in-progress",
      notes: "进入 SSTI 漏洞版",
    });
  });

  it("生成漏洞版和修复版验证记录载荷", () => {
    const vulnerableResult: SstiPreviewResult = {
      status: "ok",
      variantKey: "vuln",
      templateKey: "shipping-notice",
      renderedText: "尊敬的 演示用户，调试结果：49",
      inspection: {
        templateLength: attackSstiMathTemplateSample.length,
        expressionCount: 2,
        expressionTypes: ["allowed-variable", "controlled-math-expression"],
        matchedControlledSample: true,
        unknownExpressionCount: 0,
        variableKeys: ["customerName", "orderNo", "noticeTitle"],
        acceptedVariableKeys: ["customerName"],
      },
      signal: "ssti-expression-evaluated",
      decision: "accepted",
      message: "controlled expression evaluated",
      nextStep: "compare fixed",
    };
    const fixedResult: SstiPreviewResult = {
      ...vulnerableResult,
      status: "blocked",
      variantKey: "fixed",
      renderedText: "",
      signal: "ssti-expression-blocked",
      decision: "blocked",
      blockedReason: "expression-not-allowed",
    };

    expect(
      createSstiVerificationRecord(
        getSstiVariantConfig("vuln"),
        vulnerableResult,
      ),
    ).toEqual({
      variantKey: "vuln",
      result: "passed",
      summary: "漏洞版接受了受控模板表达式，并返回教学模拟器信号。",
      details: {
        signal: "ssti-expression-evaluated",
        expressionTypes: ["allowed-variable", "controlled-math-expression"],
        matchedControlledSample: true,
      },
    });
    expect(
      createSstiVerificationRecord(getSstiVariantConfig("fixed"), fixedResult),
    ).toEqual({
      variantKey: "fixed",
      result: "passed",
      summary: "修复版检测到非允许变量表达式，并通过模板来源隔离阻断请求。",
      details: {
        signal: "ssti-expression-blocked",
        expressionTypes: ["allowed-variable", "controlled-math-expression"],
        matchedControlledSample: true,
      },
    });
  });

  it("暴露本机受控模板样例与信号文案", () => {
    expect(normalSstiTemplateSample).toContain("{{ customerName }}");
    expect(attackSstiMathTemplateSample).toContain("{{ 7 * 7 }}");
    expect(attackSstiDebugTemplateSample).toContain("{{ debugContext }}");
    expect(formatSstiSignal("ssti-template-context-exposed")).toBe(
      "漏洞版暴露了虚拟模板上下文",
    );
  });
});
