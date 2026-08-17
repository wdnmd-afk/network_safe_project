import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  analyzeFixedDetectionRule,
  fixedSecurityEventDataset,
  validateFixedSecurityEventDataset,
} from "../../../../packages/shared/src/fixed-security-events.js";
import {
  parseLabMetadataJson,
  validateLabMetadata,
  type LabMetadata,
} from "../../../../packages/shared/src/lab-metadata.js";

export type RuleAlertTriageConsistencyCheck = {
  key: string;
  passed: boolean;
  message: string;
};

export type RuleAlertTriageConsistencyReport = {
  labKey: "detection.rule-alert-triage";
  scope: "local-repository-only";
  ok: boolean;
  checkedFiles: string[];
  checks: RuleAlertTriageConsistencyCheck[];
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
  "/labs/detection/rule-alert-triage/vuln",
  "/labs/detection/rule-alert-triage/fixed",
];

const expectedApiEntrypoints = [
  "/api/labs/detection/rule-alert-triage/workbench",
  "/api/labs/detection/rule-alert-triage/vuln/evaluate",
  "/api/labs/detection/rule-alert-triage/fixed/evaluate",
];

const expectedServerRoutes = [
  "/api/labs/detection/rule-alert-triage/workbench",
  "/api/labs/detection/rule-alert-triage/:variant/evaluate",
];

const expectedSignals = [
  "detection-rule-alert-triage-risk-accepted",
  "detection-rule-alert-triage-defense-escalated",
  "detection-rule-alert-triage-normal-verified",
];

const expectedDocs = [
  "labs/detection/rule-alert-triage/README.md",
  "labs/detection/rule-alert-triage/vuln/README.md",
  "labs/detection/rule-alert-triage/fixed/README.md",
  "labs/detection/rule-alert-triage/mock/README.md",
  "labs/detection/rule-alert-triage/docs/attack-steps.md",
  "labs/detection/rule-alert-triage/docs/fix-notes.md",
  "labs/detection/rule-alert-triage/docs/manual-verification.md",
  "tools/lab-scripts/detection/rule-alert-triage/README.md",
];

const implementationFiles = [
  "packages/shared/src/fixed-security-events.js",
  "packages/shared/src/fixed-security-events.d.ts",
  "apps/server/src/services/rule-alert-triage-lab.ts",
  "apps/server/src/services/lab-metadata-sync.ts",
  "apps/server/src/app.ts",
  "apps/web/src/api/rule-alert-triage-lab.ts",
  "apps/web/src/labs/rule-alert-triage.ts",
  "apps/web/src/labs/platform-status.ts",
  "apps/web/src/router/routes.ts",
  "apps/web/src/views/RuleAlertTriageLabView.vue",
  "apps/web/src/views/LabsView.vue",
];

const testFiles = [
  "packages/shared/tests/fixed-security-events.test.mjs",
  "apps/server/tests/rule-alert-triage-lab.test.ts",
  "apps/web/tests/rule-alert-triage-api.test.ts",
  "apps/web/tests/router.test.ts",
];

