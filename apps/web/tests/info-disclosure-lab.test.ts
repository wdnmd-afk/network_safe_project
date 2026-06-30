import { describe, expect, it } from "vitest";

import type { InfoDisclosureResult } from "../src/api/info-disclosure-lab";
import {
  attackInfoDisclosureSample,
  createInfoDisclosureLearningProgress,
  createInfoDisclosureVerificationRecord,
  formatInfoDisclosureSignal,
  getInfoDisclosureVariantConfig,
  normalInfoDisclosureSample,
} from "../src/labs/info-disclosure";

describe("信息泄露纵向实验模型", () => {
  it("为漏洞版和修复版提供不同教学信号", () => {
    expect(getInfoDisclosureVariantConfig("vuln")).toMatchObject({
      key: "vuln",
      badge: "普通用户可读取调试诊断报告",
    });
    expect(getInfoDisclosureVariantConfig("fixed")).toMatchObject({
      key: "fixed",
      badge: "调试报告阻断与错误信息收敛",
    });
  });

  it("生成进入实验时的学习进度载荷", () => {
    expect(
      createInfoDisclosureLearningProgress(
        getInfoDisclosureVariantConfig("vuln"),
      ),
    ).toEqual({
      variantKey: "vuln",
      status: "in-progress",
      notes: "进入 信息泄露漏洞版",
    });
  });

  it("生成漏洞版和修复版验证记录载荷", () => {
    const vulnerableResult: InfoDisclosureResult = {
      status: "ok",
      variantKey: "vuln",
      reportKey: attackInfoDisclosureSample,
      inspection: {
        normalizedReportKey: attackInfoDisclosureSample,
        requestedSensitiveReport: true,
        allowedPublicReport: false,
        exposedFieldCount: 4,
        reportKeyLength: attackInfoDisclosureSample.length,
      },
      report: {
        key: attackInfoDisclosureSample,
        title: "内部调试诊断报告",
        reportType: "debug",
        summary: "debug training report",
        fields: [],
        isSensitive: true,
      },
      signal: "info-disclosure-debug-data-exposed",
      decision: "accepted",
      message: "debug data exposed",
      nextStep: "compare fixed",
    };
    const fixedResult: InfoDisclosureResult = {
      ...vulnerableResult,
      status: "blocked",
      variantKey: "fixed",
      report: null,
      signal: "info-disclosure-debug-data-blocked",
      decision: "blocked",
      blockedReason: "debug-report-not-public",
    };

    expect(
      createInfoDisclosureVerificationRecord(
        getInfoDisclosureVariantConfig("vuln"),
        vulnerableResult,
      ),
    ).toEqual({
      variantKey: "vuln",
      result: "passed",
      summary: "漏洞版返回了内部调试诊断报告，教学占位信息被暴露。",
      details: {
        signal: "info-disclosure-debug-data-exposed",
        normalizedReportKey: "debug-diagnostics",
        requestedSensitiveReport: true,
      },
    });
    expect(
      createInfoDisclosureVerificationRecord(
        getInfoDisclosureVariantConfig("fixed"),
        fixedResult,
      ),
    ).toEqual({
      variantKey: "fixed",
      result: "passed",
      summary: "修复版阻断了调试诊断报告，并返回通用阻断结果。",
      details: {
        signal: "info-disclosure-debug-data-blocked",
        normalizedReportKey: "debug-diagnostics",
        requestedSensitiveReport: true,
      },
    });
  });

  it("暴露本机受控报告样例与信号文案", () => {
    expect(normalInfoDisclosureSample).toBe("public-status");
    expect(attackInfoDisclosureSample).toBe("debug-diagnostics");
    expect(
      formatInfoDisclosureSignal("info-disclosure-debug-data-exposed"),
    ).toBe("漏洞版暴露了调试诊断信息");
  });
});
