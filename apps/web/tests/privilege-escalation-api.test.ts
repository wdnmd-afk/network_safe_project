import { afterEach, describe, expect, it, vi } from "vitest";

import { submitPrivilegeEscalationExecute } from "../src/api/privilege-escalation-lab";
import {
  adminOperationKeySample,
  attackRequestedRoleSample,
  normalOperationKeySample,
  normalRequestedRoleSample,
} from "../src/labs/privilege-escalation";

describe("privilege escalation lab api client", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("posts operation payload to the selected variant", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "ok",
          result: {
            status: "ok",
            variantKey: "vuln",
            operationKey: normalOperationKeySample,
            requestedRole: normalRequestedRoleSample,
            operation: {
              key: normalOperationKeySample,
              title: "查看个人资料摘要",
              requiredRole: "member",
              resultSummary: "返回当前用户自己的资料摘要",
            },
            inspection: {
              operationKeyLength: normalOperationKeySample.length,
              requestedRole: "member",
              currentUserRole: "member",
              effectiveRole: "member",
              trustedClientRole: true,
              privilegedOperation: false,
              roleAllowed: true,
            },
            signal: "privilege-normal-operation-accepted",
            decision: "accepted",
            message: "normal operation accepted",
            nextStep: "try admin role",
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

    const result = await submitPrivilegeEscalationExecute(
      "vuln",
      "local-session-token",
      {
        operationKey: normalOperationKeySample,
        requestedRole: normalRequestedRoleSample,
      },
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/labs/auth/privilege-escalation/vuln/execute",
      {
        method: "POST",
        headers: {
          authorization: "Bearer local-session-token",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          operationKey: normalOperationKeySample,
          requestedRole: normalRequestedRoleSample,
        }),
      },
    );
    expect(result.result.signal).toBe("privilege-normal-operation-accepted");
  });

  it("returns blocked response body for fixed variant admin role claim", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "blocked",
          result: {
            status: "blocked",
            variantKey: "fixed",
            operationKey: adminOperationKeySample,
            requestedRole: attackRequestedRoleSample,
            operation: null,
            inspection: {
              operationKeyLength: adminOperationKeySample.length,
              requestedRole: "admin",
              currentUserRole: "member",
              effectiveRole: "member",
              trustedClientRole: false,
              privilegedOperation: true,
              roleAllowed: false,
            },
            signal: "privilege-client-role-admin-blocked",
            decision: "blocked",
            message: "blocked",
            nextStep: "compare vulnerable",
            blockedReason: "server-role-not-allowed",
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

    const result = await submitPrivilegeEscalationExecute(
      "fixed",
      "local-session-token",
      {
        operationKey: adminOperationKeySample,
        requestedRole: attackRequestedRoleSample,
      },
    );

    expect(result.status).toBe("blocked");
    expect(result.result.signal).toBe("privilege-client-role-admin-blocked");
  });
});
