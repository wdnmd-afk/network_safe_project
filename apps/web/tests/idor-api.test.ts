import { afterEach, describe, expect, it, vi } from "vitest";

import { submitIdorRead } from "../src/api/idor-lab";
import { otherUserOrderIdSample, ownOrderIdSample } from "../src/labs/idor";

describe("idor lab api client", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("posts orderId to the selected variant", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "ok",
          result: {
            status: "ok",
            variantKey: "vuln",
            orderId: ownOrderIdSample,
            order: {
              id: ownOrderIdSample,
              ownerUserId: "1",
              ownerLabel: "演示用户",
              productName: "Secure Key Pro",
              amount: 299,
              status: "paid",
              contactMasked: "lin***01",
              internalNote: "own order",
            },
            inspection: {
              orderIdLength: ownOrderIdSample.length,
              objectType: "order",
              objectFound: true,
              currentUserId: "1",
              ownerUserId: "1",
              ownerMatches: true,
              crossUserRequested: false,
            },
            signal: "idor-own-order-accepted",
            decision: "accepted",
            message: "own order accepted",
            nextStep: "try another order",
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

    const result = await submitIdorRead("vuln", "local-session-token", {
      orderId: ownOrderIdSample,
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/labs/auth/idor/vuln/read", {
      method: "POST",
      headers: {
        authorization: "Bearer local-session-token",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        orderId: ownOrderIdSample,
      }),
    });
    expect(result.result.signal).toBe("idor-own-order-accepted");
  });

  it("returns blocked response body for fixed variant cross-user order", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "blocked",
          result: {
            status: "blocked",
            variantKey: "fixed",
            orderId: otherUserOrderIdSample,
            order: null,
            inspection: {
              orderIdLength: otherUserOrderIdSample.length,
              objectType: "order",
              objectFound: true,
              currentUserId: "1",
              ownerUserId: "2",
              ownerMatches: false,
              crossUserRequested: true,
            },
            signal: "idor-cross-user-order-blocked",
            decision: "blocked",
            message: "blocked",
            nextStep: "compare vulnerable",
            blockedReason: "owner-mismatch",
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

    const result = await submitIdorRead("fixed", "local-session-token", {
      orderId: otherUserOrderIdSample,
    });

    expect(result.status).toBe("blocked");
    expect(result.result.signal).toBe("idor-cross-user-order-blocked");
  });
});
