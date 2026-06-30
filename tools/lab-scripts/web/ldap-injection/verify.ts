import { closeSync, existsSync, fstatSync, openSync, readSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  parseLabMetadataJson,
  validateLabMetadata,
  type LabMetadata,
} from "../../../../packages/shared/src/lab-metadata.js";

export type LdapInjectionConsistencyCheck = {
  key: string;
  passed: boolean;
  message: string;
};

export type LdapInjectionConsistencyReport = {
  labKey: "web.ldap-injection";
  scope: "local-repository-only";
  ok: boolean;
  checkedFiles: string[];
  checks: LdapInjectionConsistencyCheck[];
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
  "/labs/web/ldap-injection/vuln",
  "/labs/web/ldap-injection/fixed",
];

const expectedApiEntrypoints = [
  "/api/labs/web/ldap-injection/vuln/search",
  "/api/labs/web/ldap-injection/fixed/search",
];

const expectedDocs = [
  "labs/web/ldap-injection/README.md",
  "labs/web/ldap-injection/vuln/README.md",
  "labs/web/ldap-injection/fixed/README.md",
  "labs/web/ldap-injection/mock/README.md",
  "labs/web/ldap-injection/docs/attack-steps.md",
  "labs/web/ldap-injection/docs/fix-notes.md",
  "labs/web/ldap-injection/docs/manual-verification.md",
];

const requiredBoundaryPhrases = [
  "不连接真实 LDAP",
  "不提供对外 LDAP 查询脚本",
  "不提供通用过滤器 payload 库",
  "不实现任意 LDAP 过滤器执行器",
  "不保存目录账号",
  "不请求外部目标",
];

const forbiddenDocumentFragments = [
  "ldap" + "://",
  "ldaps" + "://",
  "ldap" + "search",
  "ldap" + "modify",
  "ldap" + "delete",
  "ldap" + "add",
  "bind" + "DN",
];

function loadRepositoryText(relativePath: string) {
  const filePath = path.join(repositoryRoot, relativePath);
  const descriptor = openSync(filePath, "r");

  try {
    const size = fstatSync(descriptor).size;
    const buffer = Buffer.alloc(size);
    let offset = 0;

    while (offset < size) {
      const bytesRead = readSync(
        descriptor,
        buffer,
        offset,
        size - offset,
        offset,
      );

      if (bytesRead === 0) {
        break;
      }

      offset += bytesRead;
    }

    return buffer.subarray(0, offset).toString("utf8");
  } finally {
    closeSync(descriptor);
  }
}

function createCheck(
  key: string,
  passed: boolean,
  message: string,
): LdapInjectionConsistencyCheck {
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
      })
    | undefined;
}

