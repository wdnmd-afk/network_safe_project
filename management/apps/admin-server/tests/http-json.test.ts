import assert from "node:assert/strict";
import http from "node:http";
import { after, test } from "node:test";

import { requestJson } from "../src/lib/http-json.js";

async function startJsonServer(payload: unknown, status = 200) {
  const server = http.createServer((_req, res) => {
    res.writeHead(status, { "content-type": "application/json" });
    res.end(JSON.stringify(payload));
  });

  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });

  after(() => {
    server.close();
  });

  const address = server.address();

  assert.ok(address && typeof address === "object");

  return `http://127.0.0.1:${address.port}`;
}

test("requestJson 读取 JSON 响应", async () => {
  const origin = await startJsonServer({ status: "ok", value: 7 });
  const result = await requestJson(`${origin}/api/platform-info`, 2000);

  assert.equal(result.ok, true);
  assert.equal(result.status, 200);
  assert.deepEqual(result.body, { status: "ok", value: 7 });
});

test("requestJson 在非 2xx 时返回 ok=false 而不是抛错", async () => {
  const origin = await startJsonServer({ status: "error" }, 503);
  const result = await requestJson(`${origin}/api/platform-info`, 2000);

  assert.equal(result.ok, false);
  assert.equal(result.status, 503);
});

test("requestJson 在响应不是 JSON 时返回 ok=false", async () => {
  const server = http.createServer((_req, res) => {
    res.writeHead(200, { "content-type": "text/html" });
    res.end("<html>not json</html>");
  });

  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });

  after(() => {
    server.close();
  });

  const address = server.address();

  assert.ok(address && typeof address === "object");

  const result = await requestJson(
    `http://127.0.0.1:${address.port}/api/platform-info`,
    2000,
  );

  assert.equal(result.ok, false);
});

/**
 * 记录「为什么不用 fetch」这条约束。
 *
 * Node 的 fetch 按 Fetch 规范拦截坏端口，而主站固定端口 6667 属于 6665–6669
 * 这段被拦名单。若该断言某天失败（Node 放开了限制），本文件与 app.ts 的注释
 * 就可以简化回 fetch。
 */
test("全局 fetch 拒绝主站端口 6667，因此主站探测必须走 node:http", async () => {
  await assert.rejects(
    () => fetch("http://127.0.0.1:6667/api/health"),
    (error: unknown) => {
      const cause = (error as { cause?: { message?: string } }).cause;
      return cause?.message === "bad port" || (error as Error).name === "TypeError";
    },
  );
});
