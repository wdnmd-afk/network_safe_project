import { describe, expect, it } from "vitest";

import type { PrivilegeEscalationResult } from "../src/api/privilege-escalation-lab";
import {
  adminOperationKeySample,
  attackRequestedRoleSample,
  createPrivilegeEscalationLearningProgress,
  createPrivilegeEscalationVerificationRecord,
  formatPrivilegeEscalationSignal,
  getPrivilegeEscalationVariantConfig,
  normalOperationKeySample,
} from "../src/labs/privilege-escalation";

describe("权限提升纵向实验模型", () => {
  it("为漏洞版和修复版提供不同教学信号", () => {
    expect(getPrivilegeEscalationVariantConfig("vuln")).toMatchObject({
      key: "vuln",
      badge: "信任客户端 requestedRole",
    });
    expect(getPrivilegeEscalationVariantConfig("fixed")).toMatchObject({
      key: "fixed",
      badge: "只信任服务端登录态角色",
    });
  });

  it("生成进入实验时的学习进度载荷", () => {
    expect(
      createPrivilegeEscalationLearningProgress(
        getPrivilegeEscalationVariantConfig("vuln"),
      ),
    ).toEqual({
      variantKey: "vuln",
      status: "in-progress",
      notes: "进入 权限提升漏洞版",
    });
  });

  it("生成漏洞版和修复版验证记录载荷", () => {
    const vulnerableResult: PrivilegeEscalationResult = {
      status: "ok",
      variantKey: "vuln",
      operationKey: adminOperationKeySample,
      requestedRole: attackRequestedRoleSample,
      operation: {
        key: adminOperationKeySample,
        title: "审批高风险退款",
        requiredRole: "admin",
        resultSummary: "虚拟审批了高风险退款请求",
      },
      inspection: {
        operationKeyLength: adminOperationKeySample.length,
        requestedRole: "admin",
        currentUserRole: "member",
        effectiveRole: "admin",
        trustedClientRole: true,
        privilegedOperation: true,
        roleAllowed: true,
      },
      signal: "privilege-client-role-admin-accepted",
      decision: "accepted",
      message: "client admin accepted",
      nextStep: "compare fixed",
    };
    const fixedResult: PrivilegeEscalationResult = {
      ...vulnerableResult,
      status: "blocked",
      variantKey: "fixed",
      operation: null,
      inspection: {
        ...vulnerableResult.inspection,
        effectiveRole: "member",
        trustedClientRole: false,
        roleAllowed: false,
      },
      signal: "privilege-client-role-admin-blocked",
      decision: "blocked",
      blockedReason: "server-role-not-allowed",
    };

    expect(
      createPrivilegeEscalationVerificationRecord(
        getPrivilegeEscalationVariantConfig("vuln"),
        vulnerableResult,
      ),
    ).toEqual({
      variantKey: "vuln",
      result: "passed",
      summary: "漏洞版信任客户端 admin 声明，普通用户执行了管理操作。",
      details: {
        signal: "privilege-client-role-admin-accepted",
        operationKey: adminOperationKeySample,
        requestedRole: "admin",
        currentUserRole: "member",
        effectiveRole: "admin",
        trustedClientRole: true,
      },
    });
    expect(
      createPrivilegeEscalationVerificationRecord(
        getPrivilegeEscalationVariantConfig("fixed"),
        fixedResult,
      ),
    ).toEqual({
      variantKey: "fixed",
      result: "passed",
      summary: "修复版只信任服务端角色，阻断了客户端 admin 声明。",
      details: {
        signal: "privilege-client-role-admin-blocked",
        operationKey: adminOperationKeySample,
        requestedRole: "admin",
        currentUserRole: "member",
        effectiveRole: "member",
        trustedClientRole: false,
      },
    });
  });

  it("暴露本机受控操作样例与信号文案", () => {
    expect(normalOperationKeySample).toBe("view-profile-summary");
    expect(adminOperationKeySample).toBe("approve-refund");
    expect(
      formatPrivilegeEscalationSignal(
        "privilege-client-role-admin-accepted",
      ),
    ).toBe("漏洞版接受了客户端 admin 声明");
  });
});
