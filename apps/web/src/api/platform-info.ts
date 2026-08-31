/**
 * 平台运行与数据状态 API 客户端（LT-051）。
 *
 * 对应服务端 GET /api/platform-info。该接口只返回可安全公开的运行元信息与
 * 由元数据现算的统计，不含任何环境变量取值、凭据或本机路径。
 */

export type PlatformBuildInfo = {
  service: string;
  version: string;
  nodeVersion: string;
  appEnv: string;
  startedAt: string;
  uptimeSeconds: number;
};

export type PlatformDataInfo = {
  labs: number;
  categories: number;
  enabledVariants: number;
  webEntrypoints: number;
  apiEntrypoints: number;
  statusCounts: Record<string, number>;
  modeCounts: Record<string, number>;
};

export type PlatformConsistencyInfo = {
  status: "consistent" | "needs-attention";
  labsMissingWebEntrypoint: string[];
  enabledVariantsWithoutEntry: number;
  inProgressLabs: number;
};

export type PlatformInfo = {
  status: "ok";
  build: PlatformBuildInfo;
  data: PlatformDataInfo;
  consistency: PlatformConsistencyInfo;
  timestamp: string;
};

export async function fetchPlatformInfo(): Promise<PlatformInfo> {
  const response = await fetch("/api/platform-info");

  if (!response.ok) {
    throw new Error(`request failed with status ${response.status}`);
  }

  return (await response.json()) as PlatformInfo;
}
