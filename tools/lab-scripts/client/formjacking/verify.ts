import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  parseLabMetadataJson,
  validateLabMetadata,
  type LabMetadata,
} from "../../../../packages/shared/src/lab-metadata.js";

export type FormjackingConsistencyCheck = {
  key: string;
  passed: boolean;
  message: string;
};

export type FormjackingConsistencyReport = {
  labKey: "client.formjacking";
  scope: "local-repository-only";
  ok: boolean;
  checkedFiles: string[];
  checks: FormjackingConsistencyCheck[];
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
  "/labs/client/formjacking/vuln",
  "/labs/client/formjacking/fixed",
];

const expectedApiEntrypoints = [
  "/api/labs/client/formjacking/workbench",
  "/api/labs/client/formjacking/vuln/evaluate",
  "/api/labs/client/formjacking/fixed/evaluate",
];

const expectedSignals = [
  "client-formjacking-risk-accepted",
  "client-formjacking-defense-blocked",
  "client-formjacking-normal-verified",
];

const expectedDocs = [
  "labs/client/formjacking/README.md",
  "labs/client/formjacking/vuln/README.md",
  "labs/client/formjacking/fixed/README.md",
  "labs/client/formjacking/mock/README.md",
  "labs/client/formjacking/docs/attack-steps.md",
  "labs/client/formjacking/docs/fix-notes.md",
  "labs/client/formjacking/docs/manual-verification.md",
  "tools/lab-scripts/client/formjacking/README.md",
];

const implementationFiles = [
  "apps/server/src/services/formjacking-lab.ts",
  "apps/server/src/app.ts",
  "apps/web/src/api/formjacking-lab.ts",
  "apps/web/src/labs/formjacking.ts",
  "apps/web/src/views/FormjackingLabView.vue",
];

const requiredBoundaryPhrases = [
  "固定",
  "scenarioKey",
  "脱敏阻断",
];

const forbiddenImplementationFragments = [
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
];

function loadRepositoryText(relativePath: string) {
  return readFileSync(path.join(repositoryRoot, relativePath), "utf8");
}

function createCheck(
  key: string,
  passed: boolean,
  message: string,
): FormjackingConsistencyCheck {
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
  return forbiddenImplementationFragments.some((item) =>
    content.includes(item.fragment),
  );
}

