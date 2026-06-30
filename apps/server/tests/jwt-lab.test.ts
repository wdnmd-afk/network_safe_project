import assert from "node:assert/strict";
import { after, test } from "node:test";

import { createApp } from "../src/app.js";
import {
  createJwtLabService,
  type JwtResult,
} from "../src/services/jwt-lab.js";
import type { LabEventInput } from "../src/services/lab-event-logs.js";

const demoUser = {
  id: "1",
  username: "demo_user",
  displayName: "演示用户",
  role: "member",
  status: "active",
};

const jwtLabService = createJwtLabService();
const jwtSamples = jwtLabService.getSamples();

async function listen(app: ReturnType<typeof createApp>) {
  const server = app.listen(0);
  const address = server.address();

  assert.ok(address && typeof address === "object");

  after(() => {
    server.close();
  });

  return `http://127.0.0.1:${address.port}`;
}

test("jwt service accepts the signed user token in both variants", async () => {
  const vulnerableResult = await jwtLabService.verifyToken({
    userId: "1",
    variantKey: "vuln",
    token: jwtSamples.normalUserToken,
  });
  const fixedResult = await jwtLabService.verifyToken({
    userId: "1",
    variantKey: "fixed",
    token: jwtSamples.normalUserToken,
  });

  assert.equal(vulnerableResult.status, "ok");
  assert.equal(vulnerableResult.signal, "jwt-valid-user-token-accepted");
  assert.equal(vulnerableResult.inspection.signatureValid, true);
  assert.equal(vulnerableResult.access?.role, "user");
  assert.equal(fixedResult.status, "ok");
  assert.equal(fixedResult.signal, "jwt-valid-user-token-accepted");
});

test("jwt service accepts an unsigned admin token in the vulnerable variant", async () => {
  const result = await jwtLabService.verifyToken({
    userId: "1",
    variantKey: "vuln",
    token: jwtSamples.noneAlgAdminToken,
  });

  assert.equal(result.status, "ok");
  assert.equal(result.signal, "jwt-none-alg-admin-accepted");
  assert.equal(result.decision, "accepted");
  assert.equal(result.inspection.algorithm, "none");
  assert.equal(result.inspection.adminClaimRequested, true);
  assert.equal(result.access?.role, "admin");
});

test("jwt service blocks the same unsigned admin token in the fixed variant", async () => {
  const result = await jwtLabService.verifyToken({
    userId: "1",
    variantKey: "fixed",
    token: jwtSamples.noneAlgAdminToken,
  });

  assert.equal(result.status, "blocked");
  assert.equal(result.signal, "jwt-none-alg-blocked");
  assert.equal(result.decision, "blocked");
  assert.equal(result.blockedReason, "algorithm-not-allowed");
  assert.equal(result.access, null);
});

