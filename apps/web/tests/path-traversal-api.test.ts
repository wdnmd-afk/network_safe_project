import { afterEach, describe, expect, it, vi } from "vitest";

import { submitPathTraversalRead } from "../src/api/path-traversal-lab";

describe("path traversal lab api client", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("posts read payload to the selected variant", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "ok",
          result: {
            status: "ok",
            variantKey: "vuln",
            requestedPath: "user-guide.md",
            resolvedPath: "public/user-guide.md",
            inspection: {
              allowedRoot: "public",
              normalizedPath: "public/user-guide.md",
              containsTraversalSequence: false,
              escapedAllowedRoot: false,
              requestedPathLength: 13,
            },
            document: {
              path: "public/user-guide.md",
              title: "SafeMart 用户指南",
              classification: "public",
              content: "public document",
              isSensitive: false,
            },
            signal: "path-traversal-normal-file-read",
            decision: "accepted",
            message: "normal read",
            nextStep: "try traversal",
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

    const result = await submitPathTraversalRead("vuln", "local-session-token", {
      requestedPath: "user-guide.md",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/labs/web/path-traversal/vuln/read",
      {
        method: "POST",
        headers: {
          authorization: "Bearer local-session-token",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          requestedPath: "user-guide.md",
        }),
      },
    );
    expect(result.result.signal).toBe("path-traversal-normal-file-read");
  });

  it("returns blocked response body for fixed variant traversal sample", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "blocked",
          result: {
            status: "blocked",
            variantKey: "fixed",
            requestedPath: "../internal/admin-note.txt",
            resolvedPath: "internal/admin-note.txt",
            inspection: {
              allowedRoot: "public",
              normalizedPath: "internal/admin-note.txt",
              containsTraversalSequence: true,
              escapedAllowedRoot: true,
              requestedPathLength: 26,
            },
            document: null,
            signal: "path-traversal-normalized-blocked",
            decision: "blocked",
            message: "blocked",
            nextStep: "compare vulnerable",
            blockedReason: "path-escaped-allowed-root",
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

    const result = await submitPathTraversalRead("fixed", "local-session-token", {
      requestedPath: "../internal/admin-note.txt",
    });

    expect(result.status).toBe("blocked");
    expect(result.result.signal).toBe("path-traversal-normalized-blocked");
  });
});
