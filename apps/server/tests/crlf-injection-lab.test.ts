import assert from "node:assert/strict";
import { after, test } from "node:test";

import { createApp } from "../src/app.js";
import type { LabEventInput } from "../src/services/lab-event-logs.js";
import {
  createCrlfInjectionLabService,
  crlfInjectionControlledFileName,
  crlfInjectionNormalDispositionType,
  crlfInjectionNormalFileName,
  crlfInjectionNormalHeaderTemplate,
  type CrlfInjectionPreviewResult,
} from "../src/services/crlf-injection-lab.js";

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

test("crlf injection service previews safe virtual headers", async () => {
  const service = createCrlfInjectionLabService();
  const result = await service.previewHeaders({
    userId: "1",
    variantKey: "fixed",
    headerTemplate: crlfInjectionNormalHeaderTemplate,
    fileName: crlfInjectionNormalFileName,
    dispositionType: crlfInjectionNormalDispositionType,
  });

  assert.equal(result.status, "ok");
  assert.equal(result.signal, "crlf-injection-safe-header-previewed");
  assert.equal(result.decision, "accepted");
  assert.equal(result.inspection.detectedControlChars.length, 0);
  assert.equal(result.headers.length, 1);
  assert.equal(result.headers[0]?.name, "Content-Disposition");
  assert.equal(result.headers[0]?.polluted, false);
  assert.equal(JSON.stringify(result).includes(crlfInjectionNormalFileName), false);
});

test("crlf injection service creates virtual injected header in vulnerable variant", async () => {
  const service = createCrlfInjectionLabService();
  const result = await service.previewHeaders({
    userId: "1",
    variantKey: "vuln",
    headerTemplate: crlfInjectionNormalHeaderTemplate,
    fileName: crlfInjectionControlledFileName,
    dispositionType: crlfInjectionNormalDispositionType,
  });

  assert.equal(result.status, "ok");
  assert.equal(result.signal, "crlf-injection-virtual-header-injected");
  assert.equal(result.decision, "accepted");
  assert.deepEqual(result.inspection.detectedControlChars, ["cr", "lf"]);
  assert.equal(result.inspection.matchedControlledSample, true);
  assert.equal(result.inspection.pollutedHeaderCount, 2);
  assert.equal(
    result.headers.some((header) => header.source === "virtual-injected"),
    true,
  );
  assert.equal(JSON.stringify(result).includes(crlfInjectionControlledFileName), false);
  assert.equal(JSON.stringify(result).includes("exposed"), false);
});

test("crlf injection service blocks controlled sample in fixed variant", async () => {
  const service = createCrlfInjectionLabService();
  const result = await service.previewHeaders({
    userId: "1",
    variantKey: "fixed",
    headerTemplate: crlfInjectionNormalHeaderTemplate,
    fileName: crlfInjectionControlledFileName,
    dispositionType: crlfInjectionNormalDispositionType,
  });

  assert.equal(result.status, "blocked");
  assert.equal(result.signal, "crlf-injection-control-chars-blocked");
  assert.equal(result.decision, "blocked");
  assert.equal(result.blockedReason, "control-chars-blocked");
  assert.equal(result.headers.length, 0);
});

test("crlf injection service rejects unknown templates", async () => {
  const service = createCrlfInjectionLabService();
  const result = await service.previewHeaders({
    userId: "1",
    variantKey: "vuln",
    headerTemplate: "raw-header",
    fileName: crlfInjectionNormalFileName,
    dispositionType: crlfInjectionNormalDispositionType,
  });

  assert.equal(result.status, "failed");
  assert.equal(result.signal, "crlf-injection-template-not-found");
  assert.equal(result.decision, "failed");
  assert.equal(result.blockedReason, "header-template-not-allowed");
});

