import assert from "node:assert/strict";
import { after, test } from "node:test";

import { createApp } from "../src/app.js";
import type { LabEventInput } from "../src/services/lab-event-logs.js";
import {
  createSsrfLabService,
  type SsrfResult,
} from "../src/services/ssrf-lab.js";

const demoUser = {
  id: "1",
  username: "demo_user",
  displayName: "演示用户",
  role: "member",
  status: "active",
};

const ssrfPublicUrl = "https://safe-mart-cdn.local/public/catalog.json";
const ssrfAttackUrl =
  "http://169.254.169.254/latest/meta-data/iam/security-credentials/demo";

async function listen(app: ReturnType<typeof createApp>) {
  const server = app.listen(0);
  const address = server.address();

  assert.ok(address && typeof address === "object");

  after(() => {
    server.close();
  });

  return `http://127.0.0.1:${address.port}`;
}

test("ssrf service fetches public virtual resources in both variants", async () => {
  const service = createSsrfLabService();
  const vulnerableResult = await service.fetchResource({
    userId: "1",
    variantKey: "vuln",
    targetUrl: ssrfPublicUrl,
  });
  const fixedResult = await service.fetchResource({
    userId: "1",
    variantKey: "fixed",
    targetUrl: ssrfPublicUrl,
  });

  assert.equal(vulnerableResult.status, "ok");
  assert.equal(vulnerableResult.signal, "ssrf-public-resource-fetched");
  assert.equal(vulnerableResult.resource?.resourceType, "public");
  assert.equal(fixedResult.status, "ok");
  assert.equal(fixedResult.signal, "ssrf-public-resource-fetched");
});

test("ssrf service exposes internal metadata in the vulnerable variant", async () => {
  const service = createSsrfLabService();

  const result = await service.fetchResource({
    userId: "1",
    variantKey: "vuln",
    targetUrl: ssrfAttackUrl,
  });

  assert.equal(result.status, "ok");
  assert.equal(result.signal, "ssrf-internal-metadata-exposed");
  assert.equal(result.decision, "accepted");
  assert.equal(result.inspection.privateTarget, true);
  assert.equal(result.resource?.resourceType, "internal");
});

test("ssrf service blocks the same internal metadata target in the fixed variant", async () => {
  const service = createSsrfLabService();

  const result = await service.fetchResource({
    userId: "1",
    variantKey: "fixed",
    targetUrl: ssrfAttackUrl,
  });

  assert.equal(result.status, "blocked");
  assert.equal(result.signal, "ssrf-private-target-blocked");
  assert.equal(result.decision, "blocked");
  assert.equal(result.blockedReason, "private-target");
  assert.equal(result.resource, null);
});

