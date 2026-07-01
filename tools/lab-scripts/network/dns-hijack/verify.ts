import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  parseLabMetadataJson,
  validateLabMetadata,
  type LabMetadata,
} from "../../../../packages/shared/src/lab-metadata.js";

export type DnsHijackConsistencyCheck = {
  key: string;
  passed: boolean;
  message: string;
};

export type DnsHijackConsistencyReport = {
  labKey: "network.dns-hijack";
  scope: "local-repository-only";
  ok: boolean;
  checkedFiles: string[];
  checks: DnsHijackConsistencyCheck[];
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
  "/labs/network/dns-hijack/vuln",
  "/labs/network/dns-hijack/fixed",
];

const expectedApiEntrypoints = [
  "/api/labs/network/dns-hijack/vuln/resolve",
  "/api/labs/network/dns-hijack/fixed/resolve",
];

const expectedDocs = [
  "labs/network/dns-hijack/README.md",
  "labs/network/dns-hijack/vuln/README.md",
  "labs/network/dns-hijack/fixed/README.md",
  "labs/network/dns-hijack/mock/README.md",
  "labs/network/dns-hijack/docs/attack-steps.md",
  "labs/network/dns-hijack/docs/fix-notes.md",
  "labs/network/dns-hijack/docs/manual-verification.md",
  "tools/lab-scripts/network/dns-hijack/README.md",
];

const implementationFiles = [
  "apps/server/src/services/dns-hijack-lab.ts",
  "apps/server/src/app.ts",
  "apps/web/src/api/dns-hijack-lab.ts",
  "apps/web/src/labs/dns-hijack.ts",
  "apps/web/src/views/DnsHijackLabView.vue",
  "packages/testing/tests/e2e/platform.spec.mjs",
];

const requiredBoundaryPhrases = [
  "固定内存解析表",
  "不修改本机 DNS",
  "不请求真实外部 DNS",
  "不执行真实 DNS 查询",
  "不提供 exploit.py",
  "不保存真实域名访问记录",
];

const forbiddenImplementationFragments = [
  {
    key: "node-dns-import",
    fragment: "node:" + "dns",
  },
  {
    key: "node-dgram-import",
    fragment: "node:" + "dgram",
  },
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
    key: "resolve-dnsname-command",
    fragment: "Resolve-" + "DnsName",
  },
  {
    key: "nslookup-command",
    fragment: "ns" + "lookup",
  },
  {
    key: "dig-command",
    fragment: "d" + "ig ",
  },
  {
    key: "netsh-command",
    fragment: "net" + "sh",
  },
  {
    key: "ipconfig-command",
    fragment: "ip" + "config",
  },
  {
    key: "dns-google-endpoint",
    fragment: "dns" + ".google",
  },
  {
    key: "public-resolver-ip",
    fragment: "8" + ".8.8.8",
  },
  {
    key: "domain-text-input",
    fragment: "<input",
  },
  {
    key: "textbox-fill",
    fragment: 'getByRole("textbox").fill',
  },
];

const standaloneDigPattern = /\bdig\b/i;

function loadRepositoryText(relativePath: string) {
  return readFileSync(path.join(repositoryRoot, relativePath), "utf8");
}

function createCheck(
  key: string,
  passed: boolean,
  message: string,
): DnsHijackConsistencyCheck {
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
    ) || standaloneDigPattern.test(content)
  );
}