const requiredContractFragments = [
  "fixed-auth-process-alert-timeline",
  "trust-broad-single-signal-rule",
  "trust-narrow-single-signal-rule",
  "correlate-multi-source-signals",
  "dismiss-correlated-alert-as-noise",
  "escalate-correlated-alert-for-containment",
  "close-known-maintenance-with-evidence",
  ...expectedSignals,
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
): RuleAlertTriageConsistencyCheck {
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

export function runRuleAlertTriageConsistencyVerification(): RuleAlertTriageConsistencyReport {
  const checks: RuleAlertTriageConsistencyCheck[] = [];
  const metadataPath = "labs/detection/rule-alert-triage/meta.json";
  const metadataText = loadRepositoryText(metadataPath);
  const parsedMetadata = parseLabMetadataJson(metadataText);

  checks.push(
    createCheck(
      "metadata-json-parse",
      parsedMetadata.ok,
      parsedMetadata.ok
        ? "检测规则与告警研判元数据 JSON 可解析。"
        : parsedMetadata.errors.join("; "),
    ),
  );

  if (!parsedMetadata.ok) {
    return {
      labKey: "detection.rule-alert-triage",
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
        ? "检测规则与告警研判元数据符合共享结构校验。"
        : validationResult.errors.join("; "),
    ),
  );

  if (!validationResult.ok) {
    return {
      labKey: "detection.rule-alert-triage",
      scope: "local-repository-only",
      ok: false,
      checkedFiles: [metadataPath],
      checks,
      notes: ["元数据结构未通过校验，后续一致性检查已停止。"],
    };
  }

  const metadata = validationResult.value;
  const datasetValidation = validateFixedSecurityEventDataset(
    fixedSecurityEventDataset,
  );
  const broadAnalysis = analyzeFixedDetectionRule(
    fixedSecurityEventDataset,
    "broad-auth-failure-rule",
  );
  const narrowAnalysis = analyzeFixedDetectionRule(
    fixedSecurityEventDataset,
    "narrow-unsigned-process-rule",
  );
  const correlatedAnalysis = analyzeFixedDetectionRule(
    fixedSecurityEventDataset,
    "correlated-auth-process-network-rule",
  );
  const scriptPath =
    "tools/lab-scripts/detection/rule-alert-triage/verify.ts";
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
  const safeRuntimeImplementation = [
    "packages/shared/src/fixed-security-events.js",
    "apps/server/src/services/rule-alert-triage-lab.ts",
  ]
    .map(loadRepositoryText)
    .join("\n");
  const serverRoutes = loadRepositoryText("apps/server/src/app.ts");
  const webRoutes = loadRepositoryText("apps/web/src/router/routes.ts");
  const categoryRegistrations = [
    "apps/server/src/services/lab-metadata-sync.ts",
    "apps/web/src/labs/platform-status.ts",
    "apps/web/src/views/LabsView.vue",
  ].map(loadRepositoryText);

  checks.push(
    createCheck(
      "metadata-basic-state",
      metadata.id === "detection.rule-alert-triage" &&
        metadata.category === "detection" &&
        metadata.mode === "simulation" &&
        (metadata.status === "in-progress" || metadata.status === "ready"),
      "元数据应保持 detection.rule-alert-triage / detection / simulation，并仅在命令门禁后推进 ready。",
    ),
    createCheck(
      "fixed-dataset-schema",
      datasetValidation.ok &&
        fixedSecurityEventDataset.key ===
          "fixed-auth-process-alert-timeline" &&
        fixedSecurityEventDataset.events.length === 6 &&
        fixedSecurityEventDataset.ruleProfiles.length === 3,
      "共享固定事件数据集应通过结构校验并保持六条事件和三组规则画像。",
    ),
    createCheck(
      "fixed-rule-metrics",
      broadAnalysis?.truePositiveCount === 1 &&
        broadAnalysis.falsePositiveCount === 1 &&
        broadAnalysis.falseNegativeCount === 3 &&
        narrowAnalysis?.truePositiveCount === 1 &&
        narrowAnalysis.falsePositiveCount === 0 &&
        narrowAnalysis.falseNegativeCount === 3 &&
        correlatedAnalysis?.truePositiveCount === 4 &&
        correlatedAnalysis.falsePositiveCount === 0 &&
        correlatedAnalysis.falseNegativeCount === 0,
      "过宽、过窄和关联规则的固定 TP/FP/FN 指标应保持锁定值。",
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
      "category-registration",
      categoryRegistrations.every((content) =>
        ["detection", "检测与响应"].every((fragment) =>
          content.includes(fragment),
        ),
      ),
      "detection 分类应接入数据库同步、实验列表和平台状态中文标签。",
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
      scriptEntrypoint?.key === "detection-rule-alert-triage-verify" &&
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
          "apps/server/tests/rule-alert-triage-lab.test.ts" &&
        metadata.verification.automation.scriptVerification?.enabled === true &&
        hasExactValues(
          metadata.verification.automation.scriptVerification.scriptKeys,
          ["detection-rule-alert-triage-verify"],
        ),
      "自动化入口应登记专用 API 测试和只读验证脚本。",
    ),
    createCheck(
      "expected-files-exist",
      [...expectedDocs, ...implementationFiles, ...testFiles].every(
        (relativePath) => existsSync(path.join(repositoryRoot, relativePath)),
      ),
      "标准文档、共享数据、实现文件和专用测试应全部存在。",
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
      ["固定", "脱敏阻断", "不执行", "真实", "查询表达式"].every(
        (phrase) => combinedDocs.includes(phrase),
      ),
      "文档应声明固定输入、未知 key 脱敏阻断和不执行真实查询处置的边界。",
    ),
    createCheck(
      "no-exploit-script",
      !existsSync(
        path.join(
          repositoryRoot,
          "tools/lab-scripts/detection/rule-alert-triage/exploit.py",
        ),
      ),
      "检测规则与告警研判实验不应提供 exploit.py。",
    ),
    createCheck(
      "no-forbidden-runtime-capability",
      forbiddenRuntimeFragments.every(
        (fragment) => !safeRuntimeImplementation.includes(fragment),
      ),
      "共享数据与专用服务不应发起外部请求或执行系统命令。",
    ),
  );

  return {
    labKey: "detection.rule-alert-triage",
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
      "本脚本只读取仓库内固定事件、元数据、文档、实现和测试文件。",
      "本脚本不发起 HTTP 请求，不连接 SIEM、EDR、日志源、主机或外部目标。",
      "规则指标只由固定 eventId 命中集合与教学基线确定性计算。",
      "本脚本不提供 exploit.py、规则执行、外部查询或真实处置能力。",
    ],
  };
}

export function getRuleAlertTriageConsistencyVerificationPlan() {
  return {
    labKey: "detection.rule-alert-triage",
    scope: "local-repository-only",
    expectedWebEntrypoints,
    expectedApiEntrypoints,
    expectedSignals,
    expectedScript:
      "tools/lab-scripts/detection/rule-alert-triage/verify.ts",
    expectedDocuments: expectedDocs,
  };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const report = runRuleAlertTriageConsistencyVerification();

  console.log(JSON.stringify(report, null, 2));

  if (!report.ok) {
    process.exitCode = 1;
  }
}
