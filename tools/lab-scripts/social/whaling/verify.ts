import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  parseLabMetadataJson,
  validateLabMetadata,
  type LabMetadata,
} from "../../../../packages/shared/src/lab-metadata.js";

export type WhalingConsistencyCheck = {
  key: string;
  passed: boolean;
  message: string;
};

export type WhalingConsistencyReport = {
  labKey: "social.whaling";
  scope: "local-repository-only";
  ok: boolean;
  checkedFiles: string[];
  checks: WhalingConsistencyCheck[];
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
  "/labs/social/whaling/vuln",
  "/labs/social/whaling/fixed",
];

const expectedApiEntrypoints = [
  "/api/labs/social/whaling/vuln/review",
  "/api/labs/social/whaling/fixed/review",
];

const expectedDocs = [
  "labs/social/whaling/README.md",
  "labs/social/whaling/vuln/README.md",
  "labs/social/whaling/fixed/README.md",
  "labs/social/whaling/mock/README.md",
  "labs/social/whaling/docs/attack-steps.md",
  "labs/social/whaling/docs/fixed-cases.md",
  "labs/social/whaling/docs/fix-notes.md",
  "labs/social/whaling/docs/manual-verification.md",
  "tools/lab-scripts/social/whaling/README.md",
];

const implementationFiles = [
  "apps/server/src/services/whaling-lab.ts",
  "apps/server/src/app.ts",
  "apps/web/src/api/whaling-lab.ts",
  "apps/web/src/labs/whaling.ts",
  "apps/web/src/views/WhalingLabView.vue",
  "packages/testing/tests/e2e/platform.spec.mjs",
];

const boundaryScanFiles = [
  "apps/server/src/services/whaling-lab.ts",
  "apps/web/src/api/whaling-lab.ts",
  "apps/web/src/labs/whaling.ts",
  "apps/web/src/views/WhalingLabView.vue",
];

const evidenceFiles = [
  "apps/server/tests/whaling-lab.test.ts",
  "apps/web/tests/whaling-api.test.ts",
  "apps/web/tests/whaling-lab.test.ts",
  "apps/web/tests/router.test.ts",
  "packages/shared/tests/lab-metadata.test.mjs",
  "packages/testing/tests/e2e/platform.spec.mjs",
];

const requiredBoundaryPhrases = [
  "固定案例",
  "固定高层决策案例",
  "不发送真实邮件",
  "不采集真实高管",
  "不收集真实凭据",
  "不连接第三方",
  "不生成可投递标题库",
  "不提供 `exploit.py`",
  "只读一致性验证",
];

const requiredCaseKeys = [
  "executive-wire-approval",
  "board-confidential-request",
  "legal-settlement-transfer",
  "ma-data-room-access",
];

const requiredVerificationPolicyKeys = [
  "authority-context-only",
  "trusted-channel-callback",
  "payment-dual-approval",
  "legal-board-channel-review",
  "least-privilege-data-room",
  "freeze-and-escalate",
];

const requiredSignals = [
  "whaling-executive-authority-overweighted",
  "whaling-confidential-pressure-identified",
  "whaling-payment-freeze-required",
  "whaling-boundary-verified",
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
    key: "imap-reference",
    fragment: "imap",
  },
  {
    key: "pop3-reference",
    fragment: "pop3",
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
    key: "executive-name-field",
    pattern: /\bexecutiveName\b/,
  },
  {
    key: "organization-chart-field",
    pattern: /\borganizationChart\b/,
  },
  {
    key: "payment-account-field",
    pattern: /\bpaymentAccount\b/,
  },
  {
    key: "meeting-invite-field",
    pattern: /\bmeetingInvite\b/,
  },
];

function loadRepositoryText(relativePath: string) {
  return readFileSync(path.join(repositoryRoot, relativePath), "utf8");
}

