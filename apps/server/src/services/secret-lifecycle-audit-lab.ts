import {
  createControlledDecisionLabService,
  type ControlledDecisionLabService,
  type ControlledResult,
  type ControlledVariantKey,
} from "./controlled-decision-lab.js";

export type SecretLifecycleAuditVariantKey = ControlledVariantKey;
export const secretLifecycleAuditScenarioKey = "fixed-secret-exposure-and-key-ledger";
export const secretLifecycleAuditRiskSignal = "crypto-secret-lifecycle-audit-risk-accepted";
export const secretLifecycleAuditDefenseSignal = "crypto-secret-lifecycle-audit-defense-blocked";
export const secretLifecycleAuditNormalSignal = "crypto-secret-lifecycle-audit-normal-verified";
export const secretLifecycleAuditBoundarySignal = "crypto-secret-lifecycle-audit-boundary-blocked";

const definition = {
  id: "crypto.secret-lifecycle-audit",
  slug: "secret-lifecycle-audit",
  category: "crypto",
  subcategory: "secret-lifecycle-audit",
  title: "秘密泄露与密钥生命周期审计",
  mode: "simulation",
  severity: "high",
  difficulty: "advanced",
  summary: "通过固定秘密标记和虚构密钥台账观察扫描、轮换、吊销与版本控制。",
  scenarioKey: secretLifecycleAuditScenarioKey,
  caseTitle: "固定秘密证据与密钥台账",
  caseDescription: "固定配置、日志、源码和构建清单含不可用秘密标记，台账包含 v1/v2 生命周期状态。",
  evidence: [
    { key: "config-marker", title: "配置标记", detail: "virtual-secret-marker-config / exposed。" },
    { key: "log-marker", title: "日志标记", detail: "virtual-secret-marker-log / exposed。" },
    { key: "source-marker", title: "源码标记", detail: "virtual-secret-marker-source / exposed。" },
    { key: "artifact-marker", title: "制品标记", detail: "virtual-secret-marker-artifact / exposed。" },
    { key: "key-v1", title: "virtual-key-v1", detail: "版本 1 / long-lived / 待吊销。" },
    { key: "key-v2", title: "virtual-key-v2", detail: "版本 2 / active / 轮换后正常使用。" },
  ],
  steps: [
    {
      key: "audit-policy",
      order: 1,
      title: "发布审计策略",
      prompt: "选择固定发布前的秘密审计策略。",
      options: [
        { key: "publish-without-secret-audit", label: "不扫描直接发布（漏洞视角）", outcome: "risk", decision: "accepted", signal: "crypto-secret-lifecycle-audit-policy-open", explanation: "漏洞版不识别固定秘密标记，也不检查长期密钥台账。" },
        { key: "scan-fixed-artifacts-and-enforce-lifecycle", label: "扫描固定制品并执行生命周期", outcome: "fix", decision: "blocked", signal: "crypto-secret-lifecycle-audit-policy-enforced", explanation: "修复版识别固定标记并要求活动密钥具备版本、轮换和吊销状态。" },
      ],
    },
    {
      key: "secret-disposition",
      order: 2,
      title: "秘密与密钥处置",
      prompt: "选择固定审计结果的处置方式。",
      options: [
        { key: "continue-with-exposed-static-key", label: "继续使用暴露的静态密钥（漏洞视角）", outcome: "risk", decision: "accepted", signal: secretLifecycleAuditRiskSignal, explanation: "漏洞版接受固定泄露标记并继续使用长期静态密钥。" },
        { key: "revoke-rotate-and-inject-secret", label: "吊销、轮换并改用注入秘密", outcome: "fix", decision: "blocked", signal: secretLifecycleAuditDefenseSignal, explanation: "修复版生成吊销/轮换安全摘要，不接触真实密钥材料。" },
        { key: "publish-with-active-version-only", label: "仅使用活动版本正常发布", outcome: "normal", decision: "accepted", signal: secretLifecycleAuditNormalSignal, explanation: "修复版保留活动虚构版本的正常发布路径。" },
      ],
    },
  ],
  safeBoundaries: ["只匹配固定内嵌标记，不读取 .env、Git 历史、真实日志或构建产物。", "不生成、存储、校验或传输真实密钥材料。", "未知 key 会被脱敏阻断。"],
  notes: "该实验只提供固定秘密审计与生命周期决策，不提供秘密扫描器或密钥操作工具。",
  signals: { risk: secretLifecycleAuditRiskSignal, defense: secretLifecycleAuditDefenseSignal, normal: secretLifecycleAuditNormalSignal, boundary: secretLifecycleAuditBoundarySignal },
} as const;

export type SecretLifecycleAuditWorkbench = ReturnType<
  ControlledDecisionLabService["getWorkbench"]
>;
export type SecretLifecycleAuditEvaluationResult = ControlledResult;
export const service = createControlledDecisionLabService(definition);
export function createSecretLifecycleAuditLabService() {
  return service;
}
