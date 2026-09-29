import http from "node:http";
import https from "node:https";

/**
 * 读取 JSON 的最小 HTTP 客户端，基于 node:http。
 *
 * 刻意不用全局 fetch：Node 的 fetch（undici）按 Fetch 规范拦截「坏端口」，
 * 而主站固定端口 6667 落在 6665–6669 这段被拦名单内，用 fetch 访问主站
 * 会直接以 `bad port` 失败，导致主站可达性恒为不可达。
 */

export type JsonRequestResult = {
  ok: boolean;
  status: number;
  body: unknown;
};

export function requestJson(
  url: string,
  timeoutMs: number,
): Promise<JsonRequestResult> {
  const target = new URL(url);
  const client = target.protocol === "https:" ? https : http;

  return new Promise((resolve, reject) => {
    const request = client.request(
      target,
      { method: "GET", timeout: timeoutMs },
      (response) => {
        const chunks: Buffer[] = [];

        response.on("data", (chunk: Buffer) => {
          chunks.push(chunk);
        });
        response.on("end", () => {
          const status = response.statusCode ?? 0;
          const text = Buffer.concat(chunks).toString("utf8");

          if (status < 200 || status >= 300) {
            resolve({ ok: false, status, body: null });
            return;
          }

          try {
            resolve({ ok: true, status, body: JSON.parse(text) });
          } catch {
            resolve({ ok: false, status, body: null });
          }
        });
      },
    );

    request.on("timeout", () => {
      request.destroy(new Error(`request timed out after ${timeoutMs}ms`));
    });
    request.on("error", reject);
    request.end();
  });
}
