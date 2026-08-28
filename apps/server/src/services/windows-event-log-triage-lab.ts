import { fixedWindowsSecurityEventDataset } from "@network-safe/shared/fixed-security-events";
import {
  createControlledDecisionLabService,
  type ControlledDecisionLabService,
  type ControlledResult,
  type ControlledVariantKey,
} from "./controlled-decision-lab.js";

export type WindowsEventLogTriageVariantKey = ControlledVariantKey;
export const windowsEventLogTriageScenarioKey = "fixed-windows-identity-service-timeline";
export const windowsEventLogTriageRiskSignal = "host-event-log-triage-risk-accepted";
export const windowsEventLogTriageDefenseSignal = "host-event-log-triage-defense-blocked";
export const windowsEventLogTriageNormalSignal = "host-event-log-triage-normal-verified";
export const windowsEventLogTriageBoundarySignal = "host-event-log-triage-boundary-blocked";

const definition = {
  id: "host.event-log-triage",
  slug: "event-log-triage",
  category: "host",
  subcategory: "event-log-triage",
  title: "Windows 事件日志时间线研判",
  mode: "case-study",
  severity: "high",
  difficulty: "advanced",
  summary: "通过固定脱敏异常登录、权限变更和服务安装事件，练习时间线关联与处置优先级。",
  scenarioKey: windowsEventLogTriageScenarioKey,
  caseTitle: "固定身份与服务事件时间线",
  caseDescription: "固定时间线包含异常登录、虚构特权组变更、服务安装和登记维护服务安装。",
  evidence: fixedWindowsSecurityEventDataset.events.map((event) => ({
    key: event.eventId,
    title: `${event.timestamp} · ${event.severity}`,
    detail: `${event.summary} [${event.signalTags.join(" / ")}]`,
  })),
  steps: [
    {
      key: "timeline-policy",
      order: 1,
      title: "时间线关联策略",
      prompt: "选择固定 Windows 事件时间线的研判策略。",
      options: [
        { key: "trust-single-event-in-isolation", label: "孤立信任单条事件（风险视角）", outcome: "risk", decision: "accepted", signal: "host-event-log-triage-policy-open", explanation: "风险路径忽略异常登录、权限变更和服务安装之间的固定关联。" },
        { key: "correlate-identity-and-service-events", label: "关联身份与服务事件", outcome: "fix", decision: "blocked", signal: "host-event-log-triage-policy-enforced", explanation: "防御路径按固定相对时间和风险标签关联多条脱敏事件。" },
      ],
    },
    {
      key: "timeline-disposition",
      order: 2,
      title: "研判处置优先级",
      prompt: "选择固定时间线的教学处置结论。",
      options: [
        { key: "dismiss-identity-service-chain", label: "忽略身份与服务关联（风险视角）", outcome: "risk", decision: "accepted", signal: windowsEventLogTriageRiskSignal, explanation: "风险路径把高风险固定关联当作普通噪声，未升级研判。" },
        { key: "escalate-correlated-host-timeline", label: "升级关联时间线调查", outcome: "fix", decision: "blocked", signal: windowsEventLogTriageDefenseSignal, explanation: "防御路径按证据链升级固定调查摘要，不执行真实隔离或账号冻结。" },
        { key: "close-registered-maintenance-baseline", label: "凭维护基线正常关闭", outcome: "normal", decision: "accepted", signal: windowsEventLogTriageNormalSignal, explanation: "正常路径依据登记维护窗口关闭虚构维护事件，同时保留异常链路。" },
      ],
    },
  ],
  safeBoundaries: ["只使用固定脱敏事件，不读取真实 Windows Event Log、注册表、服务或主机名。", "不执行隔离、冻结、提权或横向移动操作。", "case-study 只输出固定研判摘要，未知 key 会被脱敏阻断。"],
  notes: "该实验按 case-study ready 例外收口，不提供 exploit.py 或真实主机操作能力。",
  signals: { risk: windowsEventLogTriageRiskSignal, defense: windowsEventLogTriageDefenseSignal, normal: windowsEventLogTriageNormalSignal, boundary: windowsEventLogTriageBoundarySignal },
  paths: {
    risk: ["trust-single-event-in-isolation", "dismiss-identity-service-chain"],
    defense: ["correlate-identity-and-service-events", "escalate-correlated-host-timeline"],
    normal: ["correlate-identity-and-service-events", "close-registered-maintenance-baseline"],
  },
} as const;

export type WindowsEventLogTriageWorkbench = ReturnType<
  ControlledDecisionLabService["getWorkbench"]
>;
export type WindowsEventLogTriageEvaluationResult = ControlledResult;
export const service = createControlledDecisionLabService(definition);
export function createWindowsEventLogTriageLabService() {
  return service;
}
