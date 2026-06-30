export type PortScanVariantKey = "vuln" | "fixed";

export type PortScanProfile = "quick-observe" | "surface-review";

export type PortScanTargetKey =
  | "office-gateway"
  | "admin-node"
  | "hardened-service";

export type PortScanSignal =
  | "port-scan-exposure-expanded"
  | "port-scan-management-surface-visible"
  | "port-scan-surface-reduced"
  | "port-scan-target-blocked"
  | "port-scan-normal-inventory-returned";

export type PortScanStatus = "ok" | "blocked";

export type PortScanInput = {
  userId: string;
  variantKey: PortScanVariantKey;
  targetKey: string;
  scanProfile: string;
};

export type PortScanVirtualPort = {
  port: number;
  protocol: "tcp";
  serviceLabel: string;
  exposure: "public" | "restricted" | "internal-only";
  riskLevel: "low" | "medium" | "high" | "critical";
  learningHint: string;
};

export type PortScanTargetSummary = {
  targetKey: PortScanTargetKey;
  title: string;
  profile: "exposed" | "hardened" | "baseline";
  description: string;
};

export type PortScanSummary = {
  virtualPortCount: number;
  openPortCount: number;
  restrictedPortCount: number;
  highRiskPortCount: number;
  exposureScore: number;
  matchedControlledSample: boolean;
};

export type PortScanResult = {
  status: PortScanStatus;
  variantKey: PortScanVariantKey;
  targetKey: string;
  scanProfile: string;
  target: PortScanTargetSummary | null;
  ports: PortScanVirtualPort[];
  summary: PortScanSummary;
  signal: PortScanSignal;
  decision: "accepted" | "blocked";
  message: string;
  nextStep: string;
  blockedReason?: string;
};

export type PortScanLabService = {
  observeExposure(input: PortScanInput): Promise<PortScanResult>;
};

type VirtualAssetVariant = {
  target: PortScanTargetSummary;
  ports: PortScanVirtualPort[];
};

type VirtualAsset = Record<PortScanVariantKey, VirtualAssetVariant>;

export const portScanDefaultTargetKey = "admin-node";
export const portScanDefaultProfile: PortScanProfile = "surface-review";

const allowedScanProfiles: PortScanProfile[] = [
  "quick-observe",
  "surface-review",
];

const virtualAssets = new Map<PortScanTargetKey, VirtualAsset>([
  [
    "office-gateway",
    {
      vuln: {
        target: {
          targetKey: "office-gateway",
          title: "虚拟办公网关",
          profile: "exposed",
          description: "模拟办公入口同时暴露远程管理和打印服务的状态。",
        },
        ports: [
          createPort(80, "业务入口", "public", "low", "公开 HTTP 入口用于观察基础业务面。"),
          createPort(443, "业务入口", "public", "low", "公开 HTTPS 入口属于必要业务暴露。"),
          createPort(3389, "远程管理", "public", "high", "远程管理端口公开会扩大攻击面。"),
          createPort(9100, "打印服务", "public", "high", "办公设备服务暴露会泄露资产线索。"),
        ],
      },
      fixed: {
        target: {
          targetKey: "office-gateway",
          title: "虚拟办公网关",
          profile: "hardened",
          description: "模拟办公入口只保留必要业务面，管理服务被隔离。",
        },
        ports: [
          createPort(443, "业务入口", "public", "low", "只保留 HTTPS 业务入口。"),
          createPort(3389, "远程管理", "restricted", "medium", "远程管理转入受控访问面。"),
        ],
      },
    },
  ],
  [
    "admin-node",
    {
      vuln: {
        target: {
          targetKey: "admin-node",
          title: "虚拟后台管理节点",
          profile: "exposed",
          description: "模拟后台节点暴露管理、数据库和调试入口的状态。",
        },
        ports: [
          createPort(443, "管理入口", "public", "medium", "管理入口公开可被持续枚举。"),
          createPort(22, "远程维护", "public", "high", "远程维护端口公开会增加凭据攻击风险。"),
          createPort(3306, "数据库服务", "public", "critical", "数据库端口公开是高风险暴露面。"),
          createPort(8080, "调试控制台", "public", "high", "调试控制台暴露会泄露管理面线索。"),
        ],
      },
      fixed: {
        target: {
          targetKey: "admin-node",
          title: "虚拟后台管理节点",
          profile: "hardened",
          description: "模拟后台节点经过最小暴露面治理后的状态。",
        },
        ports: [
          createPort(443, "管理入口", "restricted", "medium", "管理入口转入受控访问范围。"),
          createPort(22, "远程维护", "internal-only", "medium", "远程维护仅保留在内部维护面。"),
          createPort(3306, "数据库服务", "internal-only", "medium", "数据库服务不再公开暴露。"),
        ],
      },
    },
  ],
  [
    "hardened-service",
    {
      vuln: {
        target: {
          targetKey: "hardened-service",
          title: "虚拟最小化服务",
          profile: "baseline",
          description: "模拟只暴露必要业务入口的基线资产。",
        },
        ports: [
          createPort(443, "业务入口", "public", "low", "公开 HTTPS 入口属于必要业务面。"),
          createPort(9090, "指标服务", "restricted", "medium", "指标服务应限制在内部观察面。"),
        ],
      },
      fixed: {
        target: {
          targetKey: "hardened-service",
          title: "虚拟最小化服务",
          profile: "baseline",
          description: "模拟最小暴露面治理后的稳定基线。",
        },
        ports: [
          createPort(443, "业务入口", "public", "low", "公开 HTTPS 入口属于必要业务面。"),
          createPort(9090, "指标服务", "internal-only", "medium", "指标服务仅保留在内部观察面。"),
        ],
      },
    },
  ],
]);

