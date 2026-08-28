import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  assessFixedPersistenceEntry,
  fixedPersistenceEntrySnapshots,
} from "../../../../apps/server/src/services/persistence-triage-lab.js";
import {
  parseLabMetadataJson,
  validateLabMetadata,
  type LabMetadata,
} from "../../../../packages/shared/src/lab-metadata.js";

export type PersistenceTriageConsistencyCheck = {
  key: string;
  passed: boolean;
  message: string;
};

export type PersistenceTriageConsistencyReport = {
  labKey: "host.persistence-triage";
  scope: "local-repository-only";
  ok: boolean;
  checkedFiles: string[];
  checks: PersistenceTriageConsistencyCheck[];
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
  "/labs/host/persistence-triage/vuln",
  "/labs/host/persistence-triage/fixed",
];

const expectedApiEntrypoints = [
  "/api/labs/host/persistence-triage/workbench",
  "/api/labs/host/persistence-triage/vuln/evaluate",
  "/api/labs/host/persistence-triage/fixed/evaluate",
];

const expectedServerRoutes = [
  "/api/labs/host/persistence-triage/workbench",
  "/api/labs/host/persistence-triage/:variant/evaluate",
];

const expectedSignals = [
  "host-persistence-triage-risk-accepted",
  "host-persistence-triage-defense-blocked",
  "host-persistence-triage-normal-verified",
];

const expectedDocs = [
  "labs/host/persistence-triage/README.md",
  "labs/host/persistence-triage/vuln/README.md",
  "labs/host/persistence-triage/fixed/README.md",
  "labs/host/persistence-triage/mock/README.md",
  "labs/host/persistence-triage/docs/attack-steps.md",
  "labs/host/persistence-triage/docs/fix-notes.md",
  "labs/host/persistence-triage/docs/manual-verification.md",
  "tools/lab-scripts/host/persistence-triage/README.md",
];

const implementationFiles = [
  "apps/server/src/services/persistence-triage-lab.ts",
  "apps/server/src/app.ts",
  "apps/web/src/api/persistence-triage-lab.ts",
  "apps/web/src/labs/persistence-triage.ts",
  "apps/web/src/router/routes.ts",
  "apps/web/src/views/PersistenceTriageLabView.vue",
];

const testFiles = [
  "apps/server/tests/persistence-triage-lab.test.ts",
  "apps/web/tests/router.test.ts",
];

const requiredContractFragments = [
  "fixed-windows-autorun-persistence-timeline",
  "accept-unsigned-autorun-entry",
  "harden-signature-and-path-acl",
  "approve-persistence-retention",
  "block-and-remove-persistence",
  "verify-managed-autorun-baseline",
  ...expectedSignals,
];

// 五要素语义枚举必须成对出现在实现与文档中，避免退化为真实主机操作指引
const requiredScopeFragments = [
  "virtual-unsigned-autorun-entry",
  "virtual-signed-managed-task",
  "unsigned",
  "publisher-verified",
  "user-writable",
  "admin-only-writable",
  "logon-high-frequency",
  "scheduled-window",
  "high-privilege-account",
  "least-privilege-account",
  "change-audited-and-alerted",
];

