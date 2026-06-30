import { describe, expect, it } from "vitest";

import type { SsrfResult } from "../src/api/ssrf-lab";
import {
  attackSsrfSample,
  createSsrfLearningProgress,
  createSsrfVerificationRecord,
  formatSsrfSignal,
  getSsrfVariantConfig,
  normalSsrfSample,
} from "../src/labs/ssrf";

describe("SSRF 纵向实验模型", () => {
  it("为漏洞版和修复版提供不同教学信号", () => {
    expect(getSsrfVariantConfig("vuln")).toMatchObject({
      key: "vuln",
      badge: "未限制服务端请求目标",
    });
    expect(getSsrfVariantConfig("fixed")).toMatchObject({
      key: "fixed",
      badge: "协议限制、主机白名单与私有目标阻断",
    });
  });

  it("生成进入实验时的学习进度载荷", () => {
    expect(createSsrfLearningProgress(getSsrfVariantConfig("vuln"))).toEqual({
      variantKey: "vuln",
      status: "in-progress",
      notes: "进入 SSRF 漏洞版",
    });
  });

  it("生成漏洞版和修复版验证记录载荷", () => {
    const vulnerableResult: SsrfResult = {
      status: "ok",
      variantKey: "vuln",
      targetUrl: attackSsrfSample,
      resolvedUrl: attackSsrfSample,
      inspection: {
        normalizedUrl: attackSsrfSample,
        protocol: "http:",
        hostname: "169.254.169.254",
        pathname: "/latest/meta-data/iam/security-credentials/demo",
        allowedPublicHost: false,
        privateTarget: true,
        targetUrlLength: attackSsrfSample.length,
      },
      resource: {
        url: attackSsrfSample,
        title: "内部元数据模拟响应",
        resourceType: "internal",
        content: "internal training metadata",
        isSensitive: true,
      },
      signal: "ssrf-internal-metadata-exposed",
      decision: "accepted",
      message: "internal metadata exposed",
      nextStep: "compare fixed",
    };
    const fixedResult: SsrfResult = {
      ...vulnerableResult,
      status: "blocked",
      variantKey: "fixed",
      resource: null,
      signal: "ssrf-private-target-blocked",
      decision: "blocked",
      blockedReason: "private-target",
    };

    expect(
      createSsrfVerificationRecord(
        getSsrfVariantConfig("vuln"),
        vulnerableResult,
      ),
    ).toEqual({
      variantKey: "vuln",
      result: "passed",
      summary: "漏洞版接受了内部目标 URL，内部模拟元数据被服务端读取。",
      details: {
        signal: "ssrf-internal-metadata-exposed",
        hostname: "169.254.169.254",
        privateTarget: true,
      },
    });
    expect(
      createSsrfVerificationRecord(getSsrfVariantConfig("fixed"), fixedResult),
    ).toEqual({
      variantKey: "fixed",
      result: "passed",
      summary: "修复版通过白名单和私有目标检查阻断了内部 URL。",
      details: {
        signal: "ssrf-private-target-blocked",
        hostname: "169.254.169.254",
        privateTarget: true,
      },
    });
  });

  it("暴露本机受控 URL 样例与信号文案", () => {
    expect(normalSsrfSample).toBe(
      "https://safe-mart-cdn.local/public/catalog.json",
    );
    expect(attackSsrfSample).toBe(
      "http://169.254.169.254/latest/meta-data/iam/security-credentials/demo",
    );
    expect(formatSsrfSignal("ssrf-internal-metadata-exposed")).toBe(
      "漏洞版暴露了内部模拟元数据",
    );
  });
});
