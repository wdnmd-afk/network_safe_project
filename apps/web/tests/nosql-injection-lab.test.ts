import { describe, expect, it } from "vitest";

import type { NosqlInjectionResult } from "../src/api/nosql-injection-lab";
import {
  attackNosqlInjectionFilterText,
  createNosqlInjectionLearningProgress,
  createNosqlInjectionVerificationRecord,
  formatNosqlInjectionSignal,
  getNosqlInjectionVariantConfig,
  normalNosqlInjectionKeyword,
} from "../src/labs/nosql-injection";

describe("NoSQL 注入纵向实验模型", () => {
  it("为漏洞版和修复版提供不同教学信号", () => {
    expect(getNosqlInjectionVariantConfig("vuln")).toMatchObject({
      key: "vuln",
      badge: "虚拟文档查询器会接受固定受控操作符样例",
    });
    expect(getNosqlInjectionVariantConfig("fixed")).toMatchObject({
      key: "fixed",
      badge: "服务端查询模板与输入类型约束",
    });
  });

  it("生成进入实验时的学习进度载荷", () => {
    expect(
      createNosqlInjectionLearningProgress(
        getNosqlInjectionVariantConfig("vuln"),
      ),
    ).toEqual({
      variantKey: "vuln",
      status: "in-progress",
      notes: "进入 NoSQL 注入漏洞版",
    });
  });

  it("生成漏洞版和修复版验证记录载荷", () => {
    const vulnerableResult: NosqlInjectionResult = {
      status: "ok",
      variantKey: "vuln",
      queryMode: "coupon-search",
      keyword: normalNosqlInjectionKeyword,
      filterTextLength: attackNosqlInjectionFilterText.length,
      documents: [
        {
          id: "coupon-public-shipping",
          title: "公开运费优惠券",
          channel: "shipping",
          visibility: "public",
          teachingOnly: false,
        },
        {
          id: "coupon-hidden-review",
          title: "虚拟隐藏复盘优惠券",
          channel: "internal-review",
          visibility: "hidden",
          teachingOnly: true,
        },
      ],
      inspection: {
        queryModeAllowed: true,
        keywordLength: normalNosqlInjectionKeyword.length,
        filterTextLength: attackNosqlInjectionFilterText.length,
        detectedRiskTypes: ["controlled-operator", "operator-like-token"],
        matchedControlledSample: true,
        resultScope: "expanded",
      },
      signal: "nosql-injection-query-expanded",
      decision: "accepted",
      message: "virtual query expanded",
      nextStep: "compare fixed",
    };
    const fixedResult: NosqlInjectionResult = {
      ...vulnerableResult,
      status: "blocked",
      variantKey: "fixed",
      documents: [],
      inspection: {
        ...vulnerableResult.inspection,
        resultScope: "blocked",
      },
      signal: "nosql-injection-operator-blocked",
      decision: "blocked",
      blockedReason: "controlled-operator-blocked",
    };

    expect(
      createNosqlInjectionVerificationRecord(
        getNosqlInjectionVariantConfig("vuln"),
        vulnerableResult,
      ),
    ).toEqual({
      variantKey: "vuln",
      result: "passed",
      summary: "漏洞版接受受控 NoSQL 样例，并展示虚拟查询范围扩大信号。",
      details: {
        signal: "nosql-injection-query-expanded",
        resultScope: "expanded",
        detectedRiskTypes: ["controlled-operator", "operator-like-token"],
        matchedControlledSample: true,
        documentCount: 2,
      },
    });
    expect(
      createNosqlInjectionVerificationRecord(
        getNosqlInjectionVariantConfig("fixed"),
        fixedResult,
      ),
    ).toEqual({
      variantKey: "fixed",
      result: "passed",
      summary: "修复版检测到受控 NoSQL 样例，并通过服务端查询模板边界阻断请求。",
      details: {
        signal: "nosql-injection-operator-blocked",
        resultScope: "blocked",
        detectedRiskTypes: ["controlled-operator", "operator-like-token"],
        matchedControlledSample: true,
        documentCount: 0,
      },
    });
  });

  it("暴露本机受控查询样例与信号文案", () => {
    expect(normalNosqlInjectionKeyword).toBe("shipping");
    expect(attackNosqlInjectionFilterText).toBe(
      "LAB_CONTROLLED_OPERATOR:include-hidden-coupons",
    );
    expect(formatNosqlInjectionSignal("nosql-injection-query-expanded")).toBe(
      "漏洞版虚拟查询范围被扩大",
    );
  });
});
