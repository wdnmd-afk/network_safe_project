import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  parseLabMetadataJson,
  validateLabMetadata,
  type LabMetadata,
} from "../../../../packages/shared/src/lab-metadata.js";

export type PortScanConsistencyCheck = {
  key: string;
  passed: boolean;
  message: string;
};

export type PortScanConsistencyReport = {
  labKey: "network.port-scan";
  scope: "local-repository-only";
  ok: boolean;
  checkedFiles: string[];
  checks: PortScanConsistencyCheck[];
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
  "/labs/network/port-scan/vuln",
  "/labs/network/port-scan/fixed",
];

const expectedApiEntrypoints = [
  "/api/labs/network/port-scan/vuln/scan",
  "/api/labs/network/port-scan/fixed/scan",
];

const expectedDocs = [
  "labs/network/port-scan/README.md",
  "labs/network/port-scan/vuln/README.md",
  "labs/network/port-scan/fixed/README.md",
  "labs/network/port-scan/mock/README.md",
  "labs/network/port-scan/docs/attack-steps.md",
  "labs/network/port-scan/docs/fix-notes.md",
  "labs/network/port-scan/docs/manual-verification.md",
  "tools/lab-scripts/network/port-scan/README.md",
];

const implementationFiles = [
  "apps/server/src/services/port-scan-lab.ts",
  "apps/server/src/app.ts",
  "apps/web/src/api/port-scan-lab.ts",
  "apps/web/src/labs/port-scan.ts",
  "apps/web/src/views/PortScanLabView.vue",
];

const requiredBoundaryPhrases = [
  "固定虚拟资产",
  "不扫描局域网",
  "不调用真实 socket",
  "不提供 exploit.py",
  "不保存真实 IP",
];

const forbiddenImplementationFragments = [
  {
    key: "node-net-import",
    fragment: "node:" + "net",
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
    key: "nmap-command",
    fragment: "n" + "map",
  },
  {
    key: "test-netconnection-command",
    fragment: "Test-" + "NetConnection",
  },
  {
    key: "ping-command",
    fragment: "p" + "ing ",
  },
  {
    key: "tracert-command",
    fragment: "trac" + "ert",
  },
  {
    key: "netcat-command",
    fragment: "net" + "cat",
  },
];

const standaloneNcPattern = /\bnc\b/i;

function loadRepositoryText(relativePath: string) {
  return readFileSync(path.join(repositoryRoot, relativePath), "utf8");
}

function createCheck(
  key: string,
  passed: boolean,
  message: string,
): PortScanConsistencyCheck {
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
    ) || standaloneNcPattern.test(content)
  );
}