test("POST /api/labs/web/crlf-injection/:variant/preview requires login", async () => {
  const app = createApp();
  const origin = await listen(app);

  const response = await fetch(
    `${origin}/api/labs/web/crlf-injection/vuln/preview`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        headerTemplate: crlfInjectionNormalHeaderTemplate,
        fileName: crlfInjectionNormalFileName,
        dispositionType: crlfInjectionNormalDispositionType,
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

test("POST /api/labs/web/crlf-injection/vuln/preview records safe summary without file name", async () => {
  const labEventLogCalls: LabEventInput[] = [];
  const app = createApp({
    authService: {
      login: async () => null,
      getCurrentUser: async (token: string) =>
        token === "local-session-token" ? demoUser : null,
    },
    crlfInjectionLabService: {
      previewHeaders: async (): Promise<CrlfInjectionPreviewResult> => ({
        status: "ok",
        variantKey: "vuln",
        headerTemplate: crlfInjectionNormalHeaderTemplate,
        dispositionType: crlfInjectionNormalDispositionType,
        fileNameLength: crlfInjectionControlledFileName.length,
        fileNamePreview: "controlled-crlf-file-name",
        headers: [
          {
            name: "Content-Disposition",
            valuePreview: "attachment; filename=\"controlled-crlf-file-name\"",
            source: "user-input",
            polluted: true,
          },
          {
            name: "X-Lab-Debug",
            valuePreview: "virtual teaching header",
            source: "virtual-injected",
            polluted: true,
          },
        ],
        inspection: {
          headerTemplateAllowed: true,
          dispositionTypeAllowed: true,
          fileNameLength: crlfInjectionControlledFileName.length,
          fileNamePreview: "controlled-crlf-file-name",
          detectedControlChars: ["cr", "lf"],
          matchedControlledSample: true,
          virtualHeaderCount: 2,
          pollutedHeaderCount: 2,
        },
        signal: "crlf-injection-virtual-header-injected",
        decision: "accepted",
        message: "virtual header injected",
        nextStep: "compare fixed variant",
      }),
    },
    labEventLogsService: {
      recordLabEvent: async (input: LabEventInput) => {
        labEventLogCalls.push(input);

        return {
          traceId: input.traceId ?? "generated-trace",
          persisted: true,
          labId: "12",
        };
      },
      listUserLabEventLogs: async () => [],
    },
  });
  const origin = await listen(app);

  const response = await fetch(
    `${origin}/api/labs/web/crlf-injection/vuln/preview`,
    {
      method: "POST",
      headers: {
        authorization: "Bearer local-session-token",
        "content-type": "application/json",
        "x-lab-trace-id": "trace-crlf-vuln",
      },
      body: JSON.stringify({
        headerTemplate: crlfInjectionNormalHeaderTemplate,
        fileName: crlfInjectionControlledFileName,
        dispositionType: crlfInjectionNormalDispositionType,
      }),
    },
  );
  const body = (await response.json()) as {
    status: string;
    result: CrlfInjectionPreviewResult;
  };

  assert.equal(response.status, 200);
  assert.equal(body.status, "ok");
  assert.equal(body.result.signal, "crlf-injection-virtual-header-injected");
  assert.deepEqual(labEventLogCalls, [
    {
      traceId: "trace-crlf-vuln",
      userId: "1",
      labKey: "web.crlf-injection",
      variantKey: "vuln",
      phase: "attack",
      eventType: "success",
      actorPerspective: "attacker",
      method: "POST",
      path: "/api/labs/web/crlf-injection/vuln/preview",
      inputSummary: {
        headerTemplate: "download-filename",
        dispositionType: "attachment",
        fileNameLength: crlfInjectionControlledFileName.length,
        fileNamePreview: "controlled-crlf-file-name",
        detectedControlChars: ["cr", "lf"],
        matchedControlledSample: true,
        virtualHeaderCount: 2,
        pollutedHeaderCount: 2,
        signal: "crlf-injection-virtual-header-injected",
      },
      decision: "accepted",
      signal: "crlf-injection-virtual-header-injected",
      statusCode: 200,
      message: "virtual header injected",
      riskLevel: "high",
    },
  ]);
  assert.equal(
    JSON.stringify(labEventLogCalls[0]?.inputSummary).includes(
      crlfInjectionControlledFileName,
    ),
    false,
  );
  assert.equal(
    JSON.stringify(labEventLogCalls[0]?.inputSummary).includes("exposed"),
    false,
  );
});

test("POST /api/labs/web/crlf-injection/fixed/preview returns blocked response", async () => {
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
        labId: "12",
      }),
      listUserLabEventLogs: async () => [],
    },
  });
  const origin = await listen(app);

  const response = await fetch(
    `${origin}/api/labs/web/crlf-injection/fixed/preview`,
    {
      method: "POST",
      headers: {
        authorization: "Bearer local-session-token",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        headerTemplate: crlfInjectionNormalHeaderTemplate,
        fileName: crlfInjectionControlledFileName,
        dispositionType: crlfInjectionNormalDispositionType,
      }),
    },
  );
  const body = (await response.json()) as {
    status: string;
    result: CrlfInjectionPreviewResult;
  };

  assert.equal(response.status, 403);
  assert.equal(body.status, "blocked");
  assert.equal(body.result.signal, "crlf-injection-control-chars-blocked");
});