function createPort(
  port: number,
  serviceLabel: string,
  exposure: PortScanVirtualPort["exposure"],
  riskLevel: PortScanVirtualPort["riskLevel"],
  learningHint: string,
): PortScanVirtualPort {
  return {
    port,
    protocol: "tcp",
    serviceLabel,
    exposure,
    riskLevel,
    learningHint,
  };
}

function isTargetKey(value: string): value is PortScanTargetKey {
  return virtualAssets.has(value as PortScanTargetKey);
}

function isScanProfile(value: string): value is PortScanProfile {
  return allowedScanProfiles.includes(value as PortScanProfile);
}

function filterPortsByProfile(
  ports: PortScanVirtualPort[],
  scanProfile: PortScanProfile,
) {
  if (scanProfile === "quick-observe") {
    return ports.filter((port) => port.exposure === "public");
  }

  return ports;
}

function isHighRiskPort(port: PortScanVirtualPort) {
  return port.riskLevel === "high" || port.riskLevel === "critical";
}

function createSummary(input: {
  targetKey: PortScanTargetKey;
  ports: PortScanVirtualPort[];
}): PortScanSummary {
  const publicPorts = input.ports.filter((port) => port.exposure === "public");
  const restrictedPorts = input.ports.filter(
    (port) => port.exposure !== "public",
  );
  const highRiskPorts = input.ports.filter(isHighRiskPort);
  const exposureScore =
    publicPorts.length * 20 +
    restrictedPorts.length * 8 +
    highRiskPorts.length * 25;

  return {
    virtualPortCount: input.ports.length,
    openPortCount: publicPorts.length,
    restrictedPortCount: restrictedPorts.length,
    highRiskPortCount: highRiskPorts.length,
    exposureScore,
    matchedControlledSample: input.targetKey !== "hardened-service",
  };
}

function createBlockedResult(input: {
  variantKey: PortScanVariantKey;
  targetKey: string;
  scanProfile: string;
  blockedReason: string;
}): PortScanResult {
  const safeTargetKey = isTargetKey(input.targetKey)
    ? input.targetKey
    : "blocked-target";
  const safeScanProfile = isScanProfile(input.scanProfile)
    ? input.scanProfile
    : "blocked-profile";

  return {
    status: "blocked",
    variantKey: input.variantKey,
    targetKey: safeTargetKey,
    scanProfile: safeScanProfile,
    target: null,
    ports: [],
    summary: {
      virtualPortCount: 0,
      openPortCount: 0,
      restrictedPortCount: 0,
      highRiskPortCount: 0,
      exposureScore: 0,
      matchedControlledSample: false,
    },
    signal: "port-scan-target-blocked",
    decision: "blocked",
    message: "该虚拟目标或观察模式不在允许列表中，实验未执行任何真实网络探测。",
    nextStep: "选择页面提供的固定虚拟资产和固定观察模式，再观察暴露面差异。",
    blockedReason: input.blockedReason,
  };
}

