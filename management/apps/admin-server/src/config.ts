import "dotenv/config";

/** 只允许回环地址：admin 账号密码弱且可读全部事件日志 */
const loopbackHosts = new Set(["127.0.0.1", "localhost", "::1"]);

export function assertLoopbackHost(host: string) {
  if (!loopbackHosts.has(host)) {
    throw new Error(
      `ADMIN_SERVER_HOST 必须是回环地址（127.0.0.1 / localhost / ::1），当前为 ${host}。` +
        "管理端账号可读取全部用户的事件日志，禁止对外监听。",
    );
  }

  return host;
}

export function readNumberEnv(value: string | undefined, fallback: number) {
  const parsed = Number(value);

  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

export type ServerConfig = {
  host: string;
  port: number;
  tokenSecret: string;
  tokenTtlMs: number;
  mainSiteOrigin: string;
  appEnv: string;
};

export function loadServerConfig(
  env: NodeJS.ProcessEnv = process.env,
): ServerConfig {
  const host = assertLoopbackHost(env.ADMIN_SERVER_HOST ?? "127.0.0.1");
  const port = readNumberEnv(env.ADMIN_SERVER_PORT, 6681);
  const tokenSecret = env.ADMIN_TOKEN_SECRET ?? "";
  const appEnv = env.APP_ENV ?? "development";

  if (!tokenSecret) {
    if (appEnv === "production") {
      throw new Error("ADMIN_TOKEN_SECRET 在 production 下必须配置");
    }

    throw new Error(
      "缺少 ADMIN_TOKEN_SECRET。请复制 .env.example 为 apps/admin-server/.env 并填入随机值。",
    );
  }

  return {
    host,
    port,
    tokenSecret,
    tokenTtlMs: readNumberEnv(env.ADMIN_TOKEN_TTL_SECONDS, 8 * 60 * 60) * 1000,
    mainSiteOrigin: env.MAIN_SITE_ORIGIN ?? "http://127.0.0.1:6667",
    appEnv,
  };
}
