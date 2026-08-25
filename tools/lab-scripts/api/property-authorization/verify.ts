import path from "node:path";
import { fileURLToPath } from "node:url";
import { createPropertyAuthorizationLabService, propertyAuthorizationBoundarySignal, propertyAuthorizationDefenseSignal, propertyAuthorizationNormalSignal, propertyAuthorizationRiskSignal, propertyAuthorizationScenarioKey } from "../../../../apps/server/src/services/property-authorization-lab.js";
import { runControlledDecisionConsistencyVerification } from "../../controlled-decision-verifier.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
const report = runControlledDecisionConsistencyVerification({ repositoryRoot: root, labId: "api.property-authorization", category: "api", scene: "property-authorization", mode: "interactive", scenarioKey: propertyAuthorizationScenarioKey, riskPath: ["bind-all-client-fields", "persist-server-owned-fields"], defensePath: ["enforce-field-allowlist-and-server-ownership", "block-server-owned-field-update"], normalPath: ["enforce-field-allowlist-and-server-ownership", "allow-display-name-update"], signals: { risk: propertyAuthorizationRiskSignal, defense: propertyAuthorizationDefenseSignal, normal: propertyAuthorizationNormalSignal, boundary: propertyAuthorizationBoundarySignal }, service: createPropertyAuthorizationLabService(), scriptPath: "tools/lab-scripts/api/property-authorization/verify.ts" });
console.log(JSON.stringify(report, null, 2)); if (!report.ok) process.exitCode = 1;
