import { afterEach, describe, expect, it, vi } from "vitest";

import { submitLdapInjectionSearch } from "../src/api/ldap-injection-lab";
import {
  attackLdapInjectionKeyword,
  normalLdapInjectionKeyword,
  normalLdapInjectionScenarioKey,
} from "../src/labs/ldap-injection";

describe("ldap injection lab api client", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("posts virtual directory search payload to the selected variant", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "ok",
          result: {
            status: "ok",
            variantKey: "vuln",
            scenarioKey: normalLdapInjectionScenarioKey,
            keywordLength: normalLdapInjectionKeyword.length,
            keywordPreview: "ali***ce",
            entries: [
              {
                id: "member-public-alice",
                displayName: "Alice Chen",
                scenarioKey: "member-search",
                directoryArea: "current-organization",
                visibility: "public",
                matchedBy: "keyword",
                teachingOnly: false,
              },
            ],
            inspection: {
              scenarioAllowed: true,
              keywordLength: normalLdapInjectionKeyword.length,
              keywordPreview: "ali***ce",
              detectedRiskTypes: ["none"],
              matchedControlledSample: false,
              resultScope: "public",
            },
            signal: "ldap-injection-safe-search-completed",
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

    const result = await submitLdapInjectionSearch(
      "vuln",
      "local-session-token",
      {
        scenarioKey: normalLdapInjectionScenarioKey,
        keyword: normalLdapInjectionKeyword,
      },
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/labs/web/ldap-injection/vuln/search",
      {
        method: "POST",
        headers: {
          authorization: "Bearer local-session-token",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          scenarioKey: normalLdapInjectionScenarioKey,
          keyword: normalLdapInjectionKeyword,
        }),
      },
    );
    expect(result.result.signal).toBe(
      "ldap-injection-safe-search-completed",
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
            scenarioKey: normalLdapInjectionScenarioKey,
            keywordLength: attackLdapInjectionKeyword.length,
            keywordPreview: "controlled-ldap-keyword",
            entries: [],
            inspection: {
              scenarioAllowed: true,
              keywordLength: attackLdapInjectionKeyword.length,
              keywordPreview: "controlled-ldap-keyword",
              detectedRiskTypes: [
                "controlled-scope-expansion",
                "directory-filter-like-token",
              ],
              matchedControlledSample: true,
              resultScope: "blocked",
            },
            signal: "ldap-injection-controlled-sample-blocked",
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

    const result = await submitLdapInjectionSearch(
      "fixed",
      "local-session-token",
      {
        scenarioKey: normalLdapInjectionScenarioKey,
        keyword: attackLdapInjectionKeyword,
      },
    );

    expect(result.status).toBe("blocked");
    expect(result.result.signal).toBe(
      "ldap-injection-controlled-sample-blocked",
    );
  });
});
