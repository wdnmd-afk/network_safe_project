import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchControlledWorkbench, submitControlledEvaluation } from "../src/api/controlled-decision-lab";
import { getControlledLabPageConfig } from "../src/labs/controlled-decision-labs";

describe("受控专用实验前端契约", () => {
  afterEach(() => vi.restoreAllMocks());

  it("loads a registered workbench path", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ status: "ok", workbench: { id: "api.property-authorization" } }), { status: 200 }));
    const result = await fetchControlledWorkbench("api", "property-authorization");
    expect(fetchMock).toHaveBeenCalledWith("/api/labs/api/property-authorization/workbench");
    expect(result.workbench.id).toBe("api.property-authorization");
  });

  it("submits only scenarioKey and ordered decisions", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ status: "ok", result: { signal: "api-property-authorization-risk-accepted" } }), { status: 200 }));
    await submitControlledEvaluation("api", "property-authorization", "vuln", "local-session-token", { scenarioKey: "fixed-profile-update-dto", decisions: ["bind-all-client-fields", "persist-server-owned-fields"] });
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(JSON.parse(String(init.body))).toEqual({ scenarioKey: "fixed-profile-update-dto", decisions: ["bind-all-client-fields", "persist-server-owned-fields"] });
  });

  it("rejects unknown page configuration instead of guessing fields", () => {
    expect(() => getControlledLabPageConfig("api", "unknown")).toThrow("未登记的专用实验页面");
  });
});

