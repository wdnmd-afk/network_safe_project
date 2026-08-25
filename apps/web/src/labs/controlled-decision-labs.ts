import type { ControlledResult, ControlledVariantKey } from "../api/controlled-decision-lab";

export type ControlledLabPageConfig = {
  id: string;
  category: string;
  scene: string;
  vulnTitle: string;
  fixedTitle: string;
  riskSignal: string;
  defenseSignal: string;
  normalSignal: string;
  riskLabel: string;
  defenseLabel: string;
  normalLabel: string;
  normalButton: string;
  runButton: string;
  recommendedPath: Record<ControlledVariantKey, string[]>;
  normalPath: string[];
};

export const controlledLabPageConfigs: Record<string, ControlledLabPageConfig> = {
  "api.property-authorization": {
    id: "api.property-authorization", category: "api", scene: "property-authorization",
    vulnTitle: "API 属性级授权风险观察版", fixedTitle: "API 属性级授权防御复盘版",
    riskSignal: "api-property-authorization-risk-accepted", defenseSignal: "api-property-authorization-defense-blocked", normalSignal: "api-property-authorization-normal-verified",
    riskLabel: "批量绑定风险", defenseLabel: "属性级授权防御", normalLabel: "正常字段更新",
    normalButton: "正常字段更新", runButton: "运行固定评估",
    recommendedPath: { vuln: ["bind-all-client-fields", "persist-server-owned-fields"], fixed: ["enforce-field-allowlist-and-server-ownership", "block-server-owned-field-update"] },
    normalPath: ["enforce-field-allowlist-and-server-ownership", "allow-display-name-update"],
  },
  "business-logic.race-condition": {
    id: "business-logic.race-condition", category: "business-logic", scene: "race-condition",
    vulnTitle: "业务竞态与幂等风险观察版", fixedTitle: "业务竞态与幂等防御复盘版",
    riskSignal: "business-logic-race-condition-risk-accepted", defenseSignal: "business-logic-race-condition-defense-blocked", normalSignal: "business-logic-race-condition-normal-verified",
    riskLabel: "竞态风险", defenseLabel: "幂等防御", normalLabel: "正常扣减",
    normalButton: "正常唯一请求", runButton: "运行固定评估",
    recommendedPath: { vuln: ["read-then-write-without-version", "accept-both-stock-decrements"], fixed: ["enforce-idempotency-and-version-check", "block-duplicate-or-stale-request"] },
    normalPath: ["enforce-idempotency-and-version-check", "allow-single-unique-request"],
  },
  "crypto.secret-lifecycle-audit": {
    id: "crypto.secret-lifecycle-audit", category: "crypto", scene: "secret-lifecycle-audit",
    vulnTitle: "秘密生命周期风险观察版", fixedTitle: "秘密生命周期防御复盘版",
    riskSignal: "crypto-secret-lifecycle-audit-risk-accepted", defenseSignal: "crypto-secret-lifecycle-audit-defense-blocked", normalSignal: "crypto-secret-lifecycle-audit-normal-verified",
    riskLabel: "泄露风险", defenseLabel: "轮换防御", normalLabel: "正常发布",
    normalButton: "活动版本正常发布", runButton: "运行固定审计",
    recommendedPath: { vuln: ["publish-without-secret-audit", "continue-with-exposed-static-key"], fixed: ["scan-fixed-artifacts-and-enforce-lifecycle", "revoke-rotate-and-inject-secret"] },
    normalPath: ["scan-fixed-artifacts-and-enforce-lifecycle", "publish-with-active-version-only"],
  },
  "host.event-log-triage": {
    id: "host.event-log-triage", category: "host", scene: "event-log-triage",
    vulnTitle: "Windows 事件日志风险观察版", fixedTitle: "Windows 事件日志防御复盘版",
    riskSignal: "host-event-log-triage-risk-accepted", defenseSignal: "host-event-log-triage-defense-blocked", normalSignal: "host-event-log-triage-normal-verified",
    riskLabel: "时间线风险", defenseLabel: "研判升级", normalLabel: "维护关闭",
    normalButton: "正常维护路径", runButton: "运行固定研判",
    recommendedPath: { vuln: ["trust-single-event-in-isolation", "dismiss-identity-service-chain"], fixed: ["correlate-identity-and-service-events", "escalate-correlated-host-timeline"] },
    normalPath: ["correlate-identity-and-service-events", "close-registered-maintenance-baseline"],
  },
};

export function getControlledLabPageConfig(category: string, scene: string) {
  const config = controlledLabPageConfigs[`${category}.${scene}`];

  if (!config) {
    throw new Error(`未登记的专用实验页面：${category}.${scene}`);
  }

  return config;
}

export function formatControlledSignal(signal: string, config: ControlledLabPageConfig) {
  const labels: Record<string, string> = {
    [config.riskSignal]: config.riskLabel,
    [config.defenseSignal]: config.defenseLabel,
    [config.normalSignal]: config.normalLabel,
  };

  return labels[signal] ?? signal;
}

export function createControlledLearningProgress(config: ControlledLabPageConfig, variant: ControlledVariantKey) {
  return { variantKey: variant, status: "in-progress", notes: `进入 ${variant === "vuln" ? config.vulnTitle : config.fixedTitle}` };
}

export function createControlledVerificationRecord(config: ControlledLabPageConfig, variant: ControlledVariantKey, result: ControlledResult) {
  return {
    variantKey: variant,
    result: result.decision === "blocked" ? "blocked" : "passed",
    summary: `${config.id}: ${result.signal}`,
    details: {
      signal: result.signal,
      scenarioKey: result.scenarioKey,
      stepCount: result.assessment.stepCount,
      riskOutcomes: result.recap.outcomeCounts.risk,
      fixOutcomes: result.recap.outcomeCounts.fix,
      normalOutcomes: result.recap.outcomeCounts.normal,
    },
  };
}
