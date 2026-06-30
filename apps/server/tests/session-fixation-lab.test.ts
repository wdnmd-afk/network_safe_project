import assert from "node:assert/strict";
import { after, test } from "node:test";

import { createApp } from "../src/app.js";
import type { LabEventInput } from "../src/services/lab-event-logs.js";
import {
  createSessionFixationLabService,
  type SessionFixationResult,
} from "../src/services/session-fixation-lab.js";

const demoUser = {
  id: "1",
  username: "demo_user",
  displayName: "演示用户",
  role: "member",
  status: "active",
};

const sessionFixationLabService = createSessionFixationLabService({
  generateSessionId: () => "server-rotated-session-0001",
});
const sessionFixationSamples = sessionFixationLabService.getSamples();

async function listen(app: ReturnType<typeof createApp>) {
  const server = app.listen(0);
  const address = server.address();

  assert.ok(address && typeof address === "object");

  after(() => {
    server.close();
  });

  return `http://127.0.0.1:${address.port}`;
}

test("session fixation service accepts normal pre-login id in vulnerable variant", async () => {
  const result = await sessionFixationLabService.submitTeachingLogin({
    userId: "1",
    username: "demo_user",
    variantKey: "vuln",
    preLoginSessionId: sessionFixationSamples.normalPreLoginSessionId,
    sessionSource: sessionFixationSamples.normalSessionSource,
  });

  assert.equal(result.status, "ok");
  assert.equal(result.signal, "session-normal-id-accepted");
  assert.equal(result.inspection.attackerControlled, false);
  assert.equal(result.inspection.acceptedClientSessionId, true);
  assert.equal(result.inspection.rotatedSessionId, false);
  assert.equal(
    result.teachingSession.sessionId,
    sessionFixationSamples.normalPreLoginSessionId,
  );
});

test("session fixation service binds attacker known id in vulnerable variant", async () => {
  const result = await sessionFixationLabService.submitTeachingLogin({
    userId: "1",
    username: "demo_user",
    variantKey: "vuln",
    preLoginSessionId: sessionFixationSamples.attackPreLoginSessionId,
    sessionSource: sessionFixationSamples.attackSessionSource,
  });

  assert.equal(result.status, "ok");
  assert.equal(result.signal, "session-fixed-id-bound");
  assert.equal(result.inspection.attackerControlled, true);
  assert.equal(result.inspection.acceptedClientSessionId, true);
  assert.equal(result.inspection.sessionIdChanged, false);
  assert.equal(
    result.teachingSession.sessionId,
    sessionFixationSamples.attackPreLoginSessionId,
  );
});

test("session fixation service rotates attacker known id in fixed variant", async () => {
  const result = await sessionFixationLabService.submitTeachingLogin({
    userId: "1",
    username: "demo_user",
    variantKey: "fixed",
    preLoginSessionId: sessionFixationSamples.attackPreLoginSessionId,
    sessionSource: sessionFixationSamples.attackSessionSource,
  });

  assert.equal(result.status, "ok");
  assert.equal(result.signal, "session-fixed-id-rotated");
  assert.equal(result.inspection.attackerControlled, true);
  assert.equal(result.inspection.acceptedClientSessionId, false);
  assert.equal(result.inspection.rotatedSessionId, true);
  assert.equal(result.inspection.sessionIdChanged, true);
  assert.equal(result.teachingSession.sessionId, "server-rotated-session-0001");
});

