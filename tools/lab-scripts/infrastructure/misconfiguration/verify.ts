import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  parseLabMetadataJson,
  validateLabMetadata,
  type LabMetadata,
} from "../../../../packages/shared/src/lab-metadata.js";

export type MisconfigurationConsistencyCheck = {
  key: string;
  passed: boolean;
  message: string;
};

export type MisconfigurationConsistencyReport = {
  labKey: "infrastructure.misconfiguration";
  scope: "local-repository-only";
  ok: boolean;
  checkedFiles: string[];
  checks: MisconfigurationConsistencyCheck[];
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
  "/labs/infrastructure/misconfiguration/vuln",
  "/labs/infrastructure/misconfiguration/fixed",
];

const expectedApiEntrypoints = [
  "/api/labs/infrastructure/misconfiguration/vuln/audit",
  "/api/labs/infrastructure/misconfiguration/fixed/audit",
];

const expectedDocs = [
  "labs/infrastructure/misconfiguration/README.md",
  "labs/infrastructure/misconfiguration/vuln/README.md",
  "labs/infrastructure/misconfiguration/fixed/README.md",
  "labs/infrastructure/misconfiguration/mock/README.md",
  "labs/infrastructure/misconfiguration/docs/attack-steps.md",
  "labs/infrastructure/misconfiguration/docs/fix-notes.md",
  "labs/infrastructure/misconfiguration/docs/manual-verification.md",
  "tools/lab-scripts/infrastructure/misconfiguration/README.md",
];

const implementationFiles = [
  "apps/server/src/services/misconfiguration-lab.ts",
  "apps/web/src/api/misconfiguration-lab.ts",
  "apps/web/src/labs/misconfiguration.ts",
  "apps/web/src/views/MisconfigurationLabView.vue",
  "packages/testing/tests/e2e/platform.spec.mjs",
];

const evidenceFiles = [
  "apps/server/tests/misconfiguration-lab.test.ts",
  "apps/web/tests/misconfiguration-api.test.ts",
  "apps/web/tests/misconfiguration-lab.test.ts",
  "apps/web/tests/router.test.ts",
  "packages/shared/tests/lab-metadata.test.mjs",
];

const requiredBoundaryPhrases = [
  "固定配置",
  "固定样例",
  "不读取真实配置",
  "不扫描",
  "不连接真实管理接口",
  "不提供 `exploit.py`",
  "只读一致性验证",
];

const requiredFixedKeys = [
  "debug-console-exposed",
  "directory-index-enabled",
  "wildcard-cors-with-credentials",
  "public-admin-status",
  "verbose-error-detail",
  "default-credential-hint-visible",
  "exposure-review",
  "least-exposure-policy",
  "authenticated-admin-only",
  "strict-cors-audit",
  "safe-error-reporting",
];

const requiredSignals = [
  "misconfiguration-debug-surface-visible",
  "misconfiguration-directory-index-visible",
  "misconfiguration-cors-too-broad",
  "misconfiguration-admin-status-public",
  "misconfiguration-error-detail-exposed",
  "misconfiguration-default-credential-hint-visible",
  "misconfiguration-exposure-reduced",
  "misconfiguration-auth-required",
  "misconfiguration-cors-policy-restricted",
  "misconfiguration-safe-error-reporting",
  "misconfiguration-boundary-verified",
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
    key: "net-create-connection",
    fragment: "net." + "createConnection",
  },
  {
    key: "dns-lookup",
    fragment: "dns." + "lookup",
  },
  {
    key: "http-request",
    fragment: "http." + "request",
  },
  {
    key: "https-request",
    fragment: "https." + "request",
  },
  {
    key: "fs-read-file-sync",
    fragment: "read" + "FileSync(",
  },
  {
    key: "create-read-stream",
    fragment: "create" + "ReadStream",
  },
  {
    key: "nginx-config-field",
    fragment: "nginx" + "Config",
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
    key: "host-field",
    pattern: /\bhost\s*:/i,
  },
  {
    key: "port-field",
    pattern: /\bport\s*:/i,
  },
  {
    key: "credential-field",
    pattern: /\b(password|cookie|certificate)\s*:/i,
  },
];

function loadRepositoryText(relativePath: string) {
  return readFileSync(path.join(repositoryRoot, relativePath), "utf8");
}

