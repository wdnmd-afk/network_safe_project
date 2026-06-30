import assert from "node:assert/strict";
import { after, test } from "node:test";

import { createApp } from "../src/app.js";
import {
  createPathTraversalLabService,
  type PathTraversalResult,
} from "../src/services/path-traversal-lab.js";
import type { LabEventInput } from "../src/services/lab-event-logs.js";

const demoUser = {
  id: "1",
  username: "demo_user",
  displayName: "演示用户",
  role: "member",
  status: "active",
};

const normalReadInput = {
  userId: "1",
  requestedPath: "user-guide.md",
};

const traversalReadInput = {
  userId: "1",
  requestedPath: "../internal/admin-note.txt",
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

test("path traversal service reads normal public documents in both variants", async () => {
  const service = createPathTraversalLabService();
  const vulnerableResult = await service.readDocument({
    ...normalReadInput,
    variantKey: "vuln",
  });
  const fixedResult = await service.readDocument({
    ...normalReadInput,
    variantKey: "fixed",
  });

  assert.equal(vulnerableResult.status, "ok");
  assert.equal(vulnerableResult.signal, "path-traversal-normal-file-read");
  assert.equal(vulnerableResult.document?.classification, "public");
  assert.equal(fixedResult.status, "ok");
  assert.equal(fixedResult.signal, "path-traversal-normal-file-read");
});

test("path traversal service exposes internal virtual document in the vulnerable variant", async () => {
  const service = createPathTraversalLabService();

  const result = await service.readDocument({
    ...traversalReadInput,
    variantKey: "vuln",
  });

  assert.equal(result.status, "ok");
  assert.equal(result.signal, "path-traversal-sensitive-file-exposed");
  assert.equal(result.decision, "accepted");
  assert.equal(result.inspection.escapedAllowedRoot, true);
  assert.equal(result.resolvedPath, "internal/admin-note.txt");
  assert.equal(result.document?.classification, "internal");
});

test("path traversal service blocks the same path in the fixed variant", async () => {
  const service = createPathTraversalLabService();

  const result = await service.readDocument({
    ...traversalReadInput,
    variantKey: "fixed",
  });

  assert.equal(result.status, "blocked");
  assert.equal(result.signal, "path-traversal-normalized-blocked");
  assert.equal(result.decision, "blocked");
  assert.equal(result.blockedReason, "path-escaped-allowed-root");
  assert.equal(result.document, null);
});

test("POST /api/labs/web/path-traversal/:variant/read requires login", async () => {
  const app = createApp();
  const origin = await listen(app);

  const response = await fetch(
    `${origin}/api/labs/web/path-traversal/vuln/read`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        requestedPath: "user-guide.md",
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

test("POST /api/labs/web/path-traversal/vuln/read records traversal event logs", async () => {
  const labEventLogCalls: LabEventInput[] = [];
  const app = createApp({
    authService: {
      login: async () => null,
      getCurrentUser: async (token: string) =>
        token === "local-session-token" ? demoUser : null,
    },
    pathTraversalLabService: {
      readDocument: async (): Promise<PathTraversalResult> => ({
        status: "ok",
        variantKey: "vuln",
        requestedPath: "../internal/admin-note.txt",
        resolvedPath: "internal/admin-note.txt",
        inspection: {
          allowedRoot: "public",
          normalizedPath: "internal/admin-note.txt",
          containsTraversalSequence: true,
          escapedAllowedRoot: true,
          requestedPathLength: 26,
        },
        document: {
          path: "internal/admin-note.txt",
          title: "内部运维备忘录",
          classification: "internal",
          content: "internal training note",
          isSensitive: true,
        },
        signal: "path-traversal-sensitive-file-exposed",
        decision: "accepted",
        message: "internal virtual document exposed",
        nextStep: "compare fixed variant",
      }),
    },
    labEventLogsService: {
      recordLabEvent: async (input: LabEventInput) => {
        labEventLogCalls.push(input);

        return {
          traceId: input.traceId ?? "generated-trace",
          persisted: true,
          labId: "5",
        };
      },
    },
  });
  const origin = await listen(app);

  const response = await fetch(
    `${origin}/api/labs/web/path-traversal/vuln/read`,
    {
      method: "POST",
      headers: {
        authorization: "Bearer local-session-token",
        "content-type": "application/json",
        "x-lab-trace-id": "trace-path-traversal-vuln",
      },
      body: JSON.stringify({
        requestedPath: "../internal/admin-note.txt",
      }),
    },
  );
  const body = (await response.json()) as {
    status: string;
    result: PathTraversalResult;
  };

  assert.equal(response.status, 200);
  assert.equal(body.status, "ok");
  assert.equal(body.result.signal, "path-traversal-sensitive-file-exposed");
  assert.deepEqual(labEventLogCalls, [
    {
      traceId: "trace-path-traversal-vuln",
      userId: "1",
      labKey: "web.path-traversal",
      variantKey: "vuln",
      phase: "attack",
      eventType: "success",
      actorPerspective: "attacker",
      method: "POST",
      path: "/api/labs/web/path-traversal/vuln/read",
      inputSummary: {
        requestedPathLength: 26,
        requestedPathPreview: "controlled-path-traversal-sample",
        normalizedPath: "internal/admin-note.txt",
        containsTraversalSequence: true,
        escapedAllowedRoot: true,
        signal: "path-traversal-sensitive-file-exposed",
      },
      decision: "accepted",
      signal: "path-traversal-sensitive-file-exposed",
      statusCode: 200,
      message: "internal virtual document exposed",
      riskLevel: "high",
    },
  ]);
});

test("POST /api/labs/web/path-traversal/fixed/read returns blocked response", async () => {
  const app = createApp({
    authService: {
      login: async () => null,
      getCurrentUser: async () => demoUser,
    },
    pathTraversalLabService: {
      readDocument: async (): Promise<PathTraversalResult> => ({
        status: "blocked",
        variantKey: "fixed",
        requestedPath: "../internal/admin-note.txt",
        resolvedPath: "internal/admin-note.txt",
        inspection: {
          allowedRoot: "public",
          normalizedPath: "internal/admin-note.txt",
          containsTraversalSequence: true,
          escapedAllowedRoot: true,
          requestedPathLength: 26,
        },
        document: null,
        signal: "path-traversal-normalized-blocked",
        decision: "blocked",
        message: "fixed variant blocked traversal",
        nextStep: "review normalization",
        blockedReason: "path-escaped-allowed-root",
      }),
    },
    labEventLogsService: {
      recordLabEvent: async (input: LabEventInput) => ({
        traceId: input.traceId ?? "generated-trace",
        persisted: true,
        labId: "5",
      }),
    },
  });
  const origin = await listen(app);

  const response = await fetch(
    `${origin}/api/labs/web/path-traversal/fixed/read`,
    {
      method: "POST",
      headers: {
        authorization: "Bearer local-session-token",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        requestedPath: "../internal/admin-note.txt",
      }),
    },
  );
  const body = (await response.json()) as {
    status: string;
    result: PathTraversalResult;
  };

  assert.equal(response.status, 403);
  assert.equal(body.status, "blocked");
  assert.equal(body.result.signal, "path-traversal-normalized-blocked");
});
