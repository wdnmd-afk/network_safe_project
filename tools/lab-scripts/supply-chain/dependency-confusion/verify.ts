import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  parseLabMetadataJson,
  validateLabMetadata,
  type LabMetadata,
} from "../../../../packages/shared/src/lab-metadata.js";

export type DependencyConfusionConsistencyCheck = {
  key: string;
  passed: boolean;
  message: string;
};

export type DependencyConfusionConsistencyReport = {
  labKey: "supply-chain.dependency-confusion";
  scope: "local-repository-only";
  ok: boolean;
  checkedFiles: string[];
  checks: DependencyConfusionConsistencyCheck[];
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
  "/labs/supply-chain/dependency-confusion/vuln",
  "/labs/supply-chain/dependency-confusion/fixed",
];

const expectedApiEntrypoints = [
  "/api/labs/supply-chain/dependency-confusion/vuln/resolve",
  "/api/labs/supply-chain/dependency-confusion/fixed/resolve",
];

const expectedDocs = [
  "labs/supply-chain/dependency-confusion/README.md",
  "labs/supply-chain/dependency-confusion/vuln/README.md",
  "labs/supply-chain/dependency-confusion/fixed/README.md",
  "labs/supply-chain/dependency-confusion/mock/README.md",
  "labs/supply-chain/dependency-confusion/docs/attack-steps.md",
  "labs/supply-chain/dependency-confusion/docs/fix-notes.md",
  "labs/supply-chain/dependency-confusion/docs/manual-verification.md",
  "tools/lab-scripts/supply-chain/dependency-confusion/README.md",
];

const implementationFiles = [
  "apps/server/src/services/dependency-confusion-lab.ts",
  "apps/server/src/app.ts",
  "apps/web/src/api/dependency-confusion-lab.ts",
  "apps/web/src/labs/dependency-confusion.ts",
  "apps/web/src/views/DependencyConfusionLabView.vue",
  "packages/testing/tests/e2e/platform.spec.mjs",
];

const evidenceFiles = [
  "apps/server/tests/dependency-confusion-lab.test.ts",
  "apps/web/tests/dependency-confusion-api.test.ts",
  "apps/web/tests/dependency-confusion-lab.test.ts",
  "apps/web/tests/router.test.ts",
];

const requiredBoundaryPhrases = [
  "固定 manifest",
  "固定伪 registry",
  "不运行真实依赖安装",
  "不访问真实 npm",
  "不发布真实包",
  "不读取 `.npmrc`",
  "不提供 `exploit.py`",
  "只读一致性验证",
];

const requiredFixedKeys = [
  "unscoped-internal-name",
  "scoped-private-package",
  "mixed-source-review",
  "public-name-collision",
  "private-scope-pinned",
  "lockfile-integrity-mismatch",
  "prefer-public-latest",
  "scope-pinned-private",
  "lockfile-integrity-audit",
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
  {
    key: "exec-file-call",
    fragment: "exec" + "File(",
  },
  {
    key: "npm-install-command",
    fragment: "npm " + "install",
  },
  {
    key: "npm-publish-command",
    fragment: "npm " + "publish",
  },
  {
    key: "npm-login-command",
    fragment: "npm " + "login",
  },
  {
    key: "pnpm-install-command",
    fragment: "pnpm " + "install",
  },
  {
    key: "pnpm-add-command",
    fragment: "pnpm " + "add",
  },
  {
    key: "yarn-install-command",
    fragment: "yarn " + "install",
  },
  {
    key: "node-modules-write",
    fragment: "node_" + "modules",
  },
  {
    key: "package-name-field",
    fragment: "package" + "Name",
  },
  {
    key: "registry-url-field",
    fragment: "registry" + "Url",
  },
  {
    key: "lifecycle-script-field",
    fragment: "lifecycle" + "Script",
  },
  {
    key: "archive-generation",
    fragment: "tar" + "ball",
  },
  {
    key: "textbox-fill",
    fragment: 'getByRole("textbox").fill',
  },
  {
    key: "text-input",
    fragment: "<input",
  },
  {
    key: "textarea-input",
    fragment: "<textarea",
  },
];

const forbiddenImplementationPatterns = [
  {
    key: "external-url-literal",
    pattern: /https?:\/\//i,
  },
  {
    key: "registry-url-key",
    pattern: /\bregistry[_-]?url\b/i,
  },
  {
    key: "package-name-key",
    pattern: /\bpackage[_-]?name\b/i,
  },
  {
    key: "publish-key",
    pattern: /\bpublish\b/i,
  },
];

function loadRepositoryText(relativePath: string) {
  return readFileSync(path.join(repositoryRoot, relativePath), "utf8");
}

