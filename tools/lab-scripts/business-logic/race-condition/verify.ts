import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRaceConditionLabService, raceConditionBoundarySignal, raceConditionDefenseSignal, raceConditionNormalSignal, raceConditionRiskSignal, raceConditionScenarioKey } from "../../../../apps/server/src/services/race-condition-lab.js";
import { runControlledDecisionConsistencyVerification } from "../../controlled-decision-verifier.js";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
const report = runControlledDecisionConsistencyVerification({ repositoryRoot: root, labId: "business-logic.race-condition", category: "business-logic", scene: "race-condition", mode: "simulation", scenarioKey: raceConditionScenarioKey, riskPath: ["read-then-write-without-version", "accept-both-stock-decrements"], defensePath: ["enforce-idempotency-and-version-check", "block-duplicate-or-stale-request"], normalPath: ["enforce-idempotency-and-version-check", "allow-single-unique-request"], signals: { risk: raceConditionRiskSignal, defense: raceConditionDefenseSignal, normal: raceConditionNormalSignal, boundary: raceConditionBoundarySignal }, service: createRaceConditionLabService(), scriptPath: "tools/lab-scripts/business-logic/race-condition/verify.ts" });
console.log(JSON.stringify(report, null, 2)); if (!report.ok) process.exitCode = 1;
