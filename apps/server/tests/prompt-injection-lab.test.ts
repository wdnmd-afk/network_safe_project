import assert from "node:assert/strict";
import { after, test } from "node:test";

import { createApp } from "../src/app.js";
import type { LabEventInput } from "../src/services/lab-event-logs.js";
import {
  createPromptInjectionLabService,
  promptInjectionDefaultDefensePolicyKey,
  promptInjectionDefaultInstructionSourceKey,
  promptInjectionDefaultScenarioKey,
  type PromptInjectionResult,
} from "../src/services/prompt-injection-lab.js";

const demoUser = {
  id: "1",
  username: "demo_user",
  displayName: "演示用户",
  role: "member",
  status: "active",
};

async function listen(app: ReturnType<typeof createApp>) {
  const server = app.listen(0);
  const address = server.address();

  assert.ok(address && typeof address === "object");

  after(() => {
    server.close();
  });

  return `http://127.0.0.1:${address.port}`;
}

test("prompt injection service exposes deterministic vulnerable routing", async () => {
  const service = createPromptInjectionLabService();

  const result = await service.evaluateRoute({
    userId: "1",
    variantKey: "vuln",
    scenarioKey: promptInjectionDefaultScenarioKey,
    instructionSourceKey: promptInjectionDefaultInstructionSourceKey,
    defensePolicyKey: promptInjectionDefaultDefensePolicyKey,
  });

  assert.equal(result.status, "ok");
  assert.equal(result.signal, "prompt-injection-retrieval-poisoning-visible");
  assert.equal(result.decision, "accepted");
  assert.equal(result.routing.instructionPriority, "confused");
  assert.equal(result.routing.outputPolicyStatus, "missing");
  assert.equal(result.routing.matchedControlledSample, true);
  assert.equal(JSON.stringify(result).includes("systemPrompt"), false);
  assert.equal(JSON.stringify(result).includes("apiKey"), false);
  assert.equal(JSON.stringify(result).includes("raw-freeform-text"), false);
});

test("prompt injection service blocks risky sample in fixed variant", async () => {
  const service = createPromptInjectionLabService();

  const result = await service.evaluateRoute({
    userId: "1",
    variantKey: "fixed",
    scenarioKey: promptInjectionDefaultScenarioKey,
    instructionSourceKey: promptInjectionDefaultInstructionSourceKey,
    defensePolicyKey: "retrieval-isolation",
  });

  assert.equal(result.status, "blocked");
  assert.equal(result.signal, "prompt-injection-policy-guardrail-applied");
  assert.equal(result.decision, "blocked");
  assert.equal(result.blockedReason, "policy-guardrail-applied");
  assert.equal(result.routing.instructionPriority, "isolated");
  assert.equal(result.routing.outputPolicyStatus, "blocked");
  assert.equal(result.policyAudit.blockedByPolicy, true);
});

test("prompt injection service blocks fixed tool request through allowlist", async () => {
  const service = createPromptInjectionLabService();

  const result = await service.evaluateRoute({
    userId: "1",
    variantKey: "fixed",
    scenarioKey: "tool-assistant",
    instructionSourceKey: "tool-request-note",
    defensePolicyKey: "tool-allowlist",
  });

  assert.equal(result.status, "blocked");
  assert.equal(result.signal, "prompt-injection-tool-request-blocked");
  assert.equal(result.routing.toolRequestStatus, "blocked");
  assert.equal(result.policyAudit.toolAllowlisted, true);
});

test("prompt injection service keeps safe document question available", async () => {
  const service = createPromptInjectionLabService();

  const result = await service.evaluateRoute({
    userId: "1",
    variantKey: "fixed",
    scenarioKey: "document-qa",
    instructionSourceKey: "user-followup",
    defensePolicyKey: "layered-instructions",
  });

  assert.equal(result.status, "ok");
  assert.equal(result.signal, "prompt-injection-safe-answer-returned");
  assert.equal(result.decision, "accepted");
  assert.equal(result.routing.riskCategory, "safe-reference");
  assert.equal(result.policyAudit.outputPolicyApplied, true);
});

