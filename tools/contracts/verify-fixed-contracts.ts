/**
 * 前后端固定契约一致性验证器（LT-046）
 *
 * 背景：78 个专项 verify.ts 均把前端与服务端源码拼接为单个字符串，再断言
 * "某固定 key 片段是否出现"。当前端写错 key 而服务端写对时，拼接串里仍然
 * 包含正确值，断言照样通过。LT-042 的 kubernetes-rbac-audit 因此带着四处
 * 前后端 key 不一致通过了全部门禁，漏洞版在浏览器中始终被脱敏阻断。
 *
 * 本验证器不做文本包含检查，而是同时 import 前端 labs 模块与服务端服务模块，
 * 取出真实运行时值逐一比对：
 *   1. scenarioKey 常量必须严格相等；
 *   2. 前端 recommendedPath / normalPath 的每个 optionKey 必须是服务端状态机
 *      中真实注册的选项；
 *   3. 前端每条路径必须能在服务端状态机上走通并抵达终止步骤。
 *
 * 第 3 条是最强断言：它等价于"页面按推荐路径提交后不会被脱敏阻断"，正是
 * LT-042 缺陷的直接表现。
 *
 * 本脚本只读取仓库内模块并在内存中求值，不发起 HTTP 请求，不连接数据库，
 * 不执行系统命令，不读取任何凭据。
 */

import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const scriptFilePath = fileURLToPath(import.meta.url);
const repositoryRoot = path.resolve(path.dirname(scriptFilePath), "..", "..");

export type ContractPairing = {
  /** 实验 id，仅用于报告可读性 */
  labKey: string;
  /** 前端 labs 模块相对路径 */
  webModule: string;
  /** 服务端服务模块相对路径 */
  serverModule: string;
  /** 导出名共同前缀，例如 kubernetesRbacAudit */
  exportPrefix: string;
  /**
   * 服务端评估函数名。存在时用它把前端路径真实走一遍，验证不会被阻断。
   * 缺省表示该实验未提供两步状态机评估入口，只做 key 相等比对。
   */
  serviceFactory?: string;
};

/**
 * 参与契约比对的实验清单。
 *
 * 只登记"前端导出了 recommendedPath 或 normalPath"的实验——这类实验才存在
 * 前端自行拼装提交路径的风险。其余实验的决策 key 全部由服务端工作台响应
 * 驱动，前端不持有独立副本，不存在同类漂移空间。
 */
