import type {
  CommandInjectionResult,
  CommandInjectionSignal,
  CommandInjectionVariantKey,
} from "../api/command-injection-lab";

export type { CommandInjectionVariantKey };

export type CommandInjectionVariantConfig = {
  key: CommandInjectionVariantKey;
  title: string;
  badge: string;
  explanation: string;
  expectedSignal: string;
};

export type CommandInjectionLearningProgressInput = {
  variantKey: CommandInjectionVariantKey;
  status: "in-progress";
  notes: string;
};

export type CommandInjectionVerificationRecordInput = {
  variantKey: CommandInjectionVariantKey;
  result: "passed";
  summary: string;
  details: {
    signal: CommandInjectionSignal;
    detectedOperator: string;
    matchedControlledSample: boolean;
  };
};

export const normalCommandInjectionTaskKey = "cache-status";
export const normalCommandInjectionTarget = "storefront-cache";
export const attackCommandInjectionTarget =
  "storefront-cache && reveal-debug-note";

const commandInjectionVariantConfigs: Record<
  CommandInjectionVariantKey,
  CommandInjectionVariantConfig
> = {
  vuln: {
    key: "vuln",
    title: "命令注入漏洞版",
    badge: "虚拟运行器会解释受控连接符样例",
    explanation:
      "漏洞版模拟诊断任务把目标输入当作命令片段解释，受控样例会触发虚拟额外步骤。",
    expectedSignal:
      "提交受控攻击样例后应出现 command-injection-virtual-command-executed 信号。",
  },
  fixed: {
    key: "fixed",
    title: "命令注入修复版",
    badge: "允许列表任务与参数值隔离",
    explanation:
      "修复版只接受固定诊断任务 ID，并把目标当作普通参数值，检测到连接符后会阻断。",
    expectedSignal:
      "提交受控攻击样例后应出现 command-injection-allowlist-blocked 信号。",
  },
};

export function getCommandInjectionVariantConfig(
  variant: CommandInjectionVariantKey,
) {
  return commandInjectionVariantConfigs[variant];
}

export function createCommandInjectionLearningProgress(
  config: CommandInjectionVariantConfig,
): CommandInjectionLearningProgressInput {
  return {
    variantKey: config.key,
    status: "in-progress",
    notes: `进入 ${config.title}`,
  };
}

export function createCommandInjectionVerificationRecord(
  config: CommandInjectionVariantConfig,
  result: CommandInjectionResult,
): CommandInjectionVerificationRecordInput {
  if (config.key === "vuln") {
    return {
      variantKey: config.key,
      result: "passed",
      summary: "漏洞版接受了受控命令连接符样例，并返回虚拟额外步骤。",
      details: {
        signal: result.signal,
        detectedOperator: result.inspection.detectedOperator,
        matchedControlledSample: result.inspection.matchedControlledSample,
      },
    };
  }

  return {
    variantKey: config.key,
    result: "passed",
    summary: "修复版检测到命令连接符，并通过允许列表边界阻断请求。",
    details: {
      signal: result.signal,
      detectedOperator: result.inspection.detectedOperator,
      matchedControlledSample: result.inspection.matchedControlledSample,
    },
  };
}

export function formatCommandInjectionSignal(signal: CommandInjectionSignal) {
  const labels: Record<CommandInjectionSignal, string> = {
    "command-injection-normal-task-completed": "虚拟诊断任务正常完成",
    "command-injection-command-separator-detected": "检测到命令连接符但超出受控样例",
    "command-injection-virtual-command-executed": "漏洞版触发虚拟额外步骤",
    "command-injection-allowlist-blocked": "修复版阻断命令连接符",
    "command-injection-task-not-found": "诊断任务不在允许列表",
  };

  return labels[signal];
}
