import { describe, expect, it } from "vitest";

import type { PromptInjectionResult } from "../src/api/prompt-injection-lab";
import {
  createPromptInjectionLearningProgress,
  createPromptInjectionVerificationRecord,
  defaultPromptInjectionFixedDefensePolicyKey,
  defaultPromptInjectionInstructionSourceKey,
  defaultPromptInjectionScenarioKey,
  defaultPromptInjectionVulnerableDefensePolicyKey,
  formatPromptInjectionSignal,
  getDefaultPromptInjectionDefensePolicyKey,
  getPromptInjectionScenarioObservationRows,
  getPromptInjectionVariantConfig,
  promptInjectionDefensePolicyOptions,
  promptInjectionInstructionSourceOptions,
  promptInjectionReviewChecklist,
  promptInjectionScenarioOptions,
} from "../src/labs/prompt-injection";

function createPromptInjectionResult(
  variantKey: PromptInjectionResult["variantKey"],
  signal: PromptInjectionResult["signal"],
): PromptInjectionResult {
  const blocked =
    signal === "prompt-injection-policy-guardrail-applied" ||
    signal === "prompt-injection-tool-request-blocked";

  return {
    status: blocked ? "blocked" : "ok",
    variantKey,
    scenarioKey: defaultPromptInjectionScenarioKey,
    instructionSourceKey: defaultPromptInjectionInstructionSourceKey,
    defensePolicyKey: blocked
      ? defaultPromptInjectionFixedDefensePolicyKey
      : defaultPromptInjectionVulnerableDefensePolicyKey,
    scenario: {
      scenarioKey: defaultPromptInjectionScenarioKey,
      title: "客服知识库问答",
      businessGoal: "根据固定知识库摘要回答工单范围内的问题。",
      expectedPolicy: "answer-within-scope",
      riskCategory: "retrieval-contamination",
      learningNotes: "观察指令边界。",
    },
    routing: {
      inputLength: 164,
      riskCategory: "retrieval-contamination",
      matchedControlledSample: true,
      instructionPriority: blocked ? "isolated" : "confused",
      toolRequestStatus: "not-requested",
      outputPolicyStatus: blocked ? "blocked" : "missing",
    },
    policyAudit: {
      layeredInstructions: blocked,
      retrievalIsolated: blocked,
      toolAllowlisted: blocked,
      outputPolicyApplied: blocked,
      blockedByPolicy: blocked,
      learningHint: "观察固定样例策略状态。",
    },
    safeAnswer: blocked ? "已阻断越界教学样例。" : "教学摘要。",
    signal,
    decision: blocked ? "blocked" : "accepted",
    message: "prompt injection observation",
    nextStep: "compare variants",
    ...(blocked ? { blockedReason: "policy-guardrail-applied" } : {}),
  };
}

