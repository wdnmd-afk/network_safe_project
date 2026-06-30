import assert from "node:assert/strict";
import { after, test } from "node:test";

import { createApp } from "../src/app.js";
import type { LabEventInput } from "../src/services/lab-event-logs.js";
import {
  createXxeLabService,
  xxeNormalInvoiceXml,
  xxeVirtualEntityXml,
  type XxeImportResult,
} from "../src/services/xxe-lab.js";

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

test("xxe service imports normal XML with safe signal", async () => {
  const service = createXxeLabService();
  const result = await service.importXml({
    userId: "1",
    variantKey: "fixed",
    importKind: "invoice-preview",
    xmlDocument: xxeNormalInvoiceXml,
  });

  assert.equal(result.status, "ok");
  assert.equal(result.signal, "xxe-safe-xml-imported");
  assert.equal(result.decision, "accepted");
  assert.equal(result.inspection.containsDoctype, false);
  assert.equal(result.preview.fields.some((field) => field.value === "128"), true);
});

test("xxe service resolves only the controlled virtual entity in vulnerable variant", async () => {
  const service = createXxeLabService();
  const result = await service.importXml({
    userId: "1",
    variantKey: "vuln",
    importKind: "invoice-preview",
    xmlDocument: xxeVirtualEntityXml,
  });

  assert.equal(result.status, "ok");
  assert.equal(result.signal, "xxe-internal-resource-exposed");
  assert.equal(result.inspection.containsDoctype, true);
  assert.deepEqual(result.inspection.declaredEntityNames, ["labSecret"]);
  assert.equal(result.inspection.matchedControlledSample, true);
  assert.equal(
    result.preview.fields.some((field) => field.fromVirtualEntity),
    true,
  );
});

test("xxe service blocks the same controlled sample in fixed variant", async () => {
  const service = createXxeLabService();
  const result = await service.importXml({
    userId: "1",
    variantKey: "fixed",
    importKind: "invoice-preview",
    xmlDocument: xxeVirtualEntityXml,
  });

  assert.equal(result.status, "blocked");
  assert.equal(result.signal, "xxe-doctype-blocked");
  assert.equal(result.decision, "blocked");
  assert.equal(result.blockedReason, "doctype-or-entity-disabled");
});

test("xxe service rejects unknown entities without file or network access", async () => {
  const service = createXxeLabService();
  const result = await service.importXml({
    userId: "1",
    variantKey: "vuln",
    importKind: "invoice-preview",
    xmlDocument:
      '<!DOCTYPE invoice [<!ENTITY unknown SYSTEM "file:///virtual/lab/unknown">]><invoice><note>&unknown;</note></invoice>',
  });

  assert.equal(result.status, "blocked");
  assert.equal(result.signal, "xxe-entity-not-found");
  assert.equal(result.inspection.unknownEntityCount, 1);
  assert.equal(result.preview.fields.length, 0);
});

test("xxe service rejects unknown import kinds", async () => {
  const service = createXxeLabService();
  const result = await service.importXml({
    userId: "1",
    variantKey: "vuln",
    importKind: "unknown-import",
    xmlDocument: xxeNormalInvoiceXml,
  });

  assert.equal(result.status, "failed");
  assert.equal(result.signal, "xxe-import-kind-not-found");
  assert.equal(result.decision, "failed");
});

test("POST /api/labs/web/xxe/:variant/import requires login", async () => {
  const app = createApp();
  const origin = await listen(app);

  const response = await fetch(`${origin}/api/labs/web/xxe/vuln/import`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      importKind: "invoice-preview",
      xmlDocument: xxeNormalInvoiceXml,
    }),
  });
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