test("prompt injection service rejects unknown scenario without echoing raw input", async () => {
  const service = createPromptInjectionLabService();
  const rawScenario = "raw-prompt-lab";

  const result = await service.evaluateRoute({
    userId: "1",
    variantKey: "vuln",
    scenarioKey: rawScenario,
    instructionSourceKey: promptInjectionDefaultInstructionSourceKey,
    defensePolicyKey: promptInjectionDefaultDefensePolicyKey,
  });

  assert.equal(result.status, "blocked");
  assert.equal(result.signal, "prompt-injection-sample-blocked");
  assert.equal(result.decision, "blocked");
  assert.equal(result.blockedReason, "scenario-not-allowed");
  assert.equal(result.scenarioKey, "blocked-scenario");
  assert.equal(JSON.stringify(result).includes(rawScenario), false);
});

test("POST /api/labs/ai/prompt-injection/:variant/evaluate requires login", async () => {
  const app = createApp();
  const origin = await listen(app);

  const response = await fetch(
    `${origin}/api/labs/ai/prompt-injection/vuln/evaluate`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        scenarioKey: promptInjectionDefaultScenarioKey,
        instructionSourceKey: promptInjectionDefaultInstructionSourceKey,
        defensePolicyKey: promptInjectionDefaultDefensePolicyKey,
      }),
    },
  );
  const body = (await response.json()) as {
    status: string;
    message: string;
  };

  assert.equal(response.status, 401);
  assert.deepEqual(body, {
    status: "error",
    message: "missing session token",
  });
});

test("POST /api/labs/ai/prompt-injection/vuln/evaluate records safe summary", async () => {
  const labEventLogCalls: LabEventInput[] = [];
  const app = createApp({
    authService: {
      login: async () => null,
      getCurrentUser: async (token: string) =>
        token === "local-session-token" ? demoUser : null,
    },
    labEventLogsService: {
      recordLabEvent: async (input: LabEventInput) => {
        labEventLogCalls.push(input);

        return {
          traceId: input.traceId ?? "generated-trace",
          persisted: true,
          labId: "22",
        };
      },
      listUserLabEventLogs: async () => [],
    },
  });
  const origin = await listen(app);

  const response = await fetch(
    `${origin}/api/labs/ai/prompt-injection/vuln/evaluate`,
    {
      method: "POST",
      headers: {
        authorization: "Bearer local-session-token",
        "content-type": "application/json",
        "x-lab-trace-id": "trace-prompt-injection-vuln",
      },
      body: JSON.stringify({
        scenarioKey: promptInjectionDefaultScenarioKey,
        instructionSourceKey: promptInjectionDefaultInstructionSourceKey,
        defensePolicyKey: promptInjectionDefaultDefensePolicyKey,
        prompt: "raw-freeform-text-should-not-appear",
        systemPrompt: "private-system-summary-should-not-appear",
        apiKey: "secret-key-should-not-appear",
        url: "https://example.invalid/should-not-appear",
        target: "external-target-should-not-appear",
      }),
    },
  );
  const body = (await response.json()) as {
    status: string;
    result: PromptInjectionResult;
  };

  assert.equal(response.status, 200);
  assert.equal(body.status, "ok");
  assert.equal(body.result.signal, "prompt-injection-retrieval-poisoning-visible");
  assert.deepEqual(labEventLogCalls, [
    {
      traceId: "trace-prompt-injection-vuln",
      userId: "1",
      labKey: "ai.prompt-injection",
      variantKey: "vuln",
      phase: "attack",
      eventType: "success",
      actorPerspective: "attacker",
      method: "POST",
      path: "/api/labs/ai/prompt-injection/vuln/evaluate",
      inputSummary: {
        scenarioKey: "support-kb",
        instructionSourceKey: "retrieved-note",
        defensePolicyKey: "none",
        inputLength: 164,
        riskCategory: "retrieval-contamination",
        matchedControlledSample: true,
        instructionPriority: "confused",
        toolRequestStatus: "not-requested",
        outputPolicyStatus: "missing",
        signal: "prompt-injection-retrieval-poisoning-visible",
      },
      decision: "accepted",
      signal: "prompt-injection-retrieval-poisoning-visible",
      statusCode: 200,
      message: body.result.message,
      riskLevel: "high",
    },
  ]);
  assert.equal(
    JSON.stringify(labEventLogCalls[0]?.inputSummary).includes(
      "raw-freeform-text-should-not-appear",
    ),
    false,
  );
  assert.equal(
    JSON.stringify(labEventLogCalls[0]?.inputSummary).includes(
      "private-system-summary-should-not-appear",
    ),
    false,
  );
  assert.equal(
    JSON.stringify(labEventLogCalls[0]?.inputSummary).includes(
      "secret-key-should-not-appear",
    ),
    false,
  );
});

