import { afterEach, describe, expect, it, vi } from "vitest";

import { submitDnsHijackObservation } from "../src/api/dns-hijack-lab";
import {
  defaultDnsHijackDomainKey,
  defaultDnsHijackResolverProfile,
} from "../src/labs/dns-hijack";

describe("dns hijack lab api client", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("posts only fixed domain sample and resolver profile to the selected variant", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "ok",
          result: {
            status: "ok",
            variantKey: "vuln",
            domainKey: defaultDnsHijackDomainKey,
            resolverProfile: defaultDnsHijackResolverProfile,
            domain: {
              domainKey: defaultDnsHijackDomainKey,
              title: "客户门户入口",
              displayDomain: "portal.example.test",
              businessPurpose: "客户登录入口",
              expectedAddressCategory: "trusted-customer-portal",
              certificateExpectation: "trusted",
              riskNotes: "certificate mismatch",
            },
            resolution: {
              resolverProfile: defaultDnsHijackResolverProfile,
              sourceTrust: "untrusted-cache",
              expectedAddressCategory: "trusted-customer-portal",
              resolvedAddressCategory: "lookalike-customer-portal",
              certificateStatus: "mismatch",
              anomalyDetected: true,
              matchedControlledSample: true,
            },
            audit: {
              trustedSource: false,
              addressMatchesExpected: false,
              certificateTrusted: false,
              blockedByPolicy: false,
              learningHint: "certificate mismatch visible",
            },
            signal: "dns-hijack-certificate-mismatch-visible",
            decision: "accepted",
            message: "certificate mismatch visible",
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

    const result = await submitDnsHijackObservation(
      "vuln",
      "local-session-token",
      {
        domainKey: defaultDnsHijackDomainKey,
        resolverProfile: defaultDnsHijackResolverProfile,
      },
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/labs/network/dns-hijack/vuln/resolve",
      {
        method: "POST",
        headers: {
          authorization: "Bearer local-session-token",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          domainKey: defaultDnsHijackDomainKey,
          resolverProfile: defaultDnsHijackResolverProfile,
        }),
      },
    );
    expect(fetchMock.mock.calls[0]?.[1]?.body).not.toContain("displayDomain");
    expect(fetchMock.mock.calls[0]?.[1]?.body).not.toContain("dnsServer");
    expect(fetchMock.mock.calls[0]?.[1]?.body).not.toContain("ipAddress");
    expect(fetchMock.mock.calls[0]?.[1]?.body).not.toContain("proxy");
    expect(result.result.signal).toBe(
      "dns-hijack-certificate-mismatch-visible",
    );
  });

  it("returns blocked response body for controlled boundary failures", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "blocked",
          result: {
            status: "blocked",
            variantKey: "vuln",
            domainKey: "blocked-domain",
            resolverProfile: defaultDnsHijackResolverProfile,
            domain: null,
            resolution: {
              resolverProfile: defaultDnsHijackResolverProfile,
              sourceTrust: "unknown",
              expectedAddressCategory: "unknown",
              resolvedAddressCategory: "unknown",
              certificateStatus: "unknown",
              anomalyDetected: true,
              matchedControlledSample: false,
            },
            audit: {
              trustedSource: false,
              addressMatchesExpected: false,
              certificateTrusted: false,
              blockedByPolicy: true,
              learningHint: "choose fixed domain sample",
            },
            signal: "dns-hijack-domain-blocked",
            decision: "blocked",
            message: "blocked",
            nextStep: "choose fixed domain sample",
            blockedReason: "domain-not-allowed",
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

    const result = await submitDnsHijackObservation(
      "vuln",
      "local-session-token",
      {
        domainKey: defaultDnsHijackDomainKey,
        resolverProfile: defaultDnsHijackResolverProfile,
      },
    );

    expect(result.status).toBe("blocked");
    expect(result.result.signal).toBe("dns-hijack-domain-blocked");
  });
});