describe("Prompt 注入前端实验模型", () => {
  it("为漏洞版和修复版提供不同教学信号", () => {
    expect(getPromptInjectionVariantConfig("vuln")).toMatchObject({
      key: "vuln",
      perspective: "攻击方观察",
      badge: "固定外部内容、指令边界混淆和策略缺失",
    });
    expect(getPromptInjectionVariantConfig("fixed")).toMatchObject({
      key: "fixed",
      perspective: "防御方复盘",
      badge: "指令分层、检索隔离、工具允许列表和输出策略",
    });
  });

  it("暴露固定场景、固定来源和固定策略选项", () => {
    expect(defaultPromptInjectionScenarioKey).toBe("support-kb");
    expect(defaultPromptInjectionInstructionSourceKey).toBe("retrieved-note");
    expect(defaultPromptInjectionVulnerableDefensePolicyKey).toBe("none");
    expect(defaultPromptInjectionFixedDefensePolicyKey).toBe(
      "retrieval-isolation",
    );
    expect(getDefaultPromptInjectionDefensePolicyKey("vuln")).toBe("none");
    expect(getDefaultPromptInjectionDefensePolicyKey("fixed")).toBe(
      "retrieval-isolation",
    );
    expect(promptInjectionScenarioOptions.map((item) => item.key)).toEqual([
      "support-kb",
      "tool-assistant",
      "document-qa",
    ]);
    expect(
      promptInjectionInstructionSourceOptions.map((item) => item.key),
    ).toEqual(["retrieved-note", "user-followup", "tool-request-note"]);
    expect(promptInjectionDefensePolicyOptions.map((item) => item.key)).toEqual(
      [
        "none",
        "layered-instructions",
        "retrieval-isolation",
        "tool-allowlist",
      ],
    );
  });

  it("为不同变体生成固定样例观察说明", () => {
    const vulnerableRows = getPromptInjectionScenarioObservationRows("vuln");
    const fixedRows = getPromptInjectionScenarioObservationRows("fixed");

    expect(vulnerableRows).toHaveLength(3);
    expect(fixedRows).toHaveLength(3);
    expect(vulnerableRows[0]).toMatchObject({
      key: "support-kb",
      title: "客服知识库问答",
    });
    expect(vulnerableRows[0]!.focus).toContain("指令优先级");
    expect(fixedRows[0]!.focus).toContain("检索隔离");
  });

  it("生成进入实验时的学习进度载荷", () => {
    expect(
      createPromptInjectionLearningProgress(
        getPromptInjectionVariantConfig("vuln"),
      ),
    ).toEqual({
      variantKey: "vuln",
      status: "in-progress",
      notes: "进入 Prompt 注入漏洞版",
    });
  });

  it("生成漏洞版和修复版验证记录载荷", () => {
    const vulnerableResult = createPromptInjectionResult(
      "vuln",
      "prompt-injection-retrieval-poisoning-visible",
    );
    const fixedResult = createPromptInjectionResult(
      "fixed",
      "prompt-injection-policy-guardrail-applied",
    );

    expect(
      createPromptInjectionVerificationRecord(
        getPromptInjectionVariantConfig("vuln"),
        vulnerableResult,
      ),
    ).toEqual({
      variantKey: "vuln",
      result: "passed",
      summary: "漏洞版展示了固定 Prompt 注入样例中的指令边界风险信号。",
      details: {
        signal: "prompt-injection-retrieval-poisoning-visible",
        scenarioKey: "support-kb",
        instructionSourceKey: "retrieved-note",
        defensePolicyKey: "none",
        riskCategory: "retrieval-contamination",
        instructionPriority: "confused",
        toolRequestStatus: "not-requested",
        outputPolicyStatus: "missing",
        blockedByPolicy: false,
      },
    });
    expect(
      createPromptInjectionVerificationRecord(
        getPromptInjectionVariantConfig("fixed"),
        fixedResult,
      ),
    ).toEqual({
      variantKey: "fixed",
      result: "passed",
      summary: "修复版展示了固定 Prompt 注入样例的阻断或安全回答信号。",
      details: {
        signal: "prompt-injection-policy-guardrail-applied",
        scenarioKey: "support-kb",
        instructionSourceKey: "retrieved-note",
        defensePolicyKey: "retrieval-isolation",
        riskCategory: "retrieval-contamination",
        instructionPriority: "isolated",
        toolRequestStatus: "not-requested",
        outputPolicyStatus: "blocked",
        blockedByPolicy: true,
      },
    });
  });

  it("静态文案保持固定样例和无外部 AI 边界", () => {
    const combined = JSON.stringify({
      configs: [
        getPromptInjectionVariantConfig("vuln"),
        getPromptInjectionVariantConfig("fixed"),
      ],
      scenarios: promptInjectionScenarioOptions,
      sources: promptInjectionInstructionSourceOptions,
      policies: promptInjectionDefensePolicyOptions,
      checklist: promptInjectionReviewChecklist,
    });

    expect(
      formatPromptInjectionSignal(
        "prompt-injection-policy-guardrail-applied",
      ),
    ).toBe("修复版策略护栏已生效");
    expect(combined).toContain("固定样例");
    expect(combined).toContain("不调用外部 AI");
    expect(combined).not.toContain("systemPrompt");
    expect(combined).not.toContain("developerPrompt");
    expect(combined).not.toContain("apiKey");
    expect(combined).not.toContain("toolSchema");
    expect(combined).not.toContain("http://");
    expect(combined).not.toContain("https://");
  });
});
