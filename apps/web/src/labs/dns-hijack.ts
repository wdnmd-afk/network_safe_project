import type {
  DnsHijackDomainKey,
  DnsHijackResolverProfile,
  DnsHijackResult,
  DnsHijackSignal as DnsHijackApiSignal,
  DnsHijackVariantKey,
} from "../api/dns-hijack-lab";

export type {
  DnsHijackDomainKey,
  DnsHijackResolverProfile,
  DnsHijackVariantKey,
};

export type DnsHijackSignal =
  | DnsHijackApiSignal
  | "dns-hijack-workbench-reviewed"
  | "dns-hijack-fixed-samples-reviewed"
  | "dns-hijack-no-real-dns-confirmed";

export type DnsHijackVariantConfig = {
  key: DnsHijackVariantKey;
  title: string;
  badge: string;
  perspective: string;
  explanation: string;
  expectedSignal: string;
  expectedOutcome: string;
  panelIntro: string;
};

export type DnsHijackDomainOption = {
  key: DnsHijackDomainKey;
  title: string;
  displayDomain: string;
  description: string;
  vulnerableFocus: string;
  fixedFocus: string;
};

export type DnsHijackResolverProfileOption = {
  key: DnsHijackResolverProfile;
  title: string;
  description: string;
};

export type DnsHijackDomainObservationRow = {
  key: DnsHijackDomainKey;
  title: string;
  displayDomain: string;
  focus: string;
  description: string;
};

export type DnsHijackReviewChecklistItem = {
  key: string;
  title: string;
  description: string;
};

export type DnsHijackLearningProgressInput = {
  variantKey: DnsHijackVariantKey;
  status: "in-progress";
  notes: string;
};

export type DnsHijackVerificationRecordInput = {
  variantKey: DnsHijackVariantKey;
  result: "passed";
  summary: string;
  details: {
    signal: DnsHijackApiSignal;
    domainKey: string;
    resolverProfile: string;
    expectedAddressCategory: string;
    resolvedAddressCategory: string;
    certificateStatus: string;
    anomalyDetected: boolean;
  };
};

export const defaultDnsHijackDomainKey: DnsHijackDomainKey = "customer-portal";
export const defaultDnsHijackResolverProfile: DnsHijackResolverProfile =
  "public-cache";

const dnsHijackVariantConfigs: Record<
  DnsHijackVariantKey,
  DnsHijackVariantConfig
> = {
  vuln: {
    key: "vuln",
    title: "DNS 劫持漏洞版",
    badge: "错误虚拟解析、相似入口和证书不匹配",
    perspective: "攻击方观察",
    explanation:
      "本页从攻击方视角观察固定域名样例被错误解析到虚拟相似入口后，证书状态和审计信号如何暴露风险。",
    expectedSignal:
      "提交客户门户和 public-cache 后应出现 dns-hijack-certificate-mismatch-visible 信号。",
    expectedOutcome: "完成固定域名样例、固定解析视角和异常解析信号观察。",
    panelIntro:
      "工作台只调用本项目内存解析 API，不提供任意域名、DNS 服务器、IP、代理或端口输入。",
  },
  fixed: {
    key: "fixed",
    title: "DNS 劫持修复版",
    badge: "可信解析源、证书校验和异常解析审计",
    perspective: "防御方复盘",
    explanation:
      "本页从防御方视角复盘同一批固定域名样例，观察异常解析如何被阻断，以及可信解析如何恢复。",
    expectedSignal:
      "提交客户门户和 public-cache 后应出现 dns-hijack-anomaly-blocked 信号。",
    expectedOutcome: "完成异常解析阻断与可信解析恢复对比。",
    panelIntro:
      "修复版强调可信来源、地址类别校验和证书状态校验，前端选择器只用于引导学习流程。",
  },
};

export const dnsHijackDomainOptions: DnsHijackDomainOption[] = [
  {
    key: "customer-portal",
    title: "客户门户入口",
    displayDomain: "portal.example.test",
    description: "模拟客户登录和工单入口。",
    vulnerableFocus: "观察客户入口被解析到相似虚拟服务后，证书不匹配如何变成关键异常。",
    fixedFocus: "观察可信解析源如何恢复客户入口的期望虚拟地址类别。",
  },
  {
    key: "update-service",
    title: "更新服务入口",
    displayDomain: "update.example.test",
    description: "模拟客户端更新包检查入口。",
    vulnerableFocus: "观察更新入口解析偏离后，学习供应链入口被误导的风险。",
    fixedFocus: "观察更新入口在可信解析和证书校验下如何恢复正常。",
  },
  {
    key: "internal-dashboard",
    title: "内部看板入口",
    displayDomain: "dashboard.example.test",
    description: "模拟内部运营看板访问入口。",
    vulnerableFocus: "观察内部入口解析到外部相似地址类别后的异常审计信号。",
    fixedFocus: "观察内部入口异常解析被阻断或审计后的防御路径。",
  },
];

