import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  parseLabMetadataJson,
  validateLabMetadata,
  type LabMetadata,
} from "../../../../packages/shared/src/lab-metadata.js";

export type BflaConsistencyCheck = {
  key: string;
  passed: boolean;
  message: string;
};

export type BflaConsistencyReport = {
  labKey: "api.functional-authorization";
  scope: "local-repository-only";
  ok: boolean;
  checkedFiles: string[];
  checks: BflaConsistencyCheck[];
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
  "/labs/api/functional-authorization/vuln",
  "/labs/api/functional-authorization/fixed",
];

const expectedApiEntrypoints = [
  "/api/labs/api/functional-authorization/workbench",
  "/api/labs/api/functional-authorization/vuln/evaluate",
  "/api/labs/api/functional-authorization/fixed/evaluate",
];

const expectedSignals = [
  "api-functional-authorization-risk-accepted",
  "api-functional-authorization-defense-blocked",
  "api-functional-authorization-normal-verified",
];

const expectedDocs = [
  "labs/api/functional-authorization/README.md",
  "labs/api/functional-authorization/vuln/README.md",
  "labs/api/functional-authorization/fixed/README.md",
  "labs/api/functional-authorization/mock/README.md",
  "labs/api/functional-authorization/docs/attack-steps.md",
  "labs/api/functional-authorization/docs/fix-notes.md",
  "labs/api/functional-authorization/docs/manual-verification.md",
  "tools/lab-scripts/api/functional-authorization/README.md",
];

const implementationFiles = [
  "apps/server/src/services/bfla-lab.ts",
  "apps/server/src/app.ts",
  "apps/web/src/api/bfla-lab.ts",
  "apps/web/src/labs/bfla.ts",
  "apps/web/src/views/BflaLabView.vue",
];

const testFiles = [
  "apps/server/tests/bfla-lab.test.ts",
  "apps/web/tests/bfla-api.test.ts",
];

const requiredContractFragments = [
  "privileged-operation-request",
  "frontend-only-hidden",
  "enforce-server-side-authorization",
  "execute-privileged-operation",
  "defense-blocks-privileged-operation",
  "allow-verified-admin-operation",
  ...expectedSignals,
];

const forbiddenImplementationFragments = [
  "node:" + "child_process",
  "child_" + "process",
  "exec(",
  "spawn(",
];

function loadRepositoryText(relativePath: string) {
  return readFileSync(path.join(repositoryRoot, relativePath), "utf8");
}

function createCheck(
  key: string,
  passed: boolean,
  message: string,
): BflaConsistencyCheck {
  return { key, passed, message };
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
        language?: string;
      })
    | undefined;
}

