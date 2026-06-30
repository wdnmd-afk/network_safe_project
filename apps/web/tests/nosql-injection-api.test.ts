import { afterEach, describe, expect, it, vi } from "vitest";

import { submitNosqlInjectionSearch } from "../src/api/nosql-injection-lab";
import {
  attackNosqlInjectionFilterText,
  normalNosqlInjectionKeyword,
  normalNosqlInjectionQueryMode,
} from "../src/labs/nosql-injection";

describe("nosql injection lab api client", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("posts coupon search payload to the selected variant", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "ok",
          result: {
            status: "ok",
            variantKey: "vuln",
            queryMode: "coupon-search",
            keyword: normalNosqlInjectionKeyword,
            filterTextLength: 11,
            documents: [
              {
                id: "coupon-public-shipping",
                title: "公开运费优惠券",
                channel: "shipping",
                visibility: "public",
                teachingOnly: false,
              },
            ],
            inspection: {
              queryModeAllowed: true,
              keywordLength: normalNosqlInjectionKeyword.length,
              filterTextLength: 11,
              detectedRiskTypes: ["none"],
              matchedControlledSample: false,
              resultScope: "public",
            },
            signal: "nosql-injection-safe-query-completed",
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

    const result = await submitNosqlInjectionSearch(
      "vuln",
      "local-session-token",
      {
        queryMode: normalNosqlInjectionQueryMode,
        keyword: normalNosqlInjectionKeyword,
        filterText: "public-only",
      },
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/labs/web/nosql-injection/vuln/search",
      {
        method: "POST",
        headers: {
          authorization: "Bearer local-session-token",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          queryMode: normalNosqlInjectionQueryMode,
          keyword: normalNosqlInjectionKeyword,
          filterText: "public-only",
        }),
      },
    );
    expect(result.result.signal).toBe(
      "nosql-injection-safe-query-completed",
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
            queryMode: "coupon-search",
            keyword: normalNosqlInjectionKeyword,
            filterTextLength: attackNosqlInjectionFilterText.length,
            documents: [],
            inspection: {
              queryModeAllowed: true,
              keywordLength: normalNosqlInjectionKeyword.length,
              filterTextLength: attackNosqlInjectionFilterText.length,
              detectedRiskTypes: [
                "controlled-operator",
                "operator-like-token",
              ],
              matchedControlledSample: true,
              resultScope: "blocked",
            },
            signal: "nosql-injection-operator-blocked",
            decision: "blocked",
            message: "blocked",
            nextStep: "compare vulnerable",
            blockedReason: "controlled-operator-blocked",
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

    const result = await submitNosqlInjectionSearch(
      "fixed",
      "local-session-token",
      {
        queryMode: normalNosqlInjectionQueryMode,
        keyword: normalNosqlInjectionKeyword,
        filterText: attackNosqlInjectionFilterText,
      },
    );

    expect(result.status).toBe("blocked");
    expect(result.result.signal).toBe("nosql-injection-operator-blocked");
  });
});
