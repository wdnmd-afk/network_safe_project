import { describe, expect, it } from "vitest";

import type { LdapInjectionResult } from "../src/api/ldap-injection-lab";
import {
  attackLdapInjectionKeyword,
  createLdapInjectionLearningProgress,
  createLdapInjectionVerificationRecord,
  formatLdapInjectionSignal,
  getLdapInjectionCaseStudyRows,
  getLdapInjectionVariantConfig,
  ldapInjectionCaseStudies,
  ldapInjectionReviewChecklist,
  ldapInjectionScenarioOptions,
  normalLdapInjectionKeyword,
  normalLdapInjectionScenarioKey,
} from "../src/labs/ldap-injection";

describe("LDAP 注入纵向实验模型", () => {
  it("为漏洞版和修复版提供不同教学信号", () => {
    expect(getLdapInjectionVariantConfig("vuln")).toMatchObject({
      key: "vuln",
      perspective: "攻击方观察",
      badge: "虚拟目录查询器会接受固定受控样例",
    });
    expect(getLdapInjectionVariantConfig("fixed")).toMatchObject({
      key: "fixed",
      perspective: "防御方复盘",
      badge: "服务端固定场景、文本值边界和目录账号最小权限",
    });
  });

  it("为三个固定案例生成漏洞观察和修复观察行", () => {
    const vulnerableRows = getLdapInjectionCaseStudyRows("vuln");
    const fixedRows = getLdapInjectionCaseStudyRows("fixed");

    expect(vulnerableRows).toHaveLength(3);
    expect(fixedRows).toHaveLength(3);
    expect(vulnerableRows[0]).toMatchObject({
      key: "member-search",
      title: "组织成员搜索",
    });
    expect(vulnerableRows[0]!.focus).toContain("影响组织范围");
    expect(fixedRows[0]!.focus).toContain("修复版");
    expect(fixedRows[0]!.observation).toContain("服务端固定");
    expect(ldapInjectionScenarioOptions.map((item) => item.key)).toEqual([
      "member-search",
      "group-lookup",
      "login-filter",
    ]);
  });

  it("生成进入实验时的学习进度载荷", () => {
    expect(
      createLdapInjectionLearningProgress(
        getLdapInjectionVariantConfig("vuln"),
      ),
    ).toEqual({
      variantKey: "vuln",
      status: "in-progress",
      notes: "进入 LDAP 注入漏洞版",
    });
  });

  it("生成漏洞版和修复版验证记录载荷", () => {
    const vulnerableResult: LdapInjectionResult = {
      status: "ok",
      variantKey: "vuln",
      scenarioKey: normalLdapInjectionScenarioKey,
      keywordLength: attackLdapInjectionKeyword.length,
      keywordPreview: "controlled-ldap-keyword",
      entries: [
        {
          id: "member-public-alice",
          displayName: "Alice Chen",
          scenarioKey: "member-search",
          directoryArea: "current-organization",
          visibility: "public",
          matchedBy: "keyword",
          teachingOnly: false,
        },
        {
          id: "member-restricted-review",
          displayName: "虚拟受限成员记录",
          scenarioKey: "member-search",
          directoryArea: "restricted-review",
          visibility: "restricted",
          matchedBy: "controlled-expanded-scope",
          teachingOnly: true,
        },
      ],
      inspection: {
        scenarioAllowed: true,
        keywordLength: attackLdapInjectionKeyword.length,
        keywordPreview: "controlled-ldap-keyword",
        detectedRiskTypes: [
          "controlled-scope-expansion",
          "directory-filter-like-token",
        ],
        matchedControlledSample: true,
        resultScope: "expanded",
      },
      signal: "ldap-injection-scope-expanded",
      decision: "accepted",
      message: "virtual directory scope expanded",
      nextStep: "compare fixed",
    };
    const fixedResult: LdapInjectionResult = {
      ...vulnerableResult,
      status: "blocked",
      variantKey: "fixed",
      entries: [],
      inspection: {
        ...vulnerableResult.inspection,
        resultScope: "blocked",
      },
      signal: "ldap-injection-controlled-sample-blocked",
      decision: "blocked",
      blockedReason: "controlled-sample-blocked",
    };

    expect(
      createLdapInjectionVerificationRecord(
        getLdapInjectionVariantConfig("vuln"),
        vulnerableResult,
      ),
    ).toEqual({
      variantKey: "vuln",
      result: "passed",
      summary: "漏洞版接受受控 LDAP 样例，并展示虚拟目录结果范围扩大信号。",
      details: {
        signal: "ldap-injection-scope-expanded",
        scenarioKey: "member-search",
        resultScope: "expanded",
        detectedRiskTypes: [
          "controlled-scope-expansion",
          "directory-filter-like-token",
        ],
        matchedControlledSample: true,
        entryCount: 2,
      },
    });
    expect(
      createLdapInjectionVerificationRecord(
        getLdapInjectionVariantConfig("fixed"),
        fixedResult,
      ),
    ).toEqual({
      variantKey: "fixed",
      result: "passed",
      summary: "修复版检测到受控 LDAP 样例，并通过服务端固定查询场景阻断请求。",
      details: {
        signal: "ldap-injection-controlled-sample-blocked",
        scenarioKey: "member-search",
        resultScope: "blocked",
        detectedRiskTypes: [
          "controlled-scope-expansion",
          "directory-filter-like-token",
        ],
        matchedControlledSample: true,
        entryCount: 0,
      },
    });
  });

  it("暴露复盘清单、受控样例和安全信号文案", () => {
    expect(normalLdapInjectionScenarioKey).toBe("member-search");
    expect(normalLdapInjectionKeyword).toBe("alice");
    expect(attackLdapInjectionKeyword).toBe(
      "LAB_CONTROLLED_LDAP:expand-directory-scope",
    );
    expect(ldapInjectionCaseStudies.map((item) => item.key)).toEqual([
      "member-search",
      "group-lookup",
      "login-filter",
    ]);
    expect(ldapInjectionReviewChecklist.map((item) => item.key)).toEqual([
      "template",
      "escaping",
      "least-privilege",
      "audit",
    ]);
    expect(
      formatLdapInjectionSignal("ldap-injection-scope-expanded"),
    ).toBe("漏洞版虚拟目录结果范围被扩大");
    expect(
      formatLdapInjectionSignal("ldap-injection-boundary-verified"),
    ).toBe("已确认案例化安全边界");
  });

  it("静态文案不包含连接地址或受控执行样例标记", () => {
    const combined = JSON.stringify({
      configs: [
        getLdapInjectionVariantConfig("vuln"),
        getLdapInjectionVariantConfig("fixed"),
      ],
      cases: ldapInjectionCaseStudies,
      checklist: ldapInjectionReviewChecklist,
    });

    expect(combined).not.toContain("://");
    expect(combined).not.toContain("LAB_CONTROLLED");
    expect(combined).not.toContain(`ldap${"search"}`);
  });
});
