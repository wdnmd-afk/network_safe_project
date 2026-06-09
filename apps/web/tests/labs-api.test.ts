import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchLab, fetchLabs } from "../src/api/labs";

describe("labs api client", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetchLabs reads the lab list endpoint", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          items: [{ id: "web.xss", title: "XSS" }],
          total: 1,
        }),
        {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        },
      ),
    );

    const result = await fetchLabs();

    expect(fetchMock).toHaveBeenCalledWith("/api/labs");
    expect(result.total).toBe(1);
    expect(result.items[0]?.id).toBe("web.xss");
  });

  it("fetchLab reads one lab endpoint", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "web.xss",
          title: "XSS",
        }),
        {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        },
      ),
    );

    const result = await fetchLab("web", "xss");

    expect(fetchMock).toHaveBeenCalledWith("/api/labs/web/xss");
    expect(result.id).toBe("web.xss");
  });
});