test("POST /api/labs/web/ssrf/:variant/fetch requires login", async () => {
  const app = createApp();
  const origin = await listen(app);

  const response = await fetch(`${origin}/api/labs/web/ssrf/vuln/fetch`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      targetUrl: ssrfPublicUrl,
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

test("POST /api/labs/web/ssrf/vuln/fetch records internal target event logs", async () => {
  const labEventLogCalls: LabEventInput[] = [];
  const app = createApp({
    authService: {
      login: async () => null,
      getCurrentUser: async (token: string) =>
        token === "local-session-token" ? demoUser : null,
    },
    ssrfLabService: {
      fetchResource: async (): Promise<SsrfResult> => ({
        status: "ok",
        variantKey: "vuln",
        targetUrl: ssrfAttackUrl,
        resolvedUrl: ssrfAttackUrl,
        inspection: {
          normalizedUrl: ssrfAttackUrl,
          protocol: "http:",
          hostname: "169.254.169.254",
          pathname: "/latest/meta-data/iam/security-credentials/demo",
          allowedPublicHost: false,
          privateTarget: true,
          targetUrlLength: ssrfAttackUrl.length,
        },
        resource: {
          url: ssrfAttackUrl,
          title: "内部元数据模拟响应",
          resourceType: "internal",
          content: "internal training metadata",
          isSensitive: true,
        },
        signal: "ssrf-internal-metadata-exposed",
        decision: "accepted",
        message: "internal metadata exposed",
        nextStep: "compare fixed variant",
      }),
    },
    labEventLogsService: {
      recordLabEvent: async (input: LabEventInput) => {
        labEventLogCalls.push(input);

        return {
          traceId: input.traceId ?? "generated-trace",
          persisted: true,
          labId: "6",
        };
      },
    },
  });
  const origin = await listen(app);

  const response = await fetch(`${origin}/api/labs/web/ssrf/vuln/fetch`, {
    method: "POST",
    headers: {
      authorization: "Bearer local-session-token",
      "content-type": "application/json",
      "x-lab-trace-id": "trace-ssrf-vuln",
    },
    body: JSON.stringify({
      targetUrl: ssrfAttackUrl,
    }),
  });
  const body = (await response.json()) as {
    status: string;
    result: SsrfResult;
  };

  assert.equal(response.status, 200);
  assert.equal(body.status, "ok");
  assert.equal(body.result.signal, "ssrf-internal-metadata-exposed");
  assert.deepEqual(labEventLogCalls, [
    {
      traceId: "trace-ssrf-vuln",
      userId: "1",
      labKey: "web.ssrf",
      variantKey: "vuln",
      phase: "attack",
      eventType: "success",
      actorPerspective: "attacker",
      method: "POST",
      path: "/api/labs/web/ssrf/vuln/fetch",
      inputSummary: {
        targetUrlLength: ssrfAttackUrl.length,
        targetUrlPreview: "controlled-ssrf-internal-target",
        protocol: "http:",
        hostname: "169.254.169.254",
        pathname: "/latest/meta-data/iam/security-credentials/demo",
        allowedPublicHost: false,
        privateTarget: true,
        signal: "ssrf-internal-metadata-exposed",
      },
      decision: "accepted",
      signal: "ssrf-internal-metadata-exposed",
      statusCode: 200,
      message: "internal metadata exposed",
      riskLevel: "high",
    },
  ]);
});

test("POST /api/labs/web/ssrf/fixed/fetch returns blocked response", async () => {
  const app = createApp({
    authService: {
      login: async () => null,
      getCurrentUser: async () => demoUser,
    },
    ssrfLabService: {
      fetchResource: async (): Promise<SsrfResult> => ({
        status: "blocked",
        variantKey: "fixed",
        targetUrl: ssrfAttackUrl,
        resolvedUrl: ssrfAttackUrl,
        inspection: {
          normalizedUrl: ssrfAttackUrl,
          protocol: "http:",
          hostname: "169.254.169.254",
          pathname: "/latest/meta-data/iam/security-credentials/demo",
          allowedPublicHost: false,
          privateTarget: true,
          targetUrlLength: ssrfAttackUrl.length,
        },
        resource: null,
        signal: "ssrf-private-target-blocked",
        decision: "blocked",
        message: "fixed variant blocked private target",
        nextStep: "review allowlist",
        blockedReason: "private-target",
      }),
    },
    labEventLogsService: {
      recordLabEvent: async (input: LabEventInput) => ({
        traceId: input.traceId ?? "generated-trace",
        persisted: true,
        labId: "6",
      }),
    },
  });
  const origin = await listen(app);

  const response = await fetch(`${origin}/api/labs/web/ssrf/fixed/fetch`, {
    method: "POST",
    headers: {
      authorization: "Bearer local-session-token",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      targetUrl: ssrfAttackUrl,
    }),
  });
  const body = (await response.json()) as {
    status: string;
    result: SsrfResult;
  };

  assert.equal(response.status, 403);
  assert.equal(body.status, "blocked");
  assert.equal(body.result.signal, "ssrf-private-target-blocked");
});
