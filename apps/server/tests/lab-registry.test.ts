import assert from "node:assert/strict";
import test from "node:test";

import { createLabRegistry } from "../src/services/lab-registry.js";

test("lab registry scans phase-one metadata files", async () => {
  const registry = createLabRegistry();
  const labs = await registry.listLabs();

  assert.equal(labs.length, 25);
  assert.equal(labs[0]?.id, "ai.prompt-injection");
  assert.equal(labs[0]?.status, "ready");
  assert.equal(labs[1]?.id, "auth.brute-force");
  assert.ok(
    labs.some(
      (lab) =>
        lab.id === "infrastructure.misconfiguration" &&
        lab.status === "ready",
    ),
  );
  assert.ok(
    labs.some(
      (lab) => lab.id === "network.dns-hijack" && lab.status === "ready",
    ),
  );
  assert.ok(
    labs.some(
      (lab) => lab.id === "network.port-scan" && lab.status === "ready",
    ),
  );
  assert.ok(
    labs.some(
      (lab) => lab.id === "social.phishing" && lab.status === "ready",
    ),
  );
  assert.ok(
    labs.some(
      (lab) =>
        lab.id === "supply-chain.dependency-confusion" &&
        lab.status === "ready",
    ),
  );
  assert.ok(
    labs.some(
      (lab) => lab.id === "web.crlf-injection" && lab.status === "ready",
    ),
  );
  assert.ok(
    labs.some(
      (lab) => lab.id === "web.nosql-injection" && lab.status === "ready",
    ),
  );
  assert.ok(
    labs.some(
      (lab) => lab.id === "web.xpath-injection" && lab.status === "ready",
    ),
  );
  assert.ok(
    labs.some(
      (lab) => lab.id === "web.ldap-injection" && lab.status === "ready",
    ),
  );
  assert.equal(labs.at(-1)?.id, "web.xxe");
});

test("lab registry finds a lab by category and scene", async () => {
  const registry = createLabRegistry();
  const lab = await registry.getLab("web", "xss");

  assert.ok(lab);
  assert.equal(lab.id, "web.xss");
  assert.equal(lab.variants.length, 2);
});