test("POST /api/labs/auth/session-fixation/:variant/login requires login", async () => {
  const app = createApp();
  const origin = await listen(app);

  const response = await fetch(
    `${origin}/api/labs/auth/session-fixation/vuln/login`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        preLoginSessionId: sessionFixationSamples.normalPreLoginSessionId,
        sessionSource: sessionFixationSamples.normalSessionSource,
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

test("POST /api/labs/auth/session-fixation/vuln/login records fixation event logs", async () => {
  const labEventLogCalls: LabEventInput[] = [];
  const app = createApp({
    authService: {
      login: async () => null,
      getCurrentUser: async (token: string) =>
        token === "local-session-token" ? demoUser : null,
    },
    sessionFixationLabService: {
      getSamples: () => sessionFixationSamples,
      submitTeachingLogin: async (): Promise<SessionFixationResult> => ({
        status: "ok",
        variantKey: "vuln",
        preLoginSessionId: sessionFixationSamples.attackPreLoginSessionId,
        sessionSource: "external-link",
        teachingSession: {
          ownerUserId: "1",
          ownerUsername: "demo_user",
          sessionId: sessionFixationSamples.attackPreLoginSessionId,
          source: "client",
          accessSummary: "teaching session only",
        },
        inspection: {
          preLoginSessionIdLength:
            sessionFixationSamples.attackPreLoginSessionId.length,
          sessionSource: "external-link",
          attackerControlled: true,
          acceptedClientSessionId: true,
          rotatedSessionId: false,
          sessionIdChanged: false,
          currentUserId: "1",
          boundSessionIdLength:
            sessionFixationSamples.attackPreLoginSessionId.length,
        },
        signal: "session-fixed-id-bound",
        decision: "accepted",
        message: "attacker known session id bound",
        nextStep: "compare fixed variant",
      }),
    },
    labEventLogsService: {
      recordLabEvent: async (input: LabEventInput) => {
        labEventLogCalls.push(input);

        return {
          traceId: input.traceId ?? "generated-trace",
          persisted: true,
          labId: "11",
        };
      },
    },
  });
  const origin = await listen(app);

  const response = await fetch(
    `${origin}/api/labs/auth/session-fixation/vuln/login`,
    {
      method: "POST",
      headers: {
        authorization: "Bearer local-session-token",
        "content-type": "application/json",
        "x-lab-trace-id": "trace-session-fixation-vuln",
      },
      body: JSON.stringify({
        preLoginSessionId: sessionFixationSamples.attackPreLoginSessionId,
        sessionSource: sessionFixationSamples.attackSessionSource,
      }),
    },
  );
  const body = (await response.json()) as {
    status: string;
    result: SessionFixationResult;
  };

  assert.equal(response.status, 200);
  assert.equal(body.status, "ok");
  assert.equal(body.result.signal, "session-fixed-id-bound");
  assert.deepEqual(labEventLogCalls, [
    {
      traceId: "trace-session-fixation-vuln",
      userId: "1",
      labKey: "auth.session-fixation",
      variantKey: "vuln",
      phase: "attack",
      eventType: "success",
      actorPerspective: "attacker",
      method: "POST",
      path: "/api/labs/auth/session-fixation/vuln/login",
      inputSummary: {
        preLoginSessionIdLength:
          sessionFixationSamples.attackPreLoginSessionId.length,
        preLoginSessionIdPreview: "controlled-session-fixation-sample",
        sessionSource: "external-link",
        attackerControlled: true,
        acceptedClientSessionId: true,
        rotatedSessionId: false,
        sessionIdChanged: false,
        currentUserId: "1",
        boundSessionIdLength:
          sessionFixationSamples.attackPreLoginSessionId.length,
        signal: "session-fixed-id-bound",
      },
      decision: "accepted",
      signal: "session-fixed-id-bound",
      statusCode: 200,
      message: "attacker known session id bound",
      riskLevel: "high",
    },
  ]);
});

test("POST /api/labs/auth/session-fixation/fixed/login returns rotated response", async () => {
  const app = createApp({
    authService: {
      login: async () => null,
      getCurrentUser: async () => demoUser,
    },
    sessionFixationLabService: {
      getSamples: () => sessionFixationSamples,
      submitTeachingLogin: async (): Promise<SessionFixationResult> => ({
        status: "ok",
        variantKey: "fixed",
        preLoginSessionId: sessionFixationSamples.attackPreLoginSessionId,
        sessionSource: "external-link",
        teachingSession: {
          ownerUserId: "1",
          ownerUsername: "demo_user",
          sessionId: "server-rotated-session-0001",
          source: "server",
          accessSummary: "teaching session only",
        },
        inspection: {
          preLoginSessionIdLength:
            sessionFixationSamples.attackPreLoginSessionId.length,
          sessionSource: "external-link",
          attackerControlled: true,
          acceptedClientSessionId: false,
          rotatedSessionId: true,
          sessionIdChanged: true,
          currentUserId: "1",
          boundSessionIdLength: "server-rotated-session-0001".length,
        },
        signal: "session-fixed-id-rotated",
        decision: "accepted",
        message: "fixed variant rotated session id",
        nextStep: "review event log",
      }),
    },
    labEventLogsService: {
      recordLabEvent: async (input: LabEventInput) => ({
        traceId: input.traceId ?? "generated-trace",
        persisted: true,
        labId: "11",
      }),
    },
  });
  const origin = await listen(app);

  const response = await fetch(
    `${origin}/api/labs/auth/session-fixation/fixed/login`,
    {
      method: "POST",
      headers: {
        authorization: "Bearer local-session-token",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        preLoginSessionId: sessionFixationSamples.attackPreLoginSessionId,
        sessionSource: sessionFixationSamples.attackSessionSource,
      }),
    },
  );
  const body = (await response.json()) as {
    status: string;
    result: SessionFixationResult;
  };

  assert.equal(response.status, 200);
  assert.equal(body.status, "ok");
  assert.equal(body.result.signal, "session-fixed-id-rotated");
  assert.equal(body.result.inspection.rotatedSessionId, true);
});
