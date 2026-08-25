import assert from "node:assert/strict";
import test from "node:test";

import {
  analyzeFixedDetectionRule,
  fixedSecurityEventDataset,
  fixedWindowsSecurityEventDataset,
  validateFixedSecurityEventDataset,
} from "../src/fixed-security-events.js";

test("fixed security event dataset passes schema and cross-reference validation", () => {
  const result = validateFixedSecurityEventDataset(fixedSecurityEventDataset);

  assert.equal(result.ok, true);
  assert.equal(result.value.events.length, 6);
  assert.equal(result.value.ruleProfiles.length, 3);
  assert.equal(Object.isFrozen(fixedSecurityEventDataset), true);
  assert.equal(Object.isFrozen(fixedSecurityEventDataset.events), true);
  assert.equal(Object.isFrozen(fixedSecurityEventDataset.events[0]), true);
  assert.equal(Object.isFrozen(fixedSecurityEventDataset.ruleProfiles), true);
});

test("fixed Windows event timeline reuses the locked security event schema", () => {
  const result = validateFixedSecurityEventDataset(fixedWindowsSecurityEventDataset);

  assert.equal(result.ok, true);
  assert.equal(result.value.events.length, 5);
  assert.equal(result.value.ruleProfiles.length, 2);
  assert.equal(Object.isFrozen(fixedWindowsSecurityEventDataset), true);
  const analysis = analyzeFixedDetectionRule(
    fixedWindowsSecurityEventDataset,
    "windows-correlated-identity-service-rule",
  );
  assert.ok(analysis);
  assert.equal(analysis.truePositiveCount, 4);
  assert.equal(analysis.falsePositiveCount, 0);
  assert.equal(analysis.falseNegativeCount, 0);
});

test("broad fixed rule exposes one false positive and three false negatives", () => {
  const analysis = analyzeFixedDetectionRule(
    fixedSecurityEventDataset,
    "broad-auth-failure-rule",
  );

  assert.deepEqual(analysis, {
    datasetKey: "fixed-auth-process-alert-timeline",
    ruleProfileKey: "broad-auth-failure-rule",
    matchedEventIds: ["auth-failure-burst", "single-user-auth-retry"],
    truePositiveCount: 1,
    falsePositiveCount: 1,
    falseNegativeCount: 3,
    trueNegativeCount: 1,
    precisionPercent: 50,
    recallPercent: 25,
  });
});

test("narrow fixed rule exposes missed multi-source evidence", () => {
  const analysis = analyzeFixedDetectionRule(
    fixedSecurityEventDataset,
    "narrow-unsigned-process-rule",
  );

  assert.equal(analysis.truePositiveCount, 1);
  assert.equal(analysis.falsePositiveCount, 0);
  assert.equal(analysis.falseNegativeCount, 3);
  assert.equal(analysis.recallPercent, 25);
});

test("correlated fixed rule matches the suspicious timeline without false results", () => {
  const analysis = analyzeFixedDetectionRule(
    fixedSecurityEventDataset,
    "correlated-auth-process-network-rule",
  );

  assert.equal(analysis.truePositiveCount, 4);
  assert.equal(analysis.falsePositiveCount, 0);
  assert.equal(analysis.falseNegativeCount, 0);
  assert.equal(analysis.precisionPercent, 100);
  assert.equal(analysis.recallPercent, 100);
});

test("unknown fixed rule keys return no analysis", () => {
  const analysis = analyzeFixedDetectionRule(
    fixedSecurityEventDataset,
    "unknown-rule-profile",
  );

  assert.equal(analysis, null);
});

test("fixed dataset validation rejects unknown rule event references", () => {
  const invalidDataset = structuredClone(fixedSecurityEventDataset);
  invalidDataset.ruleProfiles[0].matchedEventIds.push("unknown-event-id");

  const result = validateFixedSecurityEventDataset(invalidDataset);

  assert.equal(result.ok, false);
  assert.ok(
    result.errors.includes(
      "ruleProfiles[0].matchedEventIds references unknown event",
    ),
  );
});

test("fixed dataset validation rejects fields outside the locked schema", () => {
  const invalidDataset = structuredClone(fixedSecurityEventDataset);
  invalidDataset.events[0].host = "real-host-name";
  invalidDataset.ruleProfiles[0].query = "source=external";

  const result = validateFixedSecurityEventDataset(invalidDataset);

  assert.equal(result.ok, false);
  assert.ok(result.errors.includes("events[0] contains unknown fields"));
  assert.ok(result.errors.includes("ruleProfiles[0] contains unknown fields"));
});