test("POST /api/labs/auth/jwt/:variant/verify requires login", async () => {
  const app = createApp();
  const origin = await listen(app);

  const response = await fetch(`${origin}/api/labs/auth/jwt/vuln/verify`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      token: jwtSamples.normalUserToken,
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

test("POST /api/labs/auth/jwt/vuln/verify records unsigned admin token event logs", async () => {
  const labEventLogCalls: LabEventInput[] = [];
  const app = createApp({
    authService: {
      login: async () => null,
      getCurrentUser: async (token: string) =>
        token === "local-session-token" ? demoUser : null,
    },
    jwtLabService: {
      getSamples: () => jwtSamples,
      verifyToken: async (): Promise<JwtResult> => ({
        status: "ok",
        variantKey: "vuln",
        header: {
          alg: "none",
          typ: "JWT",
        },
        payload: {
          sub: "learner-1001",
          role: "admin",
          scope: "admin:read",
          lab: "auth.jwt",
        },
        inspection: {
          tokenLength: jwtSamples.noneAlgAdminToken.length,
          segmentCount: 3,
          algorithm: "none",
          signaturePresent: false,
          signatureValid: false,
          roleClaim: "admin",
          scopeClaim: "admin:read",
          adminClaimRequested: true,
          labToken: true,
        },
        access: {
          subject: "learner-1001",
          role: "admin",
          scope: "admin:read",
          resource: "admin-analytics",
          granted: true,
        },
        signal: "jwt-none-alg-admin-accepted",
        decision: "accepted",
        message: "unsigned admin token accepted",
        nextStep: "compare fixed variant",
      }),
    },
    labEventLogsService: {
      recordLabEvent: async (input: LabEventInput) => {
        labEventLogCalls.push(input);

        return {
          traceId: input.traceId ?? "generated-trace",
          persisted: true,
          labId: "8",
        };
      },
    },
  });
  const origin = await listen(app);

  const response = await fetch(`${origin}/api/labs/auth/jwt/vuln/verify`, {
    method: "POST",
    headers: {
      authorization: "Bearer local-session-token",
      "content-type": "application/json",
      "x-lab-trace-id": "trace-jwt-vuln",
    },
    body: JSON.stringify({
      token: jwtSamples.noneAlgAdminToken,
    }),
  });
  const body = (await response.json()) as {
    status: string;
    result: JwtResult;
  };

  assert.equal(response.status, 200);
  assert.equal(body.status, "ok");
  assert.equal(body.result.signal, "jwt-none-alg-admin-accepted");
  assert.deepEqual(labEventLogCalls, [
    {
      traceId: "trace-jwt-vuln",
      userId: "1",
      labKey: "auth.jwt",
      variantKey: "vuln",
      phase: "attack",
      eventType: "success",
      actorPerspective: "attacker",
      method: "POST",
      path: "/api/labs/auth/jwt/vuln/verify",
      inputSummary: {
        tokenLength: jwtSamples.noneAlgAdminToken.length,
        tokenPreview: "controlled-jwt-none-admin-sample",
        segmentCount: 3,
        algorithm: "none",
        signaturePresent: false,
        signatureValid: false,
        roleClaim: "admin",
        scopeClaim: "admin:read",
        adminClaimRequested: true,
        labToken: true,
        signal: "jwt-none-alg-admin-accepted",
      },
      decision: "accepted",
      signal: "jwt-none-alg-admin-accepted",
      statusCode: 200,
      message: "unsigned admin token accepted",
      riskLevel: "high",
    },
  ]);
});

test("POST /api/labs/auth/jwt/fixed/verify returns blocked response", async () => {
  const app = createApp({
    authService: {
      login: async () => null,
      getCurrentUser: async () => demoUser,
    },
    jwtLabService: {
      getSamples: () => jwtSamples,
      verifyToken: async (): Promise<JwtResult> => ({
        status: "blocked",
        variantKey: "fixed",
        header: {
          alg: "none",
          typ: "JWT",
        },
        payload: {
          sub: "learner-1001",
          role: "admin",
          scope: "admin:read",
          lab: "auth.jwt",
        },
        inspection: {
          tokenLength: jwtSamples.noneAlgAdminToken.length,
          segmentCount: 3,
          algorithm: "none",
          signaturePresent: false,
          signatureValid: false,
          roleClaim: "admin",
          scopeClaim: "admin:read",
          adminClaimRequested: true,
          labToken: true,
        },
        access: null,
        signal: "jwt-none-alg-blocked",
        decision: "blocked",
        message: "fixed variant blocked none algorithm",
        nextStep: "review algorithm allowlist",
        blockedReason: "algorithm-not-allowed",
      }),
    },
    labEventLogsService: {
      recordLabEvent: async (input: LabEventInput) => ({
        traceId: input.traceId ?? "generated-trace",
        persisted: true,
        labId: "8",
      }),
    },
  });
  const origin = await listen(app);

  const response = await fetch(`${origin}/api/labs/auth/jwt/fixed/verify`, {
    method: "POST",
    headers: {
      authorization: "Bearer local-session-token",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      token: jwtSamples.noneAlgAdminToken,
    }),
  });
  const body = (await response.json()) as {
    status: string;
    result: JwtResult;
  };

  assert.equal(response.status, 403);
  assert.equal(body.status, "blocked");
  assert.equal(body.result.signal, "jwt-none-alg-blocked");
});
