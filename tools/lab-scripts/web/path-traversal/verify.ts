import { pathToFileURL } from "node:url";

export type PathTraversalVerificationCase = {
  key: string;
  variantKey: "vuln" | "fixed";
  method: "POST";
  path: string;
  body: {
    requestedPath: string;
  };
  expectedStatus: number;
  expectedSignal:
    | "path-traversal-normal-file-read"
    | "path-traversal-sensitive-file-exposed"
    | "path-traversal-normalized-blocked";
  description: string;
};

export const pathTraversalNormalSample = "user-guide.md";
export const pathTraversalControlledPayload = "../internal/admin-note.txt";

export const pathTraversalVerificationCases: PathTraversalVerificationCase[] = [
  {
    key: "path-traversal-vuln-normal-read",
    variantKey: "vuln",
    method: "POST",
    path: "/api/labs/web/path-traversal/vuln/read",
    body: {
      requestedPath: pathTraversalNormalSample,
    },
    expectedStatus: 200,
    expectedSignal: "path-traversal-normal-file-read",
    description: "漏洞版正常公开文档应被读取。",
  },
  {
    key: "path-traversal-vuln-sensitive-exposed",
    variantKey: "vuln",
    method: "POST",
    path: "/api/labs/web/path-traversal/vuln/read",
    body: {
      requestedPath: pathTraversalControlledPayload,
    },
    expectedStatus: 200,
    expectedSignal: "path-traversal-sensitive-file-exposed",
    description: "漏洞版受控遍历样例会读取内部模拟文档。",
  },
  {
    key: "path-traversal-fixed-normalized-blocked",
    variantKey: "fixed",
    method: "POST",
    path: "/api/labs/web/path-traversal/fixed/read",
    body: {
      requestedPath: pathTraversalControlledPayload,
    },
    expectedStatus: 403,
    expectedSignal: "path-traversal-normalized-blocked",
    description: "修复版应在规范化后阻断逃逸 public 目录的读取请求。",
  },
];

export const pathTraversalVerificationNotes = [
  "这些配置只描述本项目本机接口的预期行为。",
  "执行真实请求前需要先通过平台登录获得本机演示账号 token。",
  "本文件不读取真实文件系统，不提交真实系统敏感路径，不访问外部目标。",
];

export function getPathTraversalVerificationPlan() {
  return {
    labKey: "web.path-traversal",
    scope: "localhost-only",
    safeBoundary:
      "仅验证本项目本机虚拟文档读取接口的校验差异，不读取真实文件系统，不访问外部目标。",
    cases: pathTraversalVerificationCases,
    notes: pathTraversalVerificationNotes,
  };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  console.log(JSON.stringify(getPathTraversalVerificationPlan(), null, 2));
}
