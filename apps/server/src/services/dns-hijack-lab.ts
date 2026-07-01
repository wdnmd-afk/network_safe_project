export type DnsHijackVariantKey = "vuln" | "fixed";

export type DnsHijackResolverProfile = "public-cache" | "trusted-resolver";

export type DnsHijackDomainKey =
  | "customer-portal"
  | "update-service"
  | "internal-dashboard";

export type DnsHijackCertificateStatus = "trusted" | "mismatch" | "unknown";

export type DnsHijackSignal =
  | "dns-hijack-resolution-misdirected"
  | "dns-hijack-certificate-mismatch-visible"
  | "dns-hijack-trusted-resolution-restored"
  | "dns-hijack-anomaly-blocked"
  | "dns-hijack-domain-blocked"
  | "dns-hijack-normal-resolution-returned";

export type DnsHijackStatus = "ok" | "blocked";

export type DnsHijackInput = {
  userId: string;
  variantKey: DnsHijackVariantKey;
  domainKey: string;
  resolverProfile: string;
};

export type DnsHijackDomainSummary = {
  domainKey: DnsHijackDomainKey;
  title: string;
  displayDomain: string;
  businessPurpose: string;
  expectedAddressCategory: string;
  certificateExpectation: DnsHijackCertificateStatus;
  riskNotes: string;
};

export type DnsHijackResolution = {
  resolverProfile: string;
  sourceTrust: "untrusted-cache" | "trusted-source" | "unknown";
  expectedAddressCategory: string;
  resolvedAddressCategory: string;
  certificateStatus: DnsHijackCertificateStatus;
  anomalyDetected: boolean;
  matchedControlledSample: boolean;
};

export type DnsHijackAudit = {
  trustedSource: boolean;
  addressMatchesExpected: boolean;
  certificateTrusted: boolean;
  blockedByPolicy: boolean;
  learningHint: string;
};

export type DnsHijackResult = {
  status: DnsHijackStatus;
  variantKey: DnsHijackVariantKey;
  domainKey: string;
  resolverProfile: string;
  domain: DnsHijackDomainSummary | null;
  resolution: DnsHijackResolution;
  audit: DnsHijackAudit;
  signal: DnsHijackSignal;
  decision: "accepted" | "blocked";
  message: string;
  nextStep: string;
  blockedReason?: string;
};

export type DnsHijackLabService = {
  resolveDomain(input: DnsHijackInput): Promise<DnsHijackResult>;
};

type DnsHijackDomainSample = DnsHijackDomainSummary & {
  vulnerableAddressCategory: string;
  vulnerableCertificateStatus: DnsHijackCertificateStatus;
};

export const dnsHijackDefaultDomainKey: DnsHijackDomainKey = "customer-portal";
export const dnsHijackDefaultResolverProfile: DnsHijackResolverProfile =
  "public-cache";

const allowedResolverProfiles: DnsHijackResolverProfile[] = [
  "public-cache",
  "trusted-resolver",
];

const virtualDomainSamples = new Map<DnsHijackDomainKey, DnsHijackDomainSample>(
  [
    [
      "customer-portal",
      {
        domainKey: "customer-portal",
        title: "客户门户入口",
        displayDomain: "portal.example.test",
        businessPurpose: "模拟客户登录和工单入口。",
        expectedAddressCategory: "trusted-customer-portal",
        vulnerableAddressCategory: "shadow-customer-portal",
        certificateExpectation: "trusted",
        vulnerableCertificateStatus: "mismatch",
        riskNotes: "错误解析会把用户带到相似的虚拟入口，证书不匹配是关键异常信号。",
      },
    ],
    [
      "update-service",
      {
        domainKey: "update-service",
        title: "更新服务入口",
        displayDomain: "update.example.test",
        businessPurpose: "模拟客户端更新包检查入口。",
        expectedAddressCategory: "trusted-update-service",
        vulnerableAddressCategory: "shadow-update-mirror",
        certificateExpectation: "trusted",
        vulnerableCertificateStatus: "mismatch",
        riskNotes: "更新入口被错误解析会让学习者观察供应链入口被误导的风险。",
      },
    ],
    [
      "internal-dashboard",
      {
        domainKey: "internal-dashboard",
        title: "内部看板入口",
        displayDomain: "dashboard.example.test",
        businessPurpose: "模拟内部运营看板访问入口。",
        expectedAddressCategory: "trusted-internal-dashboard",
        vulnerableAddressCategory: "external-lookalike-dashboard",
        certificateExpectation: "trusted",
        vulnerableCertificateStatus: "unknown",
        riskNotes: "内部入口出现外部相似地址类别时，应触发异常解析审计。",
      },
    ],
  ],
);

