import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  parseLabMetadataJson,
  validateLabMetadata,
  type LabMetadata,
} from "../../../../packages/shared/src/lab-metadata.js";

export type PhishingConsistencyCheck = {
  key: string;
  passed: boolean;
  message: string;
};

export type PhishingConsistencyReport = {
  labKey: "social.phishing";
  scope: "local-repository-only";
  ok: boolean;
  checkedFiles: string[];
  checks: PhishingConsistencyCheck[];
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
  "/labs/social/phishing/vuln",
  "/labs/social/phishing/fixed",
];

const expectedApiEntrypoints = [
  "/api/labs/social/phishing/vuln/review",
  "/api/labs/social/phishing/fixed/review",
];

const expectedDocs = [
  "labs/social/phishing/README.md",
  "labs/social/phishing/vuln/README.md",
  "labs/social/phishing/fixed/README.md",
  "labs/social/phishing/mock/README.md",
  "labs/social/phishing/docs/attack-steps.md",
  "labs/social/phishing/docs/fix-notes.md",
  "labs/social/phishing/docs/manual-verification.md",
  "tools/lab-scripts/social/phishing/README.md",
];

const implementationFiles = [
  "apps/server/src/services/phishing-lab.ts",
  "apps/server/src/app.ts",
  "apps/web/src/api/phishing-lab.ts",
  "apps/web/src/labs/phishing.ts",
  "apps/web/src/views/PhishingLabView.vue",
];

const boundaryScanFiles = [
  "apps/server/src/services/phishing-lab.ts",
  "apps/web/src/api/phishing-lab.ts",
  "apps/web/src/labs/phishing.ts",
  "apps/web/src/views/PhishingLabView.vue",
];

const evidenceFiles = [
  "apps/server/tests/phishing-lab.test.ts",
  "apps/web/tests/phishing-api.test.ts",
  "apps/web/tests/phishing-lab.test.ts",
  "apps/web/tests/router.test.ts",
];

const requiredBoundaryPhrases = [
  "固定案例",
  "不发送真实邮件",
  "不收集真实邮箱",
  "不连接第三方",
  "不生成可投递邮件模板包",
  "exploit.py",
  "只读一致性验证",
];

const forbiddenImplementationFragments = [
  {
    key: "nodemailer-reference",
    fragment: "node" + "mailer",
  },
  {
    key: "smtp-reference",
    fragment: "smtp",
  },
  {
    key: "send-mail-call",
    fragment: "send" + "Mail",
  },
  {
    key: "create-transport-call",
    fragment: "create" + "Transport",
  },
  {
    key: "mailgun-reference",
    fragment: "mail" + "gun",
  },
  {
    key: "twilio-reference",
    fragment: "twi" + "lio",
  },
  {
    key: "mailchimp-reference",
    fragment: "mail" + "chimp",
  },
  {
    key: "imap-reference",
    fragment: "imap",
  },
  {
    key: "pop3-reference",
    fragment: "pop3",
  },
  {
    key: "mailparser-reference",
    fragment: "mail" + "parser",
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
    key: "email-body-field",
    pattern: /\bemailBody\b/,
  },
  {
    key: "recipient-field",
    pattern: /\brecipient\b/,
  },
  {
    key: "password-field",
    pattern: /\bpassword\b/,
  },
];

function loadRepositoryText(relativePath: string) {
  return readFileSync(path.join(repositoryRoot, relativePath), "utf8");
}

