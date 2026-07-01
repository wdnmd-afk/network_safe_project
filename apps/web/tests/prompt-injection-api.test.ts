import { afterEach, describe, expect, it, vi } from "vitest";

import { submitPromptInjectionObservation } from "../src/api/prompt-injection-lab";
import {
  defaultPromptInjectionInstructionSourceKey,
  defaultPromptInjectionScenarioKey,
  defaultPromptInjectionVulnerableDefensePolicyKey,
} from "../src/labs/prompt-injection";

describe("prompt injection lab api client", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("posts only fixed scenario, source and policy keys to the selected variant", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "ok",
          result: {
            status: "ok",
            variantKey: "vuln",
            scenarioKey: defaultPromptInjectionScenarioKey,
            instructionSourceKey: defaultPromptInjectionInstructionSourceKey,
            defensePolicyKey: defaultPromptInjectionVulnerableDefensePolicyKey,
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
              instructionPriority: "confused",
              toolRequestStatus: "not-requested",
              outputPolicyStatus: "missing",
            },
            policyAudit: {
              layeredInstructions: false,
              retrievalIsolated: false,
              toolAllowlisted: false,
              outputPolicyApplied: false,
              blockedByPolicy: false,
              learningHint: "漏洞版缺少有效边界。",
            },
            safeAnswer: "教学摘要",
            signal: "prompt-injection-retrieval-poisoning-visible",
            decision: "accepted",
            message: "routing visible",
            nextStep: "compare fixed",
          },
        }),
        {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        },
      ),
    );

    const result = await submitPromptInjectionObservation(
      "vuln",
      "local-session-token",
      {
        scenarioKey: defaultPromptInjectionScenarioKey,
        instructionSourceKey: defaultPromptInjectionInstructionSourceKey,
        defensePolicyKey: defaultPromptInjectionVulnerableDefensePolicyKey,
      },
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/labs/ai/prompt-injection/vuln/evaluate",
      {
        method: "POST",
        headers: {
          authorization: "Bearer local-session-token",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          scenarioKey: defaultPromptInjectionScenarioKey,
          instructionSourceKey: defaultPromptInjectionInstructionSourceKey,
          defensePolicyKey: defaultPromptInjectionVulnerableDefensePolicyKey,
        }),
      },
    );

    const requestBody = String(fetchMock.mock.calls[0]?.[1]?.body);

    expect(JSON.parse(requestBody)).toEqual({
      scenarioKey: defaultPromptInjectionScenarioKey,
      instructionSourceKey: defaultPromptInjectionInstructionSourceKey,
      defensePolicyKey: defaultPromptInjectionVulnerableDefensePolicyKey,
    });
    expect(requestBody).not.toContain("prompt");
    expect(requestBody).not.toContain("systemPrompt");
    expect(requestBody).not.toContain("apiKey");
    expect(requestBody).not.toContain("url");
    expect(requestBody).not.toContain("target");
    expect(requestBody).not.toContain("toolSchema");
    expect(result.result.signal).toBe(
      "prompt-injection-retrieval-poisoning-visible",
    );
  });

  it("returns blocked response body for controlled policy failures", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "blocked",
          result: {
            status: "blocked",
            variantKey: "fixed",
            scenarioKey: defaultPromptInjectionScenarioKey,
            instructionSourceKey: defaultPromptInjectionInstructionSourceKey,
            defensePolicyKey: "retrieval-isolation",
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
              instructionPriority: "isolated",
              toolRequestStatus: "not-requested",
              outputPolicyStatus: "blocked",
            },
            policyAudit: {
              layeredInstructions: true,
              retrievalIsolated: true,
              toolAllowlisted: true,
              outputPolicyApplied: true,
              blockedByPolicy: true,
              learningHint: "修复版阻断越界路由结果。",
            },
            safeAnswer: "已阻断越界教学样例。",
            signal: "prompt-injection-policy-guardrail-applied",
            decision: "blocked",
            message: "blocked",
            nextStep: "compare normal sample",
            blockedReason: "policy-guardrail-applied",
          },
        }),
        {
          status: 403,
          headers: {
            "content-type": "application/json",
          },
        },
      ),
    );

    const result = await submitPromptInjectionObservation(
      "fixed",
      "local-session-token",
      {
        scenarioKey: defaultPromptInjectionScenarioKey,
        instructionSourceKey: defaultPromptInjectionInstructionSourceKey,
        defensePolicyKey: "retrieval-isolation",
      },
    );

    expect(result.status).toBe("blocked");
    expect(result.result.signal).toBe(
      "prompt-injection-policy-guardrail-applied",
    );
  });
});
