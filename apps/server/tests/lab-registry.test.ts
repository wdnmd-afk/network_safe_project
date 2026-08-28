import assert from "node:assert/strict";
import test from "node:test";

import { createLabRegistry } from "../src/services/lab-registry.js";

test("lab registry scans all current metadata files", async () => {
  const registry = createLabRegistry();
  const labs = await registry.listLabs();
  const labIds = labs.map((lab) => lab.id);

  assert.equal(labs.length, 75);
  assert.equal(new Set(labIds).size, 75);
  assert.equal(labs.filter((lab) => lab.status === "ready").length, 75);
  assert.equal(
    labs.filter((lab) => lab.status === "in-progress").length,
    0,
  );
  assert.equal(new Set(labs.map((lab) => lab.category)).size, 14);
  assert.equal(
    labs.reduce((total, lab) => total + lab.variants.length, 0),
    150,
  );
  assert.ok(labIds.includes("ai.prompt-injection"));
  assert.ok(labIds.includes("auth.brute-force"));
  assert.ok(
    labs.some(
      (lab) =>
        lab.id === "api.functional-authorization" &&
        lab.status === "ready",
    ),
  );
  assert.ok(
    labs.some(
      (lab) =>
        lab.id === "business-logic.workflow-bypass" &&
        lab.status === "ready",
    ),
  );
  assert.ok(
    labs.some(
      (lab) =>
        lab.id === "crypto.insecure-randomness" &&
        lab.status === "ready",
    ),
  );
  assert.ok(
    labs.some(
      (lab) =>
        lab.id === "detection.rule-alert-triage" && lab.status === "ready",
    ),
  );
  assert.ok(
    labs.some(
      (lab) =>
        lab.id === "host.service-permission-audit" && lab.status === "ready",
    ),
  );
  assert.ok(
    labs.some(
      (lab) =>
        lab.id === "infrastructure.iam-policy-audit" &&
        lab.status === "ready",
    ),
  );
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
        lab.id === "social.spear-phishing" && lab.status === "ready",
    ),
  );
  assert.ok(
    labs.some(
      (lab) => lab.id === "social.whaling" && lab.status === "ready",
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
  assert.ok(
    labs.some(
      (lab) => lab.id === "malware.ransomware" && lab.status === "ready",
    ),
  );
  assert.ok(
    labs.some(
      (lab) => lab.id === "client.formjacking" && lab.status === "ready",
    ),
  );
  assert.ok(labs.some((lab) => lab.id === "api.property-authorization" && lab.status === "ready"));
  assert.ok(labs.some((lab) => lab.id === "business-logic.race-condition" && lab.status === "ready"));
  assert.ok(labs.some((lab) => lab.id === "crypto.secret-lifecycle-audit" && lab.status === "ready"));
  assert.ok(labs.some((lab) => lab.id === "host.event-log-triage" && lab.status === "ready"));
  assert.ok(
    labs.some(
      (lab) =>
        lab.id === "infrastructure.zero-day" && lab.status === "ready",
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
