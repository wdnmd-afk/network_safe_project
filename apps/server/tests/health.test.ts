import assert from "node:assert/strict";
import { after, test } from "node:test";

import { createApp } from "../src/app.js";

type HealthResponse = {
  status: string;
  service: string;
  timestamp: string;
};

type DatabaseHealthResponse = {
  status: string;
  service: string;
  database: {
    status: string;
  };
  timestamp: string;
};

test("GET /api/health returns server status", async () => {
  const app = createApp();
  const server = app.listen(0);
  after(() => {
    server.close();
  });

  const address = server.address();

  assert.ok(address && typeof address === "object");

  const response = await fetch(`http://127.0.0.1:${address.port}/api/health`);
  const body = (await response.json()) as HealthResponse;

  assert.equal(response.status, 200);
  assert.equal(body.status, "ok");
  assert.equal(body.service, "server");
  assert.match(body.timestamp, /^\d{4}-\d{2}-\d{2}T/);
});

test("GET /api/health/db returns database status", async () => {
  const app = createApp({
    checkDatabaseHealth: async () => ({
      status: "ok",
    }),
  });
  const server = app.listen(0);
  after(() => {
    server.close();
  });

  const address = server.address();

  assert.ok(address && typeof address === "object");

  const response = await fetch(`http://127.0.0.1:${address.port}/api/health/db`);
  const body = (await response.json()) as DatabaseHealthResponse;

  assert.equal(response.status, 200);
  assert.equal(body.status, "ok");
  assert.equal(body.service, "server");
  assert.equal(body.database.status, "ok");
  assert.match(body.timestamp, /^\d{4}-\d{2}-\d{2}T/);
});

test("GET /api/labs returns scanned lab metadata list", async () => {
  const app = createApp();
  const server = app.listen(0);
  after(() => {
    server.close();
  });

  const address = server.address();

  assert.ok(address && typeof address === "object");

  const response = await fetch(`http://127.0.0.1:${address.port}/api/labs`);
  const body = (await response.json()) as {
    items: Array<{
      id: string;
      category: string;
      subcategory: string;
      status: string;
    }>;
    total: number;
  };

  assert.equal(response.status, 200);
  assert.equal(body.total, 25);
  assert.ok(
    body.items.some(
      (item) =>
        item.id === "ai.prompt-injection" && item.status === "ready",
    ),
  );
  assert.ok(
    body.items.some(
      (item) =>
        item.id === "network.dns-hijack" && item.status === "ready",
    ),
  );
  assert.ok(
    body.items.some(
      (item) =>
        item.id === "infrastructure.misconfiguration" &&
        item.status === "planned",
    ),
  );
  assert.ok(
    body.items.some(
      (item) =>
        item.id === "network.port-scan" && item.status === "ready",
    ),
  );
  assert.ok(
    body.items.some(
      (item) => item.id === "social.phishing" && item.status === "ready",
    ),
  );
  assert.ok(
    body.items.some(
      (item) =>
        item.id === "supply-chain.dependency-confusion" &&
        item.status === "ready",
    ),
  );
  assert.ok(body.items.some((item) => item.id === "web.xss"));
  assert.ok(
    body.items.some(
      (item) =>
        item.id === "web.crlf-injection" && item.status === "ready",
    ),
  );
  assert.ok(
    body.items.some(
      (item) =>
        item.id === "web.nosql-injection" && item.status === "ready",
    ),
  );
  assert.ok(
    body.items.some(
      (item) =>
        item.id === "web.xpath-injection" && item.status === "ready",
    ),
  );
  assert.ok(
    body.items.some(
      (item) =>
        item.id === "web.ldap-injection" && item.status === "ready",
    ),
  );
});

test("GET /api/labs/:category/:scene returns one lab", async () => {
  const app = createApp();
  const server = app.listen(0);
  after(() => {
    server.close();
  });

  const address = server.address();

  assert.ok(address && typeof address === "object");

  const response = await fetch(
    `http://127.0.0.1:${address.port}/api/labs/web/xss`,
  );
  const body = (await response.json()) as {
    id: string;
    title: string;
  };

  assert.equal(response.status, 200);
  assert.equal(body.id, "web.xss");
  assert.equal(body.title, "XSS");
});

test("GET /api/labs/:category/:scene returns 404 for unknown lab", async () => {
  const app = createApp();
  const server = app.listen(0);
  after(() => {
    server.close();
  });

  const address = server.address();

  assert.ok(address && typeof address === "object");

  const response = await fetch(
    `http://127.0.0.1:${address.port}/api/labs/web/not-found`,
  );
  const body = (await response.json()) as {
    status: string;
    message: string;
  };

  assert.equal(response.status, 404);
  assert.equal(body.status, "error");
  assert.equal(body.message, "lab not found");
});
