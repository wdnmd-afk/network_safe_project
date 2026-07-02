import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  parseLabMetadataJson,
  validateLabMetadata,
  type LabMetadata,
} from "../../../../packages/shared/src/lab-metadata.js";

export type PromptInjectionConsistencyCheck = {
  key: string;
  passed: boolean;
  message: string;
};

export type PromptInjectionConsistencyReport = {
  labKey: "ai.prompt-injection";
  scope: "local-repository-only";
  ok: boolean;
  checkedFiles: string[];
  checks: PromptInjectionConsistencyCheck[];
  notes: string[];
};

const scriptFilePath = fileURLToPath(import.meta.url);
const repositoryRoot = path.resolve(
  path.dirname(scriptFilePath),
  "..",
  "..",
  "..",
  "..",
);

const expectedWebEntrypoints = [
  "/labs/ai/prompt-injection/vuln",
  "/labs/ai/prompt-injection/fixed",
];

const expectedApiEntrypoints = [
  "/api/labs/ai/prompt-injection/vuln/evaluate",
  "/api/labs/ai/prompt-injection/fixed/evaluate",
];

const expectedDocs = [
  "labs/ai/prompt-injection/README.md",
  "labs/ai/prompt-injection/vuln/README.md",
  "labs/ai/prompt-injection/fixed/README.md",
  "labs/ai/prompt-injection/mock/README.md",
  "labs/ai/prompt-injection/docs/attack-steps.md",
  "labs/ai/prompt-injection/docs/fix-notes.md",
  "labs/ai/prompt-injection/docs/manual-verification.md",
  "tools/lab-scripts/ai/prompt-injection/README.md",
];

const implementationFiles = [
  "apps/server/src/services/prompt-injection-lab.ts",
  "apps/server/src/app.ts",
  "apps/web/src/api/prompt-injection-lab.ts",
  "apps/web/src/labs/prompt-injection.ts",
  "apps/web/src/views/PromptInjectionLabView.vue",
];

const evidenceFiles = [
  "apps/server/tests/prompt-injection-lab.test.ts",
  "apps/web/tests/prompt-injection-api.test.ts",
  "apps/web/tests/prompt-injection-lab.test.ts",
  "packages/testing/tests/e2e/platform.spec.mjs",
];

const requiredBoundaryPhrases = [
  "固定样例",
  "不调用外部 AI",
  "不提供 `exploit.py`",
  "任意提示词执行器",
  "不保存完整用户提示词",
  "真实工具",
];

const forbiddenImplementationFragments = [
  {
    key: "openai-reference",
    fragment: "open" + "ai",
  },
  {
    key: "anthropic-reference",
    fragment: "anth" + "ropic",
  },
  {
    key: "gemini-reference",
    fragment: "gem" + "ini",
  },
  {
    key: "langchain-reference",
    fragment: "lang" + "chain",
  },
  {
    key: "ollama-reference",
    fragment: "ol" + "lama",
  },
  {
    key: "huggingface-reference",
    fragment: "hugging" + "face",
  },
  {
    key: "node-child-process-import",
    fragment: "node:" + "child_process",
  },
  {
    key: "child-process-reference",
    fragment: "child_" + "process",
  },
  {
    key: "exec-call",
    fragment: "exec(",
  },
  {
    key: "spawn-call",
    fragment: "spawn(",
  },
  {
    key: "new-function-call",
    fragment: "new Function",
  },
  {
    key: "eval-call",
    fragment: "eval(",
  },
  {
    key: "textarea-input",
    fragment: "<textarea",
  },
  {
    key: "text-input",
    fragment: "<input",
  },
  {
    key: "textbox-fill",
    fragment: 'getByRole("textbox").fill',
  },
];

const forbiddenImplementationPatterns = [
  {
    key: "api-key-field",
    pattern: /\bapi[_-]?key\b/i,
  },
  {
    key: "model-name-field",
    pattern: /\b(modelName|modelConfig|modelProvider)\b/i,
  },
  {
    key: "external-url-literal",
    pattern: /https?:\/\//i,
  },
];

function loadRepositoryText(relativePath: string) {
  return readFileSync(path.join(repositoryRoot, relativePath), "utf8");
}

function createCheck(
  key: string,
  passed: boolean,
  message: string,
): PromptInjectionConsistencyCheck {
  return {
    key,
    passed,
    message,
  };
}

