import { describe, expect, it } from "vitest";

import type { JwtResult } from "../src/api/jwt-lab";
import {
  attackJwtSample,
  createJwtLearningProgress,
  createJwtVerificationRecord,
  formatJwtSignal,
  getJwtVariantConfig,
  normalJwtSample,
} from "../src/labs/jwt";

describe("JWT 攻击纵向实验模型", () => {
  it("为漏洞版和修复版提供不同教学信号", () => {
    expect(getJwtVariantConfig("vuln")).toMatchObject({
      key: "vuln",
      badge: "信任 alg=none 并接受未签名角色声明",
    });
    expect(getJwtVariantConfig("fixed")).toMatchObject({
      key: "fixed",
      badge: "算法白名单与 HS256 签名校验",
    });
  });

  it("生成进入实验时的学习进度载荷", () => {
    expect(createJwtLearningProgress(getJwtVariantConfig("vuln"))).toEqual({
      variantKey: "vuln",
      status: "in-progress",
      notes: "进入 JWT 攻击漏洞版",
    });
  });

  it("生成漏洞版和修复版验证记录载荷", () => {
    const vulnerableResult: JwtResult = {
      status: "ok",
      variantKey: "vuln",
      header: {
        alg: "none",
        typ: "JWT",
      },
      payload: {
        sub: "learner-1001",
        role: "admin",
        scope: "admin:read",
        lab: "auth.jwt",
      },
      inspection: {
        tokenLength: attackJwtSample.length,
        segmentCount: 3,
        algorithm: "none",
        signaturePresent: false,
        signatureValid: false,
        roleClaim: "admin",
        scopeClaim: "admin:read",
        adminClaimRequested: true,
        labToken: true,
      },
      access: {
        subject: "learner-1001",
        role: "admin",
        scope: "admin:read",
        resource: "admin-analytics",
        granted: true,
      },
      signal: "jwt-none-alg-admin-accepted",
      decision: "accepted",
      message: "none algorithm accepted",
      nextStep: "compare fixed",
    };
    const fixedResult: JwtResult = {
      ...vulnerableResult,
      status: "blocked",
      variantKey: "fixed",
      access: null,
      signal: "jwt-none-alg-blocked",
      decision: "blocked",
      blockedReason: "algorithm-not-allowed",
    };

    expect(
      createJwtVerificationRecord(getJwtVariantConfig("vuln"), vulnerableResult),
    ).toEqual({
      variantKey: "vuln",
      result: "passed",
      summary: "漏洞版接受了 alg=none 管理员声明，未签名 token 获得管理区访问结果。",
      details: {
        signal: "jwt-none-alg-admin-accepted",
        algorithm: "none",
        roleClaim: "admin",
        adminClaimRequested: true,
      },
    });
    expect(
      createJwtVerificationRecord(getJwtVariantConfig("fixed"), fixedResult),
    ).toEqual({
      variantKey: "fixed",
      result: "passed",
      summary: "修复版通过算法白名单和签名校验阻断了 alg=none 管理员声明。",
      details: {
        signal: "jwt-none-alg-blocked",
        algorithm: "none",
        roleClaim: "admin",
        adminClaimRequested: true,
      },
    });
  });

  it("暴露本机受控 token 样例与信号文案", () => {
    expect(normalJwtSample).toContain(".eyJzdWIiOiJsZWFybmVyLTEwMDEi");
    expect(attackJwtSample.endsWith(".")).toBe(true);
    expect(formatJwtSignal("jwt-none-alg-admin-accepted")).toBe(
      "漏洞版接受了未签名管理员声明",
    );
  });
});
