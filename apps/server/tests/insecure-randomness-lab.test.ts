import assert from "node:assert/strict";
import { after, test } from "node:test";

import { createApp } from "../src/app.js";
import {
  createInsecureRandomnessLabService,
  insecureRandomnessDefenseSignal,
  insecureRandomnessNormalSignal,
  insecureRandomnessRiskSignal,
  insecureRandomnessScenarioKey,
} from "../src/services/insecure-randomness-lab.js";
import type { LabEventInput } from "../src/services/lab-event-logs.js";

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

test("insecure randomness service accepts the fixed low-entropy risk path", () => {
  const service = createInsecureRandomnessLabService();
  const result = service.evaluate({
    variantKey: "vuln",
    scenarioKey: insecureRandomnessScenarioKey,
    decisions: [
      "trust-timestamp-counter-pattern",
      "keep-predictable-token-source",
    ],
  });

  assert.equal(result.status, "ok");
  assert.equal(result.completed, true);
  assert.equal(result.decision, "accepted");
  assert.equal(result.signal, insecureRandomnessRiskSignal);
  assert.equal(result.steps.length, 2);
  assert.equal(result.recap.terminalOutcome, "risk");
  assert.equal(result.recap.outcomeCounts.risk, 2);
});

test("insecure randomness service blocks the weak random source", () => {
  const service = createInsecureRandomnessLabService();
  const result = service.evaluate({
    variantKey: "fixed",
    scenarioKey: insecureRandomnessScenarioKey,
    decisions: [
      "detect-low-entropy-pattern",
      "block-weak-token-generation",
    ],
  });

  assert.equal(result.status, "blocked");
  assert.equal(result.decision, "blocked");
  assert.equal(result.signal, insecureRandomnessDefenseSignal);
  assert.equal(result.recap.terminalOutcome, "fix");
  assert.equal(result.blockedReason, "weak-random-source-blocked");
});

test("insecure randomness service verifies the fixed CSPRNG policy", () => {
  const service = createInsecureRandomnessLabService();
  const result = service.evaluate({
    variantKey: "fixed",
    scenarioKey: insecureRandomnessScenarioKey,
    decisions: [
      "detect-low-entropy-pattern",
      "verify-csprng-token-policy",
    ],
  });

  assert.equal(result.status, "ok");
  assert.equal(result.decision, "accepted");
  assert.equal(result.signal, insecureRandomnessNormalSignal);
  assert.equal(result.recap.terminalOutcome, "normal");
});

test("insecure randomness service blocks unknown keys without echoing raw input", () => {
  const service = createInsecureRandomnessLabService();
  const rawScenario = "real-session-token-sequence";
  const rawOption = "predict-next-real-token";

  const unknownScenario = service.evaluate({
    variantKey: "vuln",
    scenarioKey: rawScenario,
    decisions: ["trust-timestamp-counter-pattern"],
  });
  const unknownOption = service.evaluate({
    variantKey: "vuln",
    scenarioKey: insecureRandomnessScenarioKey,
    decisions: [rawOption],
  });
  const trailingOption = service.evaluate({
    variantKey: "vuln",
    scenarioKey: insecureRandomnessScenarioKey,
    decisions: [
      "trust-timestamp-counter-pattern",
      "keep-predictable-token-source",
      rawOption,
    ],
  });

  assert.equal(unknownScenario.decision, "blocked");
  assert.equal(unknownScenario.scenarioKey, "blocked-scenario");
  assert.equal(JSON.stringify(unknownScenario).includes(rawScenario), false);

  assert.equal(unknownOption.decision, "blocked");
  assert.equal(
    unknownOption.signal,
    "crypto-insecure-randomness-boundary-blocked",
  );
  assert.equal(JSON.stringify(unknownOption).includes(rawOption), false);

  assert.equal(trailingOption.decision, "blocked");
  assert.equal(trailingOption.blockedReason, "decisions-after-terminal");
  assert.equal(JSON.stringify(trailingOption).includes(rawOption), false);
});

