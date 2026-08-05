import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  parseLabMetadataJson,
  validateLabMetadata,
  type LabMetadata,
} from "../../../../packages/shared/src/lab-metadata.js";

export type WorkflowBypassConsistencyCheck = {
  key: string;
  passed: boolean;
  message: string;
};

export type WorkflowBypassConsistencyReport = {
  labKey: "business-logic.workflow-bypass";
  scope: "local-repository-only";
  ok: boolean;
  checkedFiles: string[];
  checks: WorkflowBypassConsistencyCheck[];
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
  "/labs/business-logic/workflow-bypass/vuln",
  "/labs/business-logic/workflow-bypass/fixed",
];

const expectedApiEntrypoints = [
  "/api/labs/business-logic/workflow-bypass/workbench",
  "/api/labs/business-logic/workflow-bypass/vuln/evaluate",
  "/api/labs/business-logic/workflow-bypass/fixed/evaluate",
];

const expectedSignals = [
  "business-logic-workflow-bypass-risk-accepted",
  "business-logic-workflow-bypass-defense-blocked",
  "business-logic-workflow-bypass-normal-verified",
];

const expectedDocs = [
  "labs/business-logic/workflow-bypass/README.md",
  "labs/business-logic/workflow-bypass/vuln/README.md",
  "labs/business-logic/workflow-bypass/fixed/README.md",
  "labs/business-logic/workflow-bypass/mock/README.md",
  "labs/business-logic/workflow-bypass/docs/attack-steps.md",
  "labs/business-logic/workflow-bypass/docs/fix-notes.md",
  "labs/business-logic/workflow-bypass/docs/manual-verification.md",
  "tools/lab-scripts/business-logic/workflow-bypass/README.md",
];

const implementationFiles = [
  "apps/server/src/services/workflow-bypass-lab.ts",
  "apps/server/src/app.ts",
  "apps/web/src/api/workflow-bypass-lab.ts",
  "apps/web/src/labs/workflow-bypass.ts",
  "apps/web/src/views/WorkflowBypassLabView.vue",
];

const testFiles = [
  "apps/server/tests/workflow-bypass-lab.test.ts",
  "apps/web/tests/workflow-bypass-api.test.ts",
];

