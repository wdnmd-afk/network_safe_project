import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  parseLabMetadataJson,
  validateLabMetadata,
  type LabMetadata,
} from "../../../../packages/shared/src/lab-metadata.js";

export type InsecureRandomnessConsistencyCheck = {
  key: string;
  passed: boolean;
  message: string;
};

export type InsecureRandomnessConsistencyReport = {
  labKey: "crypto.insecure-randomness";
  scope: "local-repository-only";
  ok: boolean;
  checkedFiles: string[];
  checks: InsecureRandomnessConsistencyCheck[];
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
  "/labs/crypto/insecure-randomness/vuln",
  "/labs/crypto/insecure-randomness/fixed",
];

const expectedApiEntrypoints = [
  "/api/labs/crypto/insecure-randomness/workbench",
  "/api/labs/crypto/insecure-randomness/vuln/evaluate",
  "/api/labs/crypto/insecure-randomness/fixed/evaluate",
];

const expectedSignals = [
  "crypto-insecure-randomness-risk-accepted",
  "crypto-insecure-randomness-defense-blocked",
  "crypto-insecure-randomness-normal-verified",
];

const expectedDocs = [
  "labs/crypto/insecure-randomness/README.md",
  "labs/crypto/insecure-randomness/vuln/README.md",
  "labs/crypto/insecure-randomness/fixed/README.md",
  "labs/crypto/insecure-randomness/mock/README.md",
  "labs/crypto/insecure-randomness/docs/attack-steps.md",
  "labs/crypto/insecure-randomness/docs/fix-notes.md",
  "labs/crypto/insecure-randomness/docs/manual-verification.md",
  "tools/lab-scripts/crypto/insecure-randomness/README.md",
];

const implementationFiles = [
  "apps/server/src/services/insecure-randomness-lab.ts",
  "apps/server/src/app.ts",
  "apps/web/src/api/insecure-randomness-lab.ts",
  "apps/web/src/labs/insecure-randomness.ts",
  "apps/web/src/views/InsecureRandomnessLabView.vue",
];

const testFiles = [
  "apps/server/tests/insecure-randomness-lab.test.ts",
  "apps/web/tests/insecure-randomness-api.test.ts",
];

const requiredContractFragments = [
  "predictable-session-token-sequence",
  "trust-timestamp-counter-pattern",
  "detect-low-entropy-pattern",
  "keep-predictable-token-source",
  "block-weak-token-generation",
  "verify-csprng-token-policy",
  ...expectedSignals,
];

