import type {
  PersistenceTriageResult,
  PersistenceTriageVariantKey,
} from "../api/persistence-triage-lab";

export type { PersistenceTriageVariantKey };

export type PersistenceTriageVariantConfig = {
  key: PersistenceTriageVariantKey;
  title: string;
  badge: string;
  explanation: string;
  expectedSignal: string;
  panelIntro: string;
  recommendedPath: string[];
};

export const persistenceTriageScenarioKey =
  "fixed-windows-autorun-persistence-timeline";

// 首步 optionKey 到固定条目 key 的映射与服务端 entryKeyByAssessmentOption 一致
export const entryKeyByAssessmentOption: Record<string, string> = {
  "accept-unsigned-autorun-entry": "virtual-unsigned-autorun-entry",
  "harden-signature-and-path-acl": "virtual-signed-managed-task",
};

const persistenceTriageVariantConfigs: Record<
  PersistenceTriageVariantKey,
  PersistenceTriageVariantConfig
> = {
  vuln: {
    key: "vuln",
    title: "持久化风险观察版",
    badge: "未签名 + 可写路径 + 高权限 + 无审计",
    explanation:
      "观察固定自启项同时具备未签名映像、标准用户可写路径、高权限运行账户和缺失变更审计时的组合风险。",
    expectedSignal:
      "风险路径完成后应出现 host-persistence-triage-risk-accepted 学习信号。",
    panelIntro:
      "页面只显示 virtual-* 虚构条目与语义枚举，不读取真实注册表、计划任务或启动项，也不创建任何持久化。",
    recommendedPath: [
      "accept-unsigned-autorun-entry",
      "approve-persistence-retention",
    ],
  },
  fixed: {
    key: "fixed",
    title: "持久化处置复盘版",
    badge: "发布者验证 + 仅管理员可写 + 最小权限 + 审计告警",
    explanation:
      "对同一固定时间线收敛签名、路径 ACL、运行账户与审计后，再对比阻断与受控自启正常基线。",
    expectedSignal:
      "防御路径出现 host-persistence-triage-defense-blocked，正常路径出现 host-persistence-triage-normal-verified。",
    panelIntro:
      "修复版只验证固定加固摘要，不删除、创建或修改真实计划任务与启动项。",
    recommendedPath: [
      "harden-signature-and-path-acl",
      "block-and-remove-persistence",
    ],
  },
};

export const persistenceTriageNormalPath = [
  "harden-signature-and-path-acl",
  "verify-managed-autorun-baseline",
];

export const persistenceTriageChecklist = [
  {
    key: "signature-scope",
    title: "校验映像签名来源",
    description: "未签名映像无法确认发布者，持久化条目失去来源可信性。",
  },
  {
    key: "image-path-acl",
    title: "收敛映像路径 ACL",
    description: "标准用户可写的映像路径让持久化条目可被静默替换。",
  },
  {
    key: "run-account",
    title: "降低运行账户权限",
    description: "高权限运行账户把一个自启项放大成主机级影响面。",
  },
  {
    key: "audit-scope",
    title: "启用变更审计与告警",
    description: "缺失审计时持久化条目的新增和篡改都不会留下可研判证据。",
  },
];

export function getPersistenceTriageVariantConfig(
  variant: PersistenceTriageVariantKey,
) {
  return persistenceTriageVariantConfigs[variant];
}

export function formatPersistenceTriageSignal(signal: string) {
  const labels: Record<string, string> = {
    "host-persistence-triage-risk-accepted": "可疑持久化被保留",
    "host-persistence-triage-defense-blocked": "可疑持久化已阻断",
    "host-persistence-triage-normal-verified": "受控自启基线通过",
    "host-persistence-triage-unsigned-accepted": "未签名条目被接受",
    "host-persistence-triage-controls-hardened": "持久化控制已加固",
    "host-persistence-triage-boundary-blocked": "未登记输入被脱敏阻断",
  };

  return labels[signal] ?? signal;
}

export function createPersistenceTriageLearningProgress(
  config: PersistenceTriageVariantConfig,
) {
  return {
    variantKey: config.key,
    status: "in-progress",
    notes: `进入 ${config.title}`,
  };
}

export function createPersistenceTriageVerificationRecord(
  config: PersistenceTriageVariantConfig,
  result: PersistenceTriageResult,
) {
  return {
    variantKey: config.key,
    result: result.decision === "blocked" ? "blocked" : "passed",
    summary: `${result.labKey}: ${result.signal}`,
    details: {
      signal: result.signal,
      scenarioKey: result.scenarioKey,
      entryKey: result.entryAssessment?.entryKey ?? "blocked-entry-snapshot",
      findingCount: result.entryAssessment?.findingCount ?? 0,
      criticalFindingCount: result.entryAssessment?.criticalFindingCount ?? 0,
      hardeningControlCount:
        result.entryAssessment?.hardeningControlCount ?? 0,
      stepCount: result.assessment.stepCount,
    },
  };
}
