import type {
  ServicePermissionAuditResult,
  ServicePermissionAuditVariantKey,
} from "../api/service-permission-audit-lab";

export type { ServicePermissionAuditVariantKey };

export type ServicePermissionAuditVariantConfig = {
  key: ServicePermissionAuditVariantKey;
  title: string;
  badge: string;
  explanation: string;
  expectedSignal: string;
  panelIntro: string;
  recommendedPath: string[];
};

export const servicePermissionAuditScenarioKey =
  "fixed-windows-service-permission-audit";

const servicePermissionAuditVariantConfigs: Record<
  ServicePermissionAuditVariantKey,
  ServicePermissionAuditVariantConfig
> = {
  vuln: {
    key: "vuln",
    title: "Windows 服务权限风险观察版",
    badge: "高权限身份 + 可写未加引号路径",
    explanation:
      "观察固定高权限服务同时具备未加引号路径、低权限目录写入权和服务配置修改权时的组合风险。",
    expectedSignal:
      "风险路径完成后应出现 host-service-permission-audit-risk-accepted 学习信号。",
    panelIntro:
      "页面只显示 C:\\LabVirtual 虚构路径和语义 ACL，不读取本机服务、注册表、文件或账号。",
    recommendedPath: [
      "accept-user-writable-unquoted-path",
      "allow-unprivileged-service-replacement",
    ],
  },
  fixed: {
    key: "fixed",
    title: "Windows 服务权限防御复盘版",
    badge: "路径加引号 + ACL 收敛 + 最小身份",
    explanation:
      "对同一虚构服务收敛目录和服务配置 ACL、加引号路径并改用受限身份，再对比阻断与正常基线。",
    expectedSignal:
      "防御路径出现 host-service-permission-audit-defense-blocked，正常路径出现 host-service-permission-audit-normal-verified。",
    panelIntro:
      "修复版只验证固定加固摘要，不执行 PowerShell、sc.exe、WMI、服务重启或权限修改。",
    recommendedPath: [
      "harden-path-and-service-acl",
      "block-unprivileged-service-modification",
    ],
  },
};

export const servicePermissionAuditNormalPath = [
  "harden-path-and-service-acl",
  "verify-hardened-service-baseline",
];

export const servicePermissionAuditChecklist = [
  {
    key: "quoted-path",
    title: "包含空格的路径必须加引号",
    description: "路径解析边界与目录写入权限需要组合评估，不能只看可执行文件名。",
  },
  {
    key: "binary-acl",
    title: "收敛二进制目录写入权",
    description: "普通用户不应能修改高权限服务加载的二进制目录。",
  },
  {
    key: "config-acl",
    title: "收敛服务配置修改权",
    description: "服务路径与启动配置的修改权限应限制在受控系统主体。",
  },
  {
    key: "least-identity",
    title: "使用最小权限服务身份",
    description: "服务运行身份应与业务所需权限匹配，避免默认使用高权限主体。",
  },
];

export function getServicePermissionAuditVariantConfig(
  variant: ServicePermissionAuditVariantKey,
) {
  return servicePermissionAuditVariantConfigs[variant];
}

export function formatServicePermissionAuditSignal(signal: string) {
  const labels: Record<string, string> = {
    "host-service-permission-audit-risk-accepted": "服务替换风险被接受",
    "host-service-permission-audit-defense-blocked": "未授权服务修改已阻断",
    "host-service-permission-audit-normal-verified": "加固服务基线通过",
    "host-service-permission-audit-weak-path-accepted": "弱服务路径被接受",
    "host-service-permission-audit-controls-hardened": "服务权限控制已收敛",
    "host-service-permission-audit-boundary-blocked": "未登记输入被脱敏阻断",
  };

  return labels[signal] ?? signal;
}

export function createServicePermissionAuditLearningProgress(
  config: ServicePermissionAuditVariantConfig,
) {
  return {
    variantKey: config.key,
    status: "in-progress",
    notes: `进入 ${config.title}`,
  };
}

export function createServicePermissionAuditVerificationRecord(
  config: ServicePermissionAuditVariantConfig,
  result: ServicePermissionAuditResult,
) {
  return {
    variantKey: config.key,
    result: result.decision === "blocked" ? "blocked" : "passed",
    summary: `${result.labKey}: ${result.signal}`,
    details: {
      signal: result.signal,
      scenarioKey: result.scenarioKey,
      serviceKey:
        result.profileAssessment?.serviceKey ?? "blocked-service-profile",
      findingCount: result.profileAssessment?.findingCount ?? 0,
      criticalFindingCount:
        result.profileAssessment?.criticalFindingCount ?? 0,
      hardenedControlCount:
        result.profileAssessment?.hardenedControlCount ?? 0,
      stepCount: result.assessment.stepCount,
    },
  };
}
