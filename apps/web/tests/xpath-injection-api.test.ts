import { afterEach, describe, expect, it, vi } from "vitest";

import { submitXpathInjectionSearch } from "../src/api/xpath-injection-lab";
import {
  attackXpathKeyword,
  normalXpathKeyword,
  normalXpathQueryTemplate,
  normalXpathScope,
} from "../src/labs/xpath-injection";

describe("xpath injection lab api client", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("posts catalog search payload to the selected variant", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "ok",
          result: {
            status: "ok",
            variantKey: "vuln",
            queryTemplate: normalXpathQueryTemplate,
            scope: normalXpathScope,
            keywordLength: normalXpathKeyword.length,
            keywordPreview: "cam***ra",
            documents: [
              {
                id: "product-public-camera",
                name: "公开相机支架",
                category: "camera-accessories",
                visibility: "public",
                matchedBy: "keyword",
                teachingOnly: false,
              },
            ],
            inspection: {
              queryTemplateAllowed: true,
              scopeAllowed: true,
              keywordLength: normalXpathKeyword.length,
              keywordPreview: "cam***ra",
              detectedRiskTypes: ["none"],
              matchedControlledSample: false,
              resultScope: "public",
            },
            signal: "xpath-injection-safe-query-completed",
            decision: "accepted",
            message: "normal query",
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

    const result = await submitXpathInjectionSearch(
      "vuln",
      "local-session-token",
      {
        queryTemplate: normalXpathQueryTemplate,
        keyword: normalXpathKeyword,
        scope: normalXpathScope,
      },
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/labs/web/xpath-injection/vuln/search",
      {
        method: "POST",
        headers: {
          authorization: "Bearer local-session-token",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          queryTemplate: normalXpathQueryTemplate,
          keyword: normalXpathKeyword,
          scope: normalXpathScope,
        }),
      },
    );
    expect(result.result.signal).toBe(
      "xpath-injection-safe-query-completed",
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
            queryTemplate: normalXpathQueryTemplate,
            scope: normalXpathScope,
            keywordLength: attackXpathKeyword.length,
            keywordPreview: "controlled-xpath-keyword",
            documents: [],
            inspection: {
              queryTemplateAllowed: true,
              scopeAllowed: true,
              keywordLength: attackXpathKeyword.length,
              keywordPreview: "controlled-xpath-keyword",
              detectedRiskTypes: [
                "controlled-scope-expansion",
                "xpath-like-token",
              ],
              matchedControlledSample: true,
              resultScope: "blocked",
            },
            signal: "xpath-injection-controlled-sample-blocked",
            decision: "blocked",
            message: "blocked",
            nextStep: "compare vulnerable",
            blockedReason: "controlled-sample-blocked",
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

    const result = await submitXpathInjectionSearch(
      "fixed",
      "local-session-token",
      {
        queryTemplate: normalXpathQueryTemplate,
        keyword: attackXpathKeyword,
        scope: normalXpathScope,
      },
    );

    expect(result.status).toBe("blocked");
    expect(result.result.signal).toBe(
      "xpath-injection-controlled-sample-blocked",
    );
  });
});
