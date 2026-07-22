import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { getGuidedScenarioById } from "../../packages/shared/src/guided-scenarios.js";
import {
  parseLabMetadataJson,
  validateLabMetadata,
} from "../../packages/shared/src/lab-metadata.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

function readRepositoryFile(relativePath) {
  return readFileSync(path.join(repoRoot, relativePath), "utf8");
}

function createCheck(key, passed, message) {
  return { key, passed, message };
}

export async function runGuidedScenarioVerification(labId, options = {}) {
  const definition = getGuidedScenarioById(labId);

  if (!definition) {
    throw new Error(`guided scenario not found: ${labId}`);
  }

  const labRoot = `labs/${definition.category}/${definition.subcategory}`;
  const scriptRoot = `tools/lab-scripts/${definition.category}/${definition.subcategory}`;
  const executionDoc = `docs/execution/2026-07-20-${definition.category}-${definition.subcategory}-guided-lab.md`;
  const requiredFiles = [
    `${labRoot}/meta.json`,
    `${labRoot}/README.md`,
    `${labRoot}/vuln/README.md`,
    `${labRoot}/fixed/README.md`,
    `${labRoot}/mock/README.md`,
    `${labRoot}/docs/attack-steps.md`,
    `${labRoot}/docs/fix-notes.md`,
    `${labRoot}/docs/manual-verification.md`,
    `${scriptRoot}/README.md`,
    `${scriptRoot}/verify.ts`,
    executionDoc,
    "packages/shared/src/guided-scenarios.js",
    "apps/server/src/services/guided-scenario-lab.ts",
    "apps/server/src/app.ts",
    "apps/server/tests/guided-scenario-lab.test.ts",
    "apps/web/src/api/guided-scenario-lab.ts",
    "apps/web/src/views/GuidedScenarioLabView.vue",
    "apps/web/src/router/routes.ts",
    "apps/web/tests/guided-scenario-api.test.ts",
    "apps/web/tests/guided-scenario-lab.test.ts",
  ];
  const checks = [];
  const missingFiles = requiredFiles.filter(
    (relativePath) => !existsSync(path.join(repoRoot, relativePath)),
  );

  checks.push(
    createCheck(
      "required-files",
      missingFiles.length === 0,
      missingFiles.length === 0
        ? "all standard lab, script, execution, frontend, backend, and test files exist"
        : `missing files: ${missingFiles.join(", ")}`,
    ),
  );

  let metadata;
  const metadataPath = `${labRoot}/meta.json`;

  if (existsSync(path.join(repoRoot, metadataPath))) {
    const parsed = parseLabMetadataJson(readRepositoryFile(metadataPath));
    const validated = parsed.ok ? validateLabMetadata(parsed.value) : parsed;

    checks.push(
      createCheck(
        "metadata-schema",
        validated.ok,
        validated.ok
          ? "metadata matches the shared schema"
          : validated.errors.join("; "),
      ),
    );

    if (validated.ok) {
      metadata = validated.value;
    }
  }

  if (metadata) {
    const expectedWebPaths = [
      `/labs/${definition.category}/${definition.subcategory}/vuln`,
      `/labs/${definition.category}/${definition.subcategory}/fixed`,
    ];
    const expectedApiPaths = [
      `/api/labs/${definition.category}/${definition.subcategory}/workbench`,
      `/api/labs/${definition.category}/${definition.subcategory}/vuln/evaluate`,
      `/api/labs/${definition.category}/${definition.subcategory}/fixed/evaluate`,
    ];
    const expectedSignals = [
      definition.vulnerableOutcome.signal,
      definition.controls[0].fixedSignal,
      definition.controls[1].fixedSignal,
    ];

    checks.push(
      createCheck(
        "metadata-state",
        metadata.id === definition.id &&
          metadata.status === "ready" &&
          metadata.mode === definition.mode,
        "metadata id, mode, and ready status match the shared catalog",
      ),
      createCheck(
        "web-entrypoints",
        JSON.stringify(metadata.entrypoints.web.map((entry) => entry.path)) ===
          JSON.stringify(expectedWebPaths),
        "web entrypoints expose the vulnerable and fixed guided routes",
      ),
      createCheck(
        "api-entrypoints",
        JSON.stringify(metadata.entrypoints.api.map((entry) => entry.path)) ===
          JSON.stringify(expectedApiPaths),
        "api entrypoints expose workbench and variant evaluation routes",
      ),
      createCheck(
        "manual-signals",
        JSON.stringify(metadata.verification.manual.expectedSignals) ===
          JSON.stringify(expectedSignals),
        "manual verification signals match vulnerable, blocked, and normal outcomes",
      ),
      createCheck(
        "automation-evidence",
        metadata.verification.automation.apiTest?.enabled === true &&
          metadata.verification.automation.scriptVerification?.enabled === true,
        "api test and script verification evidence are enabled",
      ),
      createCheck(
        "case-study-automation-boundary",
        definition.mode !== "case-study" ||
          metadata.variants.every(
            (variant) => variant.supportsAutomation === false,
          ),
        "case-study variants do not claim attack automation",
      ),
    );
  }

  const generatedDocs = requiredFiles.filter(
    (file) => file.endsWith(".md") && existsSync(path.join(repoRoot, file)),
  );
  const documentationText = generatedDocs
    .map((file) => readRepositoryFile(file))
    .join("\n");

  checks.push(
    createCheck(
      "documentation-boundaries",
      documentationText.includes(definition.defaultScenarioKey) &&
        documentationText.includes(definition.defaultControlKey) &&
        documentationText.includes("安全边界") &&
        documentationText.includes("固定"),
      "documents include the fixed keys and safety boundary",
    ),
  );

  const exploitPath = `${scriptRoot}/exploit.py`;
  const exploitExists = existsSync(path.join(repoRoot, exploitPath));

  checks.push(
    createCheck(
      "exploit-boundary",
      definition.mode === "interactive" ? exploitExists : !exploitExists,
      definition.mode === "interactive"
        ? "interactive lab provides a localhost-restricted controlled request script"
        : "simulation and case-study labs do not provide exploit.py",
    ),
  );

  if (exploitExists) {
    const exploitSource = readRepositoryFile(exploitPath);

    checks.push(
      createCheck(
        "interactive-localhost-limit",
        exploitSource.includes('parsed.hostname not in {"localhost", "127.0.0.1"}') &&
          exploitSource.includes(definition.defaultScenarioKey) &&
          !exploitSource.includes("subprocess") &&
          !exploitSource.includes("os.system"),
        "controlled Python script rejects non-local targets and has no command execution",
      ),
    );
  }

  const implementationText = [
    "packages/shared/src/guided-scenarios.js",
    "apps/server/src/services/guided-scenario-lab.ts",
    "apps/web/src/api/guided-scenario-lab.ts",
    "apps/web/src/views/GuidedScenarioLabView.vue",
  ]
    .map((file) => readRepositoryFile(file))
    .join("\n");
  const forbiddenImplementationPatterns = [
    /child_process/,
    /execSync\(/,
    /spawnSync\(/,
    /\.env["']/,
    /document\.cookie/,
    /localStorage\.getItem\(["']token/,
  ];

  checks.push(
    createCheck(
      "dangerous-capability-scan",
      forbiddenImplementationPatterns.every(
        (pattern) => !pattern.test(implementationText),
      ),
      "shared implementation has no command execution, environment credential, or browser credential access",
    ),
  );

  const report = {
    labKey: definition.id,
    scope: "local-repository-only",
    ok: checks.every((check) => check.passed),
    checkedFiles: requiredFiles,
    checks,
    notes: [
      "The verifier only reads repository files declared for the guided scenario lab.",
      "It does not make HTTP requests, read .env, inspect credentials, scan networks, or execute samples.",
      definition.notes,
    ],
  };

  if (!options.silent) {
    console.log(JSON.stringify(report, null, 2));
  }

  if (!report.ok) {
    process.exitCode = 1;
  }

  return report;
}
