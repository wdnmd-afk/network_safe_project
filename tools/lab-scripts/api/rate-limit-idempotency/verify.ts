import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  assessFixedWebhookBatch,
  fixedWebhookBatchSnapshots,
} from "../../../../apps/server/src/services/rate-limit-idempotency-lab.js";
import {
  parseLabMetadataJson,
  validateLabMetadata,
  type LabMetadata,
} from "../../../../packages/shared/src/lab-metadata.js";

export type RateLimitIdempotencyConsistencyCheck = {
  key: string;
  passed: boolean;
  message: string;
};

export type RateLimitIdempotencyConsistencyReport = {
  labKey: "api.rate-limit-idempotency";
  scope: "local-repository-only";
  ok: boolean;
  checkedFiles: string[];
  checks: RateLimitIdempotencyConsistencyCheck[];
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
  "/labs/api/rate-limit-idempotency/vuln",
  "/labs/api/rate-limit-idempotency/fixed",
];

const expectedApiEntrypoints = [
  "/api/labs/api/rate-limit-idempotency/workbench",
  "/api/labs/api/rate-limit-idempotency/vuln/evaluate",
  "/api/labs/api/rate-limit-idempotency/fixed/evaluate",
];

const expectedServerRoutes = [
  "/api/labs/api/rate-limit-idempotency/workbench",
  "/api/labs/api/rate-limit-idempotency/:variant/evaluate",
];

const expectedSignals = [
  "api-rate-limit-idempotency-risk-accepted",
  "api-rate-limit-idempotency-defense-blocked",
  "api-rate-limit-idempotency-normal-verified",
];

const expectedDocs = [
  "labs/api/rate-limit-idempotency/README.md",
  "labs/api/rate-limit-idempotency/vuln/README.md",
  "labs/api/rate-limit-idempotency/fixed/README.md",
  "labs/api/rate-limit-idempotency/mock/README.md",
  "labs/api/rate-limit-idempotency/docs/attack-steps.md",
  "labs/api/rate-limit-idempotency/docs/fix-notes.md",
  "labs/api/rate-limit-idempotency/docs/manual-verification.md",
  "tools/lab-scripts/api/rate-limit-idempotency/README.md",
];

const implementationFiles = [
  "apps/server/src/services/rate-limit-idempotency-lab.ts",
  "apps/server/src/app.ts",
  "apps/web/src/api/rate-limit-idempotency-lab.ts",
  "apps/web/src/labs/rate-limit-idempotency.ts",
  "apps/web/src/router/routes.ts",
  "apps/web/src/views/RateLimitIdempotencyLabView.vue",
];

const testFiles = [
  "apps/server/tests/rate-limit-idempotency-lab.test.ts",
  "apps/web/tests/router.test.ts",
];

const requiredContractFragments = [
  "fixed-webhook-batch-quota-audit",
  "accept-unthrottled-replayable-batch",
  "enforce-quota-and-idempotency",
  "approve-overload-and-replay",
  "block-overload-and-replay",
  "verify-throttled-baseline",
  ...expectedSignals,
];

// 四要素语义枚举必须成对出现在实现与文档中，避免退化为真实网关配置
const requiredScopeFragments = [
  "virtual-unthrottled-replayable-batch",
  "virtual-quota-idempotent-batch",
  "unlimited",
  "windowed-quota",
  "idempotency-key-required",
  "signed-window",
  "throttle-then-degrade",
];

// 只扫描真实运行能力片段；实现中的"不调用"边界声明不应被误判
const forbiddenRuntimeFragments = [
  "node:" + "child_process",
  "child_" + "process",
  "http." + "request(",
  "https." + "request(",
  "exec(",
  "spawn(",
  "fetch(",
  "setInterval(",
];

function loadRepositoryText(relativePath: string) {
  return readFileSync(path.join(repositoryRoot, relativePath), "utf8");
}