function createCheck(
  key: string,
  passed: boolean,
  message: string,
): DependencyConfusionConsistencyCheck {
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
  return (
    forbiddenImplementationFragments.some((item) =>
      content.includes(item.fragment),
    ) || forbiddenImplementationPatterns.some((item) => item.pattern.test(content))
  );
}

export function runDependencyConfusionConsistencyVerification(): DependencyConfusionConsistencyReport {
  const checks: DependencyConfusionConsistencyCheck[] = [];
  const metadataText = loadRepositoryText(
    "labs/supply-chain/dependency-confusion/meta.json",
  );
  const parsedMetadata = parseLabMetadataJson(metadataText);

  checks.push(
    createCheck(
      "metadata-json-parse",
      parsedMetadata.ok,
      parsedMetadata.ok
        ? "依赖混淆元数据 JSON 可解析。"
        : parsedMetadata.errors.join("; "),
    ),
  );

  if (!parsedMetadata.ok) {
    return {
      labKey: "supply-chain.dependency-confusion",
      scope: "local-repository-only",
      ok: false,
      checkedFiles: ["labs/supply-chain/dependency-confusion/meta.json"],
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
        ? "依赖混淆元数据符合共享结构校验。"
        : validationResult.errors.join("; "),
    ),
  );

  if (!validationResult.ok) {
    return {
      labKey: "supply-chain.dependency-confusion",
      scope: "local-repository-only",
      ok: false,
      checkedFiles: ["labs/supply-chain/dependency-confusion/meta.json"],
      checks,
      notes: ["元数据结构未通过校验，后续一致性检查已停止。"],
    };
  }

  const metadata = validationResult.value;
  const scriptPath =
    "tools/lab-scripts/supply-chain/dependency-confusion/verify.ts";
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
  const apiClientText = loadRepositoryText(
    "apps/web/src/api/dependency-confusion-lab.ts",
  );
  const serverAppText = loadRepositoryText("apps/server/src/app.ts");
  const playwrightText = loadRepositoryText(
    "packages/testing/tests/e2e/platform.spec.mjs",
  );
  const scriptExists = existsSync(path.join(repositoryRoot, scriptPath));
  const exploitScriptExists = existsSync(
    path.join(
      repositoryRoot,
      "tools/lab-scripts/supply-chain/dependency-confusion/exploit.py",
    ),
  );

  checks.push(
    createCheck(
      "metadata-basic-state",
      metadata.id === "supply-chain.dependency-confusion" &&
        metadata.mode === "simulation" &&
        metadata.status === "ready",
      "依赖混淆元数据应保持 supply-chain.dependency-confusion / simulation / ready。",
    ),
  );
  checks.push(
    createCheck(
      "web-entrypoints",
      hasExactValues(
        metadata.entrypoints.web.map((entrypoint) => entrypoint.path),
        expectedWebEntrypoints,
      ),
      "依赖混淆前端入口应只包含漏洞版和修复版固定选择器工作台。",
    ),
  );
  checks.push(
    createCheck(
      "api-entrypoints",
      hasExactValues(
        metadata.entrypoints.api.map((entrypoint) => entrypoint.path),
        expectedApiEntrypoints,
      ),
      "依赖混淆 API 入口应只包含漏洞版和修复版 resolve 接口。",
    ),
  );
  checks.push(
    createCheck(
      "script-entrypoint",
      metadata.entrypoints.scripts.length === 1 &&
        scriptEntrypoint?.key === "dependency-confusion-verify" &&
        scriptEntrypoint.path === scriptPath &&
        scriptEntrypoint.language === "ts" &&
        scriptExists,
      "依赖混淆脚本入口应只登记本机只读一致性验证脚本。",
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
          "apps/server/tests/dependency-confusion-lab.test.ts" &&
        metadata.verification.automation.scriptVerification?.enabled === true &&
        hasExactValues(
          metadata.verification.automation.scriptVerification.scriptKeys,
          ["dependency-confusion-verify"],
        ) &&
        metadata.variants.every((variant) => !variant.supportsAutomation),
      "自动化应登记 Playwright 页面验证、服务端 API 测试和本机只读一致性验证脚本，变体仍不登记攻击脚本自动化。",
    ),
  );
  checks.push(
    createCheck(
      "simulation-ready-boundary",
      metadata.safeBoundaries.some(
        (boundary) =>
          boundary.includes("ready 状态仅表示") &&
          boundary.includes("固定样例学习边界"),
      ) &&
        metadata.safeBoundaries.some((boundary) =>
          boundary.includes("不提供 exploit.py"),
        ) &&
        metadata.notes.includes("ready 收口审计") &&
        metadata.notes.includes("只读一致性验证") &&
        metadata.notes.includes("variants[].supportsAutomation 仍为 false") &&
        metadata.notes.includes("不提供") &&
        metadata.notes.includes("exploit.py"),
      "依赖混淆 ready 元数据应说明固定样例学习边界、只读验证证据和不提供 exploit.py。",
    ),
  );
  checks.push(
    createCheck(
      "expected-documents-exist",
      expectedDocs.every((relativePath) =>
        existsSync(path.join(repositoryRoot, relativePath)),
      ),
      "依赖混淆标准文档和脚本说明应全部存在。",
    ),
  );
  checks.push(
    createCheck(
      "boundary-phrases",
      requiredBoundaryPhrases.every((phrase) =>
        combinedLabDocs.includes(phrase),
      ),
      "依赖混淆文档应持续声明固定样例、无真实 registry、无真实安装发布和无 exploit.py 边界。",
    ),
  );
  checks.push(
    createCheck(
      "fixed-keys-visible",
      requiredFixedKeys.every((key) => combinedLabDocs.includes(key)),
      "依赖混淆文档应列出全部固定 manifest、伪 registry 场景和解析策略 key。",
    ),
  );
  checks.push(
    createCheck(
      "no-exploit-script",
      !exploitScriptExists,
      "依赖混淆脚本目录不应提供 exploit.py 或供应链攻击脚本。",
    ),
  );
  checks.push(
    createCheck(
      "no-real-supply-chain-implementation",
      implementationContents.every(
        (item) => !implementationHasForbiddenFragment(item.content),
      ),
      "依赖混淆相关实现不应包含真实安装、发布、registry URL、任意包名输入、包归档、生命周期脚本或命令执行能力。",
    ),
  );
  checks.push(
    createCheck(
      "server-route-mounted",
      serverAppText.includes(
        "/api/labs/supply-chain/dependency-confusion/:variant/resolve",
      ) &&
        serverAppText.includes("summarizeDependencyConfusionInput") &&
        serverAppText.includes('labKey: "supply-chain.dependency-confusion"'),
      "服务端应挂载依赖混淆 resolve 接口，并使用统一事件日志安全摘要。",
    ),
  );
  checks.push(
    createCheck(
      "fixed-key-request-body",
      apiClientText.includes("manifestKey: input.manifestKey") &&
        apiClientText.includes(
          "registryScenarioKey: input.registryScenarioKey",
        ) &&
        apiClientText.includes(
          "resolutionPolicyKey: input.resolutionPolicyKey",
        ) &&
        !apiClientText.includes("packageName") &&
        !apiClientText.includes("registryUrl") &&
        !apiClientText.includes("lockfileContent"),
      "依赖混淆 API client 应只提交固定 manifestKey、registryScenarioKey 和 resolutionPolicyKey。",
    ),
  );
  checks.push(
    createCheck(
      "playwright-boundary",
      playwrightText.includes("登录用户可以对比依赖混淆漏洞版公共来源与修复版审计路径") &&
        playwrightText.includes('getByRole("textbox")).toHaveCount(0)') &&
        playwrightText.includes("未绑定 scope") &&
        playwrightText.includes("私有 scope") &&
        playwrightText.includes("完整性审计") &&
        playwrightText.includes("混合来源"),
      "Playwright 应覆盖依赖混淆漏洞版和修复版固定路径，并断言页面无文本输入框。",
    ),
  );

  return {
    labKey: "supply-chain.dependency-confusion",
    scope: "local-repository-only",
    ok: checks.every((check) => check.passed),
    checkedFiles: [
      "labs/supply-chain/dependency-confusion/meta.json",
      ...expectedDocs,
      ...implementationFiles,
      ...evidenceFiles,
      scriptPath,
    ],
    checks,
    notes: [
      "本脚本只读取仓库内依赖混淆元数据、文档、前端、后端和测试文件。",
      "本脚本不发起 HTTP 请求，不安装、下载、打包或发布依赖，不访问真实 registry。",
      "本脚本不读取 .env、.npmrc、Cookie、token、registry 凭据、CI 凭据或真实依赖缓存。",
      "本脚本入口是只读一致性验证，不是 exploit.py、安装器、发布器、包归档生成器或攻击脚本。",
      "当前实验已按 simulation ready 收口，ready 仅代表本项目内固定样例学习闭环完成。",
    ],
  };
}

export function getDependencyConfusionConsistencyVerificationPlan() {
  return {
    labKey: "supply-chain.dependency-confusion",
    scope: "local-repository-only",
    safeBoundary:
      "只验证本项目仓库内依赖混淆文档、元数据、固定 key 入口和安全边界一致性，不安装依赖，不连接真实 registry。",
    expectedWebEntrypoints,
    expectedApiEntrypoints,
    expectedScript:
      "tools/lab-scripts/supply-chain/dependency-confusion/verify.ts",
    expectedDocuments: expectedDocs,
  };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const report = runDependencyConfusionConsistencyVerification();

  console.log(JSON.stringify(report, null, 2));

  if (!report.ok) {
    process.exitCode = 1;
  }
}
