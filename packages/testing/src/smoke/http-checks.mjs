import http from "node:http";
import https from "node:https";

async function requestWithTimeout(url, timeoutMs) {
  const target = new URL(url);
  const client = target.protocol === "https:" ? https : http;

  return await new Promise((resolve, reject) => {
    const request = client.request(
      target,
      {
        method: "GET",
        timeout: timeoutMs,
      },
      (response) => {
        const chunks = [];

        response.on("data", (chunk) => {
          chunks.push(chunk);
        });
        response.on("end", () => {
          resolve({
            ok:
              typeof response.statusCode === "number" &&
              response.statusCode >= 200 &&
              response.statusCode < 300,
            status: response.statusCode ?? 0,
            async text() {
              return Buffer.concat(chunks).toString("utf8");
            },
            async json() {
              return JSON.parse(Buffer.concat(chunks).toString("utf8"));
            },
          });
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

function assertJsonSubset(actual, expected, checkName) {
  for (const [key, value] of Object.entries(expected)) {
    if (actual[key] !== value) {
      throw new Error(
        `${checkName} expected JSON field ${key}=${value}, received ${actual[key]}`,
      );
    }
  }
}

export async function runHttpCheck(check, options = {}) {
  const timeoutMs = options.timeoutMs ?? 5000;
  const response = await requestWithTimeout(check.url, timeoutMs);

  if (!response.ok) {
    throw new Error(`${check.name} returned HTTP ${response.status}`);
  }

  if (check.kind === "json") {
    const body = await response.json();
    assertJsonSubset(body, check.expectedJson, check.name);
    return {
      name: check.name,
      status: response.status,
      body,
    };
  }

  const body = await response.text();

  if (!body.includes(check.expectedText)) {
    throw new Error(`${check.name} did not contain "${check.expectedText}"`);
  }

  return {
    name: check.name,
    status: response.status,
    body,
  };
}

export async function waitForCheck(check, options = {}) {
  const timeoutMs = options.timeoutMs ?? 15000;
  const intervalMs = options.intervalMs ?? 500;
  const requestTimeoutMs = options.requestTimeoutMs ?? 3000;
  const startedAt = Date.now();
  let lastError;

  while (Date.now() - startedAt < timeoutMs) {
    try {
      return await runHttpCheck(check, {
        timeoutMs: requestTimeoutMs,
      });
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  }

  throw lastError ?? new Error(`${check.name} did not become ready`);
}