test("insecure randomness service blocks an incomplete decision path", () => {
  const service = createInsecureRandomnessLabService();
  const result = service.evaluate({
    variantKey: "vuln",
    scenarioKey: insecureRandomnessScenarioKey,
    decisions: ["trust-timestamp-counter-pattern"],
  });

  assert.equal(result.status, "blocked");
  assert.equal(result.completed, false);
  assert.equal(result.blockedReason, "path-incomplete");
});

test("insecure randomness workbench API exposes only fixed summaries", async () => {
  const app = createApp();
  const origin = await listen(app);

  const response = await fetch(
    `${origin}/api/labs/crypto/insecure-randomness/workbench`,
  );
  const body = (await response.json()) as {
    status: string;
    workbench: {
      id: string;
      defaultScenarioKey: string;
      cases: { steps: { key: string }[] }[];
    };
  };

  assert.equal(response.status, 200);
  assert.equal(body.status, "ok");
  assert.equal(body.workbench.id, "crypto.insecure-randomness");
  assert.equal(body.workbench.defaultScenarioKey, insecureRandomnessScenarioKey);
  assert.equal(body.workbench.cases[0]?.steps.length, 2);
});

test("insecure randomness evaluate API requires login", async () => {
  const app = createApp();
  const origin = await listen(app);

  const response = await fetch(
    `${origin}/api/labs/crypto/insecure-randomness/vuln/evaluate`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        scenarioKey: insecureRandomnessScenarioKey,
        decisions: [
          "trust-timestamp-counter-pattern",
          "keep-predictable-token-source",
        ],
      }),
    },
  );

  assert.equal(response.status, 401);
});

test("insecure randomness API records only a safe event summary", async () => {
  const eventCalls: LabEventInput[] = [];
  const app = createApp({
    authService: {
      login: async () => null,
      getCurrentUser: async () => demoUser,
    },
    labEventLogsService: {
      recordLabEvent: async (input) => {
        eventCalls.push(input);
        return {
          traceId: input.traceId ?? "generated-trace",
          persisted: true,
          labId: null,
        };
      },
      listUserLabEventLogs: async () => [],
    },
  });
  const origin = await listen(app);

  const response = await fetch(
    `${origin}/api/labs/crypto/insecure-randomness/vuln/evaluate`,
    {
      method: "POST",
      headers: {
        authorization: "Bearer local-session-token",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        scenarioKey: insecureRandomnessScenarioKey,
        decisions: [
          "trust-timestamp-counter-pattern",
          "keep-predictable-token-source",
        ],
        token: "real-session-token-value",
        secret: "real-signing-secret",
        seed: "real-random-seed",
        timestamp: 1_754_387_200_000,
        counter: 42,
        userId: "real-user-42",
      }),
    },
  );
  const body = (await response.json()) as {
    status: string;
    result: { labKey: string; signal: string };
  };

  assert.equal(response.status, 200);
  assert.equal(body.result.labKey, "crypto.insecure-randomness");
  assert.equal(body.result.signal, insecureRandomnessRiskSignal);
  assert.equal(eventCalls.length, 1);

  const serialized = JSON.stringify(eventCalls[0]);
  assert.equal(serialized.includes("real-session-token-value"), false);
  assert.equal(serialized.includes("real-signing-secret"), false);
  assert.equal(serialized.includes("real-random-seed"), false);
  assert.equal(serialized.includes("real-user-42"), false);
  assert.equal(serialized.includes("1754387200000"), false);
});

test("insecure randomness API returns 403 on the defense path", async () => {
  const app = createApp({
    authService: {
      login: async () => null,
      getCurrentUser: async () => demoUser,
    },
    labEventLogsService: {
      recordLabEvent: async (input) => ({
        traceId: input.traceId ?? "generated-trace",
        persisted: true,
        labId: null,
      }),
      listUserLabEventLogs: async () => [],
    },
  });
  const origin = await listen(app);

  const response = await fetch(
    `${origin}/api/labs/crypto/insecure-randomness/fixed/evaluate`,
    {
      method: "POST",
      headers: {
        authorization: "Bearer local-session-token",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        scenarioKey: insecureRandomnessScenarioKey,
        decisions: [
          "detect-low-entropy-pattern",
          "block-weak-token-generation",
        ],
      }),
    },
  );

  assert.equal(response.status, 403);
});