// 只扫描真实运行能力片段；实现中的"不创建"边界声明不应被误判
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
): PersistenceTriageConsistencyCheck {
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

export function runPersistenceTriageConsistencyVerification(): PersistenceTriageConsistencyReport {
  const checks: PersistenceTriageConsistencyCheck[] = [];
  const metadataPath = "labs/host/persistence-triage/meta.json";
  const metadataText = loadRepositoryText(metadataPath);
  const parsedMetadata = parseLabMetadataJson(metadataText);

  checks.push(
    createCheck(
      "metadata-json-parse",
      parsedMetadata.ok,
      parsedMetadata.ok
        ? "持久化研判元数据 JSON 可解析。"
        : parsedMetadata.errors.join("; "),
    ),
  );

  if (!parsedMetadata.ok) {
    return {
      labKey: "host.persistence-triage",
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
        ? "持久化研判元数据符合共享结构校验。"
        : validationResult.errors.join("; "),
    ),
  );

  if (!validationResult.ok) {
    return {
      labKey: "host.persistence-triage",
      scope: "local-repository-only",
      ok: false,
      checkedFiles: [metadataPath],
      checks,
      notes: ["元数据结构未通过校验，后续一致性检查已停止。"],
    };
  }

  const metadata = validationResult.value;
  const unsignedEntry = fixedPersistenceEntrySnapshots.find(
    (entry) => entry.entryKey === "virtual-unsigned-autorun-entry",
  );
  const managedEntry = fixedPersistenceEntrySnapshots.find(
    (entry) => entry.entryKey === "virtual-signed-managed-task",
  );
  const unsignedAssessment = unsignedEntry
    ? assessFixedPersistenceEntry(unsignedEntry)
    : undefined;
  const managedAssessment = managedEntry
    ? assessFixedPersistenceEntry(managedEntry)
    : undefined;
  const scriptPath = "tools/lab-scripts/host/persistence-triage/verify.ts";
  const scriptEntrypoint = getScriptEntrypoint(metadata);
  const combinedDocs = expectedDocs
    .map((relativePath) => loadRepositoryText(relativePath))
    .join("\n");
  const combinedImplementation = implementationFiles
    .map((relativePath) => loadRepositoryText(relativePath))
    .join("\n");
  const safeRuntimeImplementation = loadRepositoryText(
    "apps/server/src/services/persistence-triage-lab.ts",
  );
  const serverRoutes = loadRepositoryText("apps/server/src/app.ts");
  const webRoutes = loadRepositoryText("apps/web/src/router/routes.ts");

  checks.push(
    createCheck(
      "metadata-basic-state",
      metadata.id === "host.persistence-triage" &&
        metadata.category === "host" &&
        metadata.mode === "case-study" &&
        (metadata.status === "in-progress" || metadata.status === "ready"),
      "元数据应保持 host.persistence-triage / host / case-study，并仅在命令门禁后推进 ready。",
    ),
    createCheck(
      "fixed-entry-shape",
      fixedPersistenceEntrySnapshots.length === 2 &&
        unsignedEntry?.expectedPosture === "vulnerable" &&
        unsignedEntry.signatureScope === "unsigned" &&
        unsignedEntry.imagePathAclScope === "user-writable" &&
        unsignedEntry.auditScope === "none" &&
        unsignedEntry.tamperableByStandardUser === true &&
        managedEntry?.expectedPosture === "hardened" &&
        managedEntry.signatureScope === "publisher-verified" &&
        managedEntry.imagePathAclScope === "admin-only-writable" &&
        managedEntry.auditScope === "change-audited-and-alerted" &&
        managedEntry.tamperableByStandardUser === false,
      "固定条目快照应保持两份虚构基线，并锁定五要素范围与可篡改性。",
    ),
    createCheck(
      "fixed-virtual-identifiers",
      fixedPersistenceEntrySnapshots.every((entry) =>
        entry.entryKey.startsWith("virtual-"),
      ),
      "固定条目标识应统一使用 virtual- 前缀，不含真实注册表键、任务名或主机名。",
    ),
    createCheck(
      "fixed-audit-counts",
      unsignedAssessment?.findingCount === 4 &&
        unsignedAssessment.criticalFindingCount === 2 &&
        unsignedAssessment.hardeningControlCount === 0 &&
        managedAssessment?.findingCount === 0 &&
        managedAssessment.criticalFindingCount === 0 &&
        managedAssessment.hardeningControlCount === 5,
      "未签名与受管条目的固定发现、关键风险和加固控制计数应保持锁定值。",
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
      scriptEntrypoint?.key === "host-persistence-triage-verify" &&
        scriptEntrypoint.path === scriptPath &&
        scriptEntrypoint.language === "ts" &&
        existsSync(path.join(repositoryRoot, scriptPath)),
      "脚本入口应登记本机只读一致性验证脚本。",
    ),
    createCheck(
      "case-study-automation-scope",
      metadata.verification.automation.supported === true &&
        metadata.verification.automation.apiTest?.enabled === true &&
        metadata.verification.automation.apiTest.specPath ===
          "apps/server/tests/persistence-triage-lab.test.ts" &&
        metadata.verification.automation.scriptVerification?.enabled === true &&
        hasExactValues(
          metadata.verification.automation.scriptVerification.scriptKeys,
          ["host-persistence-triage-verify"],
        ) &&
        metadata.variants.every((variant) => !variant.supportsAutomation),
      "自动化入口应登记专用 API 测试与只读脚本，且 case-study 变体保持 supportsAutomation false。",
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
      "fixed-scope-semantics",
      requiredScopeFragments.every(
        (fragment) =>
          combinedImplementation.includes(fragment) &&
          combinedDocs.includes(fragment),
      ),
      "固定条目与五要素语义枚举应在实现与文档中保持一致。",
    ),
    createCheck(
      "safe-boundary-documented",
      ["固定", "脱敏阻断", "不创建", "真实", "虚构"].every((phrase) =>
        combinedDocs.includes(phrase),
      ),
      "文档应声明固定虚构数据、未知 key 脱敏阻断和不创建真实持久化的边界。",
    ),
    createCheck(
      "case-study-ready-boundary",
      metadata.safeBoundaries.some(
        (boundary) =>
          boundary.includes("case-study") && boundary.includes("ready"),
      ) &&
        metadata.notes.includes("不提供") &&
        metadata.notes.includes("exploit.py"),
      "case-study ready 元数据应说明 ready 边界并声明不提供攻击脚本。",
    ),
    createCheck(
      "no-exploit-script",
      !existsSync(
        path.join(
          repositoryRoot,
          "tools/lab-scripts/host/persistence-triage/exploit.py",
        ),
      ),
      "持久化研判实验不应提供 exploit.py。",
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
    labKey: "host.persistence-triage",
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
      "本脚本只读取仓库内元数据、文档、实现和测试文件，并复用服务端固定条目常量。",
      "本脚本不发起 HTTP 请求，不读取真实注册表、计划任务、ACL 或系统凭据。",
      "加固控制计数只由固定虚构条目的语义枚举确定性推导。",
      "本脚本不提供 exploit.py、持久化载荷、驻留脚本或任何真实主机变更能力。",
    ],
  };
}

export function getPersistenceTriageConsistencyVerificationPlan() {
  return {
    labKey: "host.persistence-triage",
    scope: "local-repository-only",
    expectedWebEntrypoints,
    expectedApiEntrypoints,
    expectedSignals,
    expectedScript: "tools/lab-scripts/host/persistence-triage/verify.ts",
    expectedDocuments: expectedDocs,
  };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const report = runPersistenceTriageConsistencyVerification();

  console.log(JSON.stringify(report, null, 2));

  if (!report.ok) {
    process.exitCode = 1;
  }
}
