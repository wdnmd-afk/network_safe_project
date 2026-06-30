import { describe, expect, it } from "vitest";

import type { IdorResult } from "../src/api/idor-lab";
import {
  createIdorLearningProgress,
  createIdorVerificationRecord,
  formatIdorSignal,
  getIdorVariantConfig,
  otherUserOrderIdSample,
  ownOrderIdSample,
} from "../src/labs/idor";

describe("IDOR 纵向实验模型", () => {
  it("为漏洞版和修复版提供不同教学信号", () => {
    expect(getIdorVariantConfig("vuln")).toMatchObject({
      key: "vuln",
      badge: "只按 orderId 读取对象，不校验归属",
    });
    expect(getIdorVariantConfig("fixed")).toMatchObject({
      key: "fixed",
      badge: "后端对象级授权与归属校验",
    });
  });

  it("生成进入实验时的学习进度载荷", () => {
    expect(createIdorLearningProgress(getIdorVariantConfig("vuln"))).toEqual({
      variantKey: "vuln",
      status: "in-progress",
      notes: "进入 IDOR 漏洞版",
    });
  });

  it("生成漏洞版和修复版验证记录载荷", () => {
    const vulnerableResult: IdorResult = {
      status: "ok",
      variantKey: "vuln",
      orderId: otherUserOrderIdSample,
      order: {
        id: otherUserOrderIdSample,
        ownerUserId: "2",
        ownerLabel: "测试账户",
        productName: "Cloud Backup Locker",
        amount: 159,
        status: "shipping",
        contactMasked: "test***02",
        internalNote: "other user controlled teaching order",
      },
      inspection: {
        orderIdLength: otherUserOrderIdSample.length,
        objectType: "order",
        objectFound: true,
        currentUserId: "1",
        ownerUserId: "2",
        ownerMatches: false,
        crossUserRequested: true,
      },
      signal: "idor-cross-user-order-exposed",
      decision: "accepted",
      message: "cross user order exposed",
      nextStep: "compare fixed",
    };
    const fixedResult: IdorResult = {
      ...vulnerableResult,
      status: "blocked",
      variantKey: "fixed",
      order: null,
      signal: "idor-cross-user-order-blocked",
      decision: "blocked",
      blockedReason: "owner-mismatch",
    };

    expect(
      createIdorVerificationRecord(getIdorVariantConfig("vuln"), vulnerableResult),
    ).toEqual({
      variantKey: "vuln",
      result: "passed",
      summary: "漏洞版未校验对象归属，跨用户订单详情被返回。",
      details: {
        signal: "idor-cross-user-order-exposed",
        orderId: otherUserOrderIdSample,
        ownerUserId: "2",
        ownerMatches: false,
        crossUserRequested: true,
      },
    });
    expect(
      createIdorVerificationRecord(getIdorVariantConfig("fixed"), fixedResult),
    ).toEqual({
      variantKey: "fixed",
      result: "passed",
      summary: "修复版通过对象级授权阻断了跨用户订单读取。",
      details: {
        signal: "idor-cross-user-order-blocked",
        orderId: otherUserOrderIdSample,
        ownerUserId: "2",
        ownerMatches: false,
        crossUserRequested: true,
      },
    });
  });

  it("暴露本机受控订单样例与信号文案", () => {
    expect(ownOrderIdSample).toBe("order-1001");
    expect(otherUserOrderIdSample).toBe("order-2001");
    expect(formatIdorSignal("idor-cross-user-order-exposed")).toBe(
      "漏洞版暴露了他人订单",
    );
  });
});