export function runDnsHijackConsistencyVerification(): DnsHijackConsistencyReport {
  const checks: DnsHijackConsistencyCheck[] = [];
  const metadataText = loadRepositoryText("labs/network/dns-hijack/meta.json");
  const parsedMetadata = parseLabMetadataJson(metadataText);

  checks.push(
    createCheck(
      "metadata-json-parse",
      parsedMetadata.ok,
      parsedMetadata.ok
        ? "DNS 劫持元数据 JSON 可解析。"
        : parsedMetadata.errors.join("; "),
    ),
  );

  if (!parsedMetadata.ok) {
    return {
      labKey: "network.dns-hijack",
      scope: "local-repository-only",
      ok: false,
      checkedFiles: ["labs/network/dns-hijack/meta.json"],
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
        ? "DNS 劫持元数据符合共享结构校验。"
        : validationResult.errors.join("; "),
    ),
  );

  if (!validationResult.ok) {
    return {
      labKey: "network.dns-hijack",
      scope: "local-repository-only",
      ok: false,
      checkedFiles: ["labs/network/dns-hijack/meta.json"],
      checks,
      notes: ["元数据结构未通过校验，后续一致性检查已停止。"],
    };
  }

  const metadata = validationResult.value;
  const scriptPath = "tools/lab-scripts/network/dns-hijack/verify.ts";
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
    path.join(repositoryRoot, "tools/lab-scripts/network/dns-hijack/exploit.py"),
  );

  checks.push(
    createCheck(
      "metadata-basic-state",
      metadata.id === "network.dns-hijack" &&
        metadata.mode === "simulation" &&
        metadata.status === "ready",
      "DNS 劫持元数据应保持 network.dns-hijack / simulation / ready。",
    ),
  );
  checks.push(
    createCheck(
      "web-entrypoints",
      hasExactValues(
        metadata.entrypoints.web.map((entrypoint) => entrypoint.path),
        expectedWebEntrypoints,
      ),
      "DNS 劫持前端入口应只包含漏洞版和修复版工作台。",
    ),
  );
  checks.push(
    createCheck(
      "api-entrypoints",
      hasExactValues(
        metadata.entrypoints.api.map((entrypoint) => entrypoint.path),
        expectedApiEntrypoints,
      ),
      "DNS 劫持 API 入口应只包含漏洞版和修复版 resolve 接口。",
    ),
  );
  checks.push(
    createCheck(
      "script-entrypoint",
      metadata.entrypoints.scripts.length === 1 &&
        scriptEntrypoint?.key === "dns-hijack-verify" &&
        scriptEntrypoint.path === scriptPath &&
        scriptEntrypoint.language === "ts" &&
        scriptExists,
      "DNS 劫持脚本入口应只登记本机只读一致性验证脚本。",
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
          "apps/server/tests/dns-hijack-lab.test.ts" &&
        metadata.verification.automation.scriptVerification?.enabled === true &&
        hasExactValues(
          metadata.verification.automation.scriptVerification.scriptKeys,
          ["dns-hijack-verify"],
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
      "DNS 劫持标准文档和脚本说明应全部存在。",
    ),
  );
  checks.push(
    createCheck(
      "boundary-phrases",
      requiredBoundaryPhrases.every((phrase) =>
        combinedLabDocs.includes(phrase),
      ),
      "DNS 劫持文档应持续声明固定内存解析表、无真实 DNS 查询、无系统网络配置修改和无真实数据保存边界。",
    ),
  );
  checks.push(
    createCheck(
      "no-exploit-script",
      !exploitScriptExists,
      "DNS 劫持脚本目录不应提供 exploit.py 或真实 DNS 查询脚本。",
    ),
  );
  checks.push(
    createCheck(
      "no-real-dns-implementation",
      implementationContents.every(
        (item) => !implementationHasForbiddenFragment(item.content),
      ),
      "DNS 劫持相关实现不应引入真实 DNS 查询、系统命令、公共解析服务或任意目标文本输入。",
    ),
  );

  return {
    labKey: "network.dns-hijack",
    scope: "local-repository-only",
    ok: checks.every((check) => check.passed),
    checkedFiles: [
      "labs/network/dns-hijack/meta.json",
      ...expectedDocs,
      ...implementationFiles,
      scriptPath,
    ],
    checks,
    notes: [
      "本脚本只读取仓库内 DNS 劫持元数据、文档和实现文件。",
      "本脚本不发起 HTTP 请求，不执行 DNS 查询，不读取或修改系统网络配置。",
      "ready 状态仅代表本项目内虚拟 DNS 解析学习闭环完成，不代表提供真实 DNS 攻击或解析能力。",
      "本脚本不提供 exploit.py，不接收任意域名、DNS 服务器、IP、代理、网络接口或端口参数。",
    ],
  };
}

export function getDnsHijackConsistencyVerificationPlan() {
  return {
    labKey: "network.dns-hijack",
    scope: "local-repository-only",
    safeBoundary:
      "只验证本项目仓库内 DNS 劫持文档、元数据、入口和安全边界一致性，不发起网络请求，不执行真实 DNS 查询。",
    expectedWebEntrypoints,
    expectedApiEntrypoints,
    expectedScript: "tools/lab-scripts/network/dns-hijack/verify.ts",
    expectedDocuments: expectedDocs,
  };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const report = runDnsHijackConsistencyVerification();

  console.log(JSON.stringify(report, null, 2));

  if (!report.ok) {
    process.exitCode = 1;
  }
}