function isDomainKey(value: string): value is DnsHijackDomainKey {
  return virtualDomainSamples.has(value as DnsHijackDomainKey);
}

function isResolverProfile(value: string): value is DnsHijackResolverProfile {
  return allowedResolverProfiles.includes(value as DnsHijackResolverProfile);
}

function createUnknownResolution(input: {
  resolverProfile: string;
}): DnsHijackResolution {
  return {
    resolverProfile: input.resolverProfile,
    sourceTrust: "unknown",
    expectedAddressCategory: "blocked",
    resolvedAddressCategory: "blocked",
    certificateStatus: "unknown",
    anomalyDetected: true,
    matchedControlledSample: false,
  };
}

function createBlockedResult(input: {
  variantKey: DnsHijackVariantKey;
  domainKey: string;
  resolverProfile: string;
  blockedReason: string;
}): DnsHijackResult {
  const safeDomainKey = isDomainKey(input.domainKey)
    ? input.domainKey
    : "blocked-domain";
  const safeResolverProfile = isResolverProfile(input.resolverProfile)
    ? input.resolverProfile
    : "blocked-resolver";

  return {
    status: "blocked",
    variantKey: input.variantKey,
    domainKey: safeDomainKey,
    resolverProfile: safeResolverProfile,
    domain: null,
    resolution: createUnknownResolution({
      resolverProfile: safeResolverProfile,
    }),
    audit: {
      trustedSource: false,
      addressMatchesExpected: false,
      certificateTrusted: false,
      blockedByPolicy: true,
      learningHint: "该域名样例或解析视角不在固定允许列表中，实验不会执行真实 DNS 查询。",
    },
    signal: "dns-hijack-domain-blocked",
    decision: "blocked",
    message: "该域名样例或解析视角不在允许列表中，实验未执行任何真实 DNS 请求。",
    nextStep: "选择页面或文档中列出的固定域名样例和固定解析视角，再观察解析差异。",
    blockedReason: input.blockedReason,
  };
}

function createResolution(input: {
  sample: DnsHijackDomainSample;
  resolverProfile: DnsHijackResolverProfile;
}): DnsHijackResolution {
  if (input.resolverProfile === "trusted-resolver") {
    return {
      resolverProfile: input.resolverProfile,
      sourceTrust: "trusted-source",
      expectedAddressCategory: input.sample.expectedAddressCategory,
      resolvedAddressCategory: input.sample.expectedAddressCategory,
      certificateStatus: input.sample.certificateExpectation,
      anomalyDetected: false,
      matchedControlledSample: true,
    };
  }

  return {
    resolverProfile: input.resolverProfile,
    sourceTrust: "untrusted-cache",
    expectedAddressCategory: input.sample.expectedAddressCategory,
    resolvedAddressCategory: input.sample.vulnerableAddressCategory,
    certificateStatus: input.sample.vulnerableCertificateStatus,
    anomalyDetected: true,
    matchedControlledSample: true,
  };
}

function createAudit(input: {
  resolution: DnsHijackResolution;
  blockedByPolicy: boolean;
}): DnsHijackAudit {
  const trustedSource = input.resolution.sourceTrust === "trusted-source";
  const addressMatchesExpected =
    input.resolution.resolvedAddressCategory ===
    input.resolution.expectedAddressCategory;
  const certificateTrusted = input.resolution.certificateStatus === "trusted";

  return {
    trustedSource,
    addressMatchesExpected,
    certificateTrusted,
    blockedByPolicy: input.blockedByPolicy,
    learningHint: input.blockedByPolicy
      ? "修复版识别到不可信解析结果，已在虚拟审计层阻断继续访问。"
      : addressMatchesExpected && certificateTrusted
        ? "解析结果和证书状态均符合可信预期。"
        : "解析结果或证书状态偏离预期，应被记录为异常解析信号。",
  };
}

