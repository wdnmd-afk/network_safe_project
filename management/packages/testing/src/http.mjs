import http from "node:http";
import https from "node:https";

/**
 * 用 node:http 发请求，而不是 fetch。
 *
 * 原因：Node 的 fetch（undici）按 Fetch 规范拦截「坏端口」，主站端口 6667
 * 正好落在 6665–6669 这段被拦名单内，用 fetch 访问会直接以 `bad port` 失败。
 * 主项目 packages/testing 也基于 node:http，此处保持一致。
 */
export function httpRequest(
  url,
  { method = "GET", body, token, timeoutMs = 3000 } = {},
) {
  const target = new URL(url);
  const client = target.protocol === "https:" ? https : http;
  const payload = body === undefined ? undefined : JSON.stringify(body);
  const headers = {};

  if (payload) {
    headers["content-type"] = "application/json";
    headers["content-length"] = Buffer.byteLength(payload);
  }

  if (token) {
    headers.authorization = `Bearer ${token}`;
  }

  return new Promise((resolve, reject) => {
    const request = client.request(
      target,
      {
        method,
        timeout: timeoutMs,
        headers: Object.keys(headers).length > 0 ? headers : undefined,
      },
      (response) => {
        const chunks = [];

        response.on("data", (chunk) => {
          chunks.push(chunk);
        });
        response.on("end", () => {
          const text = Buffer.concat(chunks).toString("utf8");

          resolve({
            status: response.statusCode ?? 0,
            text,
            json() {
              return JSON.parse(text);
            },
          });
        });
      },
    );

    request.on("timeout", () => {
      request.destroy(new Error(`request timed out after ${timeoutMs}ms`));
    });
    request.on("error", reject);

    if (payload) {
      request.write(payload);
    }

    request.end();
  });
}
