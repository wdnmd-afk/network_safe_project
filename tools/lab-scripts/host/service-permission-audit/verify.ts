import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  assessFixedServicePermissionProfile,
  fixedServicePermissionProfiles,
} from "../../../../apps/server/src/services/service-permission-audit-lab.js";
import {
  parseLabMetadataJson,
  validateLabMetadata,
  type LabMetadata,
} from "../../../../packages/shared/src/lab-metadata.js";

export type ServicePermissionAuditConsistencyCheck = {
  key: string;
  passed: boolean;
  message: string;
};

export type ServicePermissionAuditConsistencyReport = {
  labKey: "host.service-permission-audit";
  scope: "local-repository-only";
  ok: boolean;
  checkedFiles: string[];
  checks: ServicePermissionAuditConsistencyCheck[];
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
  "/labs/host/service-permission-audit/vuln",
  "/labs/host/service-permission-audit/fixed",
];

const expectedApiEntrypoints = [
  "/api/labs/host/service-permission-audit/workbench",
  "/api/labs/host/service-permission-audit/vuln/evaluate",
  "/api/labs/host/service-permission-audit/fixed/evaluate",
];

const expectedServerRoutes = [
  "/api/labs/host/service-permission-audit/workbench",
  "/api/labs/host/service-permission-audit/:variant/evaluate",
];

const expectedSignals = [
  "host-service-permission-audit-risk-accepted",
  "host-service-permission-audit-defense-blocked",
  "host-service-permission-audit-normal-verified",
];

const expectedDocs = [
  "labs/host/service-permission-audit/README.md",
  "labs/host/service-permission-audit/vuln/README.md",
  "labs/host/service-permission-audit/fixed/README.md",
  "labs/host/service-permission-audit/mock/README.md",
  "labs/host/service-permission-audit/docs/attack-steps.md",
  "labs/host/service-permission-audit/docs/fix-notes.md",
  "labs/host/service-permission-audit/docs/manual-verification.md",
  "tools/lab-scripts/host/service-permission-audit/README.md",
];

const implementationFiles = [
  "apps/server/src/services/service-permission-audit-lab.ts",
  "apps/server/src/services/lab-metadata-sync.ts",
  "apps/server/src/app.ts",
  "apps/web/src/api/service-permission-audit-lab.ts",
  "apps/web/src/labs/service-permission-audit.ts",
  "apps/web/src/labs/platform-status.ts",
  "apps/web/src/router/routes.ts",
  "apps/web/src/views/ServicePermissionAuditLabView.vue",
  "apps/web/src/views/LabsView.vue",
];

const testFiles = [
  "apps/server/tests/service-permission-audit-lab.test.ts",
  "apps/web/tests/router.test.ts",
];

const requiredContractFragments = [
  "fixed-windows-service-permission-audit",
  "accept-user-writable-unquoted-path",
  "harden-path-and-service-acl",
  "allow-unprivileged-service-replacement",
  "block-unprivileged-service-modification",
  "verify-hardened-service-baseline",
  ...expectedSignals,
];

