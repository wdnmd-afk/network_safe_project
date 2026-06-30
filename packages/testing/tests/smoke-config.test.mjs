import assert from "node:assert/strict";
import test from "node:test";

import {
  expectedLabTotal,
  smokeChecks,
  smokeRuntime,
} from "../src/smoke/config.mjs";

test("smoke runtime uses local frontend and backend ports", () => {
  assert.equal(smokeRuntime.webOrigin, "http://127.0.0.1:6670");
  assert.equal(smokeRuntime.apiOrigin, "http://127.0.0.1:6667");
});

test("smoke checks cover web home, backend health, labs API, and frontend proxy", () => {
  const checkNames = smokeChecks.map((check) => check.name);

  assert.deepEqual(checkNames, [
    "web-home",
    "api-health-direct",
    "api-labs-direct",
    "api-health-proxy",
  ]);
});

test("labs API smoke check expects the current local metadata count", () => {
  const labsCheck = smokeChecks.find((check) => check.name === "api-labs-direct");

  assert.ok(expectedLabTotal > 0);
  assert.equal(labsCheck?.expectedJson.total, expectedLabTotal);
});
