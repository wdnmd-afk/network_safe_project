export type SsrfVariantKey = "vuln" | "fixed";

export type SsrfSignal =
  | "ssrf-public-resource-fetched"
  | "ssrf-internal-metadata-exposed"
  | "ssrf-private-target-blocked"
  | "ssrf-target-not-found"
  | "ssrf-invalid-url-blocked";

export type SsrfStatus = "ok" | "blocked" | "not-found";

export type SsrfInput = {
  userId: string;
  variantKey: SsrfVariantKey;
  targetUrl: string;
};

export type SsrfInspection = {
  normalizedUrl: string;
  protocol: string;
  hostname: string;
  pathname: string;
  allowedPublicHost: boolean;
  privateTarget: boolean;
  targetUrlLength: number;
};

export type SsrfResource = {
  url: string;
  title: string;
  resourceType: "public" | "internal";
  content: string;
  isSensitive: boolean;
};

export type SsrfResult = {
  status: SsrfStatus;
  variantKey: SsrfVariantKey;
  targetUrl: string;
  resolvedUrl: string;
  inspection: SsrfInspection;
  resource: SsrfResource | null;
  signal: SsrfSignal;
  decision: "accepted" | "blocked" | "failed";
  message: string;
  nextStep: string;
  blockedReason?: string;
};

export type SsrfLabService = {
  fetchResource(input: SsrfInput): Promise<SsrfResult>;
};

const allowedPublicHosts = new Set(["safe-mart-cdn.local"]);

const virtualResources = new Map<string, SsrfResource>([
  [
    "https://safe-mart-cdn.local/public/catalog.json",
    {
      url: "https://safe-mart-cdn.local/public/catalog.json",
      title: "SafeMart 公开商品目录",
      resourceType: "public",
      content: "公开资源：这里是运营素材预览可正常读取的商品目录摘要。",
      isSensitive: false,
    },
  ],
  [
    "https://safe-mart-cdn.local/public/banner.json",
    {
      url: "https://safe-mart-cdn.local/public/banner.json",
      title: "SafeMart 公开 Banner 配置",
      resourceType: "public",
      content: "公开资源：这里是首页 Banner 的公开配置摘要。",
      isSensitive: false,
    },
  ],
  [
    "http://169.254.169.254/latest/meta-data/iam/security-credentials/demo",
    {
      url: "http://169.254.169.254/latest/meta-data/iam/security-credentials/demo",
      title: "内部元数据模拟响应",
      resourceType: "internal",
      content:
        "内部模拟资源：这里不包含真实凭据，只用于观察 SSRF 访问内部元数据的风险信号。",
      isSensitive: true,
    },
  ],
]);

function createEmptyInspection(targetUrl: string): SsrfInspection {
  return {
    normalizedUrl: "",
    protocol: "",
    hostname: "",
    pathname: "",
    allowedPublicHost: false,
    privateTarget: false,
    targetUrlLength: targetUrl.length,
  };
}

function isPrivateIpv4(hostname: string) {
  const parts = hostname.split(".").map((part) => Number.parseInt(part, 10));

  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) {
    return false;
  }

  const [first, second] = parts;

  return (
    first === 10 ||
    first === 127 ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168)
  );
}

function isPrivateHost(hostname: string) {
  const normalized = hostname.toLowerCase();

  return (
    normalized === "localhost" ||
    normalized === "::1" ||
    normalized === "0.0.0.0" ||
    normalized.endsWith(".internal") ||
    normalized === "internal-admin.local" ||
    isPrivateIpv4(normalized)
  );
}

function inspectTargetUrl(targetUrl: string): SsrfInspection | null {
  let parsed: URL;

  try {
    parsed = new URL(targetUrl.trim());
  } catch {
    return null;
  }

  const protocol = parsed.protocol.toLowerCase();
  const hostname = parsed.hostname.toLowerCase();
  const pathname = parsed.pathname || "/";
  const normalizedUrl = `${protocol}//${hostname}${pathname}`;

  return {
    normalizedUrl,
    protocol,
    hostname,
    pathname,
    allowedPublicHost: allowedPublicHosts.has(hostname),
    privateTarget: isPrivateHost(hostname),
    targetUrlLength: targetUrl.length,
  };
}

function isUnsupportedProtocol(protocol: string) {
  return protocol !== "http:" && protocol !== "https:";
}

function shouldBlockFixedVariant(inspection: SsrfInspection) {
  return (
    isUnsupportedProtocol(inspection.protocol) ||
    inspection.privateTarget ||
    !inspection.allowedPublicHost
  );
}

export function createSsrfLabService(): SsrfLabService {
  return {
    async fetchResource(input) {
      const targetUrl = input.targetUrl.trim();
      const inspection = inspectTargetUrl(targetUrl);

      if (!inspection) {
        return {
          status: "blocked",
          variantKey: input.variantKey,
          targetUrl,
          resolvedUrl: "",
          inspection: createEmptyInspection(targetUrl),
          resource: null,
          signal: "ssrf-invalid-url-blocked",
          decision: "blocked",
          message: "URL 格式无效，实验入口已拒绝请求。",
          nextStep: "填入公开资源样例或受控 SSRF 样例，再观察后端目标检查结果。",
          blockedReason: "invalid-url",
        };
      }

      if (input.variantKey === "fixed" && shouldBlockFixedVariant(inspection)) {
        return {
          status: "blocked",
          variantKey: input.variantKey,
          targetUrl,
          resolvedUrl: inspection.normalizedUrl,
          inspection,
          resource: null,
          signal: "ssrf-private-target-blocked",
          decision: "blocked",
          message: "修复版只允许访问公开白名单主机，已阻断内部或非白名单目标。",
          nextStep: "切回漏洞版提交同样 URL，观察服务端代请求为什么会暴露内部资源。",
          blockedReason: inspection.privateTarget
            ? "private-target"
            : "host-not-allowlisted",
        };
      }

      const resource = virtualResources.get(inspection.normalizedUrl) ?? null;

      if (!resource) {
        return {
          status: "not-found",
          variantKey: input.variantKey,
          targetUrl,
          resolvedUrl: inspection.normalizedUrl,
          inspection,
          resource: null,
          signal: "ssrf-target-not-found",
          decision: "failed",
          message: "虚拟资源表中不存在该目标，实验未执行真实网络请求。",
          nextStep: "填入公开资源样例或受控 SSRF 样例，再观察后端判定。",
        };
      }

      if (resource.isSensitive) {
        return {
          status: "ok",
          variantKey: input.variantKey,
          targetUrl,
          resolvedUrl: inspection.normalizedUrl,
          inspection,
          resource,
          signal: "ssrf-internal-metadata-exposed",
          decision: "accepted",
          message: "漏洞版未限制服务端请求目标，内部模拟元数据被读取。",
          nextStep: "切到修复版提交同样 URL，观察后端如何阻断内部目标。",
        };
      }

      return {
        status: "ok",
        variantKey: input.variantKey,
        targetUrl,
        resolvedUrl: inspection.normalizedUrl,
        inspection,
        resource,
        signal: "ssrf-public-resource-fetched",
        decision: "accepted",
        message: "公开白名单资源读取成功，目标属于允许的运营素材域。",
        nextStep: "填入 SSRF 攻击样例，观察漏洞版和修复版对内部目标的判断差异。",
      };
    },
  };
}
