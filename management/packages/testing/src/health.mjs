import { httpRequest } from "./http.mjs";

export async function waitForUrl(
  url,
  { timeoutMs = 60_000, intervalMs = 400, requestTimeoutMs = 2_000 } = {},
) {
  const deadline = Date.now() + timeoutMs;
  let lastError = "unknown";

  while (Date.now() < deadline) {
    try {
      const response = await httpRequest(url, { timeoutMs: requestTimeoutMs });

      // 只要求服务有响应；登录态相关的 401 也说明进程已起
      if (response.status > 0 && response.status < 500) {
        return true;
      }

      lastError = `HTTP ${response.status}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error(`等待服务就绪超时：${url}（最后错误：${lastError}）`);
}

export async function isReachable(url) {
  try {
    await waitForUrl(url, {
      timeoutMs: 2_500,
      intervalMs: 250,
      requestTimeoutMs: 1_500,
    });
    return true;
  } catch {
    return false;
  }
}
