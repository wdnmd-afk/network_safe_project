import { afterEach, describe, expect, it, vi } from "vitest";

import { submitJwtVerify } from "../src/api/jwt-lab";
import { attackJwtSample, normalJwtSample } from "../src/labs/jwt";

describe("jwt lab api client", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("posts teaching token to the selected variant", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "ok",
          result: {
            status: "ok",
            variantKey: "vuln",
            header: {
              alg: "HS256",
              typ: "JWT",
            },
            payload: {
              sub: "learner-1001",
              role: "user",
              scope: "orders:read",
              lab: "auth.jwt",
            },
            inspection: {
              tokenLength: normalJwtSample.length,
              segmentCount: 3,
              algorithm: "HS256",
              signaturePresent: true,
              signatureValid: true,
              roleClaim: "user",
              scopeClaim: "orders:read",
              adminClaimRequested: false,
              labToken: true,
            },
            access: {
              subject: "learner-1001",
              role: "user",
              scope: "orders:read",
              resource: "user-orders",
              granted: true,
            },
            signal: "jwt-valid-user-token-accepted",
            decision: "accepted",
            message: "valid token",
            nextStep: "try none algorithm",
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

    const result = await submitJwtVerify("vuln", "local-session-token", {
      token: normalJwtSample,
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/labs/auth/jwt/vuln/verify", {
      method: "POST",
      headers: {
        authorization: "Bearer local-session-token",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        token: normalJwtSample,
      }),
    });
    expect(result.result.signal).toBe("jwt-valid-user-token-accepted");
  });

  it("returns blocked response body for fixed variant none algorithm token", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "blocked",
          result: {
            status: "blocked",
            variantKey: "fixed",
            header: {
              alg: "none",
              typ: "JWT",
            },
            payload: {
              sub: "learner-1001",
              role: "admin",
              scope: "admin:read",
              lab: "auth.jwt",
            },
            inspection: {
              tokenLength: attackJwtSample.length,
              segmentCount: 3,
              algorithm: "none",
              signaturePresent: false,
              signatureValid: false,
              roleClaim: "admin",
              scopeClaim: "admin:read",
              adminClaimRequested: true,
              labToken: true,
            },
            access: null,
            signal: "jwt-none-alg-blocked",
            decision: "blocked",
            message: "blocked",
            nextStep: "compare vulnerable",
            blockedReason: "algorithm-not-allowed",
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

    const result = await submitJwtVerify("fixed", "local-session-token", {
      token: attackJwtSample,
    });

    expect(result.status).toBe("blocked");
    expect(result.result.signal).toBe("jwt-none-alg-blocked");
  });
});
