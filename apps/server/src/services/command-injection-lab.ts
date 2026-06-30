export type CommandInjectionVariantKey = "vuln" | "fixed";

export type CommandInjectionTaskKey =
  | "cache-status"
  | "queue-depth"
  | "release-health";

export type CommandInjectionDetectedOperator =
  | "none"
  | "semicolon"
  | "and"
  | "or"
  | "pipe"
  | "redirect";

export type CommandInjectionSignal =
  | "command-injection-normal-task-completed"
  | "command-injection-command-separator-detected"
  | "command-injection-virtual-command-executed"
  | "command-injection-allowlist-blocked"
  | "command-injection-task-not-found";

export type CommandInjectionStatus = "ok" | "blocked" | "failed";

export type CommandInjectionInput = {
  userId: string;
  variantKey: CommandInjectionVariantKey;
  taskKey: string;
  target: string;
};

export type CommandInjectionInspection = {
  targetLength: number;
  containsCommandSeparator: boolean;
  detectedOperator: CommandInjectionDetectedOperator;
  matchedControlledSample: boolean;
  allowedTask: boolean;
};

export type CommandInjectionVirtualStep = {
  label: string;
  output: string;
  injected: boolean;
};

export type CommandInjectionResult = {
  status: CommandInjectionStatus;
  variantKey: CommandInjectionVariantKey;
  taskKey: string;
  target: string;
  inspection: CommandInjectionInspection;
  virtualSteps: CommandInjectionVirtualStep[];
  signal: CommandInjectionSignal;
  decision: "accepted" | "blocked" | "failed";
  message: string;
  nextStep: string;
  blockedReason?: string;
};

export type CommandInjectionLabService = {
  runDiagnostic(input: CommandInjectionInput): Promise<CommandInjectionResult>;
};

export const commandInjectionNormalTarget = "storefront-cache";
export const commandInjectionAttackTarget =
  "storefront-cache && reveal-debug-note";

const taskOutputs: Record<
  CommandInjectionTaskKey,
  {
    label: string;
    output: string;
  }
> = {
  "cache-status": {
    label: "缓存节点状态",
    output: "虚拟诊断：storefront-cache 节点在线，命中率 97%。",
  },
  "queue-depth": {
    label: "队列堆积",
    output: "虚拟诊断：order-events 队列当前堆积 12 条。",
  },
  "release-health": {
    label: "发布健康度",
    output: "虚拟诊断：release-2026-06-29 健康检查通过。",
  },
};

function isTaskKey(value: string): value is CommandInjectionTaskKey {
  return Object.hasOwn(taskOutputs, value);
}

function detectOperator(value: string): CommandInjectionDetectedOperator {
  if (value.includes("&&")) {
    return "and";
  }

  if (value.includes("||")) {
    return "or";
  }

  if (value.includes(";")) {
    return "semicolon";
  }

  if (value.includes("|")) {
    return "pipe";
  }

  if (value.includes(">") || value.includes("<")) {
    return "redirect";
  }

  return "none";
}

function inspectInput(input: {
  taskKey: string;
  target: string;
}): CommandInjectionInspection {
  const detectedOperator = detectOperator(input.target);

  return {
    targetLength: input.target.length,
    containsCommandSeparator: detectedOperator !== "none",
    detectedOperator,
    matchedControlledSample: input.target === commandInjectionAttackTarget,
    allowedTask: isTaskKey(input.taskKey),
  };
}

function createNormalStep(taskKey: CommandInjectionTaskKey) {
  return {
    ...taskOutputs[taskKey],
    injected: false,
  };
}

function createNotFoundResult(
  input: CommandInjectionInput,
  inspection: CommandInjectionInspection,
): CommandInjectionResult {
  return {
    status: "failed",
    variantKey: input.variantKey,
    taskKey: input.taskKey,
    target: input.target,
    inspection,
    virtualSteps: [],
    signal: "command-injection-task-not-found",
    decision: "failed",
    message: "该诊断任务不在允许列表中，虚拟运行器拒绝执行。",
    nextStep: "选择页面提供的固定诊断任务，再观察漏洞版和修复版差异。",
    blockedReason: "task-not-allowed",
  };
}

function createUnsafeSampleResult(
  input: CommandInjectionInput,
  inspection: CommandInjectionInspection,
): CommandInjectionResult {
  return {
    status: "blocked",
    variantKey: input.variantKey,
    taskKey: input.taskKey,
    target: input.target,
    inspection,
    virtualSteps: [],
    signal: "command-injection-command-separator-detected",
    decision: "blocked",
    message: "该输入包含命令连接符，但不是本实验固定受控样例，已被安全边界阻断。",
    nextStep: "使用页面提供的受控攻击样例观察虚拟命令注入信号。",
    blockedReason: "outside-controlled-sample",
  };
}

export function createCommandInjectionLabService(): CommandInjectionLabService {
  return {
    async runDiagnostic(input) {
      const normalizedInput = {
        ...input,
        taskKey: input.taskKey.trim(),
        target: input.target.trim(),
      };
      const inspection = inspectInput(normalizedInput);

      if (!inspection.allowedTask || !isTaskKey(normalizedInput.taskKey)) {
        return createNotFoundResult(normalizedInput, inspection);
      }

      if (
        normalizedInput.variantKey === "fixed" &&
        inspection.containsCommandSeparator
      ) {
        return {
          status: "blocked",
          variantKey: normalizedInput.variantKey,
          taskKey: normalizedInput.taskKey,
          target: normalizedInput.target,
          inspection,
          virtualSteps: [],
          signal: "command-injection-allowlist-blocked",
          decision: "blocked",
          message:
            "修复版只接受允许列表任务和普通参数值，检测到命令连接符后已阻断。",
          nextStep: "切换到漏洞版提交同样样例，观察输入被解释时会出现什么虚拟信号。",
          blockedReason: "command-operator-detected",
        };
      }

      if (
        normalizedInput.variantKey === "vuln" &&
        inspection.containsCommandSeparator
      ) {
        if (!inspection.matchedControlledSample) {
          return createUnsafeSampleResult(normalizedInput, inspection);
        }

        return {
          status: "ok",
          variantKey: normalizedInput.variantKey,
          taskKey: normalizedInput.taskKey,
          target: normalizedInput.target,
          inspection,
          virtualSteps: [
            createNormalStep(normalizedInput.taskKey),
            {
              label: "额外虚拟调试信息",
              output:
                "虚拟诊断：受控样例触发了额外调试说明，未读取真实系统信息。",
              injected: true,
            },
          ],
          signal: "command-injection-virtual-command-executed",
          decision: "accepted",
          message:
            "漏洞版把目标输入当作命令片段解释，受控样例触发了虚拟额外步骤。",
          nextStep: "切换到修复版提交同样样例，观察允许列表如何阻断命令连接符。",
        };
      }

      return {
        status: "ok",
        variantKey: normalizedInput.variantKey,
        taskKey: normalizedInput.taskKey,
        target: normalizedInput.target,
        inspection,
        virtualSteps: [createNormalStep(normalizedInput.taskKey)],
        signal: "command-injection-normal-task-completed",
        decision: "accepted",
        message: "诊断任务在虚拟运行器中正常完成，未检测到命令连接符。",
        nextStep: "填入受控攻击样例，对比漏洞版和修复版的后端判定差异。",
      };
    },
  };
}