function createCheck(
  key: string,
  passed: boolean,
  message: string,
): WhalingConsistencyCheck {
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

export function runWhalingConsistencyVerification(): WhalingConsistencyReport {
  const checks: WhalingConsistencyCheck[] = [];
  const metadataText = loadRepositoryText("labs/social/whaling/meta.json");
  const parsedMetadata = parseLabMetadataJson(metadataText);

  checks.push(
    createCheck(
      "metadata-json-parse",
      parsedMetadata.ok,
      parsedMetadata.ok
        ? "whaling metadata JSON is parseable."
        : parsedMetadata.errors.join("; "),
    ),
  );

  if (!parsedMetadata.ok) {
    return {
      labKey: "social.whaling",
      scope: "local-repository-only",
      ok: false,
      checkedFiles: ["labs/social/whaling/meta.json"],
      checks,
      notes: ["metadata parse failed; later consistency checks stopped."],
    };
  }

  const validationResult = validateLabMetadata(parsedMetadata.value);

  checks.push(
    createCheck(
      "metadata-schema",
      validationResult.ok,
      validationResult.ok
        ? "whaling metadata matches shared metadata schema."
        : validationResult.errors.join("; "),
    ),
  );

  if (!validationResult.ok) {
    return {
      labKey: "social.whaling",
      scope: "local-repository-only",
      ok: false,
      checkedFiles: ["labs/social/whaling/meta.json"],
      checks,
      notes: ["metadata schema validation failed; later checks stopped."],
    };
  }

  const metadata = validationResult.value;
  const scriptPath = "tools/lab-scripts/social/whaling/verify.ts";
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
  const apiClientText = loadRepositoryText("apps/web/src/api/whaling-lab.ts");
  const serverAppText = loadRepositoryText("apps/server/src/app.ts");
  const playwrightText = loadRepositoryText(
    "packages/testing/tests/e2e/platform.spec.mjs",
  );
  const scriptExists = existsSync(path.join(repositoryRoot, scriptPath));
  const exploitScriptExists = existsSync(
    path.join(repositoryRoot, "tools/lab-scripts/social/whaling/exploit.py"),
  );

  checks.push(
    createCheck(
      "metadata-basic-state",
      metadata.id === "social.whaling" &&
        metadata.mode === "case-study" &&
        metadata.status === "ready",
      "metadata should stay social.whaling / case-study / ready.",
    ),
  );
  checks.push(
    createCheck(
      "web-entrypoints",
      hasExactValues(
        metadata.entrypoints.web.map((entrypoint) => entrypoint.path),
        expectedWebEntrypoints,
      ),
      "web entrypoints should expose only fixed whaling workbench routes.",
    ),
  );
  checks.push(
    createCheck(
      "api-entrypoints",
      hasExactValues(
        metadata.entrypoints.api.map((entrypoint) => entrypoint.path),
        expectedApiEntrypoints,
      ),
      "api entrypoints should expose only vuln/fixed whaling review APIs.",
    ),
  );
  checks.push(
    createCheck(
      "script-entrypoint",
      metadata.entrypoints.scripts.length === 1 &&
        scriptEntrypoint?.key === "whaling-verify" &&
        scriptEntrypoint.path === scriptPath &&
        scriptEntrypoint.language === "ts" &&
        scriptExists,
      "scripts should register only the local read-only whaling verifier.",
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
          "apps/server/tests/whaling-lab.test.ts" &&
        metadata.verification.automation.scriptVerification?.enabled === true &&
        hasExactValues(
          metadata.verification.automation.scriptVerification.scriptKeys,
          ["whaling-verify"],
        ) &&
        metadata.variants.every((variant) => !variant.supportsAutomation),
      "automation evidence should include Playwright, API test, and read-only verifier while variants remain non-automated.",
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
      "whaling ready metadata should describe the case-study ready boundary, read-only verification, and no exploit.py.",
    ),
  );
  checks.push(
    createCheck(
      "expected-documents-exist",
      expectedDocs.every((relativePath) =>
        existsSync(path.join(repositoryRoot, relativePath)),
      ),
      "all standard whaling documents and script README should exist.",
    ),
  );
  checks.push(
    createCheck(
      "boundary-phrases",
      requiredBoundaryPhrases.every((phrase) =>
        combinedLabDocs.includes(phrase),
      ),
      "documents should state fixed-case, no real delivery, no profiling, no credential collection, and read-only verification boundaries.",
    ),
  );
  checks.push(
    createCheck(
      "fixed-case-keys-visible",
      requiredCaseKeys.every((key) => combinedLabDocs.includes(key)),
      "documents should list all fixed whaling case keys.",
    ),
  );
  checks.push(
    createCheck(
      "verification-policy-keys-visible",
      requiredVerificationPolicyKeys.every((key) =>
        combinedLabDocs.includes(key),
      ),
      "documents should list all fixed whaling verificationPolicyKey values.",
    ),
  );
  checks.push(
    createCheck(
      "expected-signals-visible",
      requiredSignals.every((signal) => combinedLabDocs.includes(signal)),
      "documents should list expected whaling learning signals.",
    ),
  );
  checks.push(
    createCheck(
      "fixed-keys-in-implementation",
      [...requiredCaseKeys, ...requiredVerificationPolicyKeys, ...requiredSignals].every(
        (key) => implementationText.includes(key),
      ),
      "frontend, backend, and tests should include the fixed cases, policies, and learning signals.",
    ),
  );
  checks.push(
    createCheck(
      "no-exploit-script",
      !exploitScriptExists,
      "whaling script directory should not provide exploit.py.",
    ),
  );
  checks.push(
    createCheck(
      "no-real-delivery-implementation",
      boundaryScanContents.every(
        (item) => !implementationHasForbiddenFragment(item.content),
      ),
      "whaling implementation files should not contain delivery libraries, external URL literals, freeform body fields, profiling fields, or payment account fields.",
    ),
  );
  checks.push(
    createCheck(
      "server-route-mounted",
      serverAppText.includes("/api/labs/social/whaling/:variant/review") &&
        serverAppText.includes("summarizeWhalingInput") &&
        serverAppText.includes('labKey: "social.whaling"'),
      "server should mount whaling review API and use sanitized event summaries.",
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
        !apiClientText.includes("executiveName") &&
        !apiClientText.includes("organizationChart") &&
        !apiClientText.includes("paymentAccount") &&
        !apiClientText.includes("meetingInvite"),
      "whaling API client should submit only fixed caseKey and verificationPolicyKey.",
    ),
  );
  checks.push(
    createCheck(
      "playwright-boundary",
      playwrightText.includes("登录用户可以对比捕鲸攻击漏洞版高权威误判与修复版流程核验") &&
        playwrightText.includes("/labs/social/whaling/vuln") &&
        playwrightText.includes("/labs/social/whaling/fixed") &&
        playwrightText.includes('getByRole("textbox")).toHaveCount(0)') &&
        playwrightText.includes('getByRole("combobox")).toHaveCount(2)') &&
        playwrightText.includes("漏洞版过度相信高权威上下文") &&
        playwrightText.includes("修复版要求冻结并复核高风险动作"),
      "Playwright should cover fixed whaling routes and assert no textbox input.",
    ),
  );

  return {
    labKey: "social.whaling",
    scope: "local-repository-only",
    ok: checks.every((check) => check.passed),
    checkedFiles: [
      "labs/social/whaling/meta.json",
      ...expectedDocs,
      ...implementationFiles,
      ...evidenceFiles,
      scriptPath,
    ],
    checks,
    notes: [
      "This script only reads whaling metadata, documents, frontend, backend, and test files inside this repository.",
      "This script does not make HTTP requests, send email/SMS/messages, or connect to third-party platforms, directories, CRM, HR, IM, calendar, payment, or inbox services.",
      "This script does not read .env, Cookie, token, verification code, credentials, payment data, real people data, or real business materials.",
      "This script is a read-only consistency verifier, not exploit.py, a delivery tool, a profiling collector, a template generator, or an attack script.",
      "当前实验已按 case-study ready 例外收口，ready 仅代表本项目内固定案例学习闭环完成。",
    ],
  };
}

export function getWhalingConsistencyVerificationPlan() {
  return {
    labKey: "social.whaling",
    scope: "local-repository-only",
    safeBoundary:
      "Only verify repository-local whaling metadata, documents, fixed key entrypoints, and safety boundaries. Do not send real messages or connect to third-party platforms.",
    expectedWebEntrypoints,
    expectedApiEntrypoints,
    expectedScript: "tools/lab-scripts/social/whaling/verify.ts",
    expectedDocuments: expectedDocs,
  };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const report = runWhalingConsistencyVerification();

  console.log(JSON.stringify(report, null, 2));

  if (!report.ok) {
    process.exitCode = 1;
  }
}
