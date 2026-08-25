import assert from "node:assert/strict";
import test from "node:test";

import type { LabMetadata } from "@network-safe/shared/lab-metadata";

import {
  matchApiRoutePath,
  verifyApiEntrypointConsistency,
  type ApiRouteRecord,
} from "../src/api-entrypoint-consistency.js";
import { verifyRepositoryApiEntrypoints } from "../../../tools/entrypoints/verify-api-entrypoints.js";

function createMetadata(): LabMetadata {
  return {
    id: "sample.demo",
    slug: "demo",
    title: "示例实验",
    category: "sample",
    subcategory: "demo",
    mode: "simulation",
    severity: "low",
    difficulty: "beginner",
    summary: "示例",
    status: "ready",
    tags: [],
    knowledgePoints: [],
    variants: [
      {
        key: "vuln",
        title: "漏洞版",
        enabled: true,
        description: "漏洞版",
        entryKey: "sample-demo-vuln",
        expectedOutcome: "风险",
        supportsAutomation: false,
      },
      {
        key: "fixed",
        title: "修复版",
        enabled: true,
        description: "修复版",
        entryKey: "sample-demo-fixed",
        expectedOutcome: "阻断",
        supportsAutomation: false,
      },
    ],
    entrypoints: {
      web: [],
      api: [
        {
          key: "sample-demo-workbench",
          variant: "shared",
          method: "GET",
          path: "/api/labs/sample/demo/workbench",
          description: "工作台",
        },
        {
          key: "sample-demo-vuln-evaluate",
          variant: "vuln",
          method: "POST",
          path: "/api/labs/sample/demo/vuln/evaluate",
          description: "漏洞评估",
        },
        {
          key: "sample-demo-fixed-evaluate",
          variant: "fixed",
          method: "POST",
          path: "/api/labs/sample/demo/fixed/evaluate",
          description: "修复评估",
        },
      ],
      scripts: [],
      docs: [],
    },
    verification: {
      manual: {
        supported: true,
        stepsDocPath: "labs/sample/demo/docs/manual-verification.md",
        expectedSignals: [],
      },
      automation: { supported: false },
    },
    prerequisites: [],
    paths: {
      root: "labs/sample/demo",
      readme: "labs/sample/demo/README.md",
      vuln: "labs/sample/demo/vuln",
      fixed: "labs/sample/demo/fixed",
      mock: "labs/sample/demo/mock",
      docs: "labs/sample/demo/docs",
      scripts: "tools/lab-scripts/sample/demo",
    },
  };
}

function createRoutes(): ApiRouteRecord[] {
  return [
    {
      id: "GET /api/labs/sample/demo/workbench#0",
      index: 0,
      method: "GET",
      path: "/api/labs/sample/demo/workbench",
    },
    {
      id: "POST /api/labs/sample/demo/:variant/evaluate#1",
      index: 1,
      method: "POST",
      path: "/api/labs/sample/demo/:variant/evaluate",
    },
  ];
}

test("API route matcher resolves Express parameters", () => {
  assert.deepEqual(
    matchApiRoutePath(
      "/api/labs/:category/:scene/:variant/evaluate",
      "/api/labs/sample/demo/fixed/evaluate",
    ),
    { category: "sample", scene: "demo", variant: "fixed" },
  );
});

test("API entrypoint verifier accepts a complete fixed contract", () => {
  const report = verifyApiEntrypointConsistency([createMetadata()], createRoutes());

  assert.equal(report.ok, true, report.errors.map((error) => error.message).join("\n"));
  assert.equal(report.apiEntrypointCount, 3);
  assert.equal(report.matchedEntrypointCount, 3);
  assert.equal(report.coveredLabRouteCount, 2);
});

test("API entrypoint verifier reports method and variant mismatches", () => {
  const metadata = createMetadata();
  metadata.entrypoints.api[1].method = "GET";
  metadata.entrypoints.api[2].variant = "vuln";
  const report = verifyApiEntrypointConsistency([metadata], createRoutes());
  const codes = report.errors.map((error) => error.code);

  assert.ok(codes.includes("missing-api-route"));
  assert.ok(codes.includes("api-entry-variant-path-mismatch"));
});

test("API entrypoint verifier reports duplicate contracts and orphan routes", () => {
  const metadata = createMetadata();
  metadata.entrypoints.api.push({ ...metadata.entrypoints.api[0] });
  const routes = [
    ...createRoutes(),
    {
      id: "POST /api/labs/sample/demo/:variant/orphan#2",
      index: 2,
      method: "POST",
      path: "/api/labs/sample/demo/:variant/orphan",
    },
  ];
  const report = verifyApiEntrypointConsistency([metadata], routes);
  const codes = report.errors.map((error) => error.code);

  assert.ok(codes.includes("duplicate-api-entry-key"));
  assert.ok(codes.includes("duplicate-api-entry-contract"));
  assert.ok(codes.includes("orphan-lab-api-route"));
});

test("repository API entrypoints match the registered Express routes", () => {
  const report = verifyRepositoryApiEntrypoints();

  assert.equal(report.ok, true, report.errors.map((error) => error.message).join("\n"));
  assert.equal(report.labCount, 75);
  assert.equal(report.apiEntrypointCount, 198);
  assert.equal(report.matchedEntrypointCount, 198);
  assert.equal(report.coveredLabRouteCount, report.labRouteCount);
});
