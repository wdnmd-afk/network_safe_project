import { afterEach, describe, expect, it, vi } from "vitest";

import { submitSstiPreview } from "../src/api/ssti-lab";
import {
  attackSstiMathTemplateSample,
  normalSstiVariables,
} from "../src/labs/ssti";

describe("ssti lab api client", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("posts preview payload to the selected variant", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "ok",
          result: {
            status: "ok",
            variantKey: "vuln",
            templateKey: "shipping-notice",
            renderedText: "尊敬的 演示用户，调试结果：49",
            inspection: {
              templateLength: attackSstiMathTemplateSample.length,
              expressionCount: 2,
              expressionTypes: [
                "allowed-variable",
                "controlled-math-expression",
              ],
              matchedControlledSample: true,
              unknownExpressionCount: 0,
              variableKeys: ["customerName", "orderNo", "noticeTitle"],
              acceptedVariableKeys: ["customerName"],
            },
            signal: "ssti-expression-evaluated",
            decision: "accepted",
            message: "controlled expression evaluated",
            nextStep: "compare fixed",
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

    const result = await submitSstiPreview("vuln", "local-session-token", {
      templateKey: "shipping-notice",
      templateText: attackSstiMathTemplateSample,
      variables: normalSstiVariables,
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/labs/web/ssti/vuln/preview", {
      method: "POST",
      headers: {
        authorization: "Bearer local-session-token",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        templateKey: "shipping-notice",
        templateText: attackSstiMathTemplateSample,
        variables: normalSstiVariables,
      }),
    });
    expect(result.result.signal).toBe("ssti-expression-evaluated");
  });

  it("returns blocked response body for fixed variant controlled sample", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "blocked",
          result: {
            status: "blocked",
            variantKey: "fixed",
            templateKey: "shipping-notice",
            renderedText: "",
            inspection: {
              templateLength: attackSstiMathTemplateSample.length,
              expressionCount: 2,
              expressionTypes: [
                "allowed-variable",
                "controlled-math-expression",
              ],
              matchedControlledSample: true,
              unknownExpressionCount: 0,
              variableKeys: ["customerName", "orderNo", "noticeTitle"],
              acceptedVariableKeys: ["customerName"],
            },
            signal: "ssti-expression-blocked",
            decision: "blocked",
            message: "blocked",
            nextStep: "compare vulnerable",
            blockedReason: "expression-not-allowed",
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

    const result = await submitSstiPreview("fixed", "local-session-token", {
      templateKey: "shipping-notice",
      templateText: attackSstiMathTemplateSample,
      variables: normalSstiVariables,
    });

    expect(result.status).toBe("blocked");
    expect(result.result.signal).toBe("ssti-expression-blocked");
  });
});