function hasExactValues(actual: string[], expected: string[]) {
  return (
    actual.length === expected.length &&
    expected.every((item, index) => actual[index] === item)
  );
}

function getScriptEntrypoint(metadata: LabMetadata) {
  return metadata.entrypoints.scripts[0] as
    | (Record<string, unknown> & {
        key: string;
        path: string;
        description: string;
        language?: string;
      })
    | undefined;
}

function implementationHasForbiddenFragment(content: string) {
  const normalizedContent = content.toLowerCase();

  return (
    forbiddenImplementationFragments.some((item) =>
      normalizedContent.includes(item.fragment.toLowerCase()),
    ) ||
    forbiddenImplementationPatterns.some((item) => item.pattern.test(content))
  );
}

export function runPromptInjectionConsistencyVerification(): PromptInjectionConsistencyReport {
  const checks: PromptInjectionConsistencyCheck[] = [];
  const metadataText = loadRepositoryText("labs/ai/prompt-injection/meta.json");
  const parsedMetadata = parseLabMetadataJson(metadataText);

  checks.push(
    createCheck(
      "metadata-json-parse",
      parsedMetadata.ok,
      parsedMetadata.ok
        ? "Prompt injection metadata JSON is parseable."
        : parsedMetadata.errors.join("; "),
    ),
  );

  if (!parsedMetadata.ok) {
    return {
      labKey: "ai.prompt-injection",
      scope: "local-repository-only",
      ok: false,
      checkedFiles: ["labs/ai/prompt-injection/meta.json"],
      checks,
      notes: ["Metadata parsing failed, so consistency checks stopped."],
    };
  }

  const validationResult = validateLabMetadata(parsedMetadata.value);

  checks.push(
    createCheck(
      "metadata-schema",
      validationResult.ok,
      validationResult.ok
        ? "Prompt injection metadata passes the shared schema validator."
        : validationResult.errors.join("; "),
    ),
  );

  if (!validationResult.ok) {
    return {
      labKey: "ai.prompt-injection",
      scope: "local-repository-only",
      ok: false,
      checkedFiles: ["labs/ai/prompt-injection/meta.json"],
      checks,
      notes: ["Metadata schema validation failed, so consistency checks stopped."],
    };
  }

  const metadata = validationResult.value;
  const scriptPath = "tools/lab-scripts/ai/prompt-injection/verify.ts";
  const scriptEntrypoint = getScriptEntrypoint(metadata);
  const documentContents = expectedDocs.map((relativePath) => ({
    relativePath,
    content: loadRepositoryText(relativePath),
  }));
  const combinedLabDocs = documentContents
    .map((item) => item.content)
    .join("\n\n");
  const implementationContents = implementationFiles.map((relativePath) => ({
    relativePath,
    content: loadRepositoryText(relativePath),
  }));
  const scriptExists = existsSync(path.join(repositoryRoot, scriptPath));
  const exploitScriptExists = existsSync(
    path.join(repositoryRoot, "tools/lab-scripts/ai/prompt-injection/exploit.py"),
  );

  checks.push(
    createCheck(
      "metadata-basic-state",
      metadata.id === "ai.prompt-injection" &&
        metadata.mode === "interactive" &&
        metadata.status === "in-progress",
      "Prompt injection metadata should remain ai.prompt-injection / interactive / in-progress.",
    ),
  );
  checks.push(
    createCheck(
      "web-entrypoints",
      hasExactValues(
        metadata.entrypoints.web.map((entrypoint) => entrypoint.path),
        expectedWebEntrypoints,
      ),
      "Prompt injection web entrypoints should only include vuln and fixed workbench pages.",
    ),
  );
  checks.push(
    createCheck(
      "api-entrypoints",
      hasExactValues(
        metadata.entrypoints.api.map((entrypoint) => entrypoint.path),
        expectedApiEntrypoints,
      ),
      "Prompt injection API entrypoints should only include vuln and fixed evaluate routes.",
    ),
  );
  checks.push(
    createCheck(
      "script-entrypoint",
      metadata.entrypoints.scripts.length === 1 &&
        scriptEntrypoint?.key === "prompt-injection-verify" &&
        scriptEntrypoint.path === scriptPath &&
        scriptEntrypoint.language === "ts" &&
        scriptExists,
      "Prompt injection scripts should only register the local read-only consistency verifier.",
    ),
  );
  checks.push(
    createCheck(
      "automation-scope",
      metadata.verification.automation.supported === true &&
        metadata.verification.automation.playwright?.enabled === true &&
        metadata.verification.automation.playwright.specPath ===
          "packages/testing/tests/e2e/platform.spec.mjs" &&
        metadata.verification.automation.apiTest?.enabled === true &&
        metadata.verification.automation.apiTest.specPath ===
          "apps/server/tests/prompt-injection-lab.test.ts" &&
        metadata.verification.automation.scriptVerification?.enabled === true &&
        hasExactValues(
          metadata.verification.automation.scriptVerification.scriptKeys,
          ["prompt-injection-verify"],
        ),
      "Automation evidence should include Playwright, server API tests, and the read-only verifier.",
    ),
  );
  checks.push(
    createCheck(
      "expected-documents-exist",
      expectedDocs.every((relativePath) =>
        existsSync(path.join(repositoryRoot, relativePath)),
      ),
      "Prompt injection standard docs and script README should all exist.",
    ),
  );
  checks.push(
    createCheck(
      "boundary-phrases",
      requiredBoundaryPhrases.every((phrase) =>
        combinedLabDocs.includes(phrase),
      ),
      "Prompt injection docs should keep fixed-sample, no-external-AI, no-tool, and no-exploit boundaries visible.",
    ),
  );
  checks.push(
    createCheck(
      "no-exploit-script",
      !exploitScriptExists,
      "Prompt injection script directory should not provide exploit.py.",
    ),
  );
  checks.push(
    createCheck(
      "no-external-ai-or-tool-implementation",
      implementationContents.every(
        (item) => !implementationHasForbiddenFragment(item.content),
      ),
      "Prompt injection implementation should not include external AI SDKs, model config, command execution, external URLs, or freeform prompt inputs.",
    ),
  );
  checks.push(
    createCheck(
      "fixed-key-request-body",
      loadRepositoryText("apps/web/src/api/prompt-injection-lab.ts").includes(
        "scenarioKey: input.scenarioKey",
      ) &&
        loadRepositoryText("apps/web/src/api/prompt-injection-lab.ts").includes(
          "instructionSourceKey: input.instructionSourceKey",
        ) &&
        loadRepositoryText("apps/web/src/api/prompt-injection-lab.ts").includes(
          "defensePolicyKey: input.defensePolicyKey",
        ),
      "Prompt injection API client should submit only the three fixed key fields.",
    ),
  );
  checks.push(
    createCheck(
      "playwright-no-textbox-assertion",
      loadRepositoryText("packages/testing/tests/e2e/platform.spec.mjs").includes(
        'getByRole("textbox")).toHaveCount(0)',
      ),
      "Prompt injection Playwright coverage should assert that no textbox is available.",
    ),
  );

  return {
    labKey: "ai.prompt-injection",
    scope: "local-repository-only",
    ok: checks.every((check) => check.passed),
    checkedFiles: [
      "labs/ai/prompt-injection/meta.json",
      ...expectedDocs,
      ...implementationFiles,
      ...evidenceFiles,
      scriptPath,
    ],
    checks,
    notes: [
      "This script only reads Prompt injection metadata, docs, tests, and implementation files in this repository.",
      "This script does not send HTTP requests, call external AI, call local models, execute tools, read .env, or run system commands.",
      "The script entrypoint is a read-only consistency verifier and is not an exploit script or prompt execution harness.",
      "The lab remains in-progress until a separate ready closeout audit is completed.",
    ],
  };
}

export function getPromptInjectionConsistencyVerificationPlan() {
  return {
    labKey: "ai.prompt-injection",
    scope: "local-repository-only",
    safeBoundary:
      "Only verifies repository-local Prompt injection metadata, docs, fixed-key entrypoints, and safety boundaries; it does not execute prompts or call AI services.",
    expectedWebEntrypoints,
    expectedApiEntrypoints,
    expectedScript: "tools/lab-scripts/ai/prompt-injection/verify.ts",
    expectedDocuments: expectedDocs,
  };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const report = runPromptInjectionConsistencyVerification();

  console.log(JSON.stringify(report, null, 2));

  if (!report.ok) {
    process.exitCode = 1;
  }
}
