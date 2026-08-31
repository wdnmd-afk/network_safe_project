import assert from "node:assert/strict";
import { after, test } from "node:test";

import { createApp } from "../src/app.js";

type PlatformInfoResponse = {
  status: string;
  build: {
    service: string;
    version: string;
    nodeVersion: string;
    appEnv: string;
    startedAt: string;
    uptimeSeconds: number;
  };
  data: {
    labs: number;
    categories: number;
    enabledVariants: number;
    webEntrypoints: number;
    apiEntrypoints: number;
    statusCounts: Record<string, number>;
    modeCounts: Record<string, number>;
  };
  consistency: {
    status: string;
    labsMissingWebEntrypoint: string[];
    enabledVariantsWithoutEntry: number;
    inProgressLabs: number;
  };
  timestamp: string;
};

async function fetchPlatformInfo() {
  const app = createApp();
  const server = app.listen(0);
  after(() => {
    server.close();
  });

  const address = server.address();
  assert.ok(address && typeof address === "object");

  const response = await fetch(
    `http://127.0.0.1:${address.port}/api/platform-info`,
  );
  const text = await response.text();

  return {
    response,
    text,
    body: JSON.parse(text) as PlatformInfoResponse,
  };
}

test("GET /api/platform-info returns build and runtime metadata", async () => {
  const { response, body } = await fetchPlatformInfo();

  assert.equal(response.status, 200);
  assert.equal(body.status, "ok");
  assert.equal(body.build.service, "@network-safe/server");
  assert.match(body.build.version, /^\d+\.\d+\.\d+$/);
  assert.match(body.build.nodeVersion, /^v\d+\./);
  assert.ok(body.build.appEnv.length > 0);
  assert.match(body.build.startedAt, /^\d{4}-\d{2}-\d{2}T/);
  assert.ok(Number.isInteger(body.build.uptimeSeconds));
  assert.ok(body.build.uptimeSeconds >= 0);
  assert.match(body.timestamp, /^\d{4}-\d{2}-\d{2}T/);
});

test("GET /api/platform-info reports data version consistent with the registry", async () => {
  const { body } = await fetchPlatformInfo();

  // 计数应与元数据真实规模一致；这里只断言结构与正数，避免把断言绑死在
  // 具体数量上——实验数量会随后续切片增长，硬编码会造成无谓的维护成本。
  assert.ok(body.data.labs > 0);
  assert.ok(body.data.categories > 0);
  assert.ok(body.data.enabledVariants >= body.data.labs);
  assert.ok(body.data.webEntrypoints >= body.data.labs);
  assert.ok(body.data.apiEntrypoints > 0);

  // 状态与模式分布之和必须等于实验总数，否则聚合逻辑漏算
  const statusTotal = Object.values(body.data.statusCounts).reduce(
    (sum, count) => sum + count,
    0,
  );
  const modeTotal = Object.values(body.data.modeCounts).reduce(
    (sum, count) => sum + count,
    0,
  );
  assert.equal(statusTotal, body.data.labs);
  assert.equal(modeTotal, body.data.labs);
});

test("GET /api/platform-info reports directory consistency status", async () => {
  const { body } = await fetchPlatformInfo();

  assert.ok(
    body.consistency.status === "consistent" ||
      body.consistency.status === "needs-attention",
  );
  assert.ok(Array.isArray(body.consistency.labsMissingWebEntrypoint));
  assert.ok(Number.isInteger(body.consistency.enabledVariantsWithoutEntry));
  assert.ok(Number.isInteger(body.consistency.inProgressLabs));

  // 当前仓库应为一致状态；若此断言失败说明真的出现了入口或状态漂移
  assert.equal(
    body.consistency.status,
    "consistent",
    `目录一致性异常：${JSON.stringify(body.consistency)}`,
  );
});

test("GET /api/platform-info never leaks secrets or local paths", async () => {
  const { text } = await fetchPlatformInfo();

  // 该接口无需登录即可访问，因此秘密不泄露是硬性要求而非可选项
  const forbiddenPatterns = [
    /mysql:\/\//i,
    /password/i,
    /DATABASE_URL/,
    /AUTH_TOKEN_SECRET/,
    /MYSQL_CLI_PATH/,
    /[A-Za-z]:\\\\/, // Windows 绝对路径
    /\/home\//,
    /\/Users\//,
  ];

  for (const pattern of forbiddenPatterns) {
    assert.equal(
      pattern.test(text),
      false,
      `响应中出现了禁止的内容，匹配 ${pattern}`,
    );
  }

  // 逐一确认真实环境变量取值未被带入响应
  for (const name of [
    "DATABASE_URL",
    "AUTH_TOKEN_SECRET",
    "MYSQL_CLI_PATH",
  ] as const) {
    const value = process.env[name];
    if (value && value.length > 3) {
      assert.equal(
        text.includes(value),
        false,
        `响应中出现了 ${name} 的取值`,
      );
    }
  }
});
