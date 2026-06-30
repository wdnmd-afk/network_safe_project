import assert from "node:assert/strict";
import { after, test } from "node:test";

import { createApp } from "../src/app.js";
import type { LabEventInput } from "../src/services/lab-event-logs.js";
import {
  createLdapInjectionLabService,
  ldapInjectionControlledKeyword,
  ldapInjectionNormalKeyword,
  ldapInjectionNormalScenarioKey,
  type LdapInjectionResult,
} from "../src/services/ldap-injection-lab.js";

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

test("ldap injection service completes normal public directory searches", async () => {
  const service = createLdapInjectionLabService();
  const result = await service.searchDirectory({
    userId: "1",
    variantKey: "fixed",
    scenarioKey: ldapInjectionNormalScenarioKey,
    keyword: ldapInjectionNormalKeyword,
  });

  assert.equal(result.status, "ok");
  assert.equal(result.signal, "ldap-injection-safe-search-completed");
  assert.equal(result.decision, "accepted");
  assert.equal(result.inspection.resultScope, "public");
  assert.equal(
    result.entries.every((entry) => entry.visibility === "public"),
    true,
  );
});

test("ldap injection service expands virtual directory scope in vulnerable variant", async () => {
  const service = createLdapInjectionLabService();
  const result = await service.searchDirectory({
    userId: "1",
    variantKey: "vuln",
    scenarioKey: ldapInjectionNormalScenarioKey,
    keyword: ldapInjectionControlledKeyword,
  });

  assert.equal(result.status, "ok");
  assert.equal(result.signal, "ldap-injection-scope-expanded");
  assert.equal(result.decision, "accepted");
  assert.equal(result.inspection.matchedControlledSample, true);
  assert.equal(result.inspection.resultScope, "expanded");
  assert.equal(
    result.entries.some((entry) => entry.visibility === "restricted"),
    true,
  );
  assert.equal(JSON.stringify(result).includes(ldapInjectionControlledKeyword), false);
});

test("ldap injection service blocks the same controlled sample in fixed variant", async () => {
  const service = createLdapInjectionLabService();
  const result = await service.searchDirectory({
    userId: "1",
    variantKey: "fixed",
    scenarioKey: ldapInjectionNormalScenarioKey,
    keyword: ldapInjectionControlledKeyword,
  });

  assert.equal(result.status, "blocked");
  assert.equal(result.signal, "ldap-injection-controlled-sample-blocked");
  assert.equal(result.decision, "blocked");
  assert.equal(result.blockedReason, "controlled-sample-blocked");
});

test("ldap injection service rejects unknown directory scenarios", async () => {
  const service = createLdapInjectionLabService();
  const result = await service.searchDirectory({
    userId: "1",
    variantKey: "vuln",
    scenarioKey: "raw-directory-filter",
    keyword: ldapInjectionNormalKeyword,
  });

  assert.equal(result.status, "failed");
  assert.equal(result.signal, "ldap-injection-template-not-found");
  assert.equal(result.decision, "failed");
  assert.equal(result.blockedReason, "scenario-not-allowed");
});