export const contractPairings: readonly ContractPairing[] = Object.freeze([
  {
    labKey: "infrastructure.iam-policy-audit",
    webModule: "apps/web/src/labs/iam-policy-audit.ts",
    serverModule: "apps/server/src/services/iam-policy-audit-lab.ts",
    exportPrefix: "iamPolicyAudit",
    serviceFactory: "createIamPolicyAuditLabService",
  },
  {
    labKey: "infrastructure.kubernetes-rbac-audit",
    webModule: "apps/web/src/labs/kubernetes-rbac-audit.ts",
    serverModule: "apps/server/src/services/kubernetes-rbac-audit-lab.ts",
    exportPrefix: "kubernetesRbacAudit",
    serviceFactory: "createKubernetesRbacAuditLabService",
  },
  {
    labKey: "api.rate-limit-idempotency",
    webModule: "apps/web/src/labs/rate-limit-idempotency.ts",
    serverModule: "apps/server/src/services/rate-limit-idempotency-lab.ts",
    exportPrefix: "rateLimitIdempotency",
    serviceFactory: "createRateLimitIdempotencyLabService",
  },
  {
    labKey: "host.persistence-triage",
    webModule: "apps/web/src/labs/persistence-triage.ts",
    serverModule: "apps/server/src/services/persistence-triage-lab.ts",
    exportPrefix: "persistenceTriage",
    serviceFactory: "createPersistenceTriageLabService",
  },
  {
    labKey: "host.service-permission-audit",
    webModule: "apps/web/src/labs/service-permission-audit.ts",
    serverModule: "apps/server/src/services/service-permission-audit-lab.ts",
    exportPrefix: "servicePermissionAudit",
    serviceFactory: "createServicePermissionAuditLabService",
  },
  {
    labKey: "detection.rule-alert-triage",
    webModule: "apps/web/src/labs/rule-alert-triage.ts",
    serverModule: "apps/server/src/services/rule-alert-triage-lab.ts",
    exportPrefix: "ruleAlertTriage",
    serviceFactory: "createRuleAlertTriageLabService",
  },
  {
    labKey: "client.mitb",
    webModule: "apps/web/src/labs/mitb-transaction.ts",
    serverModule: "apps/server/src/services/mitb-transaction-lab.ts",
    exportPrefix: "mitbTransaction",
    serviceFactory: "createMitbTransactionLabService",
  },
  {
    labKey: "api.functional-authorization",
    webModule: "apps/web/src/labs/bfla.ts",
    serverModule: "apps/server/src/services/bfla-lab.ts",
    exportPrefix: "bfla",
    serviceFactory: "createBflaLabService",
  },
  {
    labKey: "business-logic.workflow-bypass",
    webModule: "apps/web/src/labs/workflow-bypass.ts",
    serverModule: "apps/server/src/services/workflow-bypass-lab.ts",
    exportPrefix: "workflowBypass",
    serviceFactory: "createWorkflowBypassLabService",
  },
  {
    labKey: "crypto.insecure-randomness",
    webModule: "apps/web/src/labs/insecure-randomness.ts",
    serverModule: "apps/server/src/services/insecure-randomness-lab.ts",
    exportPrefix: "insecureRandomness",
    serviceFactory: "createInsecureRandomnessLabService",
  },
  {
    labKey: "web.clickjacking",
    webModule: "apps/web/src/labs/clickjacking.ts",
    serverModule: "apps/server/src/services/clickjacking-lab.ts",
    exportPrefix: "clickjacking",
    serviceFactory: "createClickjackingLabService",
  },
  {
    labKey: "web.open-redirect",
    webModule: "apps/web/src/labs/open-redirect.ts",
    serverModule: "apps/server/src/services/open-redirect-lab.ts",
    exportPrefix: "openRedirect",
    serviceFactory: "createOpenRedirectLabService",
  },
  {
    labKey: "auth.credential-stuffing",
    webModule: "apps/web/src/labs/credential-stuffing.ts",
    serverModule: "apps/server/src/services/credential-stuffing-lab.ts",
    exportPrefix: "credentialStuffing",
    serviceFactory: "createCredentialStuffingLabService",
  },
  {
    labKey: "auth.session-hijacking",
    webModule: "apps/web/src/labs/session-hijacking.ts",
    serverModule: "apps/server/src/services/session-hijacking-lab.ts",
    exportPrefix: "sessionHijacking",
    serviceFactory: "createSessionHijackingLabService",
  },
  {
    labKey: "auth.oauth",
    webModule: "apps/web/src/labs/oauth.ts",
    serverModule: "apps/server/src/services/oauth-lab.ts",
    exportPrefix: "oauth",
    serviceFactory: "createOauthLabService",
  },
  {
    labKey: "client.formjacking",
    webModule: "apps/web/src/labs/formjacking.ts",
    serverModule: "apps/server/src/services/formjacking-lab.ts",
    exportPrefix: "formjacking",
    serviceFactory: "createFormjackingLabService",
  },
  {
    labKey: "malware.ransomware",
    webModule: "apps/web/src/labs/ransomware.ts",
    serverModule: "apps/server/src/services/ransomware-lab.ts",
    exportPrefix: "ransomware",
    serviceFactory: "createRansomwareLabService",
  },
]);

export type ContractCheck = {
  labKey: string;
  key: string;
  passed: boolean;
  message: string;
};

export type ContractReport = {
  scope: "local-repository-only";
  ok: boolean;
  pairingCount: number;
  checkedPairings: string[];
  checks: ContractCheck[];
  notes: string[];
};

