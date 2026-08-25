import assert from "node:assert/strict";
import { after, test } from "node:test";

import { createApp } from "../src/app.js";
import { createPropertyAuthorizationLabService } from "../src/services/property-authorization-lab.js";
import { createRaceConditionLabService } from "../src/services/race-condition-lab.js";
import { createSecretLifecycleAuditLabService } from "../src/services/secret-lifecycle-audit-lab.js";
import { createWindowsEventLogTriageLabService } from "../src/services/windows-event-log-triage-lab.js";
import type { LabEventInput } from "../src/services/lab-event-logs.js";

const scenarios = [
  {
    id: "api.property-authorization", category: "api", scene: "property-authorization", scenarioKey: "fixed-profile-update-dto",
    service: createPropertyAuthorizationLabService(),
    riskPath: ["bind-all-client-fields", "persist-server-owned-fields"], defensePath: ["enforce-field-allowlist-and-server-ownership", "block-server-owned-field-update"], normalPath: ["enforce-field-allowlist-and-server-ownership", "allow-display-name-update"],
    signals: ["api-property-authorization-risk-accepted", "api-property-authorization-defense-blocked", "api-property-authorization-normal-verified"],
  },
  {
    id: "business-logic.race-condition", category: "business-logic", scene: "race-condition", scenarioKey: "fixed-single-stock-double-request",
    service: createRaceConditionLabService(),
    riskPath: ["read-then-write-without-version", "accept-both-stock-decrements"], defensePath: ["enforce-idempotency-and-version-check", "block-duplicate-or-stale-request"], normalPath: ["enforce-idempotency-and-version-check", "allow-single-unique-request"],
    signals: ["business-logic-race-condition-risk-accepted", "business-logic-race-condition-defense-blocked", "business-logic-race-condition-normal-verified"],
  },
  {
    id: "crypto.secret-lifecycle-audit", category: "crypto", scene: "secret-lifecycle-audit", scenarioKey: "fixed-secret-exposure-and-key-ledger",
    service: createSecretLifecycleAuditLabService(),
    riskPath: ["publish-without-secret-audit", "continue-with-exposed-static-key"], defensePath: ["scan-fixed-artifacts-and-enforce-lifecycle", "revoke-rotate-and-inject-secret"], normalPath: ["scan-fixed-artifacts-and-enforce-lifecycle", "publish-with-active-version-only"],
    signals: ["crypto-secret-lifecycle-audit-risk-accepted", "crypto-secret-lifecycle-audit-defense-blocked", "crypto-secret-lifecycle-audit-normal-verified"],
  },
  {
    id: "host.event-log-triage", category: "host", scene: "event-log-triage", scenarioKey: "fixed-windows-identity-service-timeline",
    service: createWindowsEventLogTriageLabService(),
    riskPath: ["trust-single-event-in-isolation", "dismiss-identity-service-chain"], defensePath: ["correlate-identity-and-service-events", "escalate-correlated-host-timeline"], normalPath: ["correlate-identity-and-service-events", "close-registered-maintenance-baseline"],
    signals: ["host-event-log-triage-risk-accepted", "host-event-log-triage-defense-blocked", "host-event-log-triage-normal-verified"],
  },
] as const;

const demoUser = { id: "1", username: "demo_user", displayName: "演示用户", role: "member", status: "active" };

test("four controlled decision labs expose deterministic risk, defense and normal paths", () => {
  for (const scenario of scenarios) {
    const risk = scenario.service.evaluate({ variantKey: "vuln", scenarioKey: scenario.scenarioKey, decisions: [...scenario.riskPath] });
    const defense = scenario.service.evaluate({ variantKey: "fixed", scenarioKey: scenario.scenarioKey, decisions: [...scenario.defensePath] });
    const normal = scenario.service.evaluate({ variantKey: "fixed", scenarioKey: scenario.scenarioKey, decisions: [...scenario.normalPath] });
    assert.equal(risk.signal, scenario.signals[0]);
    assert.equal(risk.decision, "accepted");
    assert.equal(defense.signal, scenario.signals[1]);
    assert.equal(defense.decision, "blocked");
    assert.equal(normal.signal, scenario.signals[2]);
    assert.equal(normal.decision, "accepted");
  }
});

test("controlled decision labs block unknown input without echoing it", () => {
  const rawValue = "real-user-or-host-value";
  for (const scenario of scenarios) {
    const result = scenario.service.evaluate({ variantKey: "vuln", scenarioKey: rawValue, decisions: [...scenario.riskPath] });
    assert.equal(result.decision, "blocked");
    assert.equal(JSON.stringify(result).includes(rawValue), false);
  }
});

test("controlled decision APIs expose workbenches and record only safe summaries", async () => {
  const events: LabEventInput[] = [];
  const app = createApp({
    authService: { login: async () => null, getCurrentUser: async () => demoUser },
    labEventLogsService: {
      recordLabEvent: async (input) => { events.push(input); return { traceId: input.traceId ?? "trace" }; },
      listUserLabEventLogs: async () => [],
    },
  });
  const server = app.listen(0);
  after(() => {
    server.close();
  });
  const address = server.address();
  assert.ok(address && typeof address === "object");
  const origin = `http://127.0.0.1:${address.port}`;

  for (const scenario of scenarios) {
    const workbenchResponse = await fetch(`${origin}/api/labs/${scenario.category}/${scenario.scene}/workbench`);
    const workbenchBody = (await workbenchResponse.json()) as { workbench: { id: string } };
    assert.equal(workbenchResponse.status, 200);
    assert.equal(workbenchBody.workbench.id, scenario.id);

    const evaluationResponse = await fetch(`${origin}/api/labs/${scenario.category}/${scenario.scene}/vuln/evaluate`, {
      method: "POST",
      headers: { authorization: "Bearer local-session-token", "content-type": "application/json" },
      body: JSON.stringify({ scenarioKey: scenario.scenarioKey, decisions: scenario.riskPath }),
    });
    assert.equal(evaluationResponse.status, 200);
  }

  assert.equal(events.length, 4);
  assert.equal(
    events.every(
      (event) =>
        (event.inputSummary as { stepCount?: number } | undefined)?.stepCount === 2,
    ),
    true,
  );
  assert.equal(JSON.stringify(events).includes("real-user-or-host-value"), false);
});
