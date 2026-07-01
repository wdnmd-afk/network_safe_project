import { describe, expect, it } from "vitest";

import type { DnsHijackResult } from "../src/api/dns-hijack-lab";
import {
  createDnsHijackLearningProgress,
  createDnsHijackVerificationRecord,
  defaultDnsHijackDomainKey,
  defaultDnsHijackResolverProfile,
  dnsHijackDomainOptions,
  dnsHijackResolverProfileOptions,
  dnsHijackReviewChecklist,
  formatDnsHijackSignal,
  getDnsHijackDomainObservationRows,
  getDnsHijackVariantConfig,
} from "../src/labs/dns-hijack";

function createDnsHijackResult(
  variantKey: DnsHijackResult["variantKey"],
  signal: DnsHijackResult["signal"],
): DnsHijackResult {
  return {
    status: signal === "dns-hijack-anomaly-blocked" ? "blocked" : "ok",
    variantKey,
    domainKey: defaultDnsHijackDomainKey,
    resolverProfile: defaultDnsHijackResolverProfile,
    domain: {
      domainKey: defaultDnsHijackDomainKey,
      title: "客户门户入口",
      displayDomain: "portal.example.test",
      businessPurpose: "客户登录入口",
      expectedAddressCategory: "trusted-customer-portal",
      certificateExpectation: "trusted",
      riskNotes: "certificate mismatch",
    },
    resolution: {
      resolverProfile: defaultDnsHijackResolverProfile,
      sourceTrust: "untrusted-cache",
      expectedAddressCategory: "trusted-customer-portal",
      resolvedAddressCategory:
        signal === "dns-hijack-anomaly-blocked"
          ? "blocked-lookalike-customer-portal"
          : "lookalike-customer-portal",
      certificateStatus:
        signal === "dns-hijack-anomaly-blocked" ? "unknown" : "mismatch",
      anomalyDetected: true,
      matchedControlledSample: true,
    },
    audit: {
      trustedSource: false,
      addressMatchesExpected: false,
      certificateTrusted: false,
      blockedByPolicy: signal === "dns-hijack-anomaly-blocked",
      learningHint: "compare trusted resolver",
    },
    signal,
    decision: signal === "dns-hijack-anomaly-blocked" ? "blocked" : "accepted",
    message: "virtual dns observation",
    nextStep: "compare fixed",
  };
}

describe("DNS 劫持纵向实验模型", () => {
  it("为漏洞版和修复版提供不同教学信号", () => {
    expect(getDnsHijackVariantConfig("vuln")).toMatchObject({
      key: "vuln",
      perspective: "攻击方观察",
      badge: "错误虚拟解析、相似入口和证书不匹配",
    });
    expect(getDnsHijackVariantConfig("fixed")).toMatchObject({
      key: "fixed",
      perspective: "防御方复盘",
      badge: "可信解析源、证书校验和异常解析审计",
    });
  });

  it("暴露固定域名样例和固定解析视角", () => {
    expect(defaultDnsHijackDomainKey).toBe("customer-portal");
    expect(defaultDnsHijackResolverProfile).toBe("public-cache");
    expect(dnsHijackDomainOptions.map((item) => item.key)).toEqual([
      "customer-portal",
      "update-service",
      "internal-dashboard",
    ]);
    expect(dnsHijackResolverProfileOptions.map((item) => item.key)).toEqual([
      "public-cache",
      "trusted-resolver",
    ]);
  });

  it("为不同变体生成域名观察说明", () => {
    const vulnerableRows = getDnsHijackDomainObservationRows("vuln");
    const fixedRows = getDnsHijackDomainObservationRows("fixed");

    expect(vulnerableRows).toHaveLength(3);
    expect(fixedRows).toHaveLength(3);
    expect(vulnerableRows[0]).toMatchObject({
      key: "customer-portal",
      title: "客户门户入口",
    });
    expect(vulnerableRows[0]!.focus).toContain("证书不匹配");
    expect(fixedRows[0]!.focus).toContain("可信解析源");
  });

  it("生成进入实验时的学习进度载荷", () => {
    expect(
      createDnsHijackLearningProgress(getDnsHijackVariantConfig("vuln")),
    ).toEqual({
      variantKey: "vuln",
      status: "in-progress",
      notes: "进入 DNS 劫持漏洞版",
    });
  });

  it("生成漏洞版和修复版验证记录载荷", () => {
    const vulnerableResult = createDnsHijackResult(
      "vuln",
      "dns-hijack-certificate-mismatch-visible",
    );
    const fixedResult = createDnsHijackResult(
      "fixed",
      "dns-hijack-anomaly-blocked",
    );

    expect(
      createDnsHijackVerificationRecord(
        getDnsHijackVariantConfig("vuln"),
        vulnerableResult,
      ),
    ).toEqual({
      variantKey: "vuln",
      result: "passed",
      summary: "漏洞版展示了固定域名样例被错误虚拟解析和证书不匹配的风险信号。",
      details: {
        signal: "dns-hijack-certificate-mismatch-visible",
        domainKey: "customer-portal",
        resolverProfile: "public-cache",
        expectedAddressCategory: "trusted-customer-portal",
        resolvedAddressCategory: "lookalike-customer-portal",
        certificateStatus: "mismatch",
        anomalyDetected: true,
      },
    });
    expect(
      createDnsHijackVerificationRecord(
        getDnsHijackVariantConfig("fixed"),
        fixedResult,
      ),
    ).toEqual({
      variantKey: "fixed",
      result: "passed",
      summary: "修复版展示了异常解析阻断或可信解析恢复的防御信号。",
      details: {
        signal: "dns-hijack-anomaly-blocked",
        domainKey: "customer-portal",
        resolverProfile: "public-cache",
        expectedAddressCategory: "trusted-customer-portal",
        resolvedAddressCategory: "blocked-lookalike-customer-portal",
        certificateStatus: "unknown",
        anomalyDetected: true,
      },
    });
  });

  it("静态文案保持固定样例和无真实 DNS 边界", () => {
    const combined = JSON.stringify({
      configs: [
        getDnsHijackVariantConfig("vuln"),
        getDnsHijackVariantConfig("fixed"),
      ],
      domains: dnsHijackDomainOptions,
      resolvers: dnsHijackResolverProfileOptions,
      checklist: dnsHijackReviewChecklist,
    });

    expect(formatDnsHijackSignal("dns-hijack-anomaly-blocked")).toBe(
      "修复版异常解析已阻断",
    );
    expect(combined).toContain("固定样例");
    expect(combined).not.toContain("://");
    expect(combined).not.toContain("8.8.8.8");
    expect(combined).not.toContain("nslookup");
  });
});
