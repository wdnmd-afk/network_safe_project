import type {
  PortScanProfile,
  PortScanResult,
  PortScanSignal as PortScanApiSignal,
  PortScanTargetKey,
  PortScanVariantKey,
} from "../api/port-scan-lab";

export type { PortScanProfile, PortScanTargetKey, PortScanVariantKey };

export type PortScanSignal =
  | PortScanApiSignal
  | "port-scan-workbench-reviewed"
  | "port-scan-fixed-targets-reviewed"
  | "port-scan-no-real-scan-confirmed";

export type PortScanVariantConfig = {
  key: PortScanVariantKey;
  title: string;
  badge: string;
  perspective: string;
  explanation: string;
  expectedSignal: string;
  expectedOutcome: string;
  panelIntro: string;
};

export type PortScanTargetOption = {
  key: PortScanTargetKey;
  title: string;
  description: string;
  vulnerableFocus: string;
  fixedFocus: string;
};

export type PortScanProfileOption = {
  key: PortScanProfile;
  title: string;
  description: string;
};

export type PortScanTargetObservationRow = {
  key: PortScanTargetKey;
  title: string;
  focus: string;
  description: string;
};

export type PortScanReviewChecklistItem = {
  key: string;
  title: string;
  description: string;
};

export type PortScanLearningProgressInput = {
  variantKey: PortScanVariantKey;
  status: "in-progress";
  notes: string;
};

export type PortScanVerificationRecordInput = {
  variantKey: PortScanVariantKey;
  result: "passed";
  summary: string;
  details: {
    signal: PortScanApiSignal;
    targetKey: string;
    scanProfile: string;
    virtualPortCount: number;
    openPortCount: number;
    restrictedPortCount: number;
    highRiskPortCount: number;
    exposureScore: number;
  };
};

export const defaultPortScanTargetKey: PortScanTargetKey = "admin-node";
export const defaultPortScanProfile: PortScanProfile = "surface-review";

const portScanVariantConfigs: Record<
  PortScanVariantKey,
  PortScanVariantConfig
> = {
  vuln: {
    key: "vuln",
    title: "端口扫描漏洞版",
    badge: "虚拟资产暴露管理端口、维护端口或调试入口",
    perspective: "攻击方观察",
    explanation:
      "本页从攻击方视角观察固定虚拟资产的开放端口如何暴露管理面、维护面和高价值服务线索。",
    expectedSignal:
      "提交后台管理节点后应出现 port-scan-management-surface-visible 信号。",
    expectedOutcome: "完成固定虚拟目标、固定观察模式和暴露面评分观察。",
    panelIntro:
      "工作台只调用本项目虚拟资产 API，不提供任意主机、网段、端口范围或扫描参数。",
  },
  fixed: {
    key: "fixed",
    title: "端口扫描修复版",
    badge: "最小暴露面、管理面收敛和内部服务隔离",
    perspective: "防御方复盘",
    explanation:
      "本页从防御方视角复盘同一批虚拟资产，观察管理端口和内部服务如何从公开暴露面收敛。",
    expectedSignal:
      "提交后台管理节点后应出现 port-scan-surface-reduced 信号。",
    expectedOutcome: "完成漏洞版与修复版公开端口、高风险端口和暴露面评分对比。",
    panelIntro:
      "修复版强调服务端资产清单、访问控制和日志摘要，前端选择器只用于引导学习流程。",
  },
};

export const portScanTargetOptions: PortScanTargetOption[] = [
  {
    key: "office-gateway",
    title: "虚拟办公网关",
    description: "模拟办公入口、业务入口和远程管理面共存的资产。",
    vulnerableFocus: "观察远程管理和打印服务公开后如何扩大攻击面。",
    fixedFocus: "观察办公入口只保留必要业务面后，管理服务如何转入受控访问。",
  },
  {
    key: "admin-node",
    title: "虚拟后台管理节点",
    description: "模拟后台管理、远程维护、数据库和调试入口所在节点。",
    vulnerableFocus: "观察数据库、维护端口和调试入口公开后的高价值管理面线索。",
    fixedFocus: "观察后台节点管理面、数据库服务和维护服务如何收敛到受控范围。",
  },
  {
    key: "hardened-service",
    title: "虚拟最小化服务",
    description: "模拟只暴露必要业务入口的基线资产。",
    vulnerableFocus: "观察基线资产仍需确认指标服务是否越过公开边界。",
    fixedFocus: "观察最小化服务如何保持业务入口可用，同时隔离内部观察面。",
  },
];

