export type LdapInjectionVariantKey = "vuln" | "fixed";

export type LdapInjectionScenarioKey =
  | "member-search"
  | "group-lookup"
  | "login-filter";

export type LdapInjectionInput = {
  scenarioKey: string;
  keyword: string;
};

export type LdapInjectionRiskType =
  | "none"
  | "controlled-scope-expansion"
  | "directory-filter-like-token";

export type LdapInjectionSignal =
  | "ldap-injection-safe-search-completed"
  | "ldap-injection-scope-expanded"
  | "ldap-injection-controlled-sample-blocked"
  | "ldap-injection-input-blocked"
  | "ldap-injection-template-not-found";

export type LdapInjectionDirectoryEntry = {
  id: string;
  displayName: string;
  scenarioKey: LdapInjectionScenarioKey;
  directoryArea: string;
  visibility: "public" | "restricted";
  matchedBy: "keyword" | "controlled-expanded-scope";
  teachingOnly: boolean;
};

export type LdapInjectionInspection = {
  scenarioAllowed: boolean;
  keywordLength: number;
  keywordPreview: string;
  detectedRiskTypes: LdapInjectionRiskType[];
  matchedControlledSample: boolean;
  resultScope: "public" | "expanded" | "blocked" | "none";
};

export type LdapInjectionResult = {
  status: "ok" | "blocked" | "failed";
  variantKey: LdapInjectionVariantKey;
  scenarioKey: string;
  keywordLength: number;
  keywordPreview: string;
  entries: LdapInjectionDirectoryEntry[];
  inspection: LdapInjectionInspection;
  signal: LdapInjectionSignal;
  decision: "accepted" | "blocked" | "failed";
  message: string;
  nextStep: string;
  blockedReason?: string;
};

export type LdapInjectionResponse = {
  status: "ok" | "blocked" | "failed";
  result: LdapInjectionResult;
};

async function readJson<T>(response: Response): Promise<T> {
  const body = (await response.json()) as T;

  if (!response.ok) {
    throw new Error(`request failed with status ${response.status}`);
  }

  return body;
}

export async function submitLdapInjectionSearch(
  variantKey: LdapInjectionVariantKey,
  token: string,
  input: LdapInjectionInput,
) {
  const response = await fetch(
    `/api/labs/web/ldap-injection/${variantKey}/search`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(input),
    },
  );

  if (
    response.status === 400 ||
    response.status === 403 ||
    response.status === 404
  ) {
    return (await response.json()) as LdapInjectionResponse;
  }

  return readJson<LdapInjectionResponse>(response);
}
