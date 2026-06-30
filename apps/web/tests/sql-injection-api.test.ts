import { afterEach, describe, expect, it, vi } from "vitest";

import { submitSqlInjectionSearch } from "../src/api/sql-injection-lab";

describe("sql injection lab api client", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("posts search payload to the selected variant", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "ok",
          result: {
            status: "ok",
            variantKey: "vuln",
            keyword: "router",
            detectedInjection: false,
            queryMode: "unsafe-concat",
            queryPreview: "unsafe query",
            rows: [],
            signal: "sql-injection-normal-search",
            decision: "accepted",
            message: "normal search",
            nextStep: "try payload",
          },
        }),
        {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        },
      ),
    );

    const result = await submitSqlInjectionSearch("vuln", "local-session-token", {
      keyword: "router",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/labs/web/sql-injection/vuln/search",
      {
        method: "POST",
        headers: {
          authorization: "Bearer local-session-token",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          keyword: "router",
        }),
      },
    );
    expect(result.result.signal).toBe("sql-injection-normal-search");
  });

  it("returns blocked response body for fixed variant injection payload", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "blocked",
          result: {
            status: "blocked",
            variantKey: "fixed",
            keyword: "%' OR 1=1 #",
            detectedInjection: true,
            queryMode: "parameterized",
            queryPreview: "parameterized query",
            rows: [],
            signal: "sql-injection-parameterized-blocked",
            decision: "blocked",
            message: "blocked",
            nextStep: "compare vulnerable",
          },
        }),
        {
          status: 403,
          headers: {
            "content-type": "application/json",
          },
        },
      ),
    );

    const result = await submitSqlInjectionSearch("fixed", "local-session-token", {
      keyword: "%' OR 1=1 #",
    });

    expect(result.status).toBe("blocked");
    expect(result.result.signal).toBe("sql-injection-parameterized-blocked");
  });
});
