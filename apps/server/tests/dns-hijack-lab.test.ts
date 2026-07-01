import assert from "node:assert/strict";
import { after, test } from "node:test";

import { createApp } from "../src/app.js";
import type { LabEventInput } from "../src/services/lab-event-logs.js";
import {
  createDnsHijackLabService,
  dnsHijackDefaultDomainKey,
  dnsHijackDefaultResolverProfile,
  type DnsHijackResult,
} from "../src/services/dns-hijack-lab.js";

const demoUser = {
  id: "1",
  username: "demo_user",
  displayName: "演示用户",
  role: "member",
  status: "active",
};

async function listen(app: ReturnType<typeof createApp>) {
  const server = app.listen(0);
  const address = server.address();

  assert.ok(address && typeof address === "object");

  after(() => {
    server.close();
  });

  return `http://127.0.0.1:${address.port}`;
}

test("dns hijack service exposes certificate mismatch in vulnerable variant", async () => {
  const service = createDnsHijackLabService();

  const result = await service.resolveDomain({
    userId: "1",
    variantKey: "vuln",
    domainKey: dnsHijackDefaultDomainKey,
    resolverProfile: dnsHijackDefaultResolverProfile,
  });

  assert.equal(result.status, "ok");
  assert.equal(result.signal, "dns-hijack-certificate-mismatch-visible");
  assert.equal(result.decision, "accepted");
  assert.equal(result.resolution.anomalyDetected, true);
  assert.equal(result.resolution.certificateStatus, "mismatch");
  assert.equal(result.audit.addressMatchesExpected, false);
  assert.equal(JSON.stringify(result).includes("203.0.113.53"), false);
  assert.equal(JSON.stringify(result).includes("Resolve-DnsName"), false);
});

test("dns hijack service blocks anomalous public cache in fixed variant", async () => {
  const service = createDnsHijackLabService();

  const result = await service.resolveDomain({
    userId: "1",
    variantKey: "fixed",
    domainKey: dnsHijackDefaultDomainKey,
    resolverProfile: dnsHijackDefaultResolverProfile,
  });

  assert.equal(result.status, "blocked");
  assert.equal(result.signal, "dns-hijack-anomaly-blocked");
  assert.equal(result.decision, "blocked");
  assert.equal(result.blockedReason, "anomaly-detected");
  assert.equal(result.audit.blockedByPolicy, true);
});

test("dns hijack service restores trusted resolver in fixed variant", async () => {
  const service = createDnsHijackLabService();

  const result = await service.resolveDomain({
    userId: "1",
    variantKey: "fixed",
    domainKey: dnsHijackDefaultDomainKey,
    resolverProfile: "trusted-resolver",
  });

  assert.equal(result.status, "ok");
  assert.equal(result.signal, "dns-hijack-trusted-resolution-restored");
  assert.equal(result.decision, "accepted");
  assert.equal(result.resolution.anomalyDetected, false);
  assert.equal(result.resolution.resolvedAddressCategory, "trusted-customer-portal");
  assert.equal(result.audit.trustedSource, true);
});

test("dns hijack service blocks unknown domain without echoing raw input", async () => {
  const service = createDnsHijackLabService();
  const rawDomain = "attacker-controlled.invalid";

  const result = await service.resolveDomain({
    userId: "1",
    variantKey: "vuln",
    domainKey: rawDomain,
    resolverProfile: dnsHijackDefaultResolverProfile,
  });

  assert.equal(result.status, "blocked");
  assert.equal(result.signal, "dns-hijack-domain-blocked");
  assert.equal(result.decision, "blocked");
  assert.equal(result.blockedReason, "domain-not-allowed");
  assert.equal(result.domainKey, "blocked-domain");
  assert.equal(JSON.stringify(result).includes(rawDomain), false);
});

test("POST /api/labs/network/dns-hijack/:variant/resolve requires login", async () => {
  const app = createApp();
  const origin = await listen(app);

  const response = await fetch(
    `${origin}/api/labs/network/dns-hijack/vuln/resolve`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        domainKey: dnsHijackDefaultDomainKey,
        resolverProfile: dnsHijackDefaultResolverProfile,
      }),
    },
  );
  const body = (await response.json()) as {
    status: string;
    message: string;
  };

  assert.equal(response.status, 401);
  assert.deepEqual(body, {
    status: "error",
    message: "missing session token",
  });
});

