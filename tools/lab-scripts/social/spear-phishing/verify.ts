import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  parseLabMetadataJson,
  validateLabMetadata,
  type LabMetadata,
} from "../../../../packages/shared/src/lab-metadata.js";

export type SpearPhishingConsistencyCheck = {
  key: string;
  passed: boolean;
  message: string;
};

export type SpearPhishingConsistencyReport = {
  labKey: "social.spear-phishing";
  scope: "local-repository-only";
  ok: boolean;
  checkedFiles: string[];
  checks: SpearPhishingConsistencyCheck[];
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
  "/labs/social/spear-phishing/vuln",
  "/labs/social/spear-phishing/fixed",
];

const expectedApiEntrypoints = [
  "/api/labs/social/spear-phishing/vuln/review",
  "/api/labs/social/spear-phishing/fixed/review",
];

const expectedDocs = [
  "labs/social/spear-phishing/README.md",
  "labs/social/spear-phishing/vuln/README.md",
  "labs/social/spear-phishing/fixed/README.md",
  "labs/social/spear-phishing/mock/README.md",
  "labs/social/spear-phishing/docs/attack-steps.md",
  "labs/social/spear-phishing/docs/fixed-cases.md",
  "labs/social/spear-phishing/docs/fix-notes.md",
  "labs/social/spear-phishing/docs/manual-verification.md",
  "tools/lab-scripts/social/spear-phishing/README.md",
];

const implementationFiles = [
  "apps/server/src/services/spear-phishing-lab.ts",
  "apps/server/src/app.ts",
  "apps/web/src/api/spear-phishing-lab.ts",
  "apps/web/src/labs/spear-phishing.ts",
  "apps/web/src/views/SpearPhishingLabView.vue",
  "packages/testing/tests/e2e/platform.spec.mjs",
];

const boundaryScanFiles = [
  "apps/server/src/services/spear-phishing-lab.ts",
  "apps/web/src/api/spear-phishing-lab.ts",
  "apps/web/src/labs/spear-phishing.ts",
  "apps/web/src/views/SpearPhishingLabView.vue",
];

const evidenceFiles = [
  "apps/server/tests/spear-phishing-lab.test.ts",
  "apps/web/tests/spear-phishing-api.test.ts",
  "apps/web/tests/spear-phishing-lab.test.ts",
  "apps/web/tests/router.test.ts",
  "packages/shared/tests/lab-metadata.test.mjs",
];

const requiredBoundaryPhrases = [
  "固定案例",
  "固定线索卡",
  "不发送真实邮件",
  "不采集真实姓名",
  "不收集真实凭据",
  "不连接第三方",
  "不生成可投递标题库",
  "不提供 `exploit.py`",
  "只读一致性验证",
];

const requiredCaseKeys = [
  "executive-invoice-approval",
  "vendor-payment-change",
  "engineering-access-request",
  "hr-benefit-personalized",
];

const requiredVerificationPolicyKeys = [
  "context-only",
  "out-of-band-confirmation",
  "approval-chain-review",
  "least-privilege-review",
  "report-and-isolate",
];

const requiredSignals = [
  "spear-phishing-context-trust-overweighted",
  "spear-phishing-approval-chain-bypassed",
  "spear-phishing-out-of-band-confirmation-required",
  "spear-phishing-boundary-verified",
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
    key: "sender-field",
    pattern: /\bsender\b/,
  },
  {
    key: "subject-field",
    pattern: /\bsubject\b/,
  },
  {
    key: "profile-field",
    pattern: /\bprofile\b/,
  },
];

function loadRepositoryText(relativePath: string) {
  return readFileSync(path.join(repositoryRoot, relativePath), "utf8");
}

