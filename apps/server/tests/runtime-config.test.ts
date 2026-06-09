import assert from "node:assert/strict";
import test from "node:test";

import { getServerPort } from "../src/config/runtime.js";

test("server default port is 6667", () => {
  assert.equal(getServerPort({}), 6667);
});

test("server PORT environment variable overrides default port", () => {
  assert.equal(getServerPort({ PORT: "7777" }), 7777);
});
