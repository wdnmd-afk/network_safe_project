import path from "node:path";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const testingRoot = path.resolve(path.dirname(currentFile), "..");
const repoRoot = path.resolve(testingRoot, "../..");

// 主项目是 management 的上级目录。E2E 需要同时驱动两侧四个进程：
// 主站前端/后端用于验证「停用是否真的全链路生效」。
const mainRepoRoot = process.env.NSP_ROOT ?? path.resolve(repoRoot, "..");

export const e2eRuntime = {
  repoRoot,
  mainRepoRoot,
  adminWebRoot: path.join(repoRoot, "apps/admin-web"),
  adminServerRoot: path.join(repoRoot, "apps/admin-server"),
  mainWebRoot: path.join(mainRepoRoot, "apps/web"),
  mainServerRoot: path.join(mainRepoRoot, "apps/server"),
  adminWebOrigin: "http://127.0.0.1:6680",
  adminApiOrigin: "http://127.0.0.1:6681",
  mainWebOrigin: "http://127.0.0.1:6670",
  mainApiOrigin: "http://127.0.0.1:6667",
  adminCredentials: {
    username: "admin",
    password: "123456",
  },
  // 该实验同时具备前台页面与 API，才能一次验证三层拦截
  targetLabKey: "web.sql-injection",
  targetCategory: "web",
  targetScene: "sql-injection",
  targetVariant: "vuln",
};

export const serviceChecks = [
  { label: "main-server", url: `${e2eRuntime.mainApiOrigin}/api/health` },
  { label: "main-web", url: `${e2eRuntime.mainWebOrigin}/` },
  { label: "admin-server", url: `${e2eRuntime.adminApiOrigin}/api/admin/health` },
  { label: "admin-web", url: `${e2eRuntime.adminWebOrigin}/` },
];