// 固定 ACL 语义枚举必须成对出现在实现与文档中，避免退化为真实 SDDL / SID 描述
const requiredAclFragments = [
  "virtual-update-service-risky",
  "virtual-update-service-hardened",
  "virtual-local-system",
  "virtual-service-account",
  "users-write",
  "administrators-write",
  "system-only",
  "users-change",
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
): ServicePermissionAuditConsistencyCheck {
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

export function runServicePermissionAuditConsistencyVerification(): ServicePermissionAuditConsistencyReport {
  const checks: ServicePermissionAuditConsistencyCheck[] = [];
  const metadataPath = "labs/host/service-permission-audit/meta.json";
  const metadataText = loadRepositoryText(metadataPath);
  const parsedMetadata = parseLabMetadataJson(metadataText);

  checks.push(
    createCheck(
      "metadata-json-parse",
      parsedMetadata.ok,
      parsedMetadata.ok
        ? "服务权限审计元数据 JSON 可解析。"
        : parsedMetadata.errors.join("; "),
    ),
  );

  if (!parsedMetadata.ok) {
    return {
      labKey: "host.service-permission-audit",
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
        ? "服务权限审计元数据符合共享结构校验。"
        : validationResult.errors.join("; "),
    ),
  );

  if (!validationResult.ok) {
    return {
      labKey: "host.service-permission-audit",
      scope: "local-repository-only",
      ok: false,
      checkedFiles: [metadataPath],
      checks,
      notes: ["元数据结构未通过校验，后续一致性检查已停止。"],
    };
  }

  const metadata = validationResult.value;
  const riskyProfile = fixedServicePermissionProfiles.find(
    (profile) => profile.serviceKey === "virtual-update-service-risky",
  );
  const hardenedProfile = fixedServicePermissionProfiles.find(
    (profile) => profile.serviceKey === "virtual-update-service-hardened",
  );
  const riskyAssessment = riskyProfile
    ? assessFixedServicePermissionProfile(riskyProfile)
    : undefined;
  const hardenedAssessment = hardenedProfile
    ? assessFixedServicePermissionProfile(hardenedProfile)
    : undefined;
  const scriptPath =
    "tools/lab-scripts/host/service-permission-audit/verify.ts";
  const scriptEntrypoint = getScriptEntrypoint(metadata);
  const combinedDocs = expectedDocs
    .map((relativePath) => loadRepositoryText(relativePath))
    .join("\n");
  const combinedImplementation = implementationFiles
    .map((relativePath) => loadRepositoryText(relativePath))
    .join("\n");
  // 只对专用服务实现做危险能力扫描，避免误伤 app.ts 等通用运行时文件
  const safeRuntimeImplementation = loadRepositoryText(
    "apps/server/src/services/service-permission-audit-lab.ts",
  );
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
      metadata.id === "host.service-permission-audit" &&
        metadata.category === "host" &&
        metadata.mode === "simulation" &&
        (metadata.status === "in-progress" || metadata.status === "ready"),
      "元数据应保持 host.service-permission-audit / host / simulation，并仅在命令门禁后推进 ready。",
    ),
    createCheck(
      "fixed-profile-shape",
      fixedServicePermissionProfiles.length === 2 &&
        riskyProfile?.expectedPosture === "vulnerable" &&
        riskyProfile.pathQuoted === false &&
        riskyProfile.runAs === "virtual-local-system" &&
        hardenedProfile?.expectedPosture === "hardened" &&
        hardenedProfile.pathQuoted === true &&
        hardenedProfile.runAs === "virtual-service-account",
      "固定服务配置应保持两组虚构基线，并锁定运行身份与路径引号状态。",
    ),
    createCheck(
      "fixed-virtual-paths",
      fixedServicePermissionProfiles.every((profile) =>
        profile.executablePath.includes("C:\\LabVirtual\\"),
      ),
      "固定可执行路径应统一使用 C:\\LabVirtual 虚构前缀，不映射真实文件。",
    ),
    createCheck(
      "fixed-audit-counts",
      riskyAssessment?.findingCount === 4 &&
        riskyAssessment.criticalFindingCount === 2 &&
        riskyAssessment.hardenedControlCount === 0 &&
        hardenedAssessment?.findingCount === 0 &&
        hardenedAssessment.criticalFindingCount === 0 &&
        hardenedAssessment.hardenedControlCount === 4,
      "风险与加固配置的固定发现、关键发现和加固控制计数应保持锁定值。",
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
        ["host", "Windows 主机安全"].every((fragment) =>
          content.includes(fragment),
        ),
      ),
      "host 分类应接入数据库同步、实验列表和平台状态中文标签。",
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
      scriptEntrypoint?.key === "host-service-permission-audit-verify" &&
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
          "apps/server/tests/service-permission-audit-lab.test.ts" &&
        metadata.verification.automation.scriptVerification?.enabled === true &&
        hasExactValues(
          metadata.verification.automation.scriptVerification.scriptKeys,
          ["host-service-permission-audit-verify"],
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
      "fixed-acl-semantics",
      requiredAclFragments.every(
        (fragment) =>
          combinedImplementation.includes(fragment) &&
          combinedDocs.includes(fragment),
      ),
      "固定服务、运行身份和 ACL 语义枚举应在实现与文档中保持一致。",
    ),
    createCheck(
      "safe-boundary-documented",
      ["固定", "脱敏阻断", "不执行", "真实", "虚构"].every((phrase) =>
        combinedDocs.includes(phrase),
      ),
      "文档应声明固定虚构数据、未知 key 脱敏阻断和不执行真实主机操作的边界。",
    ),
    createCheck(
      "no-exploit-script",
      !existsSync(
        path.join(
          repositoryRoot,
          "tools/lab-scripts/host/service-permission-audit/exploit.py",
        ),
      ),
      "服务权限审计实验不应提供 exploit.py。",
    ),
    createCheck(
      "no-forbidden-runtime-capability",
      forbiddenRuntimeFragments.every(
        (fragment) => !safeRuntimeImplementation.includes(fragment),
      ),
      "专用服务不应读取文件系统、发起外部请求或执行系统命令。",
    ),
  );

  return {
    labKey: "host.service-permission-audit",
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
      "本脚本只读取仓库内元数据、文档、实现和测试文件，并复用服务端固定配置常量。",
      "本脚本不发起 HTTP 请求，不连接主机、服务控制管理器、注册表或外部目标。",
      "权限计数只由固定虚构配置的语义枚举确定性推导。",
      "本脚本不提供 exploit.py、服务替换、ACL 修改或任何真实处置能力。",
    ],
  };
}

export function getServicePermissionAuditConsistencyVerificationPlan() {
  return {
    labKey: "host.service-permission-audit",
    scope: "local-repository-only",
    expectedWebEntrypoints,
    expectedApiEntrypoints,
    expectedSignals,
    expectedScript:
      "tools/lab-scripts/host/service-permission-audit/verify.ts",
    expectedDocuments: expectedDocs,
  };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const report = runServicePermissionAuditConsistencyVerification();

  console.log(JSON.stringify(report, null, 2));

  if (!report.ok) {
    process.exitCode = 1;
  }
}
