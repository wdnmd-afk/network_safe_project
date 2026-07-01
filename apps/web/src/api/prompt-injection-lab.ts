export type PromptInjectionVariantKey = "vuln" | "fixed";

export type PromptInjectionScenarioKey =
  | "support-kb"
  | "tool-assistant"
  | "document-qa";

export type PromptInjectionInstructionSourceKey =
  | "retrieved-note"
  | "user-followup"
  | "tool-request-note";

export type PromptInjectionDefensePolicyKey =
  | "none"
  | "layered-instructions"
  | "retrieval-isolation"
  | "tool-allowlist";

export type PromptInjectionSignal =
  | "prompt-injection-instruction-overridden"
  | "prompt-injection-retrieval-poisoning-visible"
  | "prompt-injection-tool-request-exposed"
  | "prompt-injection-tool-request-blocked"
  | "prompt-injection-policy-guardrail-applied"
  | "prompt-injection-safe-answer-returned"
  | "prompt-injection-boundary-verified"
  | "prompt-injection-sample-blocked";

export type PromptInjectionInput = {
  scenarioKey: PromptInjectionScenarioKey;
  instructionSourceKey: PromptInjectionInstructionSourceKey;
  defensePolicyKey: PromptInjectionDefensePolicyKey;
};

export type PromptInjectionScenarioSummary = {
  scenarioKey: PromptInjectionScenarioKey;
  title: string;
  businessGoal: string;
  expectedPolicy: string;
  riskCategory: string;
  learningNotes: string;
};

export type PromptInjectionRouting = {
  inputLength: number;
  riskCategory: string;
  matchedControlledSample: boolean;
  instructionPriority: "confused" | "layered" | "isolated";
  toolRequestStatus:
    | "not-requested"
    | "requested"
    | "blocked"
    | "allowed-fixed-tool";
  outputPolicyStatus: "missing" | "applied" | "blocked";
};

export type PromptInjectionPolicyAudit = {
  layeredInstructions: boolean;
  retrievalIsolated: boolean;
  toolAllowlisted: boolean;
  outputPolicyApplied: boolean;
  blockedByPolicy: boolean;
  learningHint: string;
};

export type PromptInjectionResult = {
  status: "ok" | "blocked";
  variantKey: PromptInjectionVariantKey;
  scenarioKey: string;
  instructionSourceKey: string;
  defensePolicyKey: string;
  scenario: PromptInjectionScenarioSummary | null;
  routing: PromptInjectionRouting;
  policyAudit: PromptInjectionPolicyAudit;
  safeAnswer: string;
  signal: PromptInjectionSignal;
  decision: "accepted" | "blocked";
  message: string;
  nextStep: string;
  blockedReason?: string;
};

export type PromptInjectionResponse = {
  status: "ok" | "blocked";
  result: PromptInjectionResult;
};

async function readJson<T>(response: Response): Promise<T> {
  const body = (await response.json()) as T;

  if (!response.ok) {
    throw new Error(`request failed with status ${response.status}`);
  }

  return body;
}

export async function submitPromptInjectionObservation(
  variantKey: PromptInjectionVariantKey,
  token: string,
  input: PromptInjectionInput,
) {
  const response = await fetch(
    `/api/labs/ai/prompt-injection/${variantKey}/evaluate`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        scenarioKey: input.scenarioKey,
        instructionSourceKey: input.instructionSourceKey,
        defensePolicyKey: input.defensePolicyKey,
      }),
    },
  );

  if (
    response.status === 400 ||
    response.status === 403 ||
    response.status === 404
  ) {
    return (await response.json()) as PromptInjectionResponse;
  }

  return readJson<PromptInjectionResponse>(response);
}