function createCheck(
  key: string,
  passed: boolean,
  message: string,
): PhishingConsistencyCheck {
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

export function runPhishingConsistencyVerification(): PhishingConsistencyReport {
  const checks: PhishingConsistencyCheck[] = [];
  const metadataText = loadRepositoryText("labs/social/phishing/meta.json");
  const parsedMetadata = parseLabMetadataJson(metadataText);

  checks.push(
    createCheck(
      "metadata-json-parse",
      parsedMetadata.ok,
      parsedMetadata.ok
        ? "网络钓鱼元数据 JSON 可解析。"
        : parsedMetadata.errors.join("; "),
    ),
  );

  if (!parsedMetadata.ok) {
    return {
      labKey: "social.phishing",
      scope: "local-repository-only",
      ok: false,
      checkedFiles: ["labs/social/phishing/meta.json"],
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
        ? "网络钓鱼元数据符合共享结构校验。"
        : validationResult.errors.join("; "),
    ),
  );

  if (!validationResult.ok) {
    return {
      labKey: "social.phishing",
      scope: "local-repository-only",
      ok: false,
      checkedFiles: ["labs/social/phishing/meta.json"],
      checks,
      notes: ["元数据结构未通过校验，后续一致性检查已停止。"],
    };
  }

  const metadata = validationResult.value;
  const scriptPath = "tools/lab-scripts/social/phishing/verify.ts";
  const scriptEntrypoint = getScriptEntrypoint(metadata);
  const documentContents = expectedDocs.map((relativePath) => ({
    relativePath,
    content: loadRepositoryText(relativePath),
  }));
  const combinedLabDocs = documentContents
    .map((item) => item.content)
    .join("\n\n");
  const boundaryScanContents = boundaryScanFiles.map((relativePath) => ({
    relativePath,
    content: loadRepositoryText(relativePath),
  }));
  const apiClientText = loadRepositoryText("apps/web/src/api/phishing-lab.ts");
  const serverAppText = loadRepositoryText("apps/server/src/app.ts");
  const scriptExists = existsSync(path.join(repositoryRoot, scriptPath));
  const exploitScriptExists = existsSync(
    path.join(repositoryRoot, "tools/lab-scripts/social/phishing/exploit.py"),
  );

  checks.push(
    createCheck(
      "metadata-basic-state",
      metadata.id === "social.phishing" &&
        metadata.mode === "case-study" &&
        metadata.status === "in-progress",
      "网络钓鱼元数据应保持 social.phishing / case-study / in-progress。",
    ),
  );
  checks.push(
    createCheck(
      "web-entrypoints",
      hasExactValues(
        metadata.entrypoints.web.map((entrypoint) => entrypoint.path),
        expectedWebEntrypoints,
      ),
      "网络钓鱼前端入口应只包含误判观察版和识别复盘版工作台。",
    ),
  );
  checks.push(
    createCheck(
      "api-entrypoints",
      hasExactValues(
        metadata.entrypoints.api.map((entrypoint) => entrypoint.path),
        expectedApiEntrypoints,
      ),
      "网络钓鱼 API 入口应只包含漏洞版和修复版 review 接口。",
    ),
  );
  checks.push(
    createCheck(
      "script-entrypoint",
      metadata.entrypoints.scripts.length === 1 &&
        scriptEntrypoint?.key === "phishing-verify" &&
        scriptEntrypoint.path === scriptPath &&
        scriptEntrypoint.language === "ts" &&
        scriptExists,
      "网络钓鱼脚本入口应只登记本机只读一致性验证脚本。",
    ),
  );
  checks.push(
    createCheck(
      "automation-scope",
      metadata.verification.automation.supported === true &&
        metadata.verification.automation.playwright?.enabled === false &&
        metadata.verification.automation.apiTest?.enabled === true &&
        metadata.verification.automation.apiTest.specPath ===
          "apps/server/tests/phishing-lab.test.ts" &&
        metadata.verification.automation.scriptVerification?.enabled === true &&
        hasExactValues(
          metadata.verification.automation.scriptVerification.scriptKeys,
          ["phishing-verify"],
        ) &&
        metadata.variants.every((variant) => !variant.supportsAutomation),
      "自动化应登记服务端 API 测试和本机只读一致性验证脚本，变体仍不登记攻击脚本自动化。",
    ),
  );
  checks.push(
    createCheck(
      "expected-documents-exist",
      expectedDocs.every((relativePath) =>
        existsSync(path.join(repositoryRoot, relativePath)),
      ),
      "网络钓鱼标准文档和脚本说明应全部存在。",
    ),
  );
  checks.push(
    createCheck(
      "boundary-phrases",
      requiredBoundaryPhrases.every((phrase) =>
        combinedLabDocs.includes(phrase),
      ),
      "网络钓鱼文档应持续声明固定案例、无真实投递、无凭据收集、无模板生成和无 exploit.py 边界。",
    ),
  );
  checks.push(
    createCheck(
      "no-exploit-script",
      !exploitScriptExists,
      "网络钓鱼脚本目录不应提供 exploit.py 或真实投递脚本。",
    ),
  );
  checks.push(
    createCheck(
      "no-real-delivery-implementation",
      boundaryScanContents.every(
        (item) => !implementationHasForbiddenFragment(item.content),
      ),
      "网络钓鱼相关实现不应包含邮件发送库、第三方投递平台、外部 URL、任意正文输入或凭据收集字段。",
    ),
  );
  checks.push(
    createCheck(
      "server-route-mounted",
      serverAppText.includes("/api/labs/social/phishing/:variant/review") &&
        serverAppText.includes("summarizePhishingInput") &&
        serverAppText.includes('labKey: "social.phishing"'),
      "服务端应挂载网络钓鱼 review 接口，并使用统一事件日志安全摘要。",
    ),
  );
  checks.push(
    createCheck(
      "fixed-key-request-body",
      apiClientText.includes("caseKey: input.caseKey") &&
        apiClientText.includes("reviewModeKey: input.reviewModeKey") &&
        apiClientText.includes(
          "defenseChecklistKey: input.defenseChecklistKey",
        ) &&
        !apiClientText.includes("emailBody") &&
        !apiClientText.includes("recipient") &&
        !apiClientText.includes("password"),
      "网络钓鱼 API client 应只提交固定 caseKey、reviewModeKey 和 defenseChecklistKey。",
    ),
  );

  return {
    labKey: "social.phishing",
    scope: "local-repository-only",
    ok: checks.every((check) => check.passed),
    checkedFiles: [
      "labs/social/phishing/meta.json",
      ...expectedDocs,
      ...implementationFiles,
      ...evidenceFiles,
      scriptPath,
    ],
    checks,
    notes: [
      "本脚本只读取仓库内网络钓鱼识别元数据、文档、前端、后端和测试文件。",
      "本脚本不发起 HTTP 请求，不发送邮件、短信或消息，不连接第三方平台或收件箱服务。",
      "本脚本不读取 .env、Cookie、token、验证码或凭据，不接收任意邮箱、正文、链接、附件或模板。",
      "本脚本入口是只读一致性验证，不是 exploit.py、投递器、模板生成器或攻击脚本。",
      "当前实验仍保持 in-progress，后续 ready 收口需要单独审计。",
    ],
  };
}

export function getPhishingConsistencyVerificationPlan() {
  return {
    labKey: "social.phishing",
    scope: "local-repository-only",
    safeBoundary:
      "只验证本项目仓库内网络钓鱼识别文档、元数据、固定 key 入口和安全边界一致性，不发送真实邮件，不连接第三方平台。",
    expectedWebEntrypoints,
    expectedApiEntrypoints,
    expectedScript: "tools/lab-scripts/social/phishing/verify.ts",
    expectedDocuments: expectedDocs,
  };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const report = runPhishingConsistencyVerification();

  console.log(JSON.stringify(report, null, 2));

  if (!report.ok) {
    process.exitCode = 1;
  }
}
