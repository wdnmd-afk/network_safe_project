import assert from "node:assert/strict";
import { after, test } from "node:test";

import { createApp } from "../src/app.js";
import type { FileUploadResult } from "../src/services/file-upload-lab.js";
import { createFileUploadLabService } from "../src/services/file-upload-lab.js";
import type { LabEventInput } from "../src/services/lab-event-logs.js";

const demoUser = {
  id: "1",
  username: "demo_user",
  displayName: "演示用户",
  role: "member",
  status: "active",
};

const normalImageInput = {
  userId: "1",
  fileName: "avatar.png",
  contentType: "image/png",
  contentText: "PNG image bytes for local learning sample",
};

const dangerousUploadInput = {
  userId: "1",
  fileName: "shell.php",
  contentType: "application/x-php",
  contentText: "<?php echo 'local controlled sample'; ?>",
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

test("file upload service accepts normal image samples in both variants", async () => {
  const service = createFileUploadLabService();
  const vulnerableResult = await service.submitUpload({
    ...normalImageInput,
    variantKey: "vuln",
  });
  const fixedResult = await service.submitUpload({
    ...normalImageInput,
    variantKey: "fixed",
  });

  assert.equal(vulnerableResult.status, "ok");
  assert.equal(vulnerableResult.signal, "file-upload-normal-image-stored");
  assert.equal(fixedResult.status, "ok");
  assert.equal(fixedResult.signal, "file-upload-normal-image-stored");
});

test("file upload service stores dangerous samples in the vulnerable variant", async () => {
  const service = createFileUploadLabService();

  const result = await service.submitUpload({
    ...dangerousUploadInput,
    variantKey: "vuln",
  });

  assert.equal(result.status, "ok");
  assert.equal(result.signal, "file-upload-executable-stored");
  assert.equal(result.decision, "accepted");
  assert.equal(result.inspection.allowedExtension, false);
  assert.equal(result.inspection.allowedContentType, false);
  assert.equal(result.inspection.detectedExecutableContent, true);
  assert.ok(result.storedAsset?.storagePath.includes("/simulated-uploads/vuln/"));
});

test("file upload service blocks dangerous samples in the fixed variant", async () => {
  const service = createFileUploadLabService();

  const result = await service.submitUpload({
    ...dangerousUploadInput,
    variantKey: "fixed",
  });

  assert.equal(result.status, "blocked");
  assert.equal(result.signal, "file-upload-validation-blocked");
  assert.equal(result.decision, "blocked");
  assert.equal(result.blockedReason, "file-validation-failed");
  assert.equal(result.storedAsset, null);
});

test("POST /api/labs/web/file-upload/:variant/upload requires login", async () => {
  const app = createApp();
  const origin = await listen(app);

  const response = await fetch(
    `${origin}/api/labs/web/file-upload/vuln/upload`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        fileName: "avatar.png",
        contentType: "image/png",
        contentText: "PNG image bytes for local learning sample",
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

test("POST /api/labs/web/file-upload/vuln/upload records dangerous upload event logs", async () => {
  const labEventLogCalls: LabEventInput[] = [];
  const app = createApp({
    authService: {
      login: async () => null,
      getCurrentUser: async (token: string) =>
        token === "local-session-token" ? demoUser : null,
    },
    fileUploadLabService: {
      submitUpload: async (): Promise<FileUploadResult> => ({
        status: "ok",
        variantKey: "vuln",
        fileName: "shell.php",
        contentType: "application/x-php",
        inspection: {
          extension: ".php",
          allowedExtension: false,
          allowedContentType: false,
          detectedExecutableContent: true,
          contentLength: 38,
        },
        storedAsset: {
          originalName: "shell.php",
          storedName: "vuln-1-shell.php",
          storagePath: "/simulated-uploads/vuln/vuln-1-shell.php",
          publicUrl: "/uploads/vuln/vuln-1-shell.php",
        },
        signal: "file-upload-executable-stored",
        decision: "accepted",
        message: "dangerous upload accepted by vulnerable variant",
        nextStep: "compare fixed variant",
      }),
    },
    labEventLogsService: {
      recordLabEvent: async (input: LabEventInput) => {
        labEventLogCalls.push(input);

        return {
          traceId: input.traceId ?? "generated-trace",
          persisted: true,
          labId: "4",
        };
      },
    },
  });
  const origin = await listen(app);

  const response = await fetch(
    `${origin}/api/labs/web/file-upload/vuln/upload`,
    {
      method: "POST",
      headers: {
        authorization: "Bearer local-session-token",
        "content-type": "application/json",
        "x-lab-trace-id": "trace-file-upload-vuln",
      },
      body: JSON.stringify({
        fileName: "shell.php",
        contentType: "application/x-php",
        contentText: "<?php echo 'local controlled sample'; ?>",
      }),
    },
  );
  const body = (await response.json()) as {
    status: string;
    result: FileUploadResult;
  };

  assert.equal(response.status, 200);
  assert.equal(body.status, "ok");
  assert.equal(body.result.signal, "file-upload-executable-stored");
  assert.deepEqual(labEventLogCalls, [
    {
      traceId: "trace-file-upload-vuln",
      userId: "1",
      labKey: "web.file-upload",
      variantKey: "vuln",
      phase: "attack",
      eventType: "success",
      actorPerspective: "attacker",
      method: "POST",
      path: "/api/labs/web/file-upload/vuln/upload",
      inputSummary: {
        fileName: "shell.php",
        contentType: "application/x-php",
        extension: ".php",
        allowedExtension: false,
        allowedContentType: false,
        detectedExecutableContent: true,
        contentLength: 38,
        signal: "file-upload-executable-stored",
      },
      decision: "accepted",
      signal: "file-upload-executable-stored",
      statusCode: 200,
      message: "dangerous upload accepted by vulnerable variant",
      riskLevel: "high",
    },
  ]);
});

test("POST /api/labs/web/file-upload/fixed/upload returns blocked response", async () => {
  const app = createApp({
    authService: {
      login: async () => null,
      getCurrentUser: async () => demoUser,
    },
    fileUploadLabService: {
      submitUpload: async (): Promise<FileUploadResult> => ({
        status: "blocked",
        variantKey: "fixed",
        fileName: "shell.php",
        contentType: "application/x-php",
        inspection: {
          extension: ".php",
          allowedExtension: false,
          allowedContentType: false,
          detectedExecutableContent: true,
          contentLength: 38,
        },
        storedAsset: null,
        signal: "file-upload-validation-blocked",
        decision: "blocked",
        message: "fixed variant blocked dangerous upload",
        nextStep: "review validation rules",
        blockedReason: "file-validation-failed",
      }),
    },
    labEventLogsService: {
      recordLabEvent: async (input: LabEventInput) => ({
        traceId: input.traceId ?? "generated-trace",
        persisted: true,
        labId: "4",
      }),
    },
  });
  const origin = await listen(app);

  const response = await fetch(
    `${origin}/api/labs/web/file-upload/fixed/upload`,
    {
      method: "POST",
      headers: {
        authorization: "Bearer local-session-token",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        fileName: "shell.php",
        contentType: "application/x-php",
        contentText: "<?php echo 'local controlled sample'; ?>",
      }),
    },
  );
  const body = (await response.json()) as {
    status: string;
    result: FileUploadResult;
  };

  assert.equal(response.status, 403);
  assert.equal(body.status, "blocked");
  assert.equal(body.result.signal, "file-upload-validation-blocked");
});
