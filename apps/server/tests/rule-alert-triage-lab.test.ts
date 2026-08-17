import assert from "node:assert/strict";
import { after, test } from "node:test";

import { createApp } from "../src/app.js";
import {
  createRuleAlertTriageLabService,
  ruleAlertTriageDefenseSignal,
  ruleAlertTriageNormalSignal,
  ruleAlertTriageRiskSignal,
  ruleAlertTriageScenarioKey,
} from "../src/services/rule-alert-triage-lab.js";
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

test("rule alert triage workbench exposes fixed events and three rule analyses", () => {
  const workbench = createRuleAlertTriageLabService().getWorkbench();

  assert.equal(workbench.id, "detection.rule-alert-triage");
  assert.equal(workbench.defaultScenarioKey, ruleAlertTriageScenarioKey);
  assert.equal(workbench.dataset.events.length, 6);
  assert.equal(workbench.ruleAnalyses.length, 3);
  assert.deepEqual(
    workbench.ruleAnalyses.map((analysis) => ({
      key: analysis.ruleProfileKey,
      falsePositiveCount: analysis.falsePositiveCount,
      falseNegativeCount: analysis.falseNegativeCount,
    })),
    [
      {
        key: "broad-auth-failure-rule",
        falsePositiveCount: 1,
        falseNegativeCount: 3,
      },
      {
        key: "narrow-unsigned-process-rule",
        falsePositiveCount: 0,
        falseNegativeCount: 3,
      },
      {
        key: "correlated-auth-process-network-rule",
        falsePositiveCount: 0,
        falseNegativeCount: 0,
      },
    ],
  );
});

test("rule alert triage service accepts the alert dismissal risk path", () => {
  const result = createRuleAlertTriageLabService().evaluate({
    variantKey: "vuln",
    scenarioKey: ruleAlertTriageScenarioKey,
    decisions: [
      "trust-broad-single-signal-rule",
      "dismiss-correlated-alert-as-noise",
    ],
  });

  assert.equal(result.status, "ok");
  assert.equal(result.signal, ruleAlertTriageRiskSignal);
  assert.equal(result.recap.terminalOutcome, "risk");
  assert.equal(result.ruleAnalysis?.ruleProfileKey, "broad-auth-failure-rule");
  assert.equal(result.ruleAnalysis?.falsePositiveCount, 1);
  assert.equal(result.triage?.disposition, "dismissed-as-noise");
});

test("rule alert triage service escalates correlated evidence", () => {
  const result = createRuleAlertTriageLabService().evaluate({
    variantKey: "fixed",
    scenarioKey: ruleAlertTriageScenarioKey,
    decisions: [
      "correlate-multi-source-signals",
      "escalate-correlated-alert-for-containment",
    ],
  });

  assert.equal(result.status, "blocked");
  assert.equal(result.signal, ruleAlertTriageDefenseSignal);
  assert.equal(result.recap.terminalOutcome, "fix");
  assert.equal(result.ruleAnalysis?.precisionPercent, 100);
  assert.equal(result.ruleAnalysis?.recallPercent, 100);
  assert.equal(result.triage?.disposition, "escalated-for-containment");
});

test("rule alert triage service verifies known maintenance evidence", () => {
  const result = createRuleAlertTriageLabService().evaluate({
    variantKey: "fixed",
    scenarioKey: ruleAlertTriageScenarioKey,
    decisions: [
      "correlate-multi-source-signals",
      "close-known-maintenance-with-evidence",
    ],
  });

  assert.equal(result.status, "ok");
  assert.equal(result.signal, ruleAlertTriageNormalSignal);
  assert.equal(result.recap.terminalOutcome, "normal");
  assert.equal(result.triage?.disposition, "closed-known-maintenance");
});

