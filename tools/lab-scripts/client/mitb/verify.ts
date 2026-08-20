import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  assessFixedTransactionView,
  fixedTransactionViews,
} from "../../../../apps/server/src/services/mitb-transaction-lab.js";
import { guidedScenarioCatalog } from "../../../../packages/shared/src/guided-scenarios.js";
import {
  parseLabMetadataJson,
  validateLabMetadata,
  type LabMetadata,
} from "../../../../packages/shared/src/lab-metadata.js";

export type MitbTransactionConsistencyCheck = {
  key: string;
  passed: boolean;
  message: string;
};

export type MitbTransactionConsistencyReport = {
  labKey: "client.mitb";
  scope: "local-repository-only";
  ok: boolean;
  checkedFiles: string[];
  checks: MitbTransactionConsistencyCheck[];
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
  "/labs/client/mitb/vuln",
  "/labs/client/mitb/fixed",
];

const expectedApiEntrypoints = [
  "/api/labs/client/mitb/workbench",
  "/api/labs/client/mitb/vuln/evaluate",
  "/api/labs/client/mitb/fixed/evaluate",
];

const expectedServerRoutes = [
  "/api/labs/client/mitb/workbench",
  "/api/labs/client/mitb/:variant/evaluate",
];

const expectedSignals = [
  "client-mitb-risk-accepted",
  "client-mitb-defense-blocked",
  "client-mitb-normal-verified",
];

const expectedDocs = [
  "labs/client/mitb/README.md",
  "labs/client/mitb/vuln/README.md",
  "labs/client/mitb/fixed/README.md",
  "labs/client/mitb/mock/README.md",
  "labs/client/mitb/docs/attack-steps.md",
  "labs/client/mitb/docs/fix-notes.md",
  "labs/client/mitb/docs/manual-verification.md",
  "tools/lab-scripts/client/mitb/README.md",
];

const implementationFiles = [
  "apps/server/src/services/mitb-transaction-lab.ts",
  "apps/server/src/app.ts",
  "apps/web/src/api/mitb-transaction-lab.ts",
  "apps/web/src/labs/mitb-transaction.ts",
  "apps/web/src/router/routes.ts",
  "apps/web/src/views/MitbTransactionLabView.vue",
];

const testFiles = [
  "apps/server/tests/mitb-transaction-lab.test.ts",
  "apps/web/tests/router.test.ts",
];

const requiredContractFragments = [
  "fixed-browser-transaction-view-audit",
  "trust-browser-rendered-view",
  "compare-server-and-out-of-band-view",
  "submit-transaction-from-browser-view",
  "block-mismatched-transaction",
  "confirm-consistent-transaction",
  ...expectedSignals,
];

// 固定视图与三方对照来源必须成对出现在实现与文档中
const requiredViewFragments = [
  "virtual-tampered-transfer-view",
  "virtual-consistent-transfer-view",
  "virtual-supplier-a",
  "virtual-unknown-payee-z",
  "tampered",
  "consistent",
];

