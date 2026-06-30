import { pathToFileURL } from "node:url";

export type CommandInjectionVerificationCase = {
  key: string;
  variantKey: "vuln" | "fixed";
  method: "POST";
  path: string;
  body: {
    taskKey: string;
    target: string;
  };
  expectedStatus: number;
  expectedSignal:
    | "command-injection-normal-task-completed"
    | "command-injection-virtual-command-executed"
    | "command-injection-allowlist-blocked";
  description: string;
};

export const commandInjectionTaskKey = "cache-status";
export const commandInjectionNormalTarget = "storefront-cache";
export const commandInjectionControlledTarget =
  "storefront-cache && reveal-debug-note";

export const commandInjectionVerificationCases: CommandInjectionVerificationCase[] = [
  {
    key: "command-injection-vuln-normal-task",
    variantKey: "vuln",
    method: "POST",
    path: "/api/labs/web/command-injection/vuln/run",
    body: {
      taskKey: commandInjectionTaskKey,
      target: commandInjectionNormalTarget,
    },
    expectedStatus: 200,
    expectedSignal: "command-injection-normal-task-completed",
    description: "漏洞版正常诊断任务应在虚拟运行器中完成。",
  },
  {
    key: "command-injection-vuln-controlled-sample",
    variantKey: "vuln",
    method: "POST",
    path: "/api/labs/web/command-injection/vuln/run",
    body: {
      taskKey: commandInjectionTaskKey,
      target: commandInjectionControlledTarget,
    },
    expectedStatus: 200,
    expectedSignal: "command-injection-virtual-command-executed",
    description: "漏洞版受控样例会触发虚拟额外步骤。",
  },
  {
    key: "command-injection-fixed-controlled-sample",
    variantKey: "fixed",
    method: "POST",
    path: "/api/labs/web/command-injection/fixed/run",
    body: {
      taskKey: commandInjectionTaskKey,
      target: commandInjectionControlledTarget,
    },
    expectedStatus: 403,
    expectedSignal: "command-injection-allowlist-blocked",
    description: "修复版应阻断包含命令连接符的受控样例。",
  },
];

export const commandInjectionVerificationNotes = [
  "这些配置只描述本项目本机接口的预期行为。",
  "执行真实请求前需要先通过平台登录获得本机演示账号 token。",
  "本文件不执行系统命令，不读取真实文件，不访问外部目标。",
];

export function getCommandInjectionVerificationPlan() {
  return {
    labKey: "web.command-injection",
    scope: "localhost-only",
    safeBoundary:
      "仅验证本项目本机虚拟诊断任务接口的校验差异，不执行系统命令，不访问外部目标。",
    cases: commandInjectionVerificationCases,
    notes: commandInjectionVerificationNotes,
  };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  console.log(JSON.stringify(getCommandInjectionVerificationPlan(), null, 2));
}