export const portScanProfileOptions: PortScanProfileOption[] = [
  {
    key: "quick-observe",
    title: "快速公开面观察",
    description: "只查看虚拟公开端口，适合先判断外部可见面。",
  },
  {
    key: "surface-review",
    title: "暴露面复盘",
    description: "查看公开、受限和内部可见的虚拟端口，用于对比治理前后差异。",
  },
];

export const portScanReviewChecklist: PortScanReviewChecklistItem[] = [
  {
    key: "fixed-targets",
    title: "目标只能来自固定虚拟资产",
    description:
      "页面不提供任意 IP、域名、网段或主机名输入，所有观察都来自本项目内存虚拟资产表。",
  },
  {
    key: "surface-minimized",
    title: "公开端口应保持最小化",
    description:
      "业务入口可以公开，管理、数据库、调试和指标类服务应转入受控或内部可见范围。",
  },
  {
    key: "log-summary",
    title: "日志只记录脱敏摘要",
    description:
      "事件日志只记录虚拟目标 key、观察模式、端口统计和学习信号，不记录真实主机或服务指纹。",
  },
  {
    key: "no-real-scan",
    title: "不执行真实网络探测",
    description:
      "实验不调用 socket、系统命令或扫描工具，也不提供端口范围、并发或超时参数。",
  },
];

export function getPortScanVariantConfig(variant: PortScanVariantKey) {
  return portScanVariantConfigs[variant];
}

export function getPortScanTargetObservationRows(
  variant: PortScanVariantKey,
): PortScanTargetObservationRow[] {
  return portScanTargetOptions.map((target) => ({
    key: target.key,
    title: target.title,
    description: target.description,
    focus:
      variant === "vuln" ? target.vulnerableFocus : target.fixedFocus,
  }));
}

export function createPortScanLearningProgress(
  config: PortScanVariantConfig,
): PortScanLearningProgressInput {
  return {
    variantKey: config.key,
    status: "in-progress",
    notes: `进入 ${config.title}`,
  };
}

export function createPortScanVerificationRecord(
  config: PortScanVariantConfig,
  result: PortScanResult,
): PortScanVerificationRecordInput {
  const details = {
    signal: result.signal,
    targetKey: result.targetKey,
    scanProfile: result.scanProfile,
    virtualPortCount: result.summary.virtualPortCount,
    openPortCount: result.summary.openPortCount,
    restrictedPortCount: result.summary.restrictedPortCount,
    highRiskPortCount: result.summary.highRiskPortCount,
    exposureScore: result.summary.exposureScore,
  };

  if (config.key === "vuln") {
    return {
      variantKey: config.key,
      result: "passed",
      summary: "漏洞版展示了虚拟资产管理面或高风险端口公开暴露信号。",
      details,
    };
  }

  return {
    variantKey: config.key,
    result: "passed",
    summary: "修复版展示了虚拟资产公开端口和高风险端口收敛效果。",
    details,
  };
}

export function formatPortScanSignal(signal: PortScanSignal) {
  const labels: Record<PortScanSignal, string> = {
    "port-scan-workbench-reviewed": "已进入端口扫描前端工作台",
    "port-scan-fixed-targets-reviewed": "已确认固定虚拟目标边界",
    "port-scan-no-real-scan-confirmed": "已确认不执行真实网络扫描",
    "port-scan-exposure-expanded": "漏洞版虚拟资产暴露面扩大",
    "port-scan-management-surface-visible": "漏洞版管理面公开可见",
    "port-scan-surface-reduced": "修复版暴露面已收敛",
    "port-scan-target-blocked": "非固定虚拟目标已被阻断",
    "port-scan-normal-inventory-returned": "虚拟资产清单正常返回",
  };

  return labels[signal];
}