const forbiddenImplementationFragments = [
  "node:" + "child_process",
  "child_" + "process",
  "random" + "Bytes(",
  "Math." + "random(",
  "http." + "request(",
  "https." + "request(",
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
): InsecureRandomnessConsistencyCheck {
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

export function runInsecureRandomnessConsistencyVerification(): InsecureRandomnessConsistencyReport {
  const checks: InsecureRandomnessConsistencyCheck[] = [];
  const metadataPath = "labs/crypto/insecure-randomness/meta.json";
  const metadataText = loadRepositoryText(metadataPath);
  const parsedMetadata = parseLabMetadataJson(metadataText);

  checks.push(
    createCheck(
      "metadata-json-parse",
      parsedMetadata.ok,
      parsedMetadata.ok
        ? "不安全随机数元数据 JSON 可解析。"
        : parsedMetadata.errors.join("; "),
    ),
  );

  if (!parsedMetadata.ok) {
    return {
      labKey: "crypto.insecure-randomness",
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
        ? "不安全随机数元数据符合共享结构校验。"
        : validationResult.errors.join("; "),
    ),
  );

  if (!validationResult.ok) {
    return {
      labKey: "crypto.insecure-randomness",
      scope: "local-repository-only",
      ok: false,
      checkedFiles: [metadataPath],
      checks,
      notes: ["元数据结构未通过校验，后续一致性检查已停止。"],
    };
  }

  const metadata = validationResult.value;
  const scriptPath = "tools/lab-scripts/crypto/insecure-randomness/verify.ts";
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
      metadata.id === "crypto.insecure-randomness" &&
        metadata.mode === "simulation" &&
        metadata.status === "ready",
      "完成命令验证后，不安全随机数元数据应保持 crypto.insecure-randomness / simulation / ready。",
    ),
    createCheck(
      "web-entrypoints",
      hasExactValues(
        metadata.entrypoints.web.map((entrypoint) => entrypoint.path),
        expectedWebEntrypoints,
      ),
      "不安全随机数前端入口应只包含漏洞版和修复版专用工作台。",
    ),
    createCheck(
      "api-entrypoints",
      hasExactValues(
        metadata.entrypoints.api.map((entrypoint) => entrypoint.path),
        expectedApiEntrypoints,
      ),
      "不安全随机数 API 入口应只包含工作台配置与漏洞版/修复版评估接口。",
    ),
    createCheck(
      "expected-signals",
      hasExactValues(
        metadata.verification.manual.expectedSignals,
        expectedSignals,
      ),
      "不安全随机数三个 canonical 终止信号应保持一致。",
    ),
    createCheck(
      "script-entrypoint",
      scriptEntrypoint?.key === "crypto-insecure-randomness-verify" &&
        scriptEntrypoint.path === scriptPath &&
        scriptEntrypoint.language === "ts" &&
        existsSync(path.join(repositoryRoot, scriptPath)),
      "不安全随机数脚本入口应登记本机只读一致性验证脚本。",
    ),
    createCheck(
      "automation-scope",
      metadata.verification.automation.supported === true &&
        metadata.verification.automation.apiTest?.enabled === true &&
        metadata.verification.automation.apiTest.specPath ===
          "apps/server/tests/insecure-randomness-lab.test.ts" &&
        metadata.verification.automation.scriptVerification?.enabled === true &&
        hasExactValues(
          metadata.verification.automation.scriptVerification.scriptKeys,
          ["crypto-insecure-randomness-verify"],
        ),
      "自动化入口应登记专用 API 测试和只读验证脚本。",
    ),
    createCheck(
      "expected-files-exist",
      [...expectedDocs, ...implementationFiles, ...testFiles].every(
        (relativePath) => existsSync(path.join(repositoryRoot, relativePath)),
      ),
      "不安全随机数标准文档、实现文件和专用测试应全部存在。",
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
      ["固定", "scenarioKey", "optionKey", "脱敏阻断", "不生成"].every(
        (phrase) => combinedDocs.includes(phrase),
      ),
      "文档应声明固定输入、未知 key 脱敏阻断和不生成真实 token 的边界。",
    ),
    createCheck(
      "no-exploit-script",
      !existsSync(
        path.join(
          repositoryRoot,
          "tools/lab-scripts/crypto/insecure-randomness/exploit.py",
        ),
      ),
      "不安全随机数实验不应提供 token 预测或爆破脚本。",
    ),
    createCheck(
      "no-forbidden-implementation",
      forbiddenImplementationFragments.every(
        (fragment) => !combinedImplementation.includes(fragment),
      ),
      "不安全随机数实现不应生成随机材料、发起外部请求或执行系统命令。",
    ),
  );

  return {
    labKey: "crypto.insecure-randomness",
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
      "本脚本只读取仓库内不安全随机数元数据、文档、实现和测试文件。",
      "本脚本不发起 HTTP 请求，不生成 token，不访问认证系统或外部目标。",
      "ready 只表示本机固定摘要学习闭环通过验证，不代表生成或分析真实 token。",
      "本脚本不提供 exploit.py、序列预测、枚举、爆破或会话接管能力。",
    ],
  };
}

export function getInsecureRandomnessConsistencyVerificationPlan() {
  return {
    labKey: "crypto.insecure-randomness",
    scope: "local-repository-only",
    expectedWebEntrypoints,
    expectedApiEntrypoints,
    expectedSignals,
    expectedScript:
      "tools/lab-scripts/crypto/insecure-randomness/verify.ts",
    expectedDocuments: expectedDocs,
  };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const report = runInsecureRandomnessConsistencyVerification();

  console.log(JSON.stringify(report, null, 2));

  if (!report.ok) {
    process.exitCode = 1;
  }
}