test("POST /api/labs/web/ldap-injection/:variant/search requires login", async () => {
  const app = createApp();
  const origin = await listen(app);

  const response = await fetch(
    `${origin}/api/labs/web/ldap-injection/vuln/search`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        scenarioKey: ldapInjectionNormalScenarioKey,
        keyword: ldapInjectionNormalKeyword,
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

test("POST /api/labs/web/ldap-injection/vuln/search records safe summary without keyword", async () => {
  const labEventLogCalls: LabEventInput[] = [];
  const app = createApp({
    authService: {
      login: async () => null,
      getCurrentUser: async (token: string) =>
        token === "local-session-token" ? demoUser : null,
    },
    ldapInjectionLabService: {
      searchDirectory: async (): Promise<LdapInjectionResult> => ({
        status: "ok",
        variantKey: "vuln",
        scenarioKey: ldapInjectionNormalScenarioKey,
        keywordLength: ldapInjectionControlledKeyword.length,
        keywordPreview: "controlled-ldap-keyword",
        entries: [
          {
            id: "member-restricted-review",
            displayName: "虚拟受限成员记录",
            scenarioKey: "member-search",
            directoryArea: "restricted-review",
            visibility: "restricted",
            matchedBy: "controlled-expanded-scope",
            teachingOnly: true,
          },
        ],
        inspection: {
          scenarioAllowed: true,
          keywordLength: ldapInjectionControlledKeyword.length,
          keywordPreview: "controlled-ldap-keyword",
          detectedRiskTypes: [
            "controlled-scope-expansion",
            "directory-filter-like-token",
          ],
          matchedControlledSample: true,
          resultScope: "expanded",
        },
        signal: "ldap-injection-scope-expanded",
        decision: "accepted",
        message: "virtual directory scope expanded",
        nextStep: "compare fixed variant",
      }),
    },
    labEventLogsService: {
      recordLabEvent: async (input: LabEventInput) => {
        labEventLogCalls.push(input);

        return {
          traceId: input.traceId ?? "generated-trace",
          persisted: true,
          labId: "14",
        };
      },
      listUserLabEventLogs: async () => [],
    },
  });
  const origin = await listen(app);

  const response = await fetch(
    `${origin}/api/labs/web/ldap-injection/vuln/search`,
    {
      method: "POST",
      headers: {
        authorization: "Bearer local-session-token",
        "content-type": "application/json",
        "x-lab-trace-id": "trace-ldap-vuln",
      },
      body: JSON.stringify({
        scenarioKey: ldapInjectionNormalScenarioKey,
        keyword: ldapInjectionControlledKeyword,
      }),
    },
  );
  const body = (await response.json()) as {
    status: string;
    result: LdapInjectionResult;
  };

  assert.equal(response.status, 200);
  assert.equal(body.status, "ok");
  assert.equal(body.result.signal, "ldap-injection-scope-expanded");
  assert.deepEqual(labEventLogCalls, [
    {
      traceId: "trace-ldap-vuln",
      userId: "1",
      labKey: "web.ldap-injection",
      variantKey: "vuln",
      phase: "attack",
      eventType: "success",
      actorPerspective: "attacker",
      method: "POST",
      path: "/api/labs/web/ldap-injection/vuln/search",
      inputSummary: {
        scenarioKey: "member-search",
        keywordLength: ldapInjectionControlledKeyword.length,
        keywordPreview: "controlled-ldap-keyword",
        detectedRiskTypes: [
          "controlled-scope-expansion",
          "directory-filter-like-token",
        ],
        matchedControlledSample: true,
        resultScope: "expanded",
        entryCount: 1,
        signal: "ldap-injection-scope-expanded",
      },
      decision: "accepted",
      signal: "ldap-injection-scope-expanded",
      statusCode: 200,
      message: "virtual directory scope expanded",
      riskLevel: "high",
    },
  ]);
  assert.equal(
    JSON.stringify(labEventLogCalls[0]?.inputSummary).includes(
      ldapInjectionControlledKeyword,
    ),
    false,
  );
});

test("POST /api/labs/web/ldap-injection/fixed/search returns blocked response", async () => {
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
        labId: "14",
      }),
      listUserLabEventLogs: async () => [],
    },
  });
  const origin = await listen(app);

  const response = await fetch(
    `${origin}/api/labs/web/ldap-injection/fixed/search`,
    {
      method: "POST",
      headers: {
        authorization: "Bearer local-session-token",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        scenarioKey: ldapInjectionNormalScenarioKey,
        keyword: ldapInjectionControlledKeyword,
      }),
    },
  );
  const body = (await response.json()) as {
    status: string;
    result: LdapInjectionResult;
  };

  assert.equal(response.status, 403);
  assert.equal(body.status, "blocked");
  assert.equal(body.result.signal, "ldap-injection-controlled-sample-blocked");
});