test("POST /api/labs/network/dns-hijack/vuln/resolve records safe virtual summary", async () => {
  const labEventLogCalls: LabEventInput[] = [];
  const app = createApp({
    authService: {
      login: async () => null,
      getCurrentUser: async (token: string) =>
        token === "local-session-token" ? demoUser : null,
    },
    labEventLogsService: {
      recordLabEvent: async (input: LabEventInput) => {
        labEventLogCalls.push(input);

        return {
          traceId: input.traceId ?? "generated-trace",
          persisted: true,
          labId: "21",
        };
      },
      listUserLabEventLogs: async () => [],
    },
  });
  const origin = await listen(app);

  const response = await fetch(
    `${origin}/api/labs/network/dns-hijack/vuln/resolve`,
    {
      method: "POST",
      headers: {
        authorization: "Bearer local-session-token",
        "content-type": "application/json",
        "x-lab-trace-id": "trace-dns-hijack-vuln",
      },
      body: JSON.stringify({
        domainKey: dnsHijackDefaultDomainKey,
        resolverProfile: dnsHijackDefaultResolverProfile,
        domain: "real.example.com",
        dnsServer: "203.0.113.53",
        resolverUrl: "https://resolver.example.invalid/resolve",
        proxy: "http://127.0.0.1:8080",
      }),
    },
  );
  const body = (await response.json()) as {
    status: string;
    result: DnsHijackResult;
  };

  assert.equal(response.status, 200);
  assert.equal(body.status, "ok");
  assert.equal(body.result.signal, "dns-hijack-certificate-mismatch-visible");
  assert.deepEqual(labEventLogCalls, [
    {
      traceId: "trace-dns-hijack-vuln",
      userId: "1",
      labKey: "network.dns-hijack",
      variantKey: "vuln",
      phase: "attack",
      eventType: "success",
      actorPerspective: "attacker",
      method: "POST",
      path: "/api/labs/network/dns-hijack/vuln/resolve",
      inputSummary: {
        domainKey: "customer-portal",
        resolverProfile: "public-cache",
        expectedAddressCategory: "trusted-customer-portal",
        resolvedAddressCategory: "shadow-customer-portal",
        certificateStatus: "mismatch",
        anomalyDetected: true,
        matchedControlledSample: true,
        signal: "dns-hijack-certificate-mismatch-visible",
      },
      decision: "accepted",
      signal: "dns-hijack-certificate-mismatch-visible",
      statusCode: 200,
      message: body.result.message,
      riskLevel: "high",
    },
  ]);
  assert.equal(
    JSON.stringify(labEventLogCalls[0]?.inputSummary).includes("203.0.113.53"),
    false,
  );
  assert.equal(
    JSON.stringify(labEventLogCalls[0]?.inputSummary).includes("real.example.com"),
    false,
  );
});

test("POST /api/labs/network/dns-hijack/fixed/resolve blocks public cache anomaly safely", async () => {
  const labEventLogCalls: LabEventInput[] = [];
  const app = createApp({
    authService: {
      login: async () => null,
      getCurrentUser: async () => demoUser,
    },
    labEventLogsService: {
      recordLabEvent: async (input: LabEventInput) => {
        labEventLogCalls.push(input);

        return {
          traceId: input.traceId ?? "generated-trace",
          persisted: true,
          labId: "21",
        };
      },
      listUserLabEventLogs: async () => [],
    },
  });
  const origin = await listen(app);

  const response = await fetch(
    `${origin}/api/labs/network/dns-hijack/fixed/resolve`,
    {
      method: "POST",
      headers: {
        authorization: "Bearer local-session-token",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        domainKey: dnsHijackDefaultDomainKey,
        resolverProfile: dnsHijackDefaultResolverProfile,
      }),
    },
  );
  const body = (await response.json()) as {
    status: string;
    result: DnsHijackResult;
  };

  assert.equal(response.status, 403);
  assert.equal(body.status, "blocked");
  assert.equal(body.result.signal, "dns-hijack-anomaly-blocked");
  assert.deepEqual(labEventLogCalls[0], {
    traceId: undefined,
    userId: "1",
    labKey: "network.dns-hijack",
    variantKey: "fixed",
    phase: "defense",
    eventType: "blocked",
    actorPerspective: "attacker",
    method: "POST",
    path: "/api/labs/network/dns-hijack/fixed/resolve",
    inputSummary: {
      domainKey: "customer-portal",
      resolverProfile: "public-cache",
      expectedAddressCategory: "trusted-customer-portal",
      resolvedAddressCategory: "shadow-customer-portal",
      certificateStatus: "mismatch",
      anomalyDetected: true,
      matchedControlledSample: true,
      signal: "dns-hijack-anomaly-blocked",
    },
    decision: "blocked",
    signal: "dns-hijack-anomaly-blocked",
    statusCode: 403,
    message: body.result.message,
    riskLevel: "medium",
  });
});

test("POST /api/labs/network/dns-hijack/fixed/resolve returns trusted restoration", async () => {
  const app = createApp({
    authService: {
      login: async () => null,
      getCurrentUser: async () => demoUser,
    },
    labEventLogsService: {
      recordLabEvent: async (input: LabEventInput) => ({
        traceId: input.traceId ?? "generated-trace",
        persisted: true,
        labId: "21",
      }),
      listUserLabEventLogs: async () => [],
    },
  });
  const origin = await listen(app);

  const response = await fetch(
    `${origin}/api/labs/network/dns-hijack/fixed/resolve`,
    {
      method: "POST",
      headers: {
        authorization: "Bearer local-session-token",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        domainKey: dnsHijackDefaultDomainKey,
        resolverProfile: "trusted-resolver",
      }),
    },
  );
  const body = (await response.json()) as {
    status: string;
    result: DnsHijackResult;
  };

  assert.equal(response.status, 200);
  assert.equal(body.status, "ok");
  assert.equal(body.result.signal, "dns-hijack-trusted-resolution-restored");
  assert.equal(body.result.resolution.anomalyDetected, false);
});
