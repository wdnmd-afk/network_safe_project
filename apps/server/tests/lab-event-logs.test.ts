import assert from "node:assert/strict";
import test from "node:test";

import {
  createLabEventLogsService,
  type LabEventLogsRepository,
} from "../src/services/lab-event-logs.js";

function createLogger() {
  const info: string[] = [];
  const warn: string[] = [];

  return {
    logger: {
      info: (message?: unknown) => {
        info.push(String(message));
      },
      warn: (message?: unknown) => {
        warn.push(String(message));
      },
    },
    info,
    warn,
  };
}

test("recordLabEvent prints a structured line and persists a sanitized event", async () => {
  const created: unknown[] = [];
  const repository: LabEventLogsRepository = {
    findLabIdByKey: async () => 9n,
    createLabEventLog: async (input) => {
      created.push(input);
    },
    findUserLabEventLogs: async () => [],
  };
  const { logger, info, warn } = createLogger();
  const service = createLabEventLogsService(repository, logger);

  const result = await service.recordLabEvent({
    traceId: "trace-csrf-vuln",
    userId: "12",
    labKey: "web.csrf",
    variantKey: "vuln",
    phase: "attack",
    eventType: "success",
    actorPerspective: "attacker",
    method: "POST",
    path: "/api/labs/web/csrf/vuln/transfer",
    inputSummary: {
      amount: 200,
      csrfToken: "real-token-should-not-be-saved",
      nested: {
        password: "secret",
        keep: "visible",
      },
    },
    decision: "accepted",
    signal: "csrf-transfer-accepted",
    statusCode: 200,
    message: "vulnerable transfer accepted",
    riskLevel: "high",
  });

  assert.deepEqual(result, {
    traceId: "trace-csrf-vuln",
    persisted: true,
    labId: "9",
  });
  assert.deepEqual(info, [
    '[LAB_EVENT] trace=trace-csrf-vuln lab=web.csrf variant=vuln phase=attack decision=accepted signal=csrf-transfer-accepted message="vulnerable transfer accepted"',
  ]);
  assert.deepEqual(warn, []);
  assert.deepEqual(created, [
    {
      traceId: "trace-csrf-vuln",
      userId: 12n,
      labKey: "web.csrf",
      variantKey: "vuln",
      phase: "attack",
      eventType: "success",
      actorPerspective: "attacker",
      method: "POST",
      path: "/api/labs/web/csrf/vuln/transfer",
      decision: "accepted",
      signal: "csrf-transfer-accepted",
      statusCode: 200,
      message: "vulnerable transfer accepted",
      riskLevel: "high",
      labId: 9n,
      inputSummaryJson: {
        amount: 200,
        csrfToken: "[redacted]",
        nested: {
          password: "[redacted]",
          keep: "visible",
        },
      },
    },
  ]);
});

test("recordLabEvent keeps the event when lab database record is not found", async () => {
  const created: unknown[] = [];
  const repository: LabEventLogsRepository = {
    findLabIdByKey: async () => null,
    createLabEventLog: async (input) => {
      created.push(input);
    },
    findUserLabEventLogs: async () => [],
  };
  const { logger } = createLogger();
  const service = createLabEventLogsService(repository, logger);

  const result = await service.recordLabEvent({
    traceId: "trace-no-lab",
    labKey: "web.future",
    variantKey: "vuln",
    phase: "attack",
    eventType: "request",
    actorPerspective: "attacker",
    method: "SCRIPT",
    path: "tools/lab-scripts/web/future/verify.ts",
    decision: "accepted",
    signal: "future-lab-event",
    statusCode: 0,
    message: "future lab event",
    riskLevel: "medium",
  });

  assert.deepEqual(result, {
    traceId: "trace-no-lab",
    persisted: true,
    labId: null,
  });
  assert.equal((created[0] as { labId: unknown }).labId, null);
});

test("recordLabEvent degrades when database write fails", async () => {
  const repository: LabEventLogsRepository = {
    findLabIdByKey: async () => {
      throw new Error("database unavailable");
    },
    createLabEventLog: async () => {
      throw new Error("create should not be called");
    },
    findUserLabEventLogs: async () => [],
  };
  const { logger, info, warn } = createLogger();
  const service = createLabEventLogsService(repository, logger);

  const result = await service.recordLabEvent({
    traceId: "trace-db-down",
    labKey: "web.csrf",
    variantKey: "fixed",
    phase: "defense",
    eventType: "blocked",
    actorPerspective: "attacker",
    method: "POST",
    path: "/api/labs/web/csrf/fixed/transfer",
    decision: "blocked",
    signal: "csrf-token-required",
    statusCode: 403,
    message: "blocked by csrf token validation",
    riskLevel: "medium",
  });

  assert.deepEqual(result, {
    traceId: "trace-db-down",
    persisted: false,
    labId: null,
    errorMessage: "database unavailable",
  });
  assert.equal(info.length, 1);
  assert.deepEqual(warn, [
    '[LAB_EVENT_STORE_FAILED] trace=trace-db-down lab=web.csrf error="database unavailable"',
  ]);
});

test("listUserLabEventLogs returns recent user event summaries", async () => {
  const repository: LabEventLogsRepository = {
    findLabIdByKey: async () => null,
    createLabEventLog: async () => {},
    findUserLabEventLogs: async (input) => {
      assert.deepEqual(input, {
        userId: "12",
        labKey: "web.csrf",
        phase: "defense",
        riskLevel: "medium",
        take: 5,
      });

      return [
        {
          traceId: "trace-csrf-fixed",
          labKey: "web.csrf",
          variantKey: "fixed",
          phase: "defense",
          eventType: "blocked",
          actorPerspective: "attacker",
          decision: "blocked",
          signal: "csrf-token-required",
          statusCode: 403,
          message: "blocked by csrf token validation",
          riskLevel: "medium",
          createdAt: new Date("2026-06-25T08:00:00.000Z"),
          lab: {
            title: "CSRF",
          },
        },
      ];
    },
  };
  const { logger } = createLogger();
  const service = createLabEventLogsService(repository, logger);

  const events = await service.listUserLabEventLogs({
    userId: "12",
    labKey: "web.csrf",
    phase: "defense",
    riskLevel: "medium",
    take: 5,
  });

  assert.deepEqual(events, [
    {
      traceId: "trace-csrf-fixed",
      labKey: "web.csrf",
      title: "CSRF",
      variantKey: "fixed",
      phase: "defense",
      eventType: "blocked",
      actorPerspective: "attacker",
      decision: "blocked",
      signal: "csrf-token-required",
      statusCode: 403,
      message: "blocked by csrf token validation",
      riskLevel: "medium",
      createdAt: "2026-06-25T08:00:00.000Z",
    },
  ]);
});
