import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  assessFixedRbacBinding,
  fixedRbacBindingSnapshots,
} from "../../../../apps/server/src/services/kubernetes-rbac-audit-lab.js";
import {
  parseLabMetadataJson,
  validateLabMetadata,
  type LabMetadata,
} from "../../../../packages/shared/src/lab-metadata.js";

export type KubernetesRbacAuditConsistencyCheck = {
  key: string;
  passed: boolean;
  message: string;
};

export type KubernetesRbacAuditConsistencyReport = {
  labKey: "infrastructure.kubernetes-rbac-audit";
  scope: "local-repository-only";
  ok: boolean;
  checkedFiles: string[];
  checks: KubernetesRbacAuditConsistencyCheck[];
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
  "/labs/infrastructure/kubernetes-rbac-audit/vuln",
  "/labs/infrastructure/kubernetes-rbac-audit/fixed",
];

const expectedApiEntrypoints = [
  "/api/labs/infrastructure/kubernetes-rbac-audit/workbench",
  "/api/labs/infrastructure/kubernetes-rbac-audit/vuln/evaluate",
  "/api/labs/infrastructure/kubernetes-rbac-audit/fixed/evaluate",
];

const expectedServerRoutes = [
  "/api/labs/infrastructure/kubernetes-rbac-audit/workbench",
  "/api/labs/infrastructure/kubernetes-rbac-audit/:variant/evaluate",
];

const expectedSignals = [
  "infrastructure-kubernetes-rbac-audit-risk-accepted",
  "infrastructure-kubernetes-rbac-audit-defense-blocked",
  "infrastructure-kubernetes-rbac-audit-normal-verified",
];

const expectedDocs = [
  "labs/infrastructure/kubernetes-rbac-audit/README.md",
  "labs/infrastructure/kubernetes-rbac-audit/vuln/README.md",
  "labs/infrastructure/kubernetes-rbac-audit/fixed/README.md",
  "labs/infrastructure/kubernetes-rbac-audit/mock/README.md",
  "labs/infrastructure/kubernetes-rbac-audit/docs/attack-steps.md",
  "labs/infrastructure/kubernetes-rbac-audit/docs/fix-notes.md",
  "labs/infrastructure/kubernetes-rbac-audit/docs/manual-verification.md",
  "tools/lab-scripts/infrastructure/kubernetes-rbac-audit/README.md",
];

const implementationFiles = [
  "apps/server/src/services/kubernetes-rbac-audit-lab.ts",
  "apps/server/src/app.ts",
  "apps/web/src/api/kubernetes-rbac-audit-lab.ts",
  "apps/web/src/labs/kubernetes-rbac-audit.ts",
  "apps/web/src/router/routes.ts",
  "apps/web/src/views/KubernetesRbacAuditLabView.vue",
];

const testFiles = [
  "apps/server/tests/kubernetes-rbac-audit-lab.test.ts",
  "apps/web/tests/router.test.ts",
];

const requiredContractFragments = [
  "fixed-kubernetes-rbac-audit",
  "accept-cluster-admin-binding",
  "scope-binding-to-namespace",
  "approve-overbroad-binding",
  "block-overbroad-binding",
  "verify-namespaced-baseline",
  ...expectedSignals,
];

// 五要素语义枚举必须成对出现在实现与文档中，避免退化为可直接套用的真实清单
const requiredScopeFragments = [
  "virtual-cluster-admin-broad-binding",
  "virtual-namespaced-readonly-binding",
  "cluster-wide",
  "namespace-scoped",
  "wildcard-all",
  "read-only-verbs",
  "explicit-resources",
  "broad-group",
  "named-service-account",
];

