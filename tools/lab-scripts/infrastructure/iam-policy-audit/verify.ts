import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  assessFixedIamPolicy,
  fixedIamPolicySnapshots,
} from "../../../../apps/server/src/services/iam-policy-audit-lab.js";
import {
  parseLabMetadataJson,
  validateLabMetadata,
  type LabMetadata,
} from "../../../../packages/shared/src/lab-metadata.js";

export type IamPolicyAuditConsistencyCheck = {
  key: string;
  passed: boolean;
  message: string;
};

export type IamPolicyAuditConsistencyReport = {
  labKey: "infrastructure.iam-policy-audit";
  scope: "local-repository-only";
  ok: boolean;
  checkedFiles: string[];
  checks: IamPolicyAuditConsistencyCheck[];
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
  "/labs/infrastructure/iam-policy-audit/vuln",
  "/labs/infrastructure/iam-policy-audit/fixed",
];

const expectedApiEntrypoints = [
  "/api/labs/infrastructure/iam-policy-audit/workbench",
  "/api/labs/infrastructure/iam-policy-audit/vuln/evaluate",
  "/api/labs/infrastructure/iam-policy-audit/fixed/evaluate",
];

const expectedServerRoutes = [
  "/api/labs/infrastructure/iam-policy-audit/workbench",
  "/api/labs/infrastructure/iam-policy-audit/:variant/evaluate",
];

const expectedSignals = [
  "infrastructure-iam-policy-audit-risk-accepted",
  "infrastructure-iam-policy-audit-defense-blocked",
  "infrastructure-iam-policy-audit-normal-verified",
];

const expectedDocs = [
  "labs/infrastructure/iam-policy-audit/README.md",
  "labs/infrastructure/iam-policy-audit/vuln/README.md",
  "labs/infrastructure/iam-policy-audit/fixed/README.md",
  "labs/infrastructure/iam-policy-audit/mock/README.md",
  "labs/infrastructure/iam-policy-audit/docs/attack-steps.md",
  "labs/infrastructure/iam-policy-audit/docs/fix-notes.md",
  "labs/infrastructure/iam-policy-audit/docs/manual-verification.md",
  "tools/lab-scripts/infrastructure/iam-policy-audit/README.md",
];

const implementationFiles = [
  "apps/server/src/services/iam-policy-audit-lab.ts",
  "apps/server/src/app.ts",
  "apps/web/src/api/iam-policy-audit-lab.ts",
  "apps/web/src/labs/iam-policy-audit.ts",
  "apps/web/src/router/routes.ts",
  "apps/web/src/views/IamPolicyAuditLabView.vue",
];

const testFiles = [
  "apps/server/tests/iam-policy-audit-lab.test.ts",
  "apps/web/tests/router.test.ts",
];

const requiredContractFragments = [
  "fixed-cloud-iam-policy-audit",
  "accept-wildcard-admin-policy",
  "scope-policy-to-least-privilege",
  "approve-overbroad-policy-grant",
  "block-overbroad-policy-grant",
  "verify-least-privilege-baseline",
  ...expectedSignals,
];

// 四要素语义枚举必须成对出现在实现与文档中，避免退化为真实策略文档
const requiredScopeFragments = [
  "virtual-admin-wildcard-policy",
  "virtual-scoped-least-privilege-policy",
  "wildcard-all",
  "named-role",
  "explicit-actions",
  "explicit-resources",
  "source-restricted",
];

