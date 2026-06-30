import assert from "node:assert/strict";
import { after, test } from "node:test";

import { createApp } from "../src/app.js";
import {
  commandInjectionAttackTarget,
  commandInjectionNormalTarget,
  createCommandInjectionLabService,
  type CommandInjectionResult,
} from "../src/services/command-injection-lab.js";
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

test("command injection service completes normal virtual diagnostic tasks", async () => {
  const service = createCommandInjectionLabService();
  const result = await service.runDiagnostic({
    userId: "1",
    variantKey: "fixed",
    taskKey: "cache-status",
    target: commandInjectionNormalTarget,
  });

  assert.equal(result.status, "ok");
  assert.equal(result.signal, "command-injection-normal-task-completed");
  assert.equal(result.inspection.containsCommandSeparator, false);
  assert.equal(result.virtualSteps.length, 1);
  assert.equal(result.virtualSteps[0]?.injected, false);
});

test("command injection service returns virtual injected step in vulnerable variant", async () => {
  const service = createCommandInjectionLabService();
  const result = await service.runDiagnostic({
    userId: "1",
    variantKey: "vuln",
    taskKey: "cache-status",
    target: commandInjectionAttackTarget,
  });

  assert.equal(result.status, "ok");
  assert.equal(result.signal, "command-injection-virtual-command-executed");
  assert.equal(result.decision, "accepted");
  assert.equal(result.inspection.detectedOperator, "and");
  assert.equal(result.inspection.matchedControlledSample, true);
  assert.equal(result.virtualSteps.some((step) => step.injected), true);
});

test("command injection service blocks the same sample in fixed variant", async () => {
  const service = createCommandInjectionLabService();
  const result = await service.runDiagnostic({
    userId: "1",
    variantKey: "fixed",
    taskKey: "cache-status",
    target: commandInjectionAttackTarget,
  });

  assert.equal(result.status, "blocked");
  assert.equal(result.signal, "command-injection-allowlist-blocked");
  assert.equal(result.decision, "blocked");
  assert.equal(result.blockedReason, "command-operator-detected");
});

test("command injection service rejects unknown diagnostic tasks", async () => {
  const service = createCommandInjectionLabService();
  const result = await service.runDiagnostic({
    userId: "1",
    variantKey: "vuln",
    taskKey: "unknown-task",
    target: commandInjectionNormalTarget,
  });

  assert.equal(result.status, "failed");
  assert.equal(result.signal, "command-injection-task-not-found");
  assert.equal(result.decision, "failed");
});

test("POST /api/labs/web/command-injection/:variant/run requires login", async () => {
  const app = createApp();
  const origin = await listen(app);

  const response = await fetch(
    `${origin}/api/labs/web/command-injection/vuln/run`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        taskKey: "cache-status",
        target: commandInjectionNormalTarget,
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

test("POST /api/labs/web/command-injection/vuln/run records virtual injection event logs", async () => {
  const labEventLogCalls: LabEventInput[] = [];
  const app = createApp({
    authService: {
      login: async () => null,
      getCurrentUser: async (token: string) =>
        token === "local-session-token" ? demoUser : null,
    },
    commandInjectionLabService: {
      runDiagnostic: async (): Promise<CommandInjectionResult> => ({
        status: "ok",
        variantKey: "vuln",
        taskKey: "cache-status",
        target: commandInjectionAttackTarget,
        inspection: {
          targetLength: commandInjectionAttackTarget.length,
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
        message: "virtual injected step executed",
        nextStep: "compare fixed variant",
      }),
    },
    labEventLogsService: {
      recordLabEvent: async (input: LabEventInput) => {
        labEventLogCalls.push(input);

        return {
          traceId: input.traceId ?? "generated-trace",
          persisted: true,
          labId: "9",
        };
      },
      listUserLabEventLogs: async () => [],
    },
  });
  const origin = await listen(app);

  const response = await fetch(
    `${origin}/api/labs/web/command-injection/vuln/run`,
    {
      method: "POST",
      headers: {
        authorization: "Bearer local-session-token",
        "content-type": "application/json",
        "x-lab-trace-id": "trace-command-injection-vuln",
      },
      body: JSON.stringify({
        taskKey: "cache-status",
        target: commandInjectionAttackTarget,
      }),
    },
  );
  const body = (await response.json()) as {
    status: string;
    result: CommandInjectionResult;
  };

  assert.equal(response.status, 200);
  assert.equal(body.status, "ok");
  assert.equal(body.result.signal, "command-injection-virtual-command-executed");
  assert.deepEqual(labEventLogCalls, [
    {
      traceId: "trace-command-injection-vuln",
      userId: "1",
      labKey: "web.command-injection",
      variantKey: "vuln",
      phase: "attack",
      eventType: "success",
      actorPerspective: "attacker",
      method: "POST",
      path: "/api/labs/web/command-injection/vuln/run",
      inputSummary: {
        taskKey: "cache-status",
        targetLength: commandInjectionAttackTarget.length,
        targetPreview: "controlled-command-injection-sample",
        containsCommandSeparator: true,
        detectedOperator: "and",
        matchedControlledSample: true,
        allowedTask: true,
        signal: "command-injection-virtual-command-executed",
      },
      decision: "accepted",
      signal: "command-injection-virtual-command-executed",
      statusCode: 200,
      message: "virtual injected step executed",
      riskLevel: "critical",
    },
  ]);
  assert.equal(
    JSON.stringify(labEventLogCalls[0]?.inputSummary).includes(
      commandInjectionAttackTarget,
    ),
    false,
  );
});

test("POST /api/labs/web/command-injection/fixed/run returns blocked response", async () => {
  const app = createApp({
    authService: {
      login: async () => null,
      getCurrentUser: async (token: string) =>
        token === "local-session-token" ? demoUser : null,
    },
    labEventLogsService: {
      recordLabEvent: async (input: LabEventInput) => ({
        traceId: input.traceId ?? "generated-trace",
        persisted: true,
        labId: "9",
      }),
      listUserLabEventLogs: async () => [],
    },
  });
  const origin = await listen(app);

  const response = await fetch(
    `${origin}/api/labs/web/command-injection/fixed/run`,
    {
      method: "POST",
      headers: {
        authorization: "Bearer local-session-token",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        taskKey: "cache-status",
        target: commandInjectionAttackTarget,
      }),
    },
  );
  const body = (await response.json()) as {
    status: string;
    result: CommandInjectionResult;
  };

  assert.equal(response.status, 403);
  assert.equal(body.status, "blocked");
  assert.equal(body.result.signal, "command-injection-allowlist-blocked");
});