function createCheck(
  key: string,
  passed: boolean,
  message: string,
): MisconfigurationConsistencyCheck {
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

export function runMisconfigurationConsistencyVerification(): MisconfigurationConsistencyReport {
  const checks: MisconfigurationConsistencyCheck[] = [];
  const metadataText = loadRepositoryText(
    "labs/infrastructure/misconfiguration/meta.json",
  );
  const parsedMetadata = parseLabMetadataJson(metadataText);

  checks.push(
    createCheck(
      "metadata-json-parse",
      parsedMetadata.ok,
      parsedMetadata.ok
        ? "配置错误元数据 JSON 可解析。"
        : parsedMetadata.errors.join("; "),
    ),
  );

  if (!parsedMetadata.ok) {
    return {
      labKey: "infrastructure.misconfiguration",
      scope: "local-repository-only",
      ok: false,
      checkedFiles: ["labs/infrastructure/misconfiguration/meta.json"],
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
        ? "配置错误元数据符合共享结构校验。"
        : validationResult.errors.join("; "),
    ),
  );

  if (!validationResult.ok) {
    return {
      labKey: "infrastructure.misconfiguration",
      scope: "local-repository-only",
      ok: false,
      checkedFiles: ["labs/infrastructure/misconfiguration/meta.json"],
      checks,
      notes: ["元数据结构未通过校验，后续一致性检查已停止。"],
    };
  }

  const metadata = validationResult.value;
  const scriptPath =
    "tools/lab-scripts/infrastructure/misconfiguration/verify.ts";
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
    "apps/web/src/api/misconfiguration-lab.ts",
  );
  const serverAppText = loadRepositoryText("apps/server/src/app.ts");
  const playwrightText = loadRepositoryText(
    "packages/testing/tests/e2e/platform.spec.mjs",
  );
  const scriptExists = existsSync(path.join(repositoryRoot, scriptPath));
  const exploitScriptExists = existsSync(
    path.join(
      repositoryRoot,
      "tools/lab-scripts/infrastructure/misconfiguration/exploit.py",
    ),
  );

  checks.push(
    createCheck(
      "metadata-basic-state",
      metadata.id === "infrastructure.misconfiguration" &&
        metadata.mode === "simulation" &&
        metadata.status === "in-progress",
      "配置错误元数据应保持 infrastructure.misconfiguration / simulation / in-progress。",
    ),
  );
  checks.push(
    createCheck(
      "web-entrypoints",
      hasExactValues(
        metadata.entrypoints.web.map((entrypoint) => entrypoint.path),
        expectedWebEntrypoints,
      ),
      "配置错误前端入口应只包含漏洞版和修复版固定审计工作台。",
    ),
  );
  checks.push(
    createCheck(
      "api-entrypoints",
      hasExactValues(
        metadata.entrypoints.api.map((entrypoint) => entrypoint.path),
        expectedApiEntrypoints,
      ),
      "配置错误 API 入口应只包含漏洞版和修复版 audit 接口。",
    ),
  );
  checks.push(
    createCheck(
      "script-entrypoint",
      metadata.entrypoints.scripts.length === 1 &&
        scriptEntrypoint?.key === "misconfiguration-verify" &&
        scriptEntrypoint.path === scriptPath &&
        scriptEntrypoint.language === "ts" &&
        scriptExists,
      "配置错误脚本入口应只登记本机只读一致性验证脚本。",
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
          "apps/server/tests/misconfiguration-lab.test.ts" &&
        metadata.verification.automation.scriptVerification?.enabled === true &&
        hasExactValues(
          metadata.verification.automation.scriptVerification.scriptKeys,
          ["misconfiguration-verify"],
        ) &&
        metadata.variants.every((variant) => !variant.supportsAutomation),
      "自动化应登记 Playwright 页面验证、服务端 API 测试和本机只读一致性验证脚本，变体仍不登记攻击脚本自动化。",
    ),
  );
  checks.push(
    createCheck(
      "in-progress-boundary",
      metadata.safeBoundaries.some(
        (boundary) =>
          boundary.includes("只读一致性验证") &&
          boundary.includes("不表示存在攻击脚本或真实配置审计能力"),
      ) &&
        metadata.safeBoundaries.some((boundary) =>
          boundary.includes("不提供 exploit.py"),
        ) &&
        metadata.notes.includes("只读一致性验证") &&
        metadata.notes.includes("variants[].supportsAutomation 仍为 false") &&
        metadata.notes.includes("不提供") &&
        metadata.notes.includes("exploit.py"),
      "配置错误 in-progress 元数据应说明只读验证证据、固定样例学习边界和不提供 exploit.py。",
    ),
  );
  checks.push(
    createCheck(
      "expected-documents-exist",
      expectedDocs.every((relativePath) =>
        existsSync(path.join(repositoryRoot, relativePath)),
      ),
      "配置错误标准文档和脚本说明应全部存在。",
    ),
  );
  checks.push(
    createCheck(
      "boundary-phrases",
      requiredBoundaryPhrases.every((phrase) =>
        combinedLabDocs.includes(phrase),
      ),
      "配置错误文档应持续声明固定样例、无真实配置读取、无扫描、无真实管理接口连接和无 exploit.py 边界。",
    ),
  );
  checks.push(
    createCheck(
      "fixed-keys-visible",
      requiredFixedKeys.every((key) => combinedLabDocs.includes(key)),
      "配置错误文档应列出全部固定配置样例 key 和固定审计策略 key。",
    ),
  );
  checks.push(
    createCheck(
      "expected-signals-visible",
      requiredSignals.every((signal) => combinedLabDocs.includes(signal)),
      "配置错误文档应列出漏洞版、修复版和边界验证预期学习信号。",
    ),
  );
  checks.push(
    createCheck(
      "no-exploit-script",
      !exploitScriptExists,
      "配置错误脚本目录不应提供 exploit.py、扫描器或配置修改脚本。",
    ),
  );
  checks.push(
    createCheck(
      "no-real-infrastructure-implementation",
      implementationContents.every(
        (item) => !implementationHasForbiddenFragment(item.content),
      ),
      "配置错误相关实现不应包含真实配置读取、真实服务扫描、真实管理接口连接、命令执行或自由输入控件。",
    ),
  );
  checks.push(
    createCheck(
      "server-route-mounted",
      serverAppText.includes(
        "/api/labs/infrastructure/misconfiguration/:variant/audit",
      ) &&
        serverAppText.includes("summarizeMisconfigurationInput") &&
        serverAppText.includes('labKey: "infrastructure.misconfiguration"'),
      "服务端应挂载配置错误 audit 接口，并使用统一事件日志安全摘要。",
    ),
  );
  checks.push(
    createCheck(
      "fixed-key-request-body",
      apiClientText.includes("configCaseKey: input.configCaseKey") &&
        apiClientText.includes("auditPolicyKey: input.auditPolicyKey") &&
        !apiClientText.includes("nginxConfig") &&
        !apiClientText.includes("host:") &&
        !apiClientText.includes("port:") &&
        !apiClientText.includes("path:") &&
        !apiClientText.includes("password:") &&
        !apiClientText.includes("cookie:"),
      "配置错误 API client 应只提交固定 configCaseKey 和 auditPolicyKey。",
    ),
  );
  checks.push(
    createCheck(
      "playwright-boundary",
      playwrightText.includes(
        "登录用户可以对比配置错误漏洞版暴露信号与修复版审计路径",
      ) &&
        playwrightText.includes(
          "/labs/infrastructure/misconfiguration/vuln",
        ) &&
        playwrightText.includes(
          "/labs/infrastructure/misconfiguration/fixed",
        ) &&
        playwrightText.includes('getByRole("textbox")).toHaveCount(0)') &&
        playwrightText.includes("调试入口可见") &&
        playwrightText.includes("CORS 策略过宽") &&
        playwrightText.includes("管理入口已要求认证") &&
        playwrightText.includes("错误信息已安全分层"),
      "Playwright 应覆盖配置错误漏洞版和修复版固定路径，并断言页面无文本输入框。",
    ),
  );

  return {
    labKey: "infrastructure.misconfiguration",
    scope: "local-repository-only",
    ok: checks.every((check) => check.passed),
    checkedFiles: [
      "labs/infrastructure/misconfiguration/meta.json",
      ...expectedDocs,
      ...implementationFiles,
      ...evidenceFiles,
      scriptPath,
    ],
    checks,
    notes: [
      "本脚本只读取仓库内配置错误元数据、文档、前端、后端和测试文件。",
      "本脚本不发起 HTTP 请求，不扫描端口、网段、服务、域名、云资源或本机进程。",
      "本脚本不读取 .env、真实配置文件、服务配置、系统配置、云凭据、token、Cookie、证书或密码。",
      "本脚本不修改、重载或启动真实 nginx、MySQL、Node、Windows 服务、代理、防火墙或云配置。",
      "本脚本入口是只读一致性验证，不是 exploit.py、扫描器、弱口令测试、服务枚举脚本或配置修改脚本。",
    ],
  };
}

export function getMisconfigurationConsistencyVerificationPlan() {
  return {
    labKey: "infrastructure.misconfiguration",
    scope: "local-repository-only",
    safeBoundary:
      "只验证本项目仓库内配置错误文档、元数据、固定 key 入口和安全边界一致性，不读取真实配置，不扫描或连接真实基础设施。",
    expectedWebEntrypoints,
    expectedApiEntrypoints,
    expectedScript:
      "tools/lab-scripts/infrastructure/misconfiguration/verify.ts",
    expectedDocuments: expectedDocs,
  };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const report = runMisconfigurationConsistencyVerification();

  console.log(JSON.stringify(report, null, 2));

  if (!report.ok) {
    process.exitCode = 1;
  }
}
