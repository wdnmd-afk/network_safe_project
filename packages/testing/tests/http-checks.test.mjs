import assert from "node:assert/strict";
import { createServer } from "node:http";
import test from "node:test";

import { waitForCheck } from "../src/smoke/http-checks.mjs";

function createDelayedTextServer(delayMs, body) {
  const server = createServer((_req, res) => {
    setTimeout(() => {
      res.writeHead(200, {
        "content-type": "text/plain; charset=utf-8",
      });
      res.end(body);
    }, delayMs);
  });

  return server;
}

test("waitForCheck allows request timeout to be longer than retry interval", async () => {
  const server = createDelayedTextServer(300, "SafeMart");

  await new Promise((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });

  try {
    const address = server.address();

    assert.ok(address && typeof address === "object");

    const result = await waitForCheck(
      {
        name: "delayed-web-home",
        url: `http://127.0.0.1:${address.port}/`,
        kind: "text",
        expectedText: "SafeMart",
      },
      {
        timeoutMs: 1200,
        intervalMs: 50,
        requestTimeoutMs: 600,
      },
    );

    assert.equal(result.status, 200);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
