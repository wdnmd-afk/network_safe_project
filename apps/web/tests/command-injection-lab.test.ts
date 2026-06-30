import { describe, expect, it } from "vitest";

import type { CommandInjectionResult } from "../src/api/command-injection-lab";
import {
  attackCommandInjectionTarget,
  createCommandInjectionLearningProgress,
  createCommandInjectionVerificationRecord,
  formatCommandInjectionSignal,
  getCommandInjectionVariantConfig,
  normalCommandInjectionTarget,
} from "../src/labs/command-injection";

describe("命令注入纵向实验模型", () => {
  it("为漏洞版和修复版提供不同教学信号", () => {
    expect(getCommandInjectionVariantConfig("vuln")).toMatchObject({
      key: "vuln",
      badge: "虚拟运行器会解释受控连接符样例",
    });
    expect(getCommandInjectionVariantConfig("fixed")).toMatchObject({
      key: "fixed",
      badge: "允许列表任务与参数值隔离",
    });
  });

  it("生成进入实验时的学习进度载荷", () => {
    expect(
      createCommandInjectionLearningProgress(
        getCommandInjectionVariantConfig("vuln"),
      ),
    ).toEqual({
      variantKey: "vuln",
      status: "in-progress",
      notes: "进入 命令注入漏洞版",
    });
  });

  it("生成漏洞版和修复版验证记录载荷", () => {
    const vulnerableResult: CommandInjectionResult = {
      status: "ok",
      variantKey: "vuln",
      taskKey: "cache-status",
      target: attackCommandInjectionTarget,
      inspection: {
        targetLength: attackCommandInjectionTarget.length,
        containsCommandSeparator: true,
        detectedOperator: "and",
        matchedControlledSample: true,
        allowedTask: true,
      },
      virtualSteps: [
        {
          label: "缓存节点状态",
          output: "cache ok",
          injected: false,
        },
        {
          label: "额外虚拟调试信息",
          output: "debug note",
          injected: true,
        },
      ],
      signal: "command-injection-virtual-command-executed",
      decision: "accepted",
      message: "virtual injected step",
      nextStep: "compare fixed",
    };
    const fixedResult: CommandInjectionResult = {
      ...vulnerableResult,
      status: "blocked",
      variantKey: "fixed",
      virtualSteps: [],
      signal: "command-injection-allowlist-blocked",
      decision: "blocked",
      blockedReason: "command-operator-detected",
    };

    expect(
      createCommandInjectionVerificationRecord(
        getCommandInjectionVariantConfig("vuln"),
        vulnerableResult,
      ),
    ).toEqual({
      variantKey: "vuln",
      result: "passed",
      summary: "漏洞版接受了受控命令连接符样例，并返回虚拟额外步骤。",
      details: {
        signal: "command-injection-virtual-command-executed",
        detectedOperator: "and",
        matchedControlledSample: true,
      },
    });
    expect(
      createCommandInjectionVerificationRecord(
        getCommandInjectionVariantConfig("fixed"),
        fixedResult,
      ),
    ).toEqual({
      variantKey: "fixed",
      result: "passed",
      summary: "修复版检测到命令连接符，并通过允许列表边界阻断请求。",
      details: {
        signal: "command-injection-allowlist-blocked",
        detectedOperator: "and",
        matchedControlledSample: true,
      },
    });
  });

  it("暴露本机受控目标样例与信号文案", () => {
    expect(normalCommandInjectionTarget).toBe("storefront-cache");
    expect(attackCommandInjectionTarget).toBe(
      "storefront-cache && reveal-debug-note",
    );
    expect(
      formatCommandInjectionSignal(
        "command-injection-virtual-command-executed",
      ),
    ).toBe("漏洞版触发虚拟额外步骤");
  });
});