function createCheck(
  key: string,
  passed: boolean,
  message: string,
): RateLimitIdempotencyConsistencyCheck {
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

export function runRateLimitIdempotencyConsistencyVerification(): RateLimitIdempotencyConsistencyReport {
  const checks: RateLimitIdempotencyConsistencyCheck[] = [];
  const metadataPath = "labs/api/rate-limit-idempotency/meta.json";
  const metadataText = loadRepositoryText(metadataPath);
  const parsedMetadata = parseLabMetadataJson(metadataText);

  checks.push(
    createCheck(
      "metadata-json-parse",
      parsedMetadata.ok,
      parsedMetadata.ok
        ? "API 配额与幂等审计元数据 JSON 可解析。"
        : parsedMetadata.errors.join("; "),
    ),
  );

  if (!parsedMetadata.ok) {
    return {
      labKey: "api.rate-limit-idempotency",
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
        ? "API 配额与幂等审计元数据符合共享结构校验。"
        : validationResult.errors.join("; "),
    ),
  );

  if (!validationResult.ok) {
    return {
      labKey: "api.rate-limit-idempotency",
      scope: "local-repository-only",
      ok: false,
      checkedFiles: [metadataPath],
      checks,
      notes: ["元数据结构未通过校验，后续一致性检查已停止。"],
    };
  }

  const metadata = validationResult.value;
  const unthrottledBatch = fixedWebhookBatchSnapshots.find(
    (batch) => batch.batchKey === "virtual-unthrottled-replayable-batch",
  );
  const hardenedBatch = fixedWebhookBatchSnapshots.find(
    (batch) => batch.batchKey === "virtual-quota-idempotent-batch",
  );
  const unthrottledAssessment = unthrottledBatch
    ? assessFixedWebhookBatch(unthrottledBatch)
    : undefined;
  const hardenedAssessment = hardenedBatch
    ? assessFixedWebhookBatch(hardenedBatch)
    : undefined;
  const scriptPath = "tools/lab-scripts/api/rate-limit-idempotency/verify.ts";
  const scriptEntrypoint = getScriptEntrypoint(metadata);
  const combinedDocs = expectedDocs
    .map((relativePath) => loadRepositoryText(relativePath))
    .join("\n");
  const combinedImplementation = implementationFiles
    .map((relativePath) => loadRepositoryText(relativePath))
    .join("\n");
  const safeRuntimeImplementation = loadRepositoryText(
    "apps/server/src/services/rate-limit-idempotency-lab.ts",
  );
  const serverRoutes = loadRepositoryText("apps/server/src/app.ts");
  const webRoutes = loadRepositoryText("apps/web/src/router/routes.ts");

  checks.push(
    createCheck(
      "metadata-basic-state",
      metadata.id === "api.rate-limit-idempotency" &&
        metadata.category === "api" &&
        metadata.mode === "simulation" &&
        (metadata.status === "in-progress" || metadata.status === "ready"),
      "元数据应保持 api.rate-limit-idempotency / api / simulation，并仅在命令门禁后推进 ready。",
    ),
    createCheck(
      "fixed-batch-shape",
      fixedWebhookBatchSnapshots.length === 2 &&
        unthrottledBatch?.expectedPosture === "vulnerable" &&
        unthrottledBatch.quotaScope === "unlimited" &&
        unthrottledBatch.idempotencyScope === "none" &&
        unthrottledBatch.replayProcessedTwice === true &&
        hardenedBatch?.expectedPosture === "hardened" &&
        hardenedBatch.quotaScope === "windowed-quota" &&
        hardenedBatch.idempotencyScope === "idempotency-key-required" &&
        hardenedBatch.replayProcessedTwice === false,
      "固定批次快照应保持两份虚构基线，并锁定配额、幂等、时间戳与重放语义。",
    ),
    createCheck(
      "fixed-virtual-identifiers",
      fixedWebhookBatchSnapshots.every((batch) =>
        batch.batchKey.startsWith("virtual-"),
      ),
      "固定批次标识应统一使用 virtual- 前缀，不含真实端点、密钥或事件 ID。",
    ),
    createCheck(
      "fixed-audit-counts",
      unthrottledAssessment?.findingCount === 4 &&
        unthrottledAssessment.criticalFindingCount === 2 &&
        unthrottledAssessment.resourceControlCount === 0 &&
        hardenedAssessment?.findingCount === 0 &&
        hardenedAssessment.criticalFindingCount === 0 &&
        hardenedAssessment.resourceControlCount === 4,
      "无限流与加固批次的固定发现、关键风险和资源控制计数应保持锁定值。",
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
      scriptEntrypoint?.key === "api-rate-limit-idempotency-verify" &&
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
          "apps/server/tests/rate-limit-idempotency-lab.test.ts" &&
        metadata.verification.automation.scriptVerification?.enabled === true &&
        hasExactValues(
          metadata.verification.automation.scriptVerification.scriptKeys,
          ["api-rate-limit-idempotency-verify"],
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
      "固定批次与四要素语义枚举应在实现与文档中保持一致。",
    ),
    createCheck(
      "safe-boundary-documented",
      ["固定", "脱敏阻断", "不发起", "真实", "虚构"].every((phrase) =>
        combinedDocs.includes(phrase),
      ),
      "文档应声明固定虚构数据、未知 key 脱敏阻断和不发起真实并发请求的边界。",
    ),
    createCheck(
      "no-exploit-script",
      !existsSync(
        path.join(
          repositoryRoot,
          "tools/lab-scripts/api/rate-limit-idempotency/exploit.py",
        ),
      ),
      "API 配额与幂等审计实验不应提供 exploit.py。",
    ),
    createCheck(
      "no-forbidden-runtime-capability",
      forbiddenRuntimeFragments.every(
        (fragment) => !safeRuntimeImplementation.includes(fragment),
      ),
      "专用服务不应发起外部请求、执行系统命令或启动真实定时批次。",
    ),
  );

  return {
    labKey: "api.rate-limit-idempotency",
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
      "本脚本只读取仓库内元数据、文档、实现和测试文件，并复用服务端固定批次常量。",
      "本脚本不发起 HTTP 请求，不连接真实 Webhook 端点、消息队列、API 网关或外部目标。",
      "配额与幂等计数只由固定虚构批次的语义枚举确定性推导。",
      "本脚本不提供 exploit.py、批量请求器、压测器或事件重放工具。",
    ],
  };
}

export function getRateLimitIdempotencyConsistencyVerificationPlan() {
  return {
    labKey: "api.rate-limit-idempotency",
    scope: "local-repository-only",
    expectedWebEntrypoints,
    expectedApiEntrypoints,
    expectedSignals,
    expectedScript: "tools/lab-scripts/api/rate-limit-idempotency/verify.ts",
    expectedDocuments: expectedDocs,
  };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const report = runRateLimitIdempotencyConsistencyVerification();

  console.log(JSON.stringify(report, null, 2));

  if (!report.ok) {
    process.exitCode = 1;
  }
}