export function runLdapInjectionConsistencyVerification(): LdapInjectionConsistencyReport {
  const checks: LdapInjectionConsistencyCheck[] = [];
  const metadataText = loadRepositoryText("labs/web/ldap-injection/meta.json");
  const parsedMetadata = parseLabMetadataJson(metadataText);

  checks.push(
    createCheck(
      "metadata-json-parse",
      parsedMetadata.ok,
      parsedMetadata.ok
        ? "LDAP 元数据 JSON 可解析。"
        : parsedMetadata.errors.join("; "),
    ),
  );

  if (!parsedMetadata.ok) {
    return {
      labKey: "web.ldap-injection",
      scope: "local-repository-only",
      ok: false,
      checkedFiles: ["labs/web/ldap-injection/meta.json"],
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
        ? "LDAP 元数据符合共享结构校验。"
        : validationResult.errors.join("; "),
    ),
  );

  if (!validationResult.ok) {
    return {
      labKey: "web.ldap-injection",
      scope: "local-repository-only",
      ok: false,
      checkedFiles: ["labs/web/ldap-injection/meta.json"],
      checks,
      notes: ["元数据结构未通过校验，后续一致性检查已停止。"],
    };
  }

  const metadata = validationResult.value;
  const scriptEntrypoint = getScriptEntrypoint(metadata);
  const documentContents = expectedDocs.map((relativePath) => ({
    relativePath,
    content: loadRepositoryText(relativePath),
  }));
  const combinedLabDocs = documentContents
    .map((item) => item.content)
    .join("\n\n");
  const scriptPath = "tools/lab-scripts/web/ldap-injection/verify.ts";
  const scriptExists = existsSync(path.join(repositoryRoot, scriptPath));

  checks.push(
    createCheck(
      "metadata-basic-state",
      metadata.id === "web.ldap-injection" &&
        metadata.mode === "case-study" &&
        metadata.status === "ready",
      "LDAP 元数据应保持 web.ldap-injection / case-study / ready。",
    ),
  );
  checks.push(
    createCheck(
      "web-entrypoints",
      hasExactValues(
        metadata.entrypoints.web.map((entrypoint) => entrypoint.path),
        expectedWebEntrypoints,
      ),
      "LDAP 前端工作台入口应只包含漏洞版和修复版。",
    ),
  );
  checks.push(
    createCheck(
      "api-entrypoints",
      hasExactValues(
        metadata.entrypoints.api.map((entrypoint) => entrypoint.path),
        expectedApiEntrypoints,
      ),
      "LDAP 虚拟目录 API 入口应只包含漏洞版和修复版 search 接口。",
    ),
  );
  checks.push(
    createCheck(
      "script-entrypoint",
      metadata.entrypoints.scripts.length === 1 &&
        scriptEntrypoint?.key === "ldap-injection-verify" &&
        scriptEntrypoint.path === scriptPath &&
        scriptEntrypoint.language === "ts" &&
        scriptExists,
      "LDAP 脚本入口应只登记本机只读一致性验证脚本。",
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
          "apps/server/tests/ldap-injection-lab.test.ts" &&
        metadata.verification.automation.scriptVerification?.enabled === true &&
        hasExactValues(
          metadata.verification.automation.scriptVerification.scriptKeys,
          ["ldap-injection-verify"],
        ) &&
        metadata.variants.every((variant) => !variant.supportsAutomation),
      "自动化应登记 Playwright 页面验证、虚拟目录 API 测试和本机只读一致性验证脚本，变体仍不登记攻击脚本自动化。",
    ),
  );
  checks.push(
    createCheck(
      "case-study-ready-boundary",
      metadata.safeBoundaries?.some(
        (boundary) =>
          boundary.includes("case-study") && boundary.includes("ready"),
      ) === true &&
        typeof metadata.notes === "string" &&
        metadata.notes.includes("不提供 exploit.py 或 LDAP 查询脚本"),
      "LDAP ready 收口应明确 case-study 例外标准，且不提供 exploit.py 或 LDAP 查询脚本。",
    ),
  );
  checks.push(
    createCheck(
      "expected-documents-exist",
      expectedDocs.every((relativePath) =>
        existsSync(path.join(repositoryRoot, relativePath)),
      ),
      "LDAP 标准案例文档应全部存在。",
    ),
  );
  checks.push(
    createCheck(
      "boundary-phrases",
      requiredBoundaryPhrases.every((phrase) =>
        combinedLabDocs.includes(phrase),
      ),
      "LDAP 文档应持续声明案例化和受控虚拟目录工作台安全边界。",
    ),
  );
  checks.push(
    createCheck(
      "no-directory-command-fragments",
      forbiddenDocumentFragments.every(
        (fragment) => !combinedLabDocs.includes(fragment),
      ),
      "LDAP 案例文档不应包含真实目录连接地址或目录命令片段。",
    ),
  );

  return {
    labKey: "web.ldap-injection",
    scope: "local-repository-only",
    ok: checks.every((check) => check.passed),
    checkedFiles: [
      "labs/web/ldap-injection/meta.json",
      ...expectedDocs,
      scriptPath,
    ],
    checks,
    notes: [
      "本脚本只读取仓库内固定 LDAP 文档和元数据。",
      "本脚本不连接真实 LDAP / AD / OpenLDAP 服务，不发起网络请求。",
      "本脚本不生成过滤器样例，不提供对外查询能力。",
    ],
  };
}

export function getLdapInjectionConsistencyVerificationPlan() {
  return {
    labKey: "web.ldap-injection",
    scope: "local-repository-only",
    safeBoundary:
      "只验证本项目仓库内 LDAP 案例文档、元数据和脚本入口一致性，不连接真实目录服务，不请求外部目标。",
    expectedWebEntrypoints,
    expectedApiEntrypoints,
    expectedScript: "tools/lab-scripts/web/ldap-injection/verify.ts",
    expectedDocuments: expectedDocs,
  };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const report = runLdapInjectionConsistencyVerification();

  console.log(JSON.stringify(report, null, 2));

  if (!report.ok) {
    process.exitCode = 1;
  }
}
