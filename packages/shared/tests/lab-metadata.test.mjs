import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import {
  labMetadataStatuses,
  parseLabMetadataJson,
  validateLabMetadata,
} from "../src/lab-metadata.js";

async function readFixture(relativePath) {
  const filePath = path.resolve(process.cwd(), "../..", relativePath);
  const result = parseLabMetadataJson(await readFile(filePath, "utf8"));

  assert.equal(result.ok, true);

  return result.value;
}

test("validateLabMetadata accepts existing xss metadata", async () => {
  const metadata = await readFixture("labs/web/xss/meta.json");
  const result = validateLabMetadata(metadata);

  assert.equal(result.ok, true);
  assert.equal(result.value.id, "web.xss");
  assert.equal(result.value.variants.length, 2);
});

test("xss metadata declares active automation and script verification entries", async () => {
  const metadata = await readFixture("labs/web/xss/meta.json");
  const result = validateLabMetadata(metadata);

  assert.equal(result.ok, true);
  assert.equal(result.value.status, "ready");
  assert.equal(result.value.verification.automation.supported, true);
  assert.deepEqual(result.value.verification.automation.playwright, {
    enabled: true,
    specPath: "packages/testing/tests/e2e/platform.spec.mjs",
  });
  assert.deepEqual(result.value.verification.automation.scriptVerification, {
    enabled: true,
    scriptKeys: ["xss-verify"],
  });
  assert.deepEqual(result.value.entrypoints.scripts, [
    {
      key: "xss-verify",
      language: "ts",
      path: "tools/lab-scripts/web/xss/verify.ts",
      description: "本机受控 XSS 漏洞版与修复版差异验证配置",
    },
  ]);
});

test("validateLabMetadata rejects missing required fields", () => {
  const result = validateLabMetadata({
    id: "web.demo",
    title: "Demo",
  });

  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /slug/);
  assert.match(result.errors.join("\n"), /category/);
});

test("labMetadataStatuses exposes documented status values", () => {
  assert.deepEqual(labMetadataStatuses, [
    "planned",
    "in-progress",
    "ready",
    "deprecated",
  ]);
});

test("parseLabMetadataJson accepts utf8 bom json", () => {
  const result = parseLabMetadataJson('\uFEFF{"id":"web.demo"}');

  assert.deepEqual(result, {
    ok: true,
    value: {
      id: "web.demo",
    },
  });
});
