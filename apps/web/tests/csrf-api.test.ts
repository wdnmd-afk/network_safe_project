import { afterEach, describe, expect, it, vi } from "vitest";

import {
  fetchCsrfState,
  issueCsrfToken,
  submitCsrfTransfer,
} from "../src/api/csrf-lab";

describe("csrf lab api client", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetchCsrfState reads the current csrf lab state", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "ok",
          state: {
            userId: "1",
            balance: 5000,
            status: "idle",
            lastSignal: "none",
            lastTransfer: null,
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

    const result = await fetchCsrfState("local-session-token");

    expect(fetchMock).toHaveBeenCalledWith("/api/labs/web/csrf/state", {
      headers: {
        authorization: "Bearer local-session-token",
      },
    });
    expect(result.state.balance).toBe(5000);
  });

  it("issueCsrfToken requests a fixed variant token", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "ok",
          csrfToken: "csrf-token",
        }),
        {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        },
      ),
    );

    const result = await issueCsrfToken("local-session-token");

    expect(fetchMock).toHaveBeenCalledWith("/api/labs/web/csrf/fixed/token", {
      method: "POST",
      headers: {
        authorization: "Bearer local-session-token",
      },
    });
    expect(result.csrfToken).toBe("csrf-token");
  });

  it("submitCsrfTransfer returns blocked response body for fixed variant without token", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "blocked",
          state: {
            userId: "1",
            balance: 5000,
            status: "blocked",
            lastSignal: "csrf-token-required",
            lastTransfer: null,
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

    const result = await submitCsrfTransfer("fixed", "local-session-token", {
      amount: 200,
      targetAccount: "safe-mart-training",
    });

    expect(result.status).toBe("blocked");
    expect(result.state.lastSignal).toBe("csrf-token-required");
  });

  it("submitCsrfTransfer posts transfer payload to the selected variant", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "ok",
          state: {
            userId: "1",
            balance: 4800,
            status: "transferred",
            lastSignal: "csrf-token-accepted",
            lastTransfer: {
              variantKey: "fixed",
              amount: 200,
              targetAccount: "safe-mart-training",
            },
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

    const result = await submitCsrfTransfer("fixed", "local-session-token", {
      amount: 200,
      targetAccount: "safe-mart-training",
      csrfToken: "csrf-token",
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/labs/web/csrf/fixed/transfer", {
      method: "POST",
      headers: {
        authorization: "Bearer local-session-token",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        amount: 200,
        targetAccount: "safe-mart-training",
        csrfToken: "csrf-token",
      }),
    });
    expect(result.state.lastSignal).toBe("csrf-token-accepted");
  });
});
