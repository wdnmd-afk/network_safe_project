import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * 平台构建与运行信息（LT-051）。
 *
 * 只暴露可安全公开的运行元信息：版本号、Node 版本、运行环境标识、启动时间。
 * 严格排除任何秘密来源——不读取 DATABASE_URL、AUTH_TOKEN_SECRET、
 * MYSQL_CLI_PATH 等环境变量，也不暴露本机绝对路径。
 *
 * 该模块在 src/config 与编译后的 dist/config 下到 package.json 的相对深度
 * 一致，因此同一路径在开发与生产模式下都成立。
 */

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const packageJsonPath = path.resolve(currentDir, "..", "..", "package.json");

function readPackageVersion() {
  try {
    const raw = readFileSync(packageJsonPath, "utf8");
    const parsed = JSON.parse(raw) as { version?: unknown; name?: unknown };

    return {
      name: typeof parsed.name === "string" ? parsed.name : "unknown",
      version: typeof parsed.version === "string" ? parsed.version : "unknown",
    };
  } catch {
    // 读取失败不应让状态接口整体不可用；退化为 unknown 并保持其余字段可用
    return { name: "unknown", version: "unknown" };
  }
}

const packageInfo = readPackageVersion();

// 进程启动时刻固定一次，用于计算运行时长
const processStartedAt = new Date();

export type BuildInfo = {
  service: string;
  version: string;
  nodeVersion: string;
  appEnv: string;
  startedAt: string;
  uptimeSeconds: number;
};

export function getBuildInfo(): BuildInfo {
  return {
    service: packageInfo.name,
    version: packageInfo.version,
    nodeVersion: process.version,
    // 只暴露环境标识本身，不暴露任何其他环境变量取值
    appEnv: process.env.APP_ENV ?? process.env.NODE_ENV ?? "unknown",
    startedAt: processStartedAt.toISOString(),
    uptimeSeconds: Math.max(
      0,
      Math.floor((Date.now() - processStartedAt.getTime()) / 1000),
    ),
  };
}