export const dnsHijackResolverProfileOptions: DnsHijackResolverProfileOption[] =
  [
    {
      key: "public-cache",
      title: "公共缓存视角",
      description: "模拟不可信缓存返回错误虚拟解析结果，用于观察漏洞版和修复版差异。",
    },
    {
      key: "trusted-resolver",
      title: "可信解析视角",
      description: "模拟可信解析源返回期望虚拟地址类别和可信证书状态。",
    },
  ];

export const dnsHijackReviewChecklist: DnsHijackReviewChecklistItem[] = [
  {
    key: "fixed-domain-samples",
    title: "域名只能来自固定样例",
    description:
      "页面不提供任意域名、DNS 服务器、IP、代理或网络接口输入，所有观察都来自本项目内存解析表。",
  },
  {
    key: "certificate-status",
    title: "证书状态必须参与判断",
    description:
      "错误虚拟地址类别和证书不匹配应被一起观察，修复版需要展示可信证书或阻断信号。",
  },
  {
    key: "log-summary",
    title: "日志只记录虚拟摘要",
    description:
      "事件日志只记录域名样例 key、固定解析视角、虚拟地址类别、证书状态和学习信号。",
  },
  {
    key: "no-real-dns",
    title: "不执行真实 DNS 查询",
    description:
      "实验不修改本机 DNS、hosts、代理、路由或防火墙，也不请求真实外部解析服务。",
  },
];

export function getDnsHijackVariantConfig(variant: DnsHijackVariantKey) {
  return dnsHijackVariantConfigs[variant];
}

export function getDnsHijackDomainObservationRows(
  variant: DnsHijackVariantKey,
): DnsHijackDomainObservationRow[] {
  return dnsHijackDomainOptions.map((domain) => ({
    key: domain.key,
    title: domain.title,
    displayDomain: domain.displayDomain,
    description: domain.description,
    focus: variant === "vuln" ? domain.vulnerableFocus : domain.fixedFocus,
  }));
}

export function createDnsHijackLearningProgress(
  config: DnsHijackVariantConfig,
): DnsHijackLearningProgressInput {
  return {
    variantKey: config.key,
    status: "in-progress",
    notes: `进入 ${config.title}`,
  };
}

export function createDnsHijackVerificationRecord(
  config: DnsHijackVariantConfig,
  result: DnsHijackResult,
): DnsHijackVerificationRecordInput {
  const details = {
    signal: result.signal,
    domainKey: result.domainKey,
    resolverProfile: result.resolverProfile,
    expectedAddressCategory: result.resolution.expectedAddressCategory,
    resolvedAddressCategory: result.resolution.resolvedAddressCategory,
    certificateStatus: result.resolution.certificateStatus,
    anomalyDetected: result.resolution.anomalyDetected,
  };

  if (config.key === "vuln") {
    return {
      variantKey: config.key,
      result: "passed",
      summary: "漏洞版展示了固定域名样例被错误虚拟解析和证书不匹配的风险信号。",
      details,
    };
  }

  return {
    variantKey: config.key,
    result: "passed",
    summary: "修复版展示了异常解析阻断或可信解析恢复的防御信号。",
    details,
  };
}

export function formatDnsHijackSignal(signal: DnsHijackSignal) {
  const labels: Record<DnsHijackSignal, string> = {
    "dns-hijack-workbench-reviewed": "已进入 DNS 劫持前端工作台",
    "dns-hijack-fixed-samples-reviewed": "已确认固定域名样例边界",
    "dns-hijack-no-real-dns-confirmed": "已确认不执行真实 DNS 查询",
    "dns-hijack-resolution-misdirected": "漏洞版解析被误导",
    "dns-hijack-certificate-mismatch-visible": "漏洞版证书不匹配可见",
    "dns-hijack-trusted-resolution-restored": "修复版可信解析已恢复",
    "dns-hijack-anomaly-blocked": "修复版异常解析已阻断",
    "dns-hijack-domain-blocked": "非固定域名样例已被阻断",
    "dns-hijack-normal-resolution-returned": "虚拟解析结果正常返回",
  };

  return labels[signal];
}
