import assert from "node:assert/strict";
import { after, test } from "node:test";

import { createApp } from "../src/app.js";
import type { InfoDisclosureResult } from "../src/services/info-disclosure-lab.js";
import {
  createInfoDisclosureLabService,
} from "../src/services/info-disclosure-lab.js";
import type { LabEventInput } from "../src/services/lab-event-logs.js";

const demoUser = {
  id: "1",
  username: "demo_user",
  displayName: "演示用户",
  role: "member",
  status: "active",
};

const publicReportKey = "public-status";
const debugReportKey = "debug-diagnostics";

async function listen(app: ReturnType<typeof createApp>) {
  const server = app.listen(0);
  const address = server.address();

  assert.ok(address && typeof address === "object");

  after(() => {
    server.close();
  });

  return `http://127.0.0.1:${address.port}`;
}

test("info disclosure service returns public reports in both variants", async () => {
  const service = createInfoDisclosureLabService();
  const vulnerableResult = await service.readReport({
    userId: "1",
    variantKey: "vuln",
    reportKey: publicReportKey,
  });
  const fixedResult = await service.readReport({
    userId: "1",
    variantKey: "fixed",
    reportKey: publicReportKey,
  });

  assert.equal(vulnerableResult.status, "ok");
  assert.equal(
    vulnerableResult.signal,
    "info-disclosure-public-report-returned",
  );
  assert.equal(vulnerableResult.report?.reportType, "public");
  assert.equal(fixedResult.status, "ok");
  assert.equal(fixedResult.signal, "info-disclosure-public-report-returned");
});

test("info disclosure service exposes debug data in the vulnerable variant", async () => {
  const service = createInfoDisclosureLabService();

  const result = await service.readReport({
    userId: "1",
    variantKey: "vuln",
    reportKey: debugReportKey,
  });

  assert.equal(result.status, "ok");
  assert.equal(result.signal, "info-disclosure-debug-data-exposed");
  assert.equal(result.decision, "accepted");
  assert.equal(result.inspection.requestedSensitiveReport, true);
  assert.equal(result.report?.reportType, "debug");
  assert.equal(
    result.report.fields.every((field) => field.sensitive),
    true,
  );
});

test("info disclosure service blocks debug data in the fixed variant", async () => {
  const service = createInfoDisclosureLabService();

  const result = await service.readReport({
    userId: "1",
    variantKey: "fixed",
    reportKey: debugReportKey,
  });

  assert.equal(result.status, "blocked");
  assert.equal(result.signal, "info-disclosure-debug-data-blocked");
  assert.equal(result.decision, "blocked");
  assert.equal(result.blockedReason, "debug-report-not-public");
  assert.equal(result.report, null);
});

test("POST /api/labs/web/info-disclosure/:variant/report requires login", async () => {
  const app = createApp();
  const origin = await listen(app);

  const response = await fetch(
    `${origin}/api/labs/web/info-disclosure/vuln/report`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        reportKey: publicReportKey,
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

test("POST /api/labs/web/info-disclosure/vuln/report records debug report event logs", async () => {
  const labEventLogCalls: LabEventInput[] = [];
  const app = createApp({
    authService: {
      login: async () => null,
      getCurrentUser: async (token: string) =>
        token === "local-session-token" ? demoUser : null,
    },
    infoDisclosureLabService: {
      readReport: async (): Promise<InfoDisclosureResult> => ({
        status: "ok",
        variantKey: "vuln",
        reportKey: debugReportKey,
        inspection: {
          normalizedReportKey: debugReportKey,
          requestedSensitiveReport: true,
          allowedPublicReport: false,
          exposedFieldCount: 4,
          reportKeyLength: debugReportKey.length,
        },
        report: {
          key: debugReportKey,
          title: "内部调试诊断报告",
          reportType: "debug",
          summary: "debug training report",
          fields: [
            {
              label: "堆栈摘要",
              value: "training stack",
              sensitive: true,
            },
          ],
          isSensitive: true,
        },
        signal: "info-disclosure-debug-data-exposed",
        decision: "accepted",
        message: "debug data exposed",
        nextStep: "compare fixed variant",
      }),
    },
    labEventLogsService: {
      recordLabEvent: async (input: LabEventInput) => {
        labEventLogCalls.push(input);

        return {
          traceId: input.traceId ?? "generated-trace",
          persisted: true,
          labId: "7",
        };
      },
    },
  });
  const origin = await listen(app);

  const response = await fetch(
    `${origin}/api/labs/web/info-disclosure/vuln/report`,
    {
      method: "POST",
      headers: {
        authorization: "Bearer local-session-token",
        "content-type": "application/json",
        "x-lab-trace-id": "trace-info-disclosure-vuln",
      },
      body: JSON.stringify({
        reportKey: debugReportKey,
      }),
    },
  );
  const body = (await response.json()) as {
    status: string;
    result: InfoDisclosureResult;
  };

  assert.equal(response.status, 200);
  assert.equal(body.status, "ok");
  assert.equal(body.result.signal, "info-disclosure-debug-data-exposed");
  assert.deepEqual(labEventLogCalls, [
    {
      traceId: "trace-info-disclosure-vuln",
      userId: "1",
      labKey: "web.info-disclosure",
      variantKey: "vuln",
      phase: "attack",
      eventType: "success",
      actorPerspective: "attacker",
      method: "POST",
      path: "/api/labs/web/info-disclosure/vuln/report",
      inputSummary: {
        reportKeyLength: debugReportKey.length,
        reportKeyPreview: "controlled-debug-report-sample",
        normalizedReportKey: debugReportKey,
        requestedSensitiveReport: true,
        allowedPublicReport: false,
        exposedFieldCount: 4,
        signal: "info-disclosure-debug-data-exposed",
      },
      decision: "accepted",
      signal: "info-disclosure-debug-data-exposed",
      statusCode: 200,
      message: "debug data exposed",
      riskLevel: "high",
    },
  ]);
});

test("POST /api/labs/web/info-disclosure/fixed/report returns blocked response", async () => {
  const app = createApp({
    authService: {
      login: async () => null,
      getCurrentUser: async () => demoUser,
    },
    infoDisclosureLabService: {
      readReport: async (): Promise<InfoDisclosureResult> => ({
        status: "blocked",
        variantKey: "fixed",
        reportKey: debugReportKey,
        inspection: {
          normalizedReportKey: debugReportKey,
          requestedSensitiveReport: true,
          allowedPublicReport: false,
          exposedFieldCount: 4,
          reportKeyLength: debugReportKey.length,
        },
        report: null,
        signal: "info-disclosure-debug-data-blocked",
        decision: "blocked",
        message: "fixed variant blocked debug report",
        nextStep: "review redaction",
        blockedReason: "debug-report-not-public",
      }),
    },
    labEventLogsService: {
      recordLabEvent: async (input: LabEventInput) => ({
        traceId: input.traceId ?? "generated-trace",
        persisted: true,
        labId: "7",
      }),
    },
  });
  const origin = await listen(app);

  const response = await fetch(
    `${origin}/api/labs/web/info-disclosure/fixed/report`,
    {
      method: "POST",
      headers: {
        authorization: "Bearer local-session-token",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        reportKey: debugReportKey,
      }),
    },
  );
  const body = (await response.json()) as {
    status: string;
    result: InfoDisclosureResult;
  };

  assert.equal(response.status, 403);
  assert.equal(body.status, "blocked");
  assert.equal(body.result.signal, "info-disclosure-debug-data-blocked");
});