function createCheck(
  labKey: string,
  key: string,
  passed: boolean,
  message: string,
): ContractCheck {
  return { labKey, key, passed, message };
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

async function importModule(relativePath: string) {
  const absolute = path.join(repositoryRoot, relativePath);

  if (!existsSync(absolute)) {
    return { ok: false as const, error: `module not found: ${relativePath}` };
  }

  try {
    const mod = (await import(pathToFileURL(absolute).href)) as Record<
      string,
      unknown
    >;
    return { ok: true as const, mod };
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return { ok: false as const, error: `import failed: ${detail}` };
  }
}

/**
 * 从服务端第二版状态机定义中收集全部注册 optionKey。
 *
 * 服务端定义未直接导出，因此通过工作台响应读取——工作台返回的 cases[].steps[]
 * 就是状态机的真实结构，与 evaluate 使用同一份定义，不存在第二份副本。
 */
function collectRegisteredOptionKeys(workbench: unknown): Set<string> {
  const keys = new Set<string>();
  const cases = (workbench as { cases?: unknown })?.cases;

  if (!Array.isArray(cases)) {
    return keys;
  }

  for (const singleCase of cases) {
    const steps = (singleCase as { steps?: unknown })?.steps;
    if (!Array.isArray(steps)) {
      continue;
    }
    for (const step of steps) {
      const options = (step as { options?: unknown })?.options;
      if (!Array.isArray(options)) {
        continue;
      }
      for (const option of options) {
        const key = (option as { key?: unknown })?.key;
        if (typeof key === "string") {
          keys.add(key);
        }
      }
    }
  }

  return keys;
}

/**
 * 收集服务端状态机中登记的全部信号，含中间步骤信号。
 *
 * 只看服务端导出的 *Signal 常量是不够的：那些只是三个 canonical 终止信号，
 * 而中间步骤信号（如 -cluster-wide-accepted）只出现在 option.signal 上。
 * LT-042 的第五处缺陷恰好在中间步骤信号的前端标签上，因此必须从工作台采集。
 */
function collectRegisteredSignals(workbench: unknown): Set<string> {
  const signals = new Set<string>();
  const cases = (workbench as { cases?: unknown })?.cases;

  if (!Array.isArray(cases)) {
    return signals;
  }

  for (const singleCase of cases) {
    const steps = (singleCase as { steps?: unknown })?.steps;
    if (!Array.isArray(steps)) {
      continue;
    }
    for (const step of steps) {
      const options = (step as { options?: unknown })?.options;
      if (!Array.isArray(options)) {
        continue;
      }
      for (const option of options) {
        const signal = (option as { signal?: unknown })?.signal;
        if (typeof signal === "string" && signal.length > 0) {
          signals.add(signal);
        }
      }
    }
  }

  return signals;
}

function readWebPaths(
  webMod: Record<string, unknown>,
  prefix: string,
): { name: string; decisions: string[] }[] {
  const paths: { name: string; decisions: string[] }[] = [];

  // 变体配置里的 recommendedPath 由 getXxxVariantConfig 暴露
  const getConfig = webMod[`get${capitalize(prefix)}VariantConfig`];
  if (typeof getConfig === "function") {
    for (const variant of ["vuln", "fixed"]) {
      try {
        const config = (getConfig as (v: string) => unknown)(variant);
        const decisions = (config as { recommendedPath?: unknown })
          ?.recommendedPath;
        if (Array.isArray(decisions) && decisions.every((d) => typeof d === "string")) {
          paths.push({
            name: `${variant}.recommendedPath`,
            decisions: decisions as string[],
          });
        }
      } catch {
        // 变体不存在时跳过；缺失会由 scenarioKey 检查侧面暴露
      }
    }
  }

  const normalPath = webMod[`${prefix}NormalPath`];
  if (Array.isArray(normalPath) && normalPath.every((d) => typeof d === "string")) {
    paths.push({ name: "normalPath", decisions: normalPath as string[] });
  }

  return paths;
}

export async function runFixedContractVerification(): Promise<ContractReport> {
  const checks: ContractCheck[] = [];
  const checkedPairings: string[] = [];

  for (const pairing of contractPairings) {
    checkedPairings.push(pairing.labKey);

    const webImport = await importModule(pairing.webModule);
    const serverImport = await importModule(pairing.serverModule);

    checks.push(
      createCheck(
        pairing.labKey,
        "modules-importable",
        webImport.ok && serverImport.ok,
        webImport.ok && serverImport.ok
          ? "前端 labs 模块与服务端服务模块均可导入。"
          : [
              webImport.ok ? "" : `web: ${webImport.error}`,
              serverImport.ok ? "" : `server: ${serverImport.error}`,
            ]
              .filter(Boolean)
              .join("; "),
      ),
    );

    if (!webImport.ok || !serverImport.ok) {
      continue;
    }

    const webMod = webImport.mod;
    const serverMod = serverImport.mod;
    const scenarioExport = `${pairing.exportPrefix}ScenarioKey`;
    const webScenario = webMod[scenarioExport];
    const serverScenario = serverMod[scenarioExport];

    // 检查一：scenarioKey 必须严格相等。LT-042 的首要错误正是此项。
    checks.push(
      createCheck(
        pairing.labKey,
        "scenario-key-equal",
        typeof webScenario === "string" &&
          typeof serverScenario === "string" &&
          webScenario === serverScenario,
        typeof webScenario !== "string" || typeof serverScenario !== "string"
          ? `${scenarioExport} 未在两侧同时导出为字符串（web=${String(webScenario)}, server=${String(serverScenario)}）。`
          : webScenario === serverScenario
            ? `scenarioKey 两侧一致：${webScenario}`
            : `scenarioKey 不一致：web=${webScenario} server=${serverScenario}`,
      ),
    );


    if (!pairing.serviceFactory) {
      continue;
    }

    const factory = serverMod[pairing.serviceFactory];
    if (typeof factory !== "function") {
      checks.push(
        createCheck(
          pairing.labKey,
          "service-factory-present",
          false,
          `服务端未导出 ${pairing.serviceFactory}。`,
        ),
      );
      continue;
    }

    const service = (factory as () => unknown)();
    const workbench = (
      service as { getWorkbench: () => unknown }
    ).getWorkbench();
    const registered = collectRegisteredOptionKeys(workbench);
    const webPaths = readWebPaths(webMod, pairing.exportPrefix);

    // 检查：服务端注册的每个信号（含中间步骤）都必须有前端中文标签。
    //
    // 覆盖 scenarioKey 与 optionKey 检查都抓不到的一类漂移：前端 formatSignal
    // 的标签键写错时，页面会把原始信号串直接显示给学习者。LT-042 的第五处缺陷
    // 正是此类——前端写 -wildcard-accepted，服务端注册 -cluster-wide-accepted。
    //
    // 判定方式是调用前端 formatSignal：约定未登记的信号原样返回，因此返回值
    // 等于入参即说明标签缺失或拼错。不读取标签表内部形态，只依赖这一约定。
    const formatSignalExport = `format${capitalize(pairing.exportPrefix)}Signal`;
    const formatSignal = webMod[formatSignalExport];
    const registeredSignals = [...collectRegisteredSignals(workbench)].sort();

    if (typeof formatSignal === "function" && registeredSignals.length > 0) {
      const unlabeled = registeredSignals.filter(
        (signal) =>
          (formatSignal as (value: string) => string)(signal) === signal,
      );

      checks.push(
        createCheck(
          pairing.labKey,
          "registered-signals-labeled",
          unlabeled.length === 0,
          unlabeled.length === 0
            ? `${registeredSignals.length} 个服务端注册信号均有前端标签。`
            : `前端缺少标签（页面将显示原始信号串）：${unlabeled.join(", ")}`,
        ),
      );
    }

    checks.push(
      createCheck(
        pairing.labKey,
        "web-paths-present",
        webPaths.length > 0,
        webPaths.length > 0
          ? `前端登记 ${webPaths.length} 条固定路径。`
          : "前端未导出可比对的 recommendedPath 或 normalPath。",
      ),
    );

    // 检查二：前端路径里的每个 optionKey 必须是服务端真实注册的选项
    for (const webPath of webPaths) {
      const unknownKeys = webPath.decisions.filter((d) => !registered.has(d));
      checks.push(
        createCheck(
          pairing.labKey,
          `option-keys-registered:${webPath.name}`,
          unknownKeys.length === 0,
          unknownKeys.length === 0
            ? `${webPath.name} 的 ${webPath.decisions.length} 个 optionKey 均已在服务端注册。`
            : `${webPath.name} 含服务端未注册的 optionKey：${unknownKeys.join(", ")}`,
        ),
      );
    }

    // 检查三：前端路径必须能在服务端真实走通而不被阻断
    const scenarioKeyForEval =
      typeof serverScenario === "string" ? serverScenario : "";
    for (const webPath of webPaths) {
      const variantKey = webPath.name.startsWith("vuln") ? "vuln" : "fixed";
      let outcome: string;
      let passed: boolean;

      try {
        const result = (
          service as {
            evaluate: (input: {
              variantKey: string;
              scenarioKey: string;
              decisions: string[];
            }) => Record<string, unknown>;
          }
        ).evaluate({
          variantKey,
          scenarioKey: scenarioKeyForEval,
          decisions: webPath.decisions,
        });

        const blockedReason = result.blockedReason;
        const completed = result.completed === true;
        // 未登记输入会被脱敏阻断并返回 boundary 类 blockedReason；
        // 防御路径的正常阻断带 completed=true，不应误判为失败。
        const boundaryBlocked =
          typeof blockedReason === "string" &&
          [
            "scenario-not-allowed",
            "decisions-required",
            "decisions-after-terminal",
            "path-incomplete",
            "registered-summary-missing",
          ].includes(blockedReason);

        passed = completed && !boundaryBlocked;
        outcome = passed
          ? `路径走通，terminalOutcome=${String(
              (result.recap as { terminalOutcome?: unknown })?.terminalOutcome,
            )}`
          : `路径被阻断：completed=${String(completed)} blockedReason=${String(blockedReason)}`;
      } catch (error) {
        passed = false;
        outcome = `评估抛错：${error instanceof Error ? error.message : String(error)}`;
      }

      checks.push(
        createCheck(
          pairing.labKey,
          `path-reaches-terminal:${webPath.name}`,
          passed,
          outcome,
        ),
      );
    }
  }

  return {
    scope: "local-repository-only",
    ok: checks.every((check) => check.passed),
    pairingCount: contractPairings.length,
    checkedPairings,
    checks,
    notes: [
      "本验证器同时导入前端 labs 模块与服务端服务模块，比对真实运行时值，不做文本包含检查。",
      "path-reaches-terminal 等价于断言页面按固定路径提交后不会被服务端脱敏阻断。",
      "只登记导出 recommendedPath / normalPath 的实验；其余实验的决策 key 完全由服务端工作台响应驱动，前端不持有独立副本。",
      "本脚本不发起 HTTP 请求、不连接数据库、不执行系统命令、不读取任何凭据。",
    ],
  };
}

async function main() {
  const report = await runFixedContractVerification();
  const failed = report.checks.filter((check) => !check.passed);

  console.log(
    JSON.stringify(
      {
        scope: report.scope,
        ok: report.ok,
        pairingCount: report.pairingCount,
        checkCount: report.checks.length,
        failedCount: failed.length,
        failed,
        notes: report.notes,
      },
      null,
      2,
    ),
  );

  if (!report.ok) {
    process.exitCode = 1;
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  void main();
}