function resolveSignal(input: {
  variantKey: DnsHijackVariantKey;
  resolution: DnsHijackResolution;
  blockedByPolicy: boolean;
}): DnsHijackSignal {
  if (input.blockedByPolicy) {
    return "dns-hijack-anomaly-blocked";
  }

  if (!input.resolution.anomalyDetected) {
    return input.variantKey === "fixed"
      ? "dns-hijack-trusted-resolution-restored"
      : "dns-hijack-normal-resolution-returned";
  }

  if (input.resolution.certificateStatus === "mismatch") {
    return "dns-hijack-certificate-mismatch-visible";
  }

  return "dns-hijack-resolution-misdirected";
}

function createMessage(input: {
  signal: DnsHijackSignal;
  variantKey: DnsHijackVariantKey;
}) {
  if (input.signal === "dns-hijack-certificate-mismatch-visible") {
    return "漏洞版接受了错误虚拟解析结果，证书状态不匹配成为攻击方和防御方都应观察的异常信号。";
  }

  if (input.signal === "dns-hijack-resolution-misdirected") {
    return "漏洞版把固定域名样例解析到错误虚拟地址类别，用户可能被引向错误入口。";
  }

  if (input.signal === "dns-hijack-anomaly-blocked") {
    return "修复版识别到不可信解析来源、地址类别偏离或证书异常，并在虚拟策略中阻断访问。";
  }

  if (input.signal === "dns-hijack-trusted-resolution-restored") {
    return "修复版使用可信解析视角恢复到期望虚拟地址类别，并通过证书状态校验。";
  }

  return input.variantKey === "fixed"
    ? "修复版返回正常可信解析结果，可用于复盘可信解析源的作用。"
    : "当前固定样例返回正常解析结果，可切换到 public-cache 观察错误解析风险。";
}

function createNextStep(input: {
  signal: DnsHijackSignal;
  variantKey: DnsHijackVariantKey;
}) {
  if (input.variantKey === "vuln") {
    return "使用同一域名样例切换到修复版，观察可信解析源和异常审计如何改变结果。";
  }

  if (input.signal === "dns-hijack-anomaly-blocked") {
    return "切换到 trusted-resolver 解析视角，观察可信解析恢复后的地址类别和证书状态。";
  }

  return "对比漏洞版 public-cache 解析视角，复盘错误解析、证书异常和审计阻断之间的关系。";
}

export function createDnsHijackLabService(): DnsHijackLabService {
  return {
    async resolveDomain(input) {
      const domainKey = input.domainKey.trim();
      const resolverProfile = input.resolverProfile.trim();

      if (!isDomainKey(domainKey)) {
        return createBlockedResult({
          variantKey: input.variantKey,
          domainKey,
          resolverProfile,
          blockedReason: "domain-not-allowed",
        });
      }

      if (!isResolverProfile(resolverProfile)) {
        return createBlockedResult({
          variantKey: input.variantKey,
          domainKey,
          resolverProfile,
          blockedReason: "resolver-not-allowed",
        });
      }

      const sample = virtualDomainSamples.get(domainKey);

      if (!sample) {
        return createBlockedResult({
          variantKey: input.variantKey,
          domainKey,
          resolverProfile,
          blockedReason: "domain-not-found",
        });
      }

      const resolution = createResolution({
        sample,
        resolverProfile,
      });
      const blockedByPolicy =
        input.variantKey === "fixed" && resolution.anomalyDetected;
      const audit = createAudit({
        resolution,
        blockedByPolicy,
      });
      const signal = resolveSignal({
        variantKey: input.variantKey,
        resolution,
        blockedByPolicy,
      });

      return {
        status: blockedByPolicy ? "blocked" : "ok",
        variantKey: input.variantKey,
        domainKey,
        resolverProfile,
        domain: {
          domainKey: sample.domainKey,
          title: sample.title,
          displayDomain: sample.displayDomain,
          businessPurpose: sample.businessPurpose,
          expectedAddressCategory: sample.expectedAddressCategory,
          certificateExpectation: sample.certificateExpectation,
          riskNotes: sample.riskNotes,
        },
        resolution,
        audit,
        signal,
        decision: blockedByPolicy ? "blocked" : "accepted",
        message: createMessage({
          signal,
          variantKey: input.variantKey,
        }),
        nextStep: createNextStep({
          signal,
          variantKey: input.variantKey,
        }),
        ...(blockedByPolicy ? { blockedReason: "anomaly-detected" } : {}),
      };
    },
  };
}
