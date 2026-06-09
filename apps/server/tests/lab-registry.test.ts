import assert from "node:assert/strict";
import test from "node:test";

import { createLabRegistry } from "../src/services/lab-registry.js";

test("lab registry scans phase-one metadata files", async () => {
  const registry = createLabRegistry();
  const labs = await registry.listLabs();

  assert.equal(labs.length, 15);
  assert.equal(labs[0]?.id, "auth.brute-force");
  assert.equal(labs.at(-1)?.id, "web.xxe");
});

test("lab registry finds a lab by category and scene", async () => {
  const registry = createLabRegistry();
  const lab = await registry.getLab("web", "xss");

  assert.ok(lab);
  assert.equal(lab.id, "web.xss");
  assert.equal(lab.variants.length, 2);
});
