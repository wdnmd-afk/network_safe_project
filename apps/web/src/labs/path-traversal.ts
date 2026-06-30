import type {
  PathTraversalResult,
  PathTraversalSignal,
  PathTraversalVariantKey,
} from "../api/path-traversal-lab";

export type { PathTraversalVariantKey };

export type PathTraversalVariantConfig = {
  key: PathTraversalVariantKey;
  title: string;
  badge: string;
  explanation: string;
  expectedSignal: string;
};

export type PathTraversalLearningProgressInput = {
  variantKey: PathTraversalVariantKey;
  status: "in-progress";
  notes: string;
};

export type PathTraversalVerificationRecordInput = {
  variantKey: PathTraversalVariantKey;
  result: "passed";
  summary: string;
  details: {
    signal: PathTraversalSignal;
    normalizedPath: string;
    escapedAllowedRoot: boolean;
  };
};

export const normalPathTraversalSample = "user-guide.md";
export const attackPathTraversalSample = "../internal/admin-note.txt";

const pathTraversalVariantConfigs: Record<
  PathTraversalVariantKey,
  PathTraversalVariantConfig
> = {
  vuln: {
    key: "vuln",
    title: "目录遍历漏洞版",
    badge: "未限制规范化后的根目录",
    explanation:
      "漏洞版模拟帮助中心文档预览接口直接拼接用户输入路径，规范化后没有确认最终路径仍在 public 目录内。",
    expectedSignal:
      "提交路径遍历样例后应出现 path-traversal-sensitive-file-exposed 信号，并看到内部模拟文档。",
  },
  fixed: {
    key: "fixed",
    title: "目录遍历修复版",
    badge: "规范化路径并限制公开根目录",
    explanation:
      "修复版在读取前规范化路径，并要求最终路径仍位于 public 目录下，逃逸公开目录的请求会被阻断。",
    expectedSignal:
      "提交路径遍历样例后应出现 path-traversal-normalized-blocked 信号。",
  },
};

export function getPathTraversalVariantConfig(variant: PathTraversalVariantKey) {
  return pathTraversalVariantConfigs[variant];
}

export function createPathTraversalLearningProgress(
  config: PathTraversalVariantConfig,
): PathTraversalLearningProgressInput {
  return {
    variantKey: config.key,
    status: "in-progress",
    notes: `进入 ${config.title}`,
  };
}

export function createPathTraversalVerificationRecord(
  config: PathTraversalVariantConfig,
  result: PathTraversalResult,
): PathTraversalVerificationRecordInput {
  if (config.key === "vuln") {
    return {
      variantKey: config.key,
      result: "passed",
      summary: "漏洞版接受了路径遍历样例，内部模拟文档被越权读取。",
      details: {
        signal: result.signal,
        normalizedPath: result.inspection.normalizedPath,
        escapedAllowedRoot: result.inspection.escapedAllowedRoot,
      },
    };
  }

  return {
    variantKey: config.key,
    result: "passed",
    summary: "修复版在规范化后阻断了逃逸 public 目录的读取请求。",
    details: {
      signal: result.signal,
      normalizedPath: result.inspection.normalizedPath,
      escapedAllowedRoot: result.inspection.escapedAllowedRoot,
    },
  };
}

export function formatPathTraversalSignal(signal: PathTraversalSignal) {
  const labels: Record<PathTraversalSignal, string> = {
    "path-traversal-normal-file-read": "公开文档正常读取",
    "path-traversal-sensitive-file-exposed": "漏洞版暴露了内部模拟文档",
    "path-traversal-normalized-blocked": "修复版阻断了目录逃逸",
    "path-traversal-file-not-found": "虚拟文档索引未命中",
  };

  return labels[signal];
}