const requiredContractFragments = [
  "pending-order-shipping-request",
  "trust-client-stage-request",
  "enforce-server-side-sequence",
  "ship-pending-order",
  "block-out-of-order-transition",
  "ship-paid-order",
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
): WorkflowBypassConsistencyCheck {
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

export function runWorkflowBypassConsistencyVerification(): WorkflowBypassConsistencyReport {
  const checks: WorkflowBypassConsistencyCheck[] = [];
  const metadataPath = "labs/business-logic/workflow-bypass/meta.json";
  const metadataText = loadRepositoryText(metadataPath);
  const parsedMetadata = parseLabMetadataJson(metadataText);

  checks.push(
    createCheck(
      "metadata-json-parse",
      parsedMetadata.ok,
      parsedMetadata.ok
        ? "业务流程跳步元数据 JSON 可解析。"
        : parsedMetadata.errors.join("; "),
    ),
  );

  if (!parsedMetadata.ok) {
    return {
      labKey: "business-logic.workflow-bypass",
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
        ? "业务流程跳步元数据符合共享结构校验。"
        : validationResult.errors.join("; "),
    ),
  );

  if (!validationResult.ok) {
    return {
      labKey: "business-logic.workflow-bypass",
      scope: "local-repository-only",
      ok: false,
      checkedFiles: [metadataPath],
      checks,
      notes: ["元数据结构未通过校验，后续一致性检查已停止。"],
    };
  }

  const metadata = validationResult.value;
  const scriptPath =
    "tools/lab-scripts/business-logic/workflow-bypass/verify.ts";
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
      metadata.id === "business-logic.workflow-bypass" &&
        metadata.mode === "interactive" &&
        metadata.status === "ready",
      "完成命令验证后，业务流程跳步元数据应保持 business-logic.workflow-bypass / interactive / ready。",
    ),
    createCheck(
      "web-entrypoints",
      hasExactValues(
        metadata.entrypoints.web.map((entrypoint) => entrypoint.path),
        expectedWebEntrypoints,
      ),
      "业务流程跳步前端入口应只包含漏洞版和修复版专用工作台。",
    ),
    createCheck(
      "api-entrypoints",
      hasExactValues(
        metadata.entrypoints.api.map((entrypoint) => entrypoint.path),
        expectedApiEntrypoints,
      ),
      "业务流程跳步 API 入口应只包含工作台配置与漏洞版/修复版评估接口。",
    ),
    createCheck(
      "expected-signals",
      hasExactValues(
        metadata.verification.manual.expectedSignals,
        expectedSignals,
      ),
      "业务流程跳步三个 canonical 终止信号应保持一致。",
    ),
    createCheck(
      "script-entrypoint",
      scriptEntrypoint?.key === "business-logic-workflow-bypass-verify" &&
        scriptEntrypoint.path === scriptPath &&
        scriptEntrypoint.language === "ts" &&
        existsSync(path.join(repositoryRoot, scriptPath)),
      "业务流程跳步脚本入口应登记本机只读一致性验证脚本。",
    ),
    createCheck(
      "automation-scope",
      metadata.verification.automation.supported === true &&
        metadata.verification.automation.apiTest?.enabled === true &&
        metadata.verification.automation.apiTest.specPath ===
          "apps/server/tests/workflow-bypass-lab.test.ts" &&
        metadata.verification.automation.scriptVerification?.enabled === true &&
        hasExactValues(
          metadata.verification.automation.scriptVerification.scriptKeys,
          ["business-logic-workflow-bypass-verify"],
        ),
      "自动化入口应登记专用 API 测试和只读验证脚本。",
    ),
    createCheck(
      "expected-files-exist",
      [...expectedDocs, ...implementationFiles, ...testFiles].every(
        (relativePath) => existsSync(path.join(repositoryRoot, relativePath)),
      ),
      "业务流程跳步标准文档、实现文件和专用测试应全部存在。",
    ),
    createCheck(
      "fixed-contract-consistency",
      requiredContractFragments.every(
        (fragment) =>
          combinedImplementation.includes(fragment) &&
          combinedDocs.includes(fragment),
      ),
      "固定案例、optionKey 和 canonical 信号应在实现与文档中保持一致。",
    ),
    createCheck(
      "safe-boundary-documented",
      ["固定", "scenarioKey", "optionKey", "脱敏阻断"].every((phrase) =>
        combinedDocs.includes(phrase),
      ),
      "文档应声明固定输入、未知 key 脱敏阻断和 optionKey 边界。",
    ),
    createCheck(
      "no-exploit-script",
      !existsSync(
        path.join(
          repositoryRoot,
          "tools/lab-scripts/business-logic/workflow-bypass/exploit.py",
        ),
      ),
      "业务流程跳步实验不应提供可迁移的流程绕过脚本。",
    ),
    createCheck(
      "no-forbidden-implementation",
      forbiddenImplementationFragments.every(
        (fragment) => !combinedImplementation.includes(fragment),
      ),
      "业务流程跳步实现不应引入系统命令或子进程执行能力。",
    ),
  );

  return {
    labKey: "business-logic.workflow-bypass",
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
      "本脚本只读取仓库内业务流程跳步元数据、文档、实现和测试文件。",
      "本脚本不发起 HTTP 请求，不访问订单、支付、物流或外部目标。",
      "ready 只表示本机固定订单阶段学习闭环通过验证，不代表可操作真实订单、支付或物流系统。",
    ],
  };
}

export function getWorkflowBypassConsistencyVerificationPlan() {
  return {
    labKey: "business-logic.workflow-bypass",
    scope: "local-repository-only",
    expectedWebEntrypoints,
    expectedApiEntrypoints,
    expectedSignals,
    expectedScript:
      "tools/lab-scripts/business-logic/workflow-bypass/verify.ts",
    expectedDocuments: expectedDocs,
  };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const report = runWorkflowBypassConsistencyVerification();

  console.log(JSON.stringify(report, null, 2));

  if (!report.ok) {
    process.exitCode = 1;
  }
}
