import { describe, expect, it } from "vitest";

import type { CrlfInjectionResult } from "../src/api/crlf-injection-lab";
import {
  attackCrlfFileName,
  createCrlfInjectionLearningProgress,
  createCrlfInjectionVerificationRecord,
  formatCrlfInjectionSignal,
  getCrlfInjectionVariantConfig,
  normalCrlfDispositionType,
  normalCrlfHeaderTemplate,
} from "../src/labs/crlf-injection";

describe("CRLF 注入纵向实验模型", () => {
  it("为漏洞版和修复版提供不同教学信号", () => {
    expect(getCrlfInjectionVariantConfig("vuln")).toMatchObject({
      key: "vuln",
      badge: "虚拟响应头预览器会展示固定受控样例造成的教学污染头部",
    });
    expect(getCrlfInjectionVariantConfig("fixed")).toMatchObject({
      key: "fixed",
      badge: "服务端模板化响应头构造与控制字符阻断",
    });
  });

  it("生成进入实验时的学习进度载荷", () => {
    expect(
      createCrlfInjectionLearningProgress(
        getCrlfInjectionVariantConfig("vuln"),
      ),
    ).toEqual({
      variantKey: "vuln",
      status: "in-progress",
      notes: "进入 CRLF 注入漏洞版",
    });
  });

  it("生成漏洞版和修复版验证记录载荷", () => {
    const vulnerableResult: CrlfInjectionResult = {
      status: "ok",
      variantKey: "vuln",
      headerTemplate: normalCrlfHeaderTemplate,
      dispositionType: normalCrlfDispositionType,
      fileNameLength: attackCrlfFileName.length,
      fileNamePreview: "controlled-crlf-file-name",
      headers: [
        {
          name: "Content-Disposition",
          valuePreview: "attachment; filename=\"controlled-crlf-file-name\"",
          source: "user-input",
          polluted: true,
        },
        {
          name: "X-Lab-Debug",
          valuePreview: "virtual teaching header",
          source: "virtual-injected",
          polluted: true,
        },
      ],
      inspection: {
        headerTemplateAllowed: true,
        dispositionTypeAllowed: true,
        fileNameLength: attackCrlfFileName.length,
        fileNamePreview: "controlled-crlf-file-name",
        detectedControlChars: ["cr", "lf"],
        matchedControlledSample: true,
        virtualHeaderCount: 2,
        pollutedHeaderCount: 2,
      },
      signal: "crlf-injection-virtual-header-injected",
      decision: "accepted",
      message: "virtual header injected",
      nextStep: "compare fixed",
    };
    const fixedResult: CrlfInjectionResult = {
      ...vulnerableResult,
      status: "blocked",
      variantKey: "fixed",
      headers: [],
      inspection: {
        ...vulnerableResult.inspection,
        virtualHeaderCount: 0,
        pollutedHeaderCount: 0,
      },
      signal: "crlf-injection-control-chars-blocked",
      decision: "blocked",
      blockedReason: "control-chars-blocked",
    };

    expect(
      createCrlfInjectionVerificationRecord(
        getCrlfInjectionVariantConfig("vuln"),
        vulnerableResult,
      ),
    ).toEqual({
      variantKey: "vuln",
      result: "passed",
      summary: "漏洞版接受受控 CRLF 样例，并展示虚拟响应头污染信号。",
      details: {
        signal: "crlf-injection-virtual-header-injected",
        headerTemplate: "download-filename",
        dispositionType: "attachment",
        detectedControlChars: ["cr", "lf"],
        matchedControlledSample: true,
        virtualHeaderCount: 2,
        pollutedHeaderCount: 2,
      },
    });
    expect(
      createCrlfInjectionVerificationRecord(
        getCrlfInjectionVariantConfig("fixed"),
        fixedResult,
      ),
    ).toEqual({
      variantKey: "fixed",
      result: "passed",
      summary: "修复版检测到受控 CRLF 样例，并在响应头构造前阻断请求。",
      details: {
        signal: "crlf-injection-control-chars-blocked",
        headerTemplate: "download-filename",
        dispositionType: "attachment",
        detectedControlChars: ["cr", "lf"],
        matchedControlledSample: true,
        virtualHeaderCount: 0,
        pollutedHeaderCount: 0,
      },
    });
  });

  it("暴露本机受控文件名样例与信号文案", () => {
    expect(attackCrlfFileName).toBe("invoice.pdf\r\nX-Lab-Debug: exposed");
    expect(
      formatCrlfInjectionSignal("crlf-injection-virtual-header-injected"),
    ).toBe("漏洞版虚拟头部结构被污染");
  });
});
