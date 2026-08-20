import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

import {
  getGuidedScenarioById,
  getGuidedScenarioByRoute,
  guidedScenarioCatalog,
  listGuidedScenarioIds,
} from "../src/guided-scenarios.js";
import { validateLabMetadata } from "../src/lab-metadata.js";

test("guided scenario catalog covers the remaining guided master-goal topics", () => {
  // LT-006～LT-010 把 clickjacking、open-redirect、credential-stuffing、session-hijacking、oauth 专用化；LT-016 把 client.formjacking、LT-017 把 malware.ransomware、LT-027 把 client.mitb 升级为专用并移出引导式目录，因此当前为 30 个引导式场景。
  assert.equal(guidedScenarioCatalog.length, 30);
  assert.equal(new Set(listGuidedScenarioIds()).size, 30);
  assert.equal(getGuidedScenarioById("web.clickjacking"), undefined);
  assert.equal(getGuidedScenarioById("web.open-redirect"), undefined);
  assert.equal(getGuidedScenarioById("auth.credential-stuffing"), undefined);
  assert.equal(getGuidedScenarioById("auth.session-hijacking"), undefined);
  assert.equal(getGuidedScenarioById("auth.oauth"), undefined);
  assert.equal(getGuidedScenarioById("client.formjacking"), undefined);
  assert.equal(getGuidedScenarioById("malware.ransomware"), undefined);
});

test("guided scenario entries expose exact fixed case and control fields", () => {
  for (const scenario of guidedScenarioCatalog) {
    assert.equal(scenario.id, `${scenario.category}.${scenario.subcategory}`);
    assert.equal(scenario.slug, scenario.subcategory);
    assert.equal(scenario.scenarios.length, 1);
    assert.equal(scenario.controls.length, 2);
    assert.equal(scenario.scenarios[0].key, scenario.defaultScenarioKey);
    assert.equal(scenario.controls[0].key, scenario.defaultControlKey);
    assert.equal(scenario.controls[0].fixedDecision, "blocked");
    assert.equal(scenario.controls[1].fixedDecision, "accepted");
    assert.ok(scenario.scenarios[0].riskIndicators.length >= 3);
    assert.ok(scenario.safeBoundaries.length >= 3);
    assert.ok(scenario.vulnerableOutcome.signal.startsWith(scenario.id.replaceAll(".", "-")));
  }
});

test("guided case studies explicitly retain the no attack-script boundary", () => {
  const caseStudies = guidedScenarioCatalog.filter(
    (scenario) => scenario.mode === "case-study",
  );

  assert.ok(caseStudies.length > 0);

  for (const scenario of caseStudies) {
    assert.match(scenario.notes, /case-study ready/);
    assert.match(scenario.notes, /不提供 exploit\.py/);
  }
});

test("guided scenario lookup uses confirmed id and route fields", () => {
  // LT-006~LT-010 已把 clickjacking、open-redirect、credential-stuffing、
  // session-hijacking、oauth 专用化并移出引导式目录。
  const smishing = getGuidedScenarioById("social.smishing");
  const bec = getGuidedScenarioByRoute("social", "bec");

  assert.equal(smishing?.title, "短信钓鱼");
  assert.equal(bec?.id, "social.bec");
  assert.equal(getGuidedScenarioById("auth.oauth"), undefined);
  assert.equal(getGuidedScenarioByRoute("web", "unknown"), undefined);
});

test("all generated guided metadata and standard documents are ready and valid", () => {
  const repoRoot = path.resolve(process.cwd(), "../..");

  for (const scenario of guidedScenarioCatalog) {
    const labRoot = path.join(
      repoRoot,
      "labs",
      scenario.category,
      scenario.subcategory,
    );
    const metadata = JSON.parse(
      readFileSync(path.join(labRoot, "meta.json"), "utf8"),
    );
    const result = validateLabMetadata(metadata);

    assert.equal(result.ok, true, scenario.id);

    if (!result.ok) {
      continue;
    }

    assert.equal(result.value.status, "ready");
    assert.equal(result.value.mode, scenario.mode);
    assert.deepEqual(
      result.value.verification.manual.expectedSignals,
      [
        scenario.vulnerableOutcome.signal,
        scenario.controls[0].fixedSignal,
        scenario.controls[1].fixedSignal,
      ],
    );

    for (const relativePath of [
      "README.md",
      "vuln/README.md",
      "fixed/README.md",
      "mock/README.md",
      "docs/attack-steps.md",
      "docs/fix-notes.md",
      "docs/manual-verification.md",
    ]) {
      assert.equal(existsSync(path.join(labRoot, relativePath)), true);
    }
  }
});
