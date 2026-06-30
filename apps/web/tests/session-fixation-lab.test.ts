import { describe, expect, it } from "vitest";

import type { SessionFixationResult } from "../src/api/session-fixation-lab";
import {
  attackPreLoginSessionIdSample,
  attackSessionSourceSample,
  createSessionFixationLearningProgress,
  createSessionFixationVerificationRecord,
  formatSessionFixationSignal,
  getSessionFixationVariantConfig,
  normalPreLoginSessionIdSample,
} from "../src/labs/session-fixation";

describe("会话固定纵向实验模型", () => {
  it("为漏洞版和修复版提供不同教学信号", () => {
    expect(getSessionFixationVariantConfig("vuln")).toMatchObject({
      key: "vuln",
      badge: "登录后继续使用客户端预登录会话 ID",
    });
    expect(getSessionFixationVariantConfig("fixed")).toMatchObject({
      key: "fixed",
      badge: "登录后由服务端轮换教学会话 ID",
    });
  });

  it("生成进入实验时的学习进度载荷", () => {
    expect(
      createSessionFixationLearningProgress(
        getSessionFixationVariantConfig("vuln"),
      ),
    ).toEqual({
      variantKey: "vuln",
      status: "in-progress",
      notes: "进入 会话固定漏洞版",
    });
  });

  it("生成漏洞版和修复版验证记录载荷", () => {
    const vulnerableResult: SessionFixationResult = {
      status: "ok",
      variantKey: "vuln",
      preLoginSessionId: attackPreLoginSessionIdSample,
      sessionSource: "external-link",
      teachingSession: {
        ownerUserId: "1",
        ownerUsername: "demo_user",
        sessionId: attackPreLoginSessionIdSample,
        source: "client",
        accessSummary: "teaching session only",
      },
      inspection: {
        preLoginSessionIdLength: attackPreLoginSessionIdSample.length,
        sessionSource: "external-link",
        attackerControlled: true,
        acceptedClientSessionId: true,
        rotatedSessionId: false,
        sessionIdChanged: false,
        currentUserId: "1",
        boundSessionIdLength: attackPreLoginSessionIdSample.length,
      },
      signal: "session-fixed-id-bound",
      decision: "accepted",
      message: "fixed id bound",
      nextStep: "compare fixed",
    };
    const fixedResult: SessionFixationResult = {
      ...vulnerableResult,
      variantKey: "fixed",
      teachingSession: {
        ...vulnerableResult.teachingSession,
        sessionId: "server-rotated-session-0001",
        source: "server",
      },
      inspection: {
        ...vulnerableResult.inspection,
        acceptedClientSessionId: false,
        rotatedSessionId: true,
        sessionIdChanged: true,
        boundSessionIdLength: "server-rotated-session-0001".length,
      },
      signal: "session-fixed-id-rotated",
      message: "session id rotated",
    };

    expect(
      createSessionFixationVerificationRecord(
        getSessionFixationVariantConfig("vuln"),
        vulnerableResult,
      ),
    ).toEqual({
      variantKey: "vuln",
      result: "passed",
      summary:
        "漏洞版把外部链接带来的固定教学会话 ID 绑定给当前用户，会话固定模拟成功。",
      details: {
        signal: "session-fixed-id-bound",
        preLoginSessionId: attackPreLoginSessionIdSample,
        sessionSource: "external-link",
        attackerControlled: true,
        acceptedClientSessionId: true,
        rotatedSessionId: false,
      },
    });
    expect(
      createSessionFixationVerificationRecord(
        getSessionFixationVariantConfig("fixed"),
        fixedResult,
      ),
    ).toEqual({
      variantKey: "fixed",
      result: "passed",
      summary:
        "修复版在登录后轮换教学会话 ID，外部链接带来的固定 ID 没有被绑定。",
      details: {
        signal: "session-fixed-id-rotated",
        preLoginSessionId: attackPreLoginSessionIdSample,
        sessionSource: "external-link",
        attackerControlled: true,
        acceptedClientSessionId: false,
        rotatedSessionId: true,
      },
    });
  });

  it("暴露本地受控会话样例与信号文案", () => {
    expect(normalPreLoginSessionIdSample).toBe("browser-prelogin-session-1024");
    expect(attackPreLoginSessionIdSample).toBe("attacker-fixed-session-9001");
    expect(attackSessionSourceSample).toBe("external-link");
    expect(formatSessionFixationSignal("session-fixed-id-bound")).toBe(
      "漏洞版绑定了攻击者已知会话 ID",
    );
  });
});
