/**
 * 管理端 HTTP 客户端。
 *
 * token 由 session store 通过 setAuthToken 注入，避免 store → api → store 的循环依赖。
 */

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

function buildHeaders(init?: RequestInit) {
  const headers = new Headers(init?.headers);

  if (init?.body !== undefined && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  if (authToken) {
    headers.set("authorization", `Bearer ${authToken}`);
  }

  return headers;
}

async function readErrorMessage(response: Response) {
  try {
    const body = (await response.json()) as { message?: unknown };

    if (typeof body.message === "string" && body.message) {
      return body.message;
    }
  } catch {
    // 响应不是 JSON 时退回状态码描述
  }

  return `请求失败（HTTP ${response.status}）`;
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: buildHeaders(init),
  });

  if (!response.ok) {
    throw new ApiError(response.status, await readErrorMessage(response));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

/** 把筛选对象转成查询串；空值一律不发送，避免服务端把空串当成非法枚举 */
export function toQueryString(
  params: Record<string, string | number | boolean | undefined | null>,
) {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") {
      continue;
    }

    search.set(key, String(value));
  }

  const text = search.toString();

  return text ? `?${text}` : "";
}