export function runFormjackingConsistencyVerification(): FormjackingConsistencyReport {
  const checks: FormjackingConsistencyCheck[] = [];
  const metadataText = loadRepositoryText("labs/client/formjacking/meta.json");
  const parsedMetadata = parseLabMetadataJson(metadataText);

  checks.push(
    createCheck(
      "metadata-json-parse",
      parsedMetadata.ok,
      parsedMetadata.ok
        ? "Formjacking 元数据 JSON 可解析。"
        : parsedMetadata.errors.join("; "),
    ),
  );

  if (!parsedMetadata.ok) {
    return {
      labKey: "client.formjacking",
      scope: "local-repository-only",
      ok: false,
      checkedFiles: ["labs/client/formjacking/meta.json"],
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
        ? "Formjacking 元数据符合共享结构校验。"
        : validationResult.errors.join("; "),
    ),
  );

  if (!validationResult.ok) {
    return {
      labKey: "client.formjacking",
      scope: "local-repository-only",
      ok: false,
      checkedFiles: ["labs/client/formjacking/meta.json"],
      checks,
      notes: ["元数据结构未通过校验，后续一致性检查已停止。"],
    };
  }

  const metadata = validationResult.value;
  const scriptPath = "tools/lab-scripts/client/formjacking/verify.ts";
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
    path.join(repositoryRoot, "tools/lab-scripts/client/formjacking/exploit.py"),
  );

  checks.push(
    createCheck(
      "metadata-basic-state",
      metadata.id === "client.formjacking" &&
        metadata.mode === "simulation" &&
        metadata.status === "ready",
      "Formjacking 元数据应保持 client.formjacking / simulation / ready。",
    ),
  );
  checks.push(
    createCheck(
      "web-entrypoints",
      hasExactValues(
        metadata.entrypoints.web.map((entrypoint) => entrypoint.path),
        expectedWebEntrypoints,
      ),
      "Formjacking 前端入口应只包含漏洞版和修复版工作台。",
    ),
  );
  checks.push(
    createCheck(
      "api-entrypoints",
      hasExactValues(
        metadata.entrypoints.api.map((entrypoint) => entrypoint.path),
        expectedApiEntrypoints,
      ),
      "Formjacking API 入口应只包含专用工作台配置与漏洞版/修复版评估接口。",
    ),
  );
  checks.push(
    createCheck(
      "expected-signals",
      hasExactValues(
        metadata.verification.manual.expectedSignals,
        expectedSignals,
      ),
      "Formjacking 三个 canonical 终止信号应保持不变。",
    ),
  );
  checks.push(
    createCheck(
      "script-entrypoint",
      scriptEntrypoint?.key === "client-formjacking-verify" &&
        scriptEntrypoint.path === scriptPath &&
        scriptEntrypoint.language === "ts" &&
        scriptExists,
      "Formjacking 脚本入口应登记本机只读一致性验证脚本。",
    ),
  );
  checks.push(
    createCheck(
      "automation-scope",
      metadata.verification.automation.supported === true &&
        metadata.verification.automation.apiTest?.enabled === true &&
        metadata.verification.automation.apiTest.specPath ===
          "apps/server/tests/formjacking-lab.test.ts" &&
        metadata.verification.automation.scriptVerification?.enabled === true &&
        hasExactValues(
          metadata.verification.automation.scriptVerification.scriptKeys,
          ["client-formjacking-verify"],
        ),
      "自动化应登记专用服务端 API 测试和本机只读一致性验证脚本。",
    ),
  );
  checks.push(
    createCheck(
      "expected-documents-exist",
      expectedDocs.every((relativePath) =>
        existsSync(path.join(repositoryRoot, relativePath)),
      ),
      "Formjacking 标准文档和脚本说明应全部存在。",
    ),
  );
  checks.push(
    createCheck(
      "boundary-phrases",
      requiredBoundaryPhrases.every((phrase) =>
        combinedLabDocs.includes(phrase),
      ),
      "Formjacking 文档应持续声明固定案例、固定 scenarioKey 和未知输入脱敏阻断边界。",
    ),
  );
  checks.push(
    createCheck(
      "no-exploit-script",
      !exploitScriptExists,
      "Formjacking 作为 simulation 不应提供 exploit.py 或真实攻击脚本。",
    ),
  );
  checks.push(
    createCheck(
      "no-forbidden-implementation",
      implementationContents.every(
        (item) => !implementationHasForbiddenFragment(item.content),
      ),
      "Formjacking 相关实现不应引入系统命令或子进程执行片段。",
    ),
  );

  return {
    labKey: "client.formjacking",
    scope: "local-repository-only",
    ok: checks.every((check) => check.passed),
    checkedFiles: [
      "labs/client/formjacking/meta.json",
      ...expectedDocs,
      ...implementationFiles,
      scriptPath,
    ],
    checks,
    notes: [
      "本脚本只读取仓库内 Formjacking 元数据、文档和实现文件。",
      "本脚本不发起 HTTP 请求，不访问外部目标，不注入真实页面或采集表单数据。",
      "ready 状态仅代表本项目内固定多步骤学习闭环完成，不代表提供真实攻击能力。",
      "本脚本不提供 exploit.py，不接收任意页面、脚本或表单目标。",
    ],
  };
}

export function getFormjackingConsistencyVerificationPlan() {
  return {
    labKey: "client.formjacking",
    scope: "local-repository-only",
    safeBoundary:
      "只验证本项目仓库内 Formjacking 文档、元数据、入口和安全边界一致性，不发起网络请求，不注入真实页面。",
    expectedWebEntrypoints,
    expectedApiEntrypoints,
    expectedSignals,
    expectedScript: "tools/lab-scripts/client/formjacking/verify.ts",
    expectedDocuments: expectedDocs,
  };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const report = runFormjackingConsistencyVerification();

  console.log(JSON.stringify(report, null, 2));

  if (!report.ok) {
    process.exitCode = 1;
  }
}