export function runPortScanConsistencyVerification(): PortScanConsistencyReport {
  const checks: PortScanConsistencyCheck[] = [];
  const metadataText = loadRepositoryText("labs/network/port-scan/meta.json");
  const parsedMetadata = parseLabMetadataJson(metadataText);

  checks.push(
    createCheck(
      "metadata-json-parse",
      parsedMetadata.ok,
      parsedMetadata.ok
        ? "端口扫描元数据 JSON 可解析。"
        : parsedMetadata.errors.join("; "),
    ),
  );

  if (!parsedMetadata.ok) {
    return {
      labKey: "network.port-scan",
      scope: "local-repository-only",
      ok: false,
      checkedFiles: ["labs/network/port-scan/meta.json"],
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
        ? "端口扫描元数据符合共享结构校验。"
        : validationResult.errors.join("; "),
    ),
  );

  if (!validationResult.ok) {
    return {
      labKey: "network.port-scan",
      scope: "local-repository-only",
      ok: false,
      checkedFiles: ["labs/network/port-scan/meta.json"],
      checks,
      notes: ["元数据结构未通过校验，后续一致性检查已停止。"],
    };
  }

  const metadata = validationResult.value;
  const scriptPath = "tools/lab-scripts/network/port-scan/verify.ts";
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
    path.join(repositoryRoot, "tools/lab-scripts/network/port-scan/exploit.py"),
  );

  checks.push(
    createCheck(
      "metadata-basic-state",
      metadata.id === "network.port-scan" &&
        metadata.mode === "simulation" &&
        metadata.status === "in-progress",
      "端口扫描元数据应保持 network.port-scan / simulation / in-progress。",
    ),
  );
  checks.push(
    createCheck(
      "web-entrypoints",
      hasExactValues(
        metadata.entrypoints.web.map((entrypoint) => entrypoint.path),
        expectedWebEntrypoints,
      ),
      "端口扫描前端入口应只包含漏洞版和修复版工作台。",
    ),
  );
  checks.push(
    createCheck(
      "api-entrypoints",
      hasExactValues(
        metadata.entrypoints.api.map((entrypoint) => entrypoint.path),
        expectedApiEntrypoints,
      ),
      "端口扫描 API 入口应只包含漏洞版和修复版 scan 接口。",
    ),
  );
  checks.push(
    createCheck(
      "script-entrypoint",
      metadata.entrypoints.scripts.length === 1 &&
        scriptEntrypoint?.key === "port-scan-verify" &&
        scriptEntrypoint.path === scriptPath &&
        scriptEntrypoint.language === "ts" &&
        scriptExists,
      "端口扫描脚本入口应只登记本机只读一致性验证脚本。",
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
          "apps/server/tests/port-scan-lab.test.ts" &&
        metadata.verification.automation.scriptVerification?.enabled === true &&
        hasExactValues(
          metadata.verification.automation.scriptVerification.scriptKeys,
          ["port-scan-verify"],
        ),
      "自动化应登记 Playwright 页面验证、服务端 API 测试和本机只读一致性验证脚本。",
    ),
  );
  checks.push(
    createCheck(
      "expected-documents-exist",
      expectedDocs.every((relativePath) =>
        existsSync(path.join(repositoryRoot, relativePath)),
      ),
      "端口扫描标准文档和脚本说明应全部存在。",
    ),
  );
  checks.push(
    createCheck(
      "boundary-phrases",
      requiredBoundaryPhrases.every((phrase) =>
        combinedLabDocs.includes(phrase),
      ),
      "端口扫描文档应持续声明固定虚拟资产、无真实扫描和无真实数据保存边界。",
    ),
  );
  checks.push(
    createCheck(
      "no-exploit-script",
      !exploitScriptExists,
      "端口扫描脚本目录不应提供 exploit.py 或真实扫描脚本。",
    ),
  );
  checks.push(
    createCheck(
      "no-real-probe-implementation",
      implementationContents.every(
        (item) => !implementationHasForbiddenFragment(item.content),
      ),
      "端口扫描相关实现不应引入网络探测模块、系统命令或通用扫描器片段。",
    ),
  );

  return {
    labKey: "network.port-scan",
    scope: "local-repository-only",
    ok: checks.every((check) => check.passed),
    checkedFiles: [
      "labs/network/port-scan/meta.json",
      ...expectedDocs,
      ...implementationFiles,
      scriptPath,
    ],
    checks,
    notes: [
      "本脚本只读取仓库内端口扫描元数据、文档和实现文件。",
      "本脚本不发起 HTTP 请求，不访问外部目标，不执行真实端口扫描。",
      "本脚本不提供 exploit.py，不接收任意主机、网段或端口范围。",
    ],
  };
}

export function getPortScanConsistencyVerificationPlan() {
  return {
    labKey: "network.port-scan",
    scope: "local-repository-only",
    safeBoundary:
      "只验证本项目仓库内端口扫描文档、元数据、入口和安全边界一致性，不发起网络请求，不执行真实端口扫描。",
    expectedWebEntrypoints,
    expectedApiEntrypoints,
    expectedScript: "tools/lab-scripts/network/port-scan/verify.ts",
    expectedDocuments: expectedDocs,
  };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const report = runPortScanConsistencyVerification();

  console.log(JSON.stringify(report, null, 2));

  if (!report.ok) {
    process.exitCode = 1;
  }
}