test("POST /api/labs/ai/prompt-injection/fixed/evaluate blocks risky sample", async () => {
  const labEventLogCalls: LabEventInput[] = [];
  const app = createApp({
    authService: {
      login: async () => null,
      getCurrentUser: async () => demoUser,
    },
    labEventLogsService: {
      recordLabEvent: async (input: LabEventInput) => {
        labEventLogCalls.push(input);

        return {
          traceId: input.traceId ?? "generated-trace",
          persisted: true,
          labId: "22",
        };
      },
      listUserLabEventLogs: async () => [],
    },
  });
  const origin = await listen(app);

  const response = await fetch(
    `${origin}/api/labs/ai/prompt-injection/fixed/evaluate`,
    {
      method: "POST",
      headers: {
        authorization: "Bearer local-session-token",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        scenarioKey: promptInjectionDefaultScenarioKey,
        instructionSourceKey: promptInjectionDefaultInstructionSourceKey,
        defensePolicyKey: "retrieval-isolation",
      }),
    },
  );
  const body = (await response.json()) as {
    status: string;
    result: PromptInjectionResult;
  };

  assert.equal(response.status, 403);
  assert.equal(body.status, "blocked");
  assert.equal(body.result.signal, "prompt-injection-policy-guardrail-applied");
  assert.deepEqual(labEventLogCalls[0], {
    traceId: undefined,
    userId: "1",
    labKey: "ai.prompt-injection",
    variantKey: "fixed",
    phase: "defense",
    eventType: "blocked",
    actorPerspective: "attacker",
    method: "POST",
    path: "/api/labs/ai/prompt-injection/fixed/evaluate",
    inputSummary: {
      scenarioKey: "support-kb",
      instructionSourceKey: "retrieved-note",
      defensePolicyKey: "retrieval-isolation",
      inputLength: 164,
      riskCategory: "retrieval-contamination",
      matchedControlledSample: true,
      instructionPriority: "isolated",
      toolRequestStatus: "not-requested",
      outputPolicyStatus: "blocked",
      signal: "prompt-injection-policy-guardrail-applied",
    },
    decision: "blocked",
    signal: "prompt-injection-policy-guardrail-applied",
    statusCode: 403,
    message: body.result.message,
    riskLevel: "medium",
  });
});

test("POST /api/labs/ai/prompt-injection/fixed/evaluate returns safe answer", async () => {
  const app = createApp({
    authService: {
      login: async () => null,
      getCurrentUser: async () => demoUser,
    },
    labEventLogsService: {
      recordLabEvent: async (input: LabEventInput) => ({
        traceId: input.traceId ?? "generated-trace",
        persisted: true,
        labId: "22",
      }),
      listUserLabEventLogs: async () => [],
    },
  });
  const origin = await listen(app);

  const response = await fetch(
    `${origin}/api/labs/ai/prompt-injection/fixed/evaluate`,
    {
      method: "POST",
      headers: {
        authorization: "Bearer local-session-token",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        scenarioKey: "document-qa",
        instructionSourceKey: "user-followup",
        defensePolicyKey: "layered-instructions",
      }),
    },
  );
  const body = (await response.json()) as {
    status: string;
    result: PromptInjectionResult;
  };

  assert.equal(response.status, 200);
  assert.equal(body.status, "ok");
  assert.equal(body.result.signal, "prompt-injection-safe-answer-returned");
  assert.equal(body.result.routing.riskCategory, "safe-reference");
});