function createCheck(
  key: string,
  passed: boolean,
  message: string,
): SpearPhishingConsistencyCheck {
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

export function runSpearPhishingConsistencyVerification(): SpearPhishingConsistencyReport {
  const checks: SpearPhishingConsistencyCheck[] = [];
  const metadataText = loadRepositoryText(
    "labs/social/spear-phishing/meta.json",
  );
  const parsedMetadata = parseLabMetadataJson(metadataText);

  checks.push(
    createCheck(
      "metadata-json-parse",
      parsedMetadata.ok,
      parsedMetadata.ok
        ? "鱼叉式钓鱼元数据 JSON 可解析。"
        : parsedMetadata.errors.join("; "),
    ),
  );

  if (!parsedMetadata.ok) {
    return {
      labKey: "social.spear-phishing",
      scope: "local-repository-only",
      ok: false,
      checkedFiles: ["labs/social/spear-phishing/meta.json"],
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
        ? "鱼叉式钓鱼元数据符合共享结构校验。"
        : validationResult.errors.join("; "),
    ),
  );

  if (!validationResult.ok) {
    return {
      labKey: "social.spear-phishing",
      scope: "local-repository-only",
      ok: false,
      checkedFiles: ["labs/social/spear-phishing/meta.json"],
      checks,
      notes: ["元数据结构未通过校验，后续一致性检查已停止。"],
    };
  }

  const metadata = validationResult.value;
  const scriptPath = "tools/lab-scripts/social/spear-phishing/verify.ts";
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
  const implementationText = implementationFiles
    .map((relativePath) => loadRepositoryText(relativePath))
    .join("\n\n");
  const apiClientText = loadRepositoryText(
    "apps/web/src/api/spear-phishing-lab.ts",
  );
  const serverAppText = loadRepositoryText("apps/server/src/app.ts");
  const playwrightText = loadRepositoryText(
    "packages/testing/tests/e2e/platform.spec.mjs",
  );
  const scriptExists = existsSync(path.join(repositoryRoot, scriptPath));
  const exploitScriptExists = existsSync(
    path.join(
      repositoryRoot,
      "tools/lab-scripts/social/spear-phishing/exploit.py",
    ),
  );

  checks.push(
    createCheck(
      "metadata-basic-state",
      metadata.id === "social.spear-phishing" &&
        metadata.mode === "case-study" &&
        metadata.status === "ready",
      "鱼叉式钓鱼元数据应保持 social.spear-phishing / case-study / ready。",
    ),
  );
  checks.push(
    createCheck(
      "web-entrypoints",
      hasExactValues(
        metadata.entrypoints.web.map((entrypoint) => entrypoint.path),
        expectedWebEntrypoints,
      ),
      "鱼叉式钓鱼前端入口应只包含漏洞版和修复版固定案例工作台。",
    ),
  );
  checks.push(
    createCheck(
      "api-entrypoints",
      hasExactValues(
        metadata.entrypoints.api.map((entrypoint) => entrypoint.path),
        expectedApiEntrypoints,
      ),
      "鱼叉式钓鱼 API 入口应只包含漏洞版和修复版 review 接口。",
    ),
  );
  checks.push(
    createCheck(
      "script-entrypoint",
      metadata.entrypoints.scripts.length === 1 &&
        scriptEntrypoint?.key === "spear-phishing-verify" &&
        scriptEntrypoint.path === scriptPath &&
        scriptEntrypoint.language === "ts" &&
        scriptExists,
      "鱼叉式钓鱼脚本入口应只登记本机只读一致性验证脚本。",
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
          "apps/server/tests/spear-phishing-lab.test.ts" &&
        metadata.verification.automation.scriptVerification?.enabled === true &&
        hasExactValues(
          metadata.verification.automation.scriptVerification.scriptKeys,
          ["spear-phishing-verify"],
        ) &&
        metadata.variants.every((variant) => !variant.supportsAutomation),
      "自动化应登记 Playwright 页面验证、服务端 API 测试和本机只读一致性验证脚本，变体仍不登记攻击脚本自动化。",
    ),
  );
  checks.push(
    createCheck(
      "case-study-ready-boundary",
      metadata.safeBoundaries.some(
        (boundary) =>
          boundary.includes("case-study") &&
          boundary.includes("ready") &&
          boundary.includes("只读一致性验证"),
      ) &&
        metadata.safeBoundaries.some((boundary) =>
          boundary.includes("不提供 exploit.py"),
        ) &&
        metadata.notes.includes("ready 收口审计") &&
        metadata.notes.includes("只读一致性验证") &&
        metadata.notes.includes("supportsAutomation 仍为 false") &&
        metadata.notes.includes("不提供") &&
        metadata.notes.includes("exploit.py"),
      "鱼叉式钓鱼 ready 元数据应说明 case-study ready 边界、只读验证证据和不提供 exploit.py。",
    ),
  );
  checks.push(
    createCheck(
      "expected-documents-exist",
      expectedDocs.every((relativePath) =>
        existsSync(path.join(repositoryRoot, relativePath)),
      ),
      "鱼叉式钓鱼标准文档和脚本说明应全部存在。",
    ),
  );
  checks.push(
    createCheck(
      "boundary-phrases",
      requiredBoundaryPhrases.every((phrase) =>
        combinedLabDocs.includes(phrase),
      ),
      "鱼叉式钓鱼文档应持续声明固定案例、固定线索卡、无真实投递、无画像采集、无凭据收集、无模板生成和无 exploit.py 边界。",
    ),
  );
  checks.push(
    createCheck(
      "fixed-case-keys-visible",
      requiredCaseKeys.every((key) => combinedLabDocs.includes(key)),
      "鱼叉式钓鱼文档应列出全部固定虚构案例 key。",
    ),
  );
  checks.push(
    createCheck(
      "verification-policy-keys-visible",
      requiredVerificationPolicyKeys.every((key) =>
        combinedLabDocs.includes(key),
      ),
      "鱼叉式钓鱼文档应列出全部固定 verificationPolicyKey。",
    ),
  );
  checks.push(
    createCheck(
      "expected-signals-visible",
      requiredSignals.every((signal) => combinedLabDocs.includes(signal)),
      "鱼叉式钓鱼文档应列出预期学习信号。",
    ),
  );
  checks.push(
    createCheck(
      "fixed-keys-in-implementation",
      [...requiredCaseKeys, ...requiredVerificationPolicyKeys, ...requiredSignals].every(
        (key) => implementationText.includes(key),
      ),
      "鱼叉式钓鱼前端、后端和测试实现应包含固定案例、核验策略和学习信号。",
    ),
  );
  checks.push(
    createCheck(
      "no-exploit-script",
      !exploitScriptExists,
      "鱼叉式钓鱼脚本目录不应提供 exploit.py、投递器、画像采集器、模板生成器或攻击脚本。",
    ),
  );
  checks.push(
    createCheck(
      "no-real-delivery-implementation",
      boundaryScanContents.every(
        (item) => !implementationHasForbiddenFragment(item.content),
      ),
      "鱼叉式钓鱼相关实现不应包含邮件发送库、第三方投递平台、外部 URL、任意正文输入或画像采集字段。",
    ),
  );
  checks.push(
    createCheck(
      "server-route-mounted",
      serverAppText.includes(
        "/api/labs/social/spear-phishing/:variant/review",
      ) &&
        serverAppText.includes("summarizeSpearPhishingInput") &&
        serverAppText.includes('labKey: "social.spear-phishing"'),
      "服务端应挂载鱼叉式钓鱼 review 接口，并使用统一事件日志安全摘要。",
    ),
  );
  checks.push(
    createCheck(
      "fixed-key-request-body",
      apiClientText.includes("caseKey: input.caseKey") &&
        apiClientText.includes(
          "verificationPolicyKey: input.verificationPolicyKey",
        ) &&
        !apiClientText.includes("emailBody") &&
        !apiClientText.includes("recipient") &&
        !apiClientText.includes("sender") &&
        !apiClientText.includes("subject") &&
        !apiClientText.includes("profile"),
      "鱼叉式钓鱼 API client 应只提交固定 caseKey 和 verificationPolicyKey。",
    ),
  );
  checks.push(
    createCheck(
      "playwright-boundary",
      playwrightText.includes(
        "登录用户可以对比鱼叉式钓鱼漏洞版误判与修复版核验",
      ) &&
        playwrightText.includes("/labs/social/spear-phishing/vuln") &&
        playwrightText.includes("/labs/social/spear-phishing/fixed") &&
        playwrightText.includes('getByRole("textbox")).toHaveCount(0)') &&
        playwrightText.includes('getByRole("combobox")).toHaveCount(2)') &&
        playwrightText.includes("漏洞版审批链绕过风险可见") &&
        playwrightText.includes("修复版要求可信通道二次确认"),
      "Playwright 应覆盖鱼叉式钓鱼漏洞版和修复版固定路径，并断言页面无文本输入框。",
    ),
  );

  return {
    labKey: "social.spear-phishing",
    scope: "local-repository-only",
    ok: checks.every((check) => check.passed),
    checkedFiles: [
      "labs/social/spear-phishing/meta.json",
      ...expectedDocs,
      ...implementationFiles,
      ...evidenceFiles,
      scriptPath,
    ],
    checks,
    notes: [
      "本脚本只读取仓库内鱼叉式钓鱼元数据、文档、前端、后端和测试文件。",
      "本脚本不发起 HTTP 请求，不发送邮件、短信或消息，不连接第三方平台、通讯录、CRM、HR、IM 或收件箱服务。",
      "本脚本不读取 .env、Cookie、token、验证码、凭据、付款信息、真实人员资料或真实业务材料。",
      "本脚本入口是只读一致性验证，不是 exploit.py、投递器、画像采集器、模板生成器或攻击脚本。",
      "当前实验已按 case-study ready 例外收口，ready 仅代表本项目内固定案例学习闭环完成。",
    ],
  };
}

export function getSpearPhishingConsistencyVerificationPlan() {
  return {
    labKey: "social.spear-phishing",
    scope: "local-repository-only",
    safeBoundary:
      "只验证本项目仓库内鱼叉式钓鱼文档、元数据、固定 key 入口和安全边界一致性，不发送真实邮件，不连接第三方平台。",
    expectedWebEntrypoints,
    expectedApiEntrypoints,
    expectedScript: "tools/lab-scripts/social/spear-phishing/verify.ts",
    expectedDocuments: expectedDocs,
  };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const report = runSpearPhishingConsistencyVerification();

  console.log(JSON.stringify(report, null, 2));

  if (!report.ok) {
    process.exitCode = 1;
  }
}
