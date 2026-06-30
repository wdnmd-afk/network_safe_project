import { afterEach, describe, expect, it, vi } from "vitest";

import { submitCommandInjectionRun } from "../src/api/command-injection-lab";

describe("command injection lab api client", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("posts diagnostic payload to the selected variant", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "ok",
          result: {
            status: "ok",
            variantKey: "vuln",
            taskKey: "cache-status",
            target: "storefront-cache",
            inspection: {
              targetLength: 16,
              containsCommandSeparator: false,
              detectedOperator: "none",
              matchedControlledSample: false,
              allowedTask: true,
            },
            virtualSteps: [
              {
                label: "缓存节点状态",
                output: "cache ok",
                injected: false,
              },
            ],
            signal: "command-injection-normal-task-completed",
            decision: "accepted",
            message: "normal task",
            nextStep: "try controlled sample",
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

    const result = await submitCommandInjectionRun(
      "vuln",
      "local-session-token",
      {
        taskKey: "cache-status",
        target: "storefront-cache",
      },
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/labs/web/command-injection/vuln/run",
      {
        method: "POST",
        headers: {
          authorization: "Bearer local-session-token",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          taskKey: "cache-status",
          target: "storefront-cache",
        }),
      },
    );
    expect(result.result.signal).toBe(
      "command-injection-normal-task-completed",
    );
  });

  it("returns blocked response body for fixed variant controlled sample", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "blocked",
          result: {
            status: "blocked",
            variantKey: "fixed",
            taskKey: "cache-status",
            target: "storefront-cache && reveal-debug-note",
            inspection: {
              targetLength: 38,
              containsCommandSeparator: true,
              detectedOperator: "and",
              matchedControlledSample: true,
              allowedTask: true,
            },
            virtualSteps: [],
            signal: "command-injection-allowlist-blocked",
            decision: "blocked",
            message: "blocked",
            nextStep: "compare vulnerable",
            blockedReason: "command-operator-detected",
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

    const result = await submitCommandInjectionRun(
      "fixed",
      "local-session-token",
      {
        taskKey: "cache-status",
        target: "storefront-cache && reveal-debug-note",
      },
    );

    expect(result.status).toBe("blocked");
    expect(result.result.signal).toBe("command-injection-allowlist-blocked");
  });
});