test("POST /api/labs/web/xxe/vuln/import records safe summary without XML document", async () => {
  const labEventLogCalls: LabEventInput[] = [];
  const app = createApp({
    authService: {
      login: async () => null,
      getCurrentUser: async (token: string) =>
        token === "local-session-token" ? demoUser : null,
    },
    xxeLabService: {
      importXml: async (): Promise<XxeImportResult> => ({
        status: "ok",
        variantKey: "vuln",
        importKind: "invoice-preview",
        preview: {
          title: "XML 发票导入预览",
          fields: [
            {
              key: "note",
              label: "备注",
              value: "虚拟内部说明：仅用于 XXE 学习复盘",
              fromVirtualEntity: true,
            },
          ],
        },
        inspection: {
          xmlLength: xxeVirtualEntityXml.length,
          containsDoctype: true,
          declaredEntityNames: ["labSecret"],
          referencedEntityNames: ["labSecret"],
          entitySourceTypes: ["virtual-file"],
          matchedControlledSample: true,
          unknownEntityCount: 0,
        },
        signal: "xxe-internal-resource-exposed",
        decision: "accepted",
        message: "controlled virtual entity resolved",
        nextStep: "compare fixed variant",
      }),
    },
    labEventLogsService: {
      recordLabEvent: async (input: LabEventInput) => {
        labEventLogCalls.push(input);

        return {
          traceId: input.traceId ?? "generated-trace",
          persisted: true,
          labId: "10",
        };
      },
      listUserLabEventLogs: async () => [],
    },
  });
  const origin = await listen(app);

  const response = await fetch(`${origin}/api/labs/web/xxe/vuln/import`, {
    method: "POST",
    headers: {
      authorization: "Bearer local-session-token",
      "content-type": "application/json",
      "x-lab-trace-id": "trace-xxe-vuln",
    },
    body: JSON.stringify({
      importKind: "invoice-preview",
      xmlDocument: xxeVirtualEntityXml,
    }),
  });
  const body = (await response.json()) as {
    status: string;
    result: XxeImportResult;
  };

  assert.equal(response.status, 200);
  assert.equal(body.status, "ok");
  assert.equal(body.result.signal, "xxe-internal-resource-exposed");
  assert.deepEqual(labEventLogCalls, [
    {
      traceId: "trace-xxe-vuln",
      userId: "1",
      labKey: "web.xxe",
      variantKey: "vuln",
      phase: "attack",
      eventType: "success",
      actorPerspective: "attacker",
      method: "POST",
      path: "/api/labs/web/xxe/vuln/import",
      inputSummary: {
        importKind: "invoice-preview",
        xmlLength: xxeVirtualEntityXml.length,
        containsDoctype: true,
        declaredEntityNames: ["labSecret"],
        referencedEntityNames: ["labSecret"],
        entitySourceTypes: ["virtual-file"],
        matchedControlledSample: true,
        unknownEntityCount: 0,
        signal: "xxe-internal-resource-exposed",
      },
      decision: "accepted",
      signal: "xxe-internal-resource-exposed",
      statusCode: 200,
      message: "controlled virtual entity resolved",
      riskLevel: "critical",
    },
  ]);
  assert.equal(
    JSON.stringify(labEventLogCalls[0]?.inputSummary).includes(
      xxeVirtualEntityXml,
    ),
    false,
  );
  assert.equal(
    JSON.stringify(labEventLogCalls[0]?.inputSummary).includes(
      "file:///virtual/lab/internal-note",
    ),
    false,
  );
});

test("POST /api/labs/web/xxe/fixed/import returns blocked response", async () => {
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
        labId: "10",
      }),
      listUserLabEventLogs: async () => [],
    },
  });
  const origin = await listen(app);

  const response = await fetch(`${origin}/api/labs/web/xxe/fixed/import`, {
    method: "POST",
    headers: {
      authorization: "Bearer local-session-token",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      importKind: "invoice-preview",
      xmlDocument: xxeVirtualEntityXml,
    }),
  });
  const body = (await response.json()) as {
    status: string;
    result: XxeImportResult;
  };

  assert.equal(response.status, 403);
  assert.equal(body.status, "blocked");
  assert.equal(body.result.signal, "xxe-doctype-blocked");
});
