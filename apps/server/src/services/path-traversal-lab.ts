export type PathTraversalVariantKey = "vuln" | "fixed";

export type PathTraversalSignal =
  | "path-traversal-normal-file-read"
  | "path-traversal-sensitive-file-exposed"
  | "path-traversal-normalized-blocked"
  | "path-traversal-file-not-found";

export type PathTraversalStatus = "ok" | "blocked" | "not-found";

export type PathTraversalInput = {
  userId: string;
  variantKey: PathTraversalVariantKey;
  requestedPath: string;
};

export type PathTraversalInspection = {
  allowedRoot: string;
  normalizedPath: string;
  containsTraversalSequence: boolean;
  escapedAllowedRoot: boolean;
  requestedPathLength: number;
};

export type PathTraversalDocument = {
  path: string;
  title: string;
  classification: "public" | "internal";
  content: string;
  isSensitive: boolean;
};

export type PathTraversalResult = {
  status: PathTraversalStatus;
  variantKey: PathTraversalVariantKey;
  requestedPath: string;
  resolvedPath: string;
  inspection: PathTraversalInspection;
  document: PathTraversalDocument | null;
  signal: PathTraversalSignal;
  decision: "accepted" | "blocked" | "failed";
  message: string;
  nextStep: string;
  blockedReason?: string;
};

export type PathTraversalLabService = {
  readDocument(input: PathTraversalInput): Promise<PathTraversalResult>;
};

const allowedRoot = "public";

const virtualDocuments = new Map<string, PathTraversalDocument>([
  [
    "public/user-guide.md",
    {
      path: "public/user-guide.md",
      title: "SafeMart 用户指南",
      classification: "public",
      content: "公开文档：这里是帮助中心可正常预览的用户指南。",
      isSensitive: false,
    },
  ],
  [
    "public/return-policy.md",
    {
      path: "public/return-policy.md",
      title: "SafeMart 退换货说明",
      classification: "public",
      content: "公开文档：这里是售后退换货流程说明。",
      isSensitive: false,
    },
  ],
  [
    "internal/admin-note.txt",
    {
      path: "internal/admin-note.txt",
      title: "内部运维备忘录",
      classification: "internal",
      content:
        "内部模拟文档：这里不包含真实密钥，只用于观察目录遍历导致的越权读取信号。",
      isSensitive: true,
    },
  ],
]);

function normalizeSlashes(value: string) {
  return value.trim().replaceAll("\\", "/");
}

function normalizeVirtualPath(value: string) {
  const segments: string[] = [];

  for (const segment of normalizeSlashes(value).split("/")) {
    if (!segment || segment === ".") {
      continue;
    }

    if (segment === "..") {
      segments.pop();
      continue;
    }

    segments.push(segment);
  }

  return segments.join("/");
}

function resolveRequestedPath(requestedPath: string) {
  return normalizeVirtualPath(`${allowedRoot}/${requestedPath}`);
}

function inspectRequestedPath(requestedPath: string): PathTraversalInspection {
  const normalizedPath = resolveRequestedPath(requestedPath);
  const escapedAllowedRoot =
    normalizedPath !== allowedRoot && !normalizedPath.startsWith(`${allowedRoot}/`);

  return {
    allowedRoot,
    normalizedPath,
    containsTraversalSequence: normalizeSlashes(requestedPath)
      .split("/")
      .includes(".."),
    escapedAllowedRoot,
    requestedPathLength: requestedPath.length,
  };
}

export function createPathTraversalLabService(): PathTraversalLabService {
  return {
    async readDocument(input) {
      const requestedPath = normalizeSlashes(input.requestedPath);
      const inspection = inspectRequestedPath(requestedPath);

      if (input.variantKey === "fixed" && inspection.escapedAllowedRoot) {
        return {
          status: "blocked",
          variantKey: input.variantKey,
          requestedPath,
          resolvedPath: inspection.normalizedPath,
          inspection,
          document: null,
          signal: "path-traversal-normalized-blocked",
          decision: "blocked",
          message: "修复版在路径规范化后发现请求逃逸公开目录，已阻断读取。",
          nextStep: "切回漏洞版提交同样路径，观察未校验根目录时会暴露什么内容。",
          blockedReason: "path-escaped-allowed-root",
        };
      }

      const document = virtualDocuments.get(inspection.normalizedPath) ?? null;

      if (!document) {
        return {
          status: "not-found",
          variantKey: input.variantKey,
          requestedPath,
          resolvedPath: inspection.normalizedPath,
          inspection,
          document: null,
          signal: "path-traversal-file-not-found",
          decision: "failed",
          message: "虚拟文档索引中不存在该路径，读取失败。",
          nextStep: "填入正常公开文档或受控路径遍历样例，再观察后端判定。",
        };
      }

      if (document.isSensitive) {
        return {
          status: "ok",
          variantKey: input.variantKey,
          requestedPath,
          resolvedPath: inspection.normalizedPath,
          inspection,
          document,
          signal: "path-traversal-sensitive-file-exposed",
          decision: "accepted",
          message: "漏洞版未校验规范化后的根目录，内部模拟文档被越权读取。",
          nextStep: "切到修复版提交同样路径，观察后端如何阻断目录逃逸。",
        };
      }

      return {
        status: "ok",
        variantKey: input.variantKey,
        requestedPath,
        resolvedPath: inspection.normalizedPath,
        inspection,
        document,
        signal: "path-traversal-normal-file-read",
        decision: "accepted",
        message: "公开文档读取成功，路径仍位于允许的 public 目录内。",
        nextStep: "填入路径遍历样例，观察漏洞版和修复版对根目录逃逸的判断差异。",
      };
    },
  };
}