export function runBflaConsistencyVerification(): BflaConsistencyReport {
  const checks: BflaConsistencyCheck[] = [];
  const metadataPath = "labs/api/functional-authorization/meta.json";
  const metadataText = loadRepositoryText(metadataPath);
  const parsedMetadata = parseLabMetadataJson(metadataText);

  checks.push(
    createCheck(
      "metadata-json-parse",
      parsedMetadata.ok,
      parsedMetadata.ok
        ? "BFLA 元数据 JSON 可解析。"
        : parsedMetadata.errors.join("; "),
    ),
  );

  if (!parsedMetadata.ok) {
    return {
      labKey: "api.functional-authorization",
      scope: "local-repository-only",
      ok: false,
      checkedFiles: [metadataPath],
      checks,
      notes: ["元数据无法解析，后续一致性检查已停止。"],
    };
  }

  const validationResult = validateLabMetadata(parsedMetadata.value);

  checks.push(
    createCheck(
      "metadata-schema",
      validationResult.ok,
      validationResult.ok
        ? "BFLA 元数据符合共享结构校验。"
        : validationResult.errors.join("; "),
    ),
  );

  if (!validationResult.ok) {
    return {
      labKey: "api.functional-authorization",
      scope: "local-repository-only",
      ok: false,
      checkedFiles: [metadataPath],
      checks,
      notes: ["元数据结构未通过校验，后续一致性检查已停止。"],
    };
  }

  const metadata = validationResult.value;
  const scriptPath =
    "tools/lab-scripts/api/functional-authorization/verify.ts";
  const scriptEntrypoint = getScriptEntrypoint(metadata);
  const documentContents = expectedDocs.map((relativePath) => ({
    relativePath,
    content: loadRepositoryText(relativePath),
  }));
  const implementationContents = implementationFiles.map((relativePath) => ({
    relativePath,
    content: loadRepositoryText(relativePath),
  }));
  const combinedDocs = documentContents.map((item) => item.content).join("\n");
  const combinedImplementation = implementationContents
    .map((item) => item.content)
    .join("\n");

  checks.push(
    createCheck(
      "metadata-basic-state",
      metadata.id === "api.functional-authorization" &&
        metadata.mode === "interactive" &&
        metadata.status === "in-progress",
      "自动化验证完成前，BFLA 元数据应保持 api.functional-authorization / interactive / in-progress。",
    ),
    createCheck(
      "web-entrypoints",
      hasExactValues(
        metadata.entrypoints.web.map((entrypoint) => entrypoint.path),
        expectedWebEntrypoints,
      ),
      "BFLA 前端入口应只包含漏洞版和修复版专用工作台。",
    ),
    createCheck(
      "api-entrypoints",
      hasExactValues(
        metadata.entrypoints.api.map((entrypoint) => entrypoint.path),
        expectedApiEntrypoints,
      ),
      "BFLA API 入口应只包含工作台配置与漏洞版/修复版评估接口。",
    ),
    createCheck(
      "expected-signals",
      hasExactValues(
        metadata.verification.manual.expectedSignals,
        expectedSignals,
      ),
      "BFLA 三个 canonical 终止信号应保持一致。",
    ),
    createCheck(
      "script-entrypoint",
      scriptEntrypoint?.key === "api-functional-authorization-verify" &&
        scriptEntrypoint.path === scriptPath &&
        scriptEntrypoint.language === "ts" &&
        existsSync(path.join(repositoryRoot, scriptPath)),
      "BFLA 脚本入口应登记本机只读一致性验证脚本。",
    ),
    createCheck(
      "automation-scope",
      metadata.verification.automation.supported === true &&
        metadata.verification.automation.apiTest?.enabled === true &&
        metadata.verification.automation.apiTest.specPath ===
          "apps/server/tests/bfla-lab.test.ts" &&
        metadata.verification.automation.scriptVerification?.enabled === true &&
        hasExactValues(
          metadata.verification.automation.scriptVerification.scriptKeys,
          ["api-functional-authorization-verify"],
        ),
      "自动化入口应登记专用 API 测试和只读验证脚本。",
    ),
    createCheck(
      "expected-files-exist",
      [...expectedDocs, ...implementationFiles, ...testFiles].every(
        (relativePath) => existsSync(path.join(repositoryRoot, relativePath)),
      ),
      "BFLA 标准文档、实现文件和专用测试应全部存在。",
    ),
    createCheck(
      "fixed-contract-consistency",
      requiredContractFragments.every(
        (fragment) =>
          combinedImplementation.includes(fragment) &&
          combinedDocs.includes(fragment),
      ),
      "BFLA 固定案例、optionKey 和 canonical 信号应在实现与文档中保持一致。",
    ),
    createCheck(
      "safe-boundary-documented",
      ["固定", "scenarioKey", "optionKey", "脱敏阻断"].every((phrase) =>
        combinedDocs.includes(phrase),
      ),
      "BFLA 文档应声明固定输入、未知 key 脱敏阻断和 optionKey 边界。",
    ),
    createCheck(
      "no-exploit-script",
      !existsSync(
        path.join(
          repositoryRoot,
          "tools/lab-scripts/api/functional-authorization/exploit.py",
        ),
      ),
      "BFLA 首版不应提供可迁移的越权请求脚本。",
    ),
    createCheck(
      "no-forbidden-implementation",
      forbiddenImplementationFragments.every(
        (fragment) => !combinedImplementation.includes(fragment),
      ),
      "BFLA 实现不应引入系统命令或子进程执行能力。",
    ),
  );

  return {
    labKey: "api.functional-authorization",
    scope: "local-repository-only",
    ok: checks.every((check) => check.passed),
    checkedFiles: [
      metadataPath,
      ...expectedDocs,
      ...implementationFiles,
      ...testFiles,
      scriptPath,
    ],
    checks,
    notes: [
      "本脚本只读取仓库内 BFLA 元数据、文档、实现和测试文件。",
      "本脚本不发起 HTTP 请求，不访问外部目标，不读取账户、角色或凭据。",
      "完成自动化验证并回填执行证据后，才能把元数据推进到 ready。",
    ],
  };
}

export function getBflaConsistencyVerificationPlan() {
  return {
    labKey: "api.functional-authorization",
    scope: "local-repository-only",
    expectedWebEntrypoints,
    expectedApiEntrypoints,
    expectedSignals,
    expectedScript:
      "tools/lab-scripts/api/functional-authorization/verify.ts",
    expectedDocuments: expectedDocs,
  };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const report = runBflaConsistencyVerification();

  console.log(JSON.stringify(report, null, 2));

  if (!report.ok) {
    process.exitCode = 1;
  }
}