// 只扫描真实运行能力片段；实现中的"不调用 kubectl"这类边界声明不应被误判，
// 因此不把 kubectl、helm 等裸工具名放入列表，只匹配可执行调用与网络请求形态
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
): KubernetesRbacAuditConsistencyCheck {
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

export function runKubernetesRbacAuditConsistencyVerification(): KubernetesRbacAuditConsistencyReport {
  const checks: KubernetesRbacAuditConsistencyCheck[] = [];
  const metadataPath = "labs/infrastructure/kubernetes-rbac-audit/meta.json";
  const metadataText = loadRepositoryText(metadataPath);
  const parsedMetadata = parseLabMetadataJson(metadataText);

  checks.push(
    createCheck(
      "metadata-json-parse",
      parsedMetadata.ok,
      parsedMetadata.ok
        ? "Kubernetes RBAC 审计元数据 JSON 可解析。"
        : parsedMetadata.errors.join("; "),
    ),
  );

  if (!parsedMetadata.ok) {
    return {
      labKey: "infrastructure.kubernetes-rbac-audit",
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
        ? "Kubernetes RBAC 审计元数据符合共享结构校验。"
        : validationResult.errors.join("; "),
    ),
  );

  if (!validationResult.ok) {
    return {
      labKey: "infrastructure.kubernetes-rbac-audit",
      scope: "local-repository-only",
      ok: false,
      checkedFiles: [metadataPath],
      checks,
      notes: ["元数据结构未通过校验，后续一致性检查已停止。"],
    };
  }

  const metadata = validationResult.value;
  const clusterBinding = fixedRbacBindingSnapshots.find(
    (binding) => binding.bindingKey === "virtual-cluster-admin-broad-binding",
  );
  const namespacedBinding = fixedRbacBindingSnapshots.find(
    (binding) => binding.bindingKey === "virtual-namespaced-readonly-binding",
  );
  const clusterAssessment = clusterBinding
    ? assessFixedRbacBinding(clusterBinding)
    : undefined;
  const namespacedAssessment = namespacedBinding
    ? assessFixedRbacBinding(namespacedBinding)
    : undefined;
  const scriptPath =
    "tools/lab-scripts/infrastructure/kubernetes-rbac-audit/verify.ts";
  const scriptEntrypoint = getScriptEntrypoint(metadata);
  const combinedDocs = expectedDocs
    .map((relativePath) => loadRepositoryText(relativePath))
    .join("\n");
  const combinedImplementation = implementationFiles
    .map((relativePath) => loadRepositoryText(relativePath))
    .join("\n");
  const safeRuntimeImplementation = loadRepositoryText(
    "apps/server/src/services/kubernetes-rbac-audit-lab.ts",
  );
  const serverRoutes = loadRepositoryText("apps/server/src/app.ts");
  const webRoutes = loadRepositoryText("apps/web/src/router/routes.ts");

  checks.push(
    createCheck(
      "metadata-basic-state",
      metadata.id === "infrastructure.kubernetes-rbac-audit" &&
        metadata.category === "infrastructure" &&
        metadata.mode === "case-study" &&
        (metadata.status === "in-progress" || metadata.status === "ready"),
      "元数据应保持 infrastructure.kubernetes-rbac-audit / infrastructure / case-study，并仅在命令门禁后推进 ready。",
    ),
    createCheck(
      "fixed-binding-shape",
      fixedRbacBindingSnapshots.length === 2 &&
        clusterBinding?.expectedPosture === "vulnerable" &&
        clusterBinding.roleScope === "cluster-wide" &&
        clusterBinding.verbScope === "wildcard-all" &&
        clusterBinding.resourceScope === "wildcard-all" &&
        clusterBinding.subjectScope === "broad-group" &&
        clusterBinding.privilegeEscalationReachable === true &&
        namespacedBinding?.expectedPosture === "hardened" &&
        namespacedBinding.roleScope === "namespace-scoped" &&
        namespacedBinding.verbScope === "read-only-verbs" &&
        namespacedBinding.resourceScope === "explicit-resources" &&
        namespacedBinding.subjectScope === "named-service-account" &&
        namespacedBinding.privilegeEscalationReachable === false,
      "固定绑定快照应保持两份虚构基线，并锁定五要素范围与提权可达性。",
    ),
    createCheck(
      "fixed-virtual-identifiers",
      fixedRbacBindingSnapshots.every((binding) =>
        binding.bindingKey.startsWith("virtual-"),
      ),
      "固定绑定标识应统一使用 virtual- 前缀，不含真实集群、命名空间或服务账号名。",
    ),
    createCheck(
      "fixed-audit-counts",
      clusterAssessment?.findingCount === 4 &&
        clusterAssessment.criticalFindingCount === 3 &&
        clusterAssessment.leastPrivilegeControlCount === 0 &&
        namespacedAssessment?.findingCount === 0 &&
        namespacedAssessment.criticalFindingCount === 0 &&
        namespacedAssessment.leastPrivilegeControlCount === 5,
      "集群级与命名空间级绑定的固定发现、关键风险和最小权限控制计数应保持锁定值。",
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
      scriptEntrypoint?.key === "infrastructure-kubernetes-rbac-audit-verify" &&
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
          "apps/server/tests/kubernetes-rbac-audit-lab.test.ts" &&
        metadata.verification.automation.scriptVerification?.enabled === true &&
        hasExactValues(
          metadata.verification.automation.scriptVerification.scriptKeys,
          ["infrastructure-kubernetes-rbac-audit-verify"],
        ) &&
        // case-study 保持 ready 例外：变体不得声明攻击脚本自动化
        metadata.variants.every(
          (variant) => variant.supportsAutomation === false,
        ),
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
      "固定绑定与五要素语义枚举应在实现与文档中保持一致。",
    ),
    createCheck(
      "safe-boundary-documented",
      ["固定", "脱敏阻断", "不调用", "真实", "虚构"].every((phrase) =>
        combinedDocs.includes(phrase),
      ),
      "文档应声明固定虚构数据、未知 key 脱敏阻断和不调用真实集群接口的边界。",
    ),
    createCheck(
      "no-exploit-script",
      !existsSync(
        path.join(
          repositoryRoot,
          "tools/lab-scripts/infrastructure/kubernetes-rbac-audit/exploit.py",
        ),
      ),
      "Kubernetes RBAC 审计实验不应提供 exploit.py。",
    ),
    createCheck(
      "no-forbidden-runtime-capability",
      forbiddenRuntimeFragments.every(
        (fragment) => !safeRuntimeImplementation.includes(fragment),
      ),
      "专用服务不应发起外部请求、执行系统命令或调用集群 CLI。",
    ),
  );

  return {
    labKey: "infrastructure.kubernetes-rbac-audit",
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
      "本脚本只读取仓库内元数据、文档、实现和测试文件，并复用服务端固定绑定常量。",
      "本脚本不发起 HTTP 请求，不连接 Kubernetes 集群、云账户、IaC 后端或外部目标。",
      "最小权限计数只由固定虚构绑定的语义枚举确定性推导。",
      "本脚本不提供 exploit.py、清单下发、角色绑定或任何真实集群变更能力。",
    ],
  };
}

export function getKubernetesRbacAuditConsistencyVerificationPlan() {
  return {
    labKey: "infrastructure.kubernetes-rbac-audit",
    scope: "local-repository-only",
    expectedWebEntrypoints,
    expectedApiEntrypoints,
    expectedSignals,
    expectedScript:
      "tools/lab-scripts/infrastructure/kubernetes-rbac-audit/verify.ts",
    expectedDocuments: expectedDocs,
  };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const report = runKubernetesRbacAuditConsistencyVerification();

  console.log(JSON.stringify(report, null, 2));

  if (!report.ok) {
    process.exitCode = 1;
  }
}