const forbiddenRuntimeFragments = [
  "node:" + "child_process",
  "child_" + "process",
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
): MitbTransactionConsistencyCheck {
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

export function runMitbTransactionConsistencyVerification(): MitbTransactionConsistencyReport {
  const checks: MitbTransactionConsistencyCheck[] = [];
  const metadataPath = "labs/client/mitb/meta.json";
  const metadataText = loadRepositoryText(metadataPath);
  const parsedMetadata = parseLabMetadataJson(metadataText);

  checks.push(
    createCheck(
      "metadata-json-parse",
      parsedMetadata.ok,
      parsedMetadata.ok
        ? "浏览器 MITB 元数据 JSON 可解析。"
        : parsedMetadata.errors.join("; "),
    ),
  );

  if (!parsedMetadata.ok) {
    return {
      labKey: "client.mitb",
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
        ? "浏览器 MITB 元数据符合共享结构校验。"
        : validationResult.errors.join("; "),
    ),
  );

  if (!validationResult.ok) {
    return {
      labKey: "client.mitb",
      scope: "local-repository-only",
      ok: false,
      checkedFiles: [metadataPath],
      checks,
      notes: ["元数据结构未通过校验，后续一致性检查已停止。"],
    };
  }

  const metadata = validationResult.value;
  const tamperedView = fixedTransactionViews.find(
    (view) => view.viewKey === "virtual-tampered-transfer-view",
  );
  const consistentView = fixedTransactionViews.find(
    (view) => view.viewKey === "virtual-consistent-transfer-view",
  );
  const tamperedAssessment = tamperedView
    ? assessFixedTransactionView(tamperedView)
    : undefined;
  const consistentAssessment = consistentView
    ? assessFixedTransactionView(consistentView)
    : undefined;
  const scriptPath = "tools/lab-scripts/client/mitb/verify.ts";
  const scriptEntrypoint = getScriptEntrypoint(metadata);
  const combinedDocs = expectedDocs
    .map((relativePath) => loadRepositoryText(relativePath))
    .join("\n");
  const combinedImplementation = implementationFiles
    .map((relativePath) => loadRepositoryText(relativePath))
    .join("\n");
  const safeRuntimeImplementation = loadRepositoryText(
    "apps/server/src/services/mitb-transaction-lab.ts",
  );
  const serverRoutes = loadRepositoryText("apps/server/src/app.ts");
  const webRoutes = loadRepositoryText("apps/web/src/router/routes.ts");

  checks.push(
    createCheck(
      "metadata-basic-state",
      metadata.id === "client.mitb" &&
        metadata.category === "client" &&
        metadata.mode === "case-study" &&
        (metadata.status === "in-progress" || metadata.status === "ready"),
      "元数据应保持 client.mitb / client / case-study，并仅在命令门禁后推进 ready。",
    ),
    createCheck(
      "graduated-from-guided-catalog",
      !guidedScenarioCatalog.some((scenario) => scenario.id === "client.mitb"),
      "client.mitb 应已从引导式目录移除，避免专用化后残留双实现。",
    ),
    createCheck(
      "fixed-view-shape",
      fixedTransactionViews.length === 2 &&
        tamperedView?.expectedPosture === "tampered" &&
        tamperedView.transactionSigned === false &&
        consistentView?.expectedPosture === "consistent" &&
        consistentView.transactionSigned === true,
      "固定交易视图应保持两组虚构基线，并锁定姿态与签名状态。",
    ),
    createCheck(
      "fixed-virtual-identifiers",
      fixedTransactionViews.every(
        (view) =>
          view.viewKey.startsWith("virtual-") &&
          view.browserPayee.startsWith("virtual-") &&
          view.serverPayee.startsWith("virtual-") &&
          view.outOfBandPayee.startsWith("virtual-"),
      ),
      "固定视图与收款方标识应统一使用 virtual- 前缀，不含真实账户或商户号。",
    ),
    createCheck(
      "fixed-audit-counts",
      tamperedAssessment?.findingCount === 4 &&
        tamperedAssessment.mismatchCount === 3 &&
        tamperedAssessment.trustedPathControlCount === 0 &&
        consistentAssessment?.findingCount === 0 &&
        consistentAssessment.mismatchCount === 0 &&
        consistentAssessment.trustedPathControlCount === 4,
      "篡改与一致视图的固定发现、不一致和受信路径控制计数应保持锁定值。",
    ),
    createCheck(
      "web-entrypoints",
      hasExactValues(
        metadata.entrypoints.web.map((entrypoint) => entrypoint.path),
        expectedWebEntrypoints,
      ),
      "前端入口应只包含漏洞版和修复版专用工作台。",
    ),
    createCheck(
      "api-entrypoints",
      hasExactValues(
        metadata.entrypoints.api.map((entrypoint) => entrypoint.path),
        expectedApiEntrypoints,
      ),
      "API 入口应只包含工作台配置与漏洞版/修复版评估接口。",
    ),
    createCheck(
      "dedicated-route-registration",
      expectedWebEntrypoints.every(
        (route) =>
          webRoutes.indexOf(route) >= 0 &&
          webRoutes.indexOf(route) <
            webRoutes.indexOf("/labs/:category/:scene/:variant(vuln|fixed)"),
      ) &&
        expectedServerRoutes.every(
          (route) =>
            serverRoutes.indexOf(route) >= 0 &&
            serverRoutes.indexOf(route) <
              serverRoutes.indexOf("/api/labs/:category/:scene/workbench"),
        ),
      "前后端真实路由文件应登记全部专用入口，并位于通用 catch-all 之前。",
    ),
    createCheck(
      "expected-signals",
      hasExactValues(
        metadata.verification.manual.expectedSignals,
        expectedSignals,
      ),
      "三个 canonical 终止信号应保持一致。",
    ),
    createCheck(
      "script-entrypoint",
      scriptEntrypoint?.key === "client-mitb-verify" &&
        scriptEntrypoint.path === scriptPath &&
        scriptEntrypoint.language === "ts" &&
        existsSync(path.join(repositoryRoot, scriptPath)),
      "脚本入口应登记本机只读一致性验证脚本。",
    ),
    createCheck(
      "automation-scope",
      metadata.verification.automation.supported === true &&
        metadata.verification.automation.apiTest?.enabled === true &&
        metadata.verification.automation.apiTest.specPath ===
          "apps/server/tests/mitb-transaction-lab.test.ts" &&
        metadata.verification.automation.scriptVerification?.enabled === true &&
        hasExactValues(
          metadata.verification.automation.scriptVerification.scriptKeys,
          ["client-mitb-verify"],
        ),
      "自动化入口应登记专用 API 测试和只读验证脚本。",
    ),
    createCheck(
      "expected-files-exist",
      [...expectedDocs, ...implementationFiles, ...testFiles].every(
        (relativePath) => existsSync(path.join(repositoryRoot, relativePath)),
      ),
      "标准文档、实现文件和专用测试应全部存在。",
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
      "fixed-view-semantics",
      requiredViewFragments.every(
        (fragment) =>
          combinedImplementation.includes(fragment) &&
          combinedDocs.includes(fragment),
      ),
      "固定视图、虚构收款方和姿态枚举应在实现与文档中保持一致。",
    ),
    createCheck(
      "safe-boundary-documented",
      ["固定", "脱敏阻断", "不发起", "真实", "虚构"].every((phrase) =>
        combinedDocs.includes(phrase),
      ),
      "文档应声明固定虚构数据、未知 key 脱敏阻断和不发起真实支付的边界。",
    ),
    createCheck(
      "no-exploit-script",
      !existsSync(
        path.join(repositoryRoot, "tools/lab-scripts/client/mitb/exploit.py"),
      ),
      "浏览器 MITB 实验按 case-study ready 例外，不应提供 exploit.py。",
    ),
    createCheck(
      "no-forbidden-runtime-capability",
      forbiddenRuntimeFragments.every(
        (fragment) => !safeRuntimeImplementation.includes(fragment),
      ),
      "专用服务不应发起外部请求或执行系统命令。",
    ),
  );

  return {
    labKey: "client.mitb",
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
      "本脚本只读取仓库内元数据、文档、实现和测试文件，并复用服务端固定交易视图常量。",
      "本脚本不发起 HTTP 请求，不读取真实浏览器状态，也不连接任何支付或金融接口。",
      "对照计数只由固定虚构视图的字段比较确定性推导。",
      "本脚本不提供 exploit.py、篡改能力或任何真实交易操作。",
    ],
  };
}

export function getMitbTransactionConsistencyVerificationPlan() {
  return {
    labKey: "client.mitb",
    scope: "local-repository-only",
    expectedWebEntrypoints,
    expectedApiEntrypoints,
    expectedSignals,
    expectedScript: "tools/lab-scripts/client/mitb/verify.ts",
    expectedDocuments: expectedDocs,
  };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const report = runMitbTransactionConsistencyVerification();

  console.log(JSON.stringify(report, null, 2));

  if (!report.ok) {
    process.exitCode = 1;
  }
}
