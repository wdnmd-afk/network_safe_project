import { afterEach, describe, expect, it, vi } from "vitest";

import { submitSessionFixationLogin } from "../src/api/session-fixation-lab";
import {
  attackPreLoginSessionIdSample,
  attackSessionSourceSample,
  normalPreLoginSessionIdSample,
  normalSessionSourceSample,
} from "../src/labs/session-fixation";

describe("session fixation lab api client", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("posts teaching session payload to the selected variant", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "ok",
          result: {
            status: "ok",
            variantKey: "vuln",
            preLoginSessionId: normalPreLoginSessionIdSample,
            sessionSource: "browser",
            teachingSession: {
              ownerUserId: "1",
              ownerUsername: "demo_user",
              sessionId: normalPreLoginSessionIdSample,
              source: "client",
              accessSummary: "teaching session only",
            },
            inspection: {
              preLoginSessionIdLength: normalPreLoginSessionIdSample.length,
              sessionSource: "browser",
              attackerControlled: false,
              acceptedClientSessionId: true,
              rotatedSessionId: false,
              sessionIdChanged: false,
              currentUserId: "1",
              boundSessionIdLength: normalPreLoginSessionIdSample.length,
            },
            signal: "session-normal-id-accepted",
            decision: "accepted",
            message: "normal session accepted",
            nextStep: "try external link",
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

    const result = await submitSessionFixationLogin(
      "vuln",
      "local-session-token",
      {
        preLoginSessionId: normalPreLoginSessionIdSample,
        sessionSource: normalSessionSourceSample,
      },
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/labs/auth/session-fixation/vuln/login",
      {
        method: "POST",
        headers: {
          authorization: "Bearer local-session-token",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          preLoginSessionId: normalPreLoginSessionIdSample,
          sessionSource: normalSessionSourceSample,
        }),
      },
    );
    expect(result.result.signal).toBe("session-normal-id-accepted");
  });

  it("returns rotated response body for fixed variant attacker session id", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "ok",
          result: {
            status: "ok",
            variantKey: "fixed",
            preLoginSessionId: attackPreLoginSessionIdSample,
            sessionSource: "external-link",
            teachingSession: {
              ownerUserId: "1",
              ownerUsername: "demo_user",
              sessionId: "server-rotated-session-0001",
              source: "server",
              accessSummary: "teaching session only",
            },
            inspection: {
              preLoginSessionIdLength: attackPreLoginSessionIdSample.length,
              sessionSource: "external-link",
              attackerControlled: true,
              acceptedClientSessionId: false,
              rotatedSessionId: true,
              sessionIdChanged: true,
              currentUserId: "1",
              boundSessionIdLength: "server-rotated-session-0001".length,
            },
            signal: "session-fixed-id-rotated",
            decision: "accepted",
            message: "rotated",
            nextStep: "review logs",
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

    const result = await submitSessionFixationLogin(
      "fixed",
      "local-session-token",
      {
        preLoginSessionId: attackPreLoginSessionIdSample,
        sessionSource: attackSessionSourceSample,
      },
    );

    expect(result.status).toBe("ok");
    expect(result.result.signal).toBe("session-fixed-id-rotated");
    expect(result.result.inspection.rotatedSessionId).toBe(true);
  });
});
