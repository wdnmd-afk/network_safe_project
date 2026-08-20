import assert from "node:assert/strict";
import { after, test } from "node:test";

import { createApp } from "../src/app.js";
import {
  assessFixedTransactionView,
  createMitbTransactionLabService,
  fixedTransactionViews,
  mitbTransactionDefenseSignal,
  mitbTransactionNormalSignal,
  mitbTransactionRiskSignal,
  mitbTransactionScenarioKey,
} from "../src/services/mitb-transaction-lab.js";
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

test("fixed transaction views are frozen and expose locked comparison counts", () => {
  assert.equal(Object.isFrozen(fixedTransactionViews), true);
  assert.equal(Object.isFrozen(fixedTransactionViews[0]), true);
  assert.deepEqual(fixedTransactionViews.map(assessFixedTransactionView), [
    {
      viewKey: "virtual-tampered-transfer-view",
      expectedPosture: "tampered",
      findingCount: 4,
      mismatchCount: 3,
      trustedPathControlCount: 0,
    },
    {
      viewKey: "virtual-consistent-transfer-view",
      expectedPosture: "consistent",
      findingCount: 0,
      mismatchCount: 0,
      trustedPathControlCount: 4,
    },
  ]);
});

test("mitb transaction accepts the fixed browser view risk path", () => {
  const result = createMitbTransactionLabService().evaluate({
    variantKey: "vuln",
    scenarioKey: mitbTransactionScenarioKey,
    decisions: [
      "trust-browser-rendered-view",
      "submit-transaction-from-browser-view",
    ],
  });

  assert.equal(result.status, "ok");
  assert.equal(result.signal, mitbTransactionRiskSignal);
  assert.equal(result.recap.terminalOutcome, "risk");
  assert.equal(result.viewAssessment?.mismatchCount, 3);
  assert.equal(
    result.transactionDecision?.disposition,
    "tampered-transaction-submitted",
  );
});

test("mitb transaction blocks the mismatched transaction on the defense path", () => {
  const result = createMitbTransactionLabService().evaluate({
    variantKey: "fixed",
    scenarioKey: mitbTransactionScenarioKey,
    decisions: [
      "compare-server-and-out-of-band-view",
      "block-mismatched-transaction",
    ],
  });

  assert.equal(result.status, "blocked");
  assert.equal(result.signal, mitbTransactionDefenseSignal);
  assert.equal(result.recap.terminalOutcome, "fix");
  assert.equal(result.viewAssessment?.trustedPathControlCount, 4);
  assert.equal(result.blockedReason, "mismatched-transaction-blocked");
});

test("mitb transaction confirms the consistent normal baseline", () => {
  const result = createMitbTransactionLabService().evaluate({
    variantKey: "fixed",
    scenarioKey: mitbTransactionScenarioKey,
    decisions: [
      "compare-server-and-out-of-band-view",
      "confirm-consistent-transaction",
    ],
  });

  assert.equal(result.status, "ok");
  assert.equal(result.signal, mitbTransactionNormalSignal);
  assert.equal(result.recap.terminalOutcome, "normal");
  assert.equal(
    result.transactionDecision?.disposition,
    "consistent-transaction-confirmed",
  );
});

