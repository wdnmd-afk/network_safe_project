import { describe, expect, it } from "vitest";

import {
  createCsrfLearningProgress,
  createCsrfVerificationRecord,
  csrfSampleTransfer,
  formatCsrfSignal,
  getCsrfVariantConfig,
} from "../src/labs/csrf";

describe("CSRF 纵向实验模型", () => {
  it("为漏洞版和修复版提供不同的教学信号", () => {
    expect(getCsrfVariantConfig("vuln")).toMatchObject({
      key: "vuln",
      badge: "缺少请求令牌校验",
    });
    expect(getCsrfVariantConfig("fixed")).toMatchObject({
      key: "fixed",
      badge: "校验一次性 CSRF token",
    });
  });

  it("生成进入实验时的学习进度载荷", () => {
    expect(createCsrfLearningProgress(getCsrfVariantConfig("vuln"))).toEqual({
      variantKey: "vuln",
      status: "in-progress",
      notes: "进入 CSRF 漏洞版",
    });
  });

  it("生成漏洞版和修复版验证记录载荷", () => {
    expect(
      createCsrfVerificationRecord(
        getCsrfVariantConfig("vuln"),
        "csrf-transfer-accepted",
      ),
    ).toEqual({
      variantKey: "vuln",
      result: "passed",
      summary: "漏洞版未校验 CSRF token，模拟第三方请求完成了转账",
      details: {
        signal: "csrf-transfer-accepted",
      },
    });
    expect(
      createCsrfVerificationRecord(
        getCsrfVariantConfig("fixed"),
        "csrf-token-required",
      ),
    ).toEqual({
      variantKey: "fixed",
      result: "passed",
      summary: "修复版要求 CSRF token，模拟第三方请求已被阻断",
      details: {
        signal: "csrf-token-required",
      },
    });
  });

  it("暴露本机受控样例转账与信号文案", () => {
    expect(csrfSampleTransfer).toEqual({
      amount: 200,
      targetAccount: "safe-mart-training",
    });
    expect(formatCsrfSignal("csrf-token-accepted")).toBe(
      "修复版接受了携带 token 的正常请求",
    );
  });
});