test("rule alert triage service blocks unknown and incomplete paths without echo", () => {
  const service = createRuleAlertTriageLabService();
  const rawScenario = "real-siem-timeline";
  const rawOption = "run-external-query";
  const unknownScenario = service.evaluate({
    variantKey: "vuln",
    scenarioKey: rawScenario,
    decisions: ["trust-broad-single-signal-rule"],
  });
  const unknownOption = service.evaluate({
    variantKey: "vuln",
    scenarioKey: ruleAlertTriageScenarioKey,
    decisions: [rawOption],
  });
  const incomplete = service.evaluate({
    variantKey: "vuln",
    scenarioKey: ruleAlertTriageScenarioKey,
    decisions: ["trust-narrow-single-signal-rule"],
  });
  const trailing = service.evaluate({
    variantKey: "vuln",
    scenarioKey: ruleAlertTriageScenarioKey,
    decisions: [
      "trust-broad-single-signal-rule",
      "dismiss-correlated-alert-as-noise",
      rawOption,
    ],
  });

  assert.equal(unknownScenario.scenarioKey, "blocked-scenario");
  assert.equal(JSON.stringify(unknownScenario).includes(rawScenario), false);
  assert.equal(JSON.stringify(unknownOption).includes(rawOption), false);
  assert.equal(incomplete.blockedReason, "path-incomplete");
  assert.equal(trailing.blockedReason, "decisions-after-terminal");
  assert.equal(JSON.stringify(trailing).includes(rawOption), false);
});

test("rule alert triage workbench API uses the dedicated route", async () => {
  const origin = await listen(createApp());
  const response = await fetch(
    `${origin}/api/labs/detection/rule-alert-triage/workbench`,
  );
  const body = (await response.json()) as {
    status: string;
    workbench: {
      id: string;
      dataset: { key: string; events: unknown[] };
      ruleAnalyses: unknown[];
    };
  };

  assert.equal(response.status, 200);
  assert.equal(body.status, "ok");
  assert.equal(body.workbench.id, "detection.rule-alert-triage");
  assert.equal(body.workbench.dataset.key, ruleAlertTriageScenarioKey);
  assert.equal(body.workbench.dataset.events.length, 6);
  assert.equal(body.workbench.ruleAnalyses.length, 3);
});

test("rule alert triage evaluate API requires login", async () => {
  const origin = await listen(createApp());
  const response = await fetch(
    `${origin}/api/labs/detection/rule-alert-triage/vuln/evaluate`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        scenarioKey: ruleAlertTriageScenarioKey,
        decisions: [
          "trust-broad-single-signal-rule",
          "dismiss-correlated-alert-as-noise",
        ],
      }),
    },
  );

  assert.equal(response.status, 401);
});

test("rule alert triage API records only fixed keys and metric counts", async () => {
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
    `${origin}/api/labs/detection/rule-alert-triage/vuln/evaluate`,
    {
      method: "POST",
      headers: {
        authorization: "Bearer local-session-token",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        scenarioKey: ruleAlertTriageScenarioKey,
        decisions: [
          "trust-broad-single-signal-rule",
          "dismiss-correlated-alert-as-noise",
        ],
        query: "index=real-host source=real-siem",
        host: "real-host-name",
        account: "real-account-name",
        ip: "203.0.113.10",
        credential: "real-secret-value",
      }),
    },
  );

  const blockedResponse = await fetch(
    `${origin}/api/labs/detection/rule-alert-triage/vuln/evaluate`,
    {
      method: "POST",
      headers: {
        authorization: "Bearer local-session-token",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        scenarioKey: "real-siem-timeline",
        decisions: ["run-external-query"],
      }),
    },
  );

  assert.equal(response.status, 200);
  assert.equal(blockedResponse.status, 403);
  assert.equal(eventCalls.length, 2);

  const serialized = JSON.stringify(eventCalls);
  assert.equal(serialized.includes("fixed-auth-process-alert-timeline"), true);
  assert.equal(serialized.includes("broad-auth-failure-rule"), true);
  assert.equal(serialized.includes("real-host-name"), false);
  assert.equal(serialized.includes("real-account-name"), false);
  assert.equal(serialized.includes("203.0.113.10"), false);
  assert.equal(serialized.includes("real-secret-value"), false);
  assert.equal(serialized.includes("index=real-host"), false);
  assert.equal(serialized.includes("real-siem-timeline"), false);
  assert.equal(serialized.includes("run-external-query"), false);
});

test("rule alert triage API returns 403 for the defense escalation", async () => {
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
    `${origin}/api/labs/detection/rule-alert-triage/fixed/evaluate`,
    {
      method: "POST",
      headers: {
        authorization: "Bearer local-session-token",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        scenarioKey: ruleAlertTriageScenarioKey,
        decisions: [
          "correlate-multi-source-signals",
          "escalate-correlated-alert-for-containment",
        ],
      }),
    },
  );

  assert.equal(response.status, 403);
});