test("mitb transaction blocks unknown and incomplete paths without echo", () => {
  const service = createMitbTransactionLabService();
  const rawScenario = "hook-real-browser-session";
  const rawOption = "rewrite-real-transfer-payee";
  const unknownScenario = service.evaluate({
    variantKey: "vuln",
    scenarioKey: rawScenario,
    decisions: ["trust-browser-rendered-view"],
  });
  const unknownOption = service.evaluate({
    variantKey: "vuln",
    scenarioKey: mitbTransactionScenarioKey,
    decisions: [rawOption],
  });
  const incomplete = service.evaluate({
    variantKey: "vuln",
    scenarioKey: mitbTransactionScenarioKey,
    decisions: ["trust-browser-rendered-view"],
  });
  const trailing = service.evaluate({
    variantKey: "vuln",
    scenarioKey: mitbTransactionScenarioKey,
    decisions: [
      "trust-browser-rendered-view",
      "submit-transaction-from-browser-view",
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

test("mitb transaction workbench API exposes only fixed views", async () => {
  const origin = await listen(createApp());
  const response = await fetch(`${origin}/api/labs/client/mitb/workbench`);
  const body = (await response.json()) as {
    status: string;
    workbench: {
      id: string;
      defaultScenarioKey: string;
      transactionViews: Array<{ viewKey: string; browserPayee: string }>;
      viewAssessments: unknown[];
    };
  };

  assert.equal(response.status, 200);
  assert.equal(body.status, "ok");
  assert.equal(body.workbench.id, "client.mitb");
  assert.equal(body.workbench.defaultScenarioKey, mitbTransactionScenarioKey);
  assert.equal(body.workbench.transactionViews.length, 2);
  assert.equal(body.workbench.viewAssessments.length, 2);
  assert.ok(
    body.workbench.transactionViews.every(
      (view) =>
        view.viewKey.startsWith("virtual-") &&
        view.browserPayee.startsWith("virtual-"),
    ),
  );
});

test("mitb transaction evaluate API requires login", async () => {
  const origin = await listen(createApp());
  const response = await fetch(
    `${origin}/api/labs/client/mitb/vuln/evaluate`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        scenarioKey: mitbTransactionScenarioKey,
        decisions: [
          "trust-browser-rendered-view",
          "submit-transaction-from-browser-view",
        ],
      }),
    },
  );

  assert.equal(response.status, 401);
});

test("mitb transaction API records only fixed keys and comparison counts", async () => {
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
    `${origin}/api/labs/client/mitb/vuln/evaluate`,
    {
      method: "POST",
      headers: {
        authorization: "Bearer local-session-token",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        scenarioKey: mitbTransactionScenarioKey,
        decisions: [
          "trust-browser-rendered-view",
          "submit-transaction-from-browser-view",
        ],
        accountNumber: "6222020000001234567",
        iban: "DE89370400440532013000",
        merchantId: "REAL-MERCHANT-9911",
        amount: "88888.00",
        sessionCookie: "SESSIONID=real-cookie-value",
      }),
    },
  );
  const blockedResponse = await fetch(
    `${origin}/api/labs/client/mitb/vuln/evaluate`,
    {
      method: "POST",
      headers: {
        authorization: "Bearer local-session-token",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        scenarioKey: "hook-real-browser-session",
        decisions: ["rewrite-real-transfer-payee"],
      }),
    },
  );

  assert.equal(response.status, 200);
  assert.equal(blockedResponse.status, 403);
  assert.equal(eventCalls.length, 2);

  const serialized = JSON.stringify(eventCalls);
  assert.equal(
    serialized.includes("fixed-browser-transaction-view-audit"),
    true,
  );
  assert.equal(serialized.includes("virtual-tampered-transfer-view"), true);
  assert.equal(serialized.includes("6222020000001234567"), false);
  assert.equal(serialized.includes("DE89370400440532013000"), false);
  assert.equal(serialized.includes("REAL-MERCHANT-9911"), false);
  assert.equal(serialized.includes("88888.00"), false);
  assert.equal(serialized.includes("real-cookie-value"), false);
  assert.equal(serialized.includes("hook-real-browser-session"), false);
  assert.equal(serialized.includes("rewrite-real-transfer-payee"), false);
});

test("mitb transaction API returns 403 for the defense path", async () => {
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
    `${origin}/api/labs/client/mitb/fixed/evaluate`,
    {
      method: "POST",
      headers: {
        authorization: "Bearer local-session-token",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        scenarioKey: mitbTransactionScenarioKey,
        decisions: [
          "compare-server-and-out-of-band-view",
          "block-mismatched-transaction",
        ],
      }),
    },
  );

  assert.equal(response.status, 403);
});