function resolveSignal(input: {
  variantKey: PortScanVariantKey;
  targetKey: PortScanTargetKey;
  summary: PortScanSummary;
}): PortScanSignal {
  if (input.variantKey === "fixed") {
    return input.targetKey === "hardened-service"
      ? "port-scan-normal-inventory-returned"
      : "port-scan-surface-reduced";
  }

  if (input.summary.highRiskPortCount > 0 && input.targetKey === "admin-node") {
    return "port-scan-management-surface-visible";
  }

  if (input.summary.highRiskPortCount > 0) {
    return "port-scan-exposure-expanded";
  }

  return "port-scan-normal-inventory-returned";
}

function createMessage(input: {
  signal: PortScanSignal;
  variantKey: PortScanVariantKey;
}) {
  if (input.signal === "port-scan-management-surface-visible") {
    return "漏洞版虚拟后台节点暴露了管理、维护或数据库端口，攻击方可据此推断高价值管理面。";
  }

  if (input.signal === "port-scan-exposure-expanded") {
    return "漏洞版虚拟资产暴露了不必要服务，整体可见攻击面被扩大。";
  }

  if (input.signal === "port-scan-surface-reduced") {
    return "修复版只保留必要业务入口，并将管理或内部服务收敛到受控访问面。";
  }

  return input.variantKey === "fixed"
    ? "修复版返回最小化后的虚拟资产清单，可用于复盘暴露面治理效果。"
    : "虚拟资产清单观察完成，当前样例未展示高风险公开暴露面。";
}

function createNextStep(input: {
  signal: PortScanSignal;
  variantKey: PortScanVariantKey;
}) {
  if (input.variantKey === "vuln") {
    return "切换到修复版提交同样目标，观察公开端口数量和高风险端口数量如何收敛。";
  }

  if (input.signal === "port-scan-surface-reduced") {
    return "对比漏洞版同一目标，复盘哪些端口从公开暴露变成受控或内部可见。";
  }

  return "选择后台管理节点或办公网关样例，观察高风险暴露面和治理后的差异。";
}

export function createPortScanLabService(): PortScanLabService {
  return {
    async observeExposure(input) {
      const targetKey = input.targetKey.trim();
      const scanProfile = input.scanProfile.trim();

      if (!isTargetKey(targetKey)) {
        return createBlockedResult({
          variantKey: input.variantKey,
          targetKey,
          scanProfile,
          blockedReason: "target-not-allowed",
        });
      }

      if (!isScanProfile(scanProfile)) {
        return createBlockedResult({
          variantKey: input.variantKey,
          targetKey,
          scanProfile,
          blockedReason: "profile-not-allowed",
        });
      }

      const asset = virtualAssets.get(targetKey);
      const variantAsset = asset?.[input.variantKey];

      if (!variantAsset) {
        return createBlockedResult({
          variantKey: input.variantKey,
          targetKey,
          scanProfile,
          blockedReason: "variant-not-allowed",
        });
      }

      const ports = filterPortsByProfile(variantAsset.ports, scanProfile);
      const summary = createSummary({
        targetKey,
        ports,
      });
      const signal = resolveSignal({
        variantKey: input.variantKey,
        targetKey,
        summary,
      });

      return {
        status: "ok",
        variantKey: input.variantKey,
        targetKey,
        scanProfile,
        target: variantAsset.target,
        ports,
        summary,
        signal,
        decision: "accepted",
        message: createMessage({
          signal,
          variantKey: input.variantKey,
        }),
        nextStep: createNextStep({
          signal,
          variantKey: input.variantKey,
        }),
      };
    },
  };
}