// 只扫描真实运行能力片段；实现中的"不调用"边界声明不应被误判
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
): IamPolicyAuditConsistencyCheck {
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

export function runIamPolicyAuditConsistencyVerification(): IamPolicyAuditConsistencyReport {
  const checks: IamPolicyAuditConsistencyCheck[] = [];
  const metadataPath = "labs/infrastructure/iam-policy-audit/meta.json";
  const metadataText = loadRepositoryText(metadataPath);
  const parsedMetadata = parseLabMetadataJson(metadataText);

  checks.push(
    createCheck(
      "metadata-json-parse",
      parsedMetadata.ok,
      parsedMetadata.ok
        ? "云 IAM 策略审计元数据 JSON 可解析。"
        : parsedMetadata.errors.join("; "),
    ),
  );

  if (!parsedMetadata.ok) {
    return {
      labKey: "infrastructure.iam-policy-audit",
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
        ? "云 IAM 策略审计元数据符合共享结构校验。"
        : validationResult.errors.join("; "),
    ),
  );

  if (!validationResult.ok) {
    return {
      labKey: "infrastructure.iam-policy-audit",
      scope: "local-repository-only",
      ok: false,
      checkedFiles: [metadataPath],
      checks,
      notes: ["元数据结构未通过校验，后续一致性检查已停止。"],
    };
  }

  const metadata = validationResult.value;
  const wildcardPolicy = fixedIamPolicySnapshots.find(
    (policy) => policy.policyKey === "virtual-admin-wildcard-policy",
  );
  const scopedPolicy = fixedIamPolicySnapshots.find(
    (policy) => policy.policyKey === "virtual-scoped-least-privilege-policy",
  );
  const wildcardAssessment = wildcardPolicy
    ? assessFixedIamPolicy(wildcardPolicy)
    : undefined;
  const scopedAssessment = scopedPolicy
    ? assessFixedIamPolicy(scopedPolicy)
    : undefined;
  const scriptPath =
    "tools/lab-scripts/infrastructure/iam-policy-audit/verify.ts";
  const scriptEntrypoint = getScriptEntrypoint(metadata);
  const combinedDocs = expectedDocs
    .map((relativePath) => loadRepositoryText(relativePath))
    .join("\n");
  const combinedImplementation = implementationFiles
    .map((relativePath) => loadRepositoryText(relativePath))
    .join("\n");
  const safeRuntimeImplementation = loadRepositoryText(
    "apps/server/src/services/iam-policy-audit-lab.ts",
  );
  const serverRoutes = loadRepositoryText("apps/server/src/app.ts");
  const webRoutes = loadRepositoryText("apps/web/src/router/routes.ts");

  checks.push(
    createCheck(
      "metadata-basic-state",
      metadata.id === "infrastructure.iam-policy-audit" &&
        metadata.category === "infrastructure" &&
        metadata.mode === "simulation" &&
        (metadata.status === "in-progress" || metadata.status === "ready"),
      "元数据应保持 infrastructure.iam-policy-audit / infrastructure / simulation，并仅在命令门禁后推进 ready。",
    ),
    createCheck(
      "fixed-policy-shape",
      fixedIamPolicySnapshots.length === 2 &&
        wildcardPolicy?.expectedPosture === "vulnerable" &&
        wildcardPolicy.principalScope === "wildcard-all" &&
        wildcardPolicy.conditionScope === "none" &&
        wildcardPolicy.privilegeEscalationReachable === true &&
        scopedPolicy?.expectedPosture === "hardened" &&
        scopedPolicy.principalScope === "named-role" &&
        scopedPolicy.conditionScope === "source-restricted" &&
        scopedPolicy.privilegeEscalationReachable === false,
      "固定策略快照应保持两份虚构基线，并锁定四要素范围与提权可达性。",
    ),
    createCheck(
      "fixed-virtual-identifiers",
      fixedIamPolicySnapshots.every((policy) =>
        policy.policyKey.startsWith("virtual-"),
      ),
      "固定策略标识应统一使用 virtual- 前缀，不含真实账号、ARN 或资源名。",
    ),
    createCheck(
      "fixed-audit-counts",
      wildcardAssessment?.findingCount === 4 &&
        wildcardAssessment.criticalFindingCount === 2 &&
        wildcardAssessment.leastPrivilegeControlCount === 0 &&
        scopedAssessment?.findingCount === 0 &&
        scopedAssessment.criticalFindingCount === 0 &&
        scopedAssessment.leastPrivilegeControlCount === 4,
      "通配符与最小权限策略的固定发现、关键风险和最小权限控制计数应保持锁定值。",
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
      scriptEntrypoint?.key === "infrastructure-iam-policy-audit-verify" &&
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
          "apps/server/tests/iam-policy-audit-lab.test.ts" &&
        metadata.verification.automation.scriptVerification?.enabled === true &&
        hasExactValues(
          metadata.verification.automation.scriptVerification.scriptKeys,
          ["infrastructure-iam-policy-audit-verify"],
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
      "fixed-scope-semantics",
      requiredScopeFragments.every(
        (fragment) =>
          combinedImplementation.includes(fragment) &&
          combinedDocs.includes(fragment),
      ),
      "固定策略与四要素语义枚举应在实现与文档中保持一致。",
    ),
    createCheck(
      "safe-boundary-documented",
      ["固定", "脱敏阻断", "不调用", "真实", "虚构"].every((phrase) =>
        combinedDocs.includes(phrase),
      ),
      "文档应声明固定虚构数据、未知 key 脱敏阻断和不调用真实云接口的边界。",
    ),
    createCheck(
      "no-exploit-script",
      !existsSync(
        path.join(
          repositoryRoot,
          "tools/lab-scripts/infrastructure/iam-policy-audit/exploit.py",
        ),
      ),
      "云 IAM 策略审计实验不应提供 exploit.py。",
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
    labKey: "infrastructure.iam-policy-audit",
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
      "本脚本只读取仓库内元数据、文档、实现和测试文件，并复用服务端固定策略常量。",
      "本脚本不发起 HTTP 请求，不连接云账户、集群、IaC 后端或外部目标。",
      "最小权限计数只由固定虚构策略的语义枚举确定性推导。",
      "本脚本不提供 exploit.py、策略下发、角色绑定或任何真实云端变更能力。",
    ],
  };
}

export function getIamPolicyAuditConsistencyVerificationPlan() {
  return {
    labKey: "infrastructure.iam-policy-audit",
    scope: "local-repository-only",
    expectedWebEntrypoints,
    expectedApiEntrypoints,
    expectedSignals,
    expectedScript:
      "tools/lab-scripts/infrastructure/iam-policy-audit/verify.ts",
    expectedDocuments: expectedDocs,
  };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const report = runIamPolicyAuditConsistencyVerification();

  console.log(JSON.stringify(report, null, 2));

  if (!report.ok) {
    process.exitCode = 1;
  }
}
