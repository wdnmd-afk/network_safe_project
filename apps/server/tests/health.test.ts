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
