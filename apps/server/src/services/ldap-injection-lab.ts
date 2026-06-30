export type LdapInjectionVariantKey = "vuln" | "fixed";

export type LdapInjectionScenarioKey =
  | "member-search"
  | "group-lookup"
  | "login-filter";

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

export type LdapInjectionStatus = "ok" | "blocked" | "failed";

export type LdapInjectionInput = {
  userId: string;
  variantKey: LdapInjectionVariantKey;
  scenarioKey: string;
  keyword: string;
};

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
  status: LdapInjectionStatus;
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

export type LdapInjectionLabService = {
  searchDirectory(input: LdapInjectionInput): Promise<LdapInjectionResult>;
};

export const ldapInjectionNormalScenarioKey = "member-search";
export const ldapInjectionNormalKeyword = "alice";
export const ldapInjectionControlledKeyword =
  "LAB_CONTROLLED_LDAP:expand-directory-scope";

const allowedScenarioKeys: LdapInjectionScenarioKey[] = [
  "member-search",
  "group-lookup",
  "login-filter",
];

const directoryEntries: Array<
  Omit<LdapInjectionDirectoryEntry, "matchedBy">
> = [
  {
    id: "member-public-alice",
    displayName: "Alice Chen",
    scenarioKey: "member-search",
    directoryArea: "current-organization",
    visibility: "public",
    teachingOnly: false,
  },
  {
    id: "member-public-alan",
    displayName: "Alan Wang",
    scenarioKey: "member-search",
    directoryArea: "current-organization",
    visibility: "public",
    teachingOnly: false,
  },
  {
    id: "member-restricted-review",
    displayName: "虚拟受限成员记录",
    scenarioKey: "member-search",
    directoryArea: "restricted-review",
    visibility: "restricted",
    teachingOnly: true,
  },
  {
    id: "group-public-support",
    displayName: "support-readers",
    scenarioKey: "group-lookup",
    directoryArea: "allowed-groups",
    visibility: "public",
    teachingOnly: false,
  },
  {
    id: "group-restricted-admin",
    displayName: "虚拟高权限组记录",
    scenarioKey: "group-lookup",
    directoryArea: "restricted-groups",
    visibility: "restricted",
    teachingOnly: true,
  },
  {
    id: "login-public-candidate",
    displayName: "login-candidate-demo",
    scenarioKey: "login-filter",
    directoryArea: "login-candidates",
    visibility: "public",
    teachingOnly: false,
  },
  {
    id: "login-restricted-review",
    displayName: "虚拟登录候选偏移记录",
    scenarioKey: "login-filter",
    directoryArea: "restricted-login-review",
    visibility: "restricted",
    teachingOnly: true,
  },
];

function isScenarioKey(value: string): value is LdapInjectionScenarioKey {
  return allowedScenarioKeys.includes(value as LdapInjectionScenarioKey);
}

function uniqueValues<T>(values: T[]) {
  return [...new Set(values)];
}

function maskKeyword(input: {
  keyword: string;
  matchedControlledSample: boolean;
}) {
  if (input.matchedControlledSample) {
    return "controlled-ldap-keyword";
  }

  const normalized = input.keyword.trim();

  if (!normalized) {
    return "empty-keyword";
  }

  if (normalized.length <= 4) {
    return "***";
  }

  return `${normalized.slice(0, 3)}***${normalized.slice(-2)}`;
}

function detectRiskTypes(keyword: string): LdapInjectionRiskType[] {
  const normalized = keyword.trim();
  const detectedRiskTypes: LdapInjectionRiskType[] = [];

  if (!normalized) {
    return ["none"];
  }

  if (normalized === ldapInjectionControlledKeyword) {
    detectedRiskTypes.push("controlled-scope-expansion");
  }

  if (/ldap/i.test(normalized) || /[()=*\u0000]/.test(normalized)) {
    detectedRiskTypes.push("directory-filter-like-token");
  }

  return detectedRiskTypes.length > 0
    ? uniqueValues(detectedRiskTypes)
    : ["none"];
}

function hasRisk(riskTypes: LdapInjectionRiskType[]) {
  return riskTypes.some((riskType) => riskType !== "none");
}

function createInspection(input: {
  scenarioKey: string;
  keyword: string;
  resultScope: LdapInjectionInspection["resultScope"];
}): LdapInjectionInspection {
  const matchedControlledSample =
    input.keyword.trim() === ldapInjectionControlledKeyword;

  return {
    scenarioAllowed: isScenarioKey(input.scenarioKey),
    keywordLength: input.keyword.length,
    keywordPreview: maskKeyword({
      keyword: input.keyword,
      matchedControlledSample,
    }),
    detectedRiskTypes: detectRiskTypes(input.keyword),
    matchedControlledSample,
    resultScope: input.resultScope,
  };
}

function createTemplateNotFoundResult(input: {
  variantKey: LdapInjectionVariantKey;
  scenarioKey: string;
  keyword: string;
}): LdapInjectionResult {
  const inspection = createInspection({
    scenarioKey: input.scenarioKey,
    keyword: input.keyword,
    resultScope: "none",
  });

  return {
    status: "failed",
    variantKey: input.variantKey,
    scenarioKey: input.scenarioKey,
    keywordLength: inspection.keywordLength,
    keywordPreview: inspection.keywordPreview,
    entries: [],
    inspection,
    signal: "ldap-injection-template-not-found",
    decision: "failed",
    message: "目录查询场景不在允许列表中，虚拟目录模拟器拒绝处理。",
    nextStep: "选择页面提供的固定案例场景，再观察漏洞版和修复版差异。",
    blockedReason: "scenario-not-allowed",
  };
}

function createBlockedResult(input: {
  variantKey: LdapInjectionVariantKey;
  scenarioKey: LdapInjectionScenarioKey;
  keyword: string;
  controlledSample: boolean;
}): LdapInjectionResult {
  const inspection = createInspection({
    scenarioKey: input.scenarioKey,
    keyword: input.keyword,
    resultScope: "blocked",
  });

  return {
    status: "blocked",
    variantKey: input.variantKey,
    scenarioKey: input.scenarioKey,
    keywordLength: inspection.keywordLength,
    keywordPreview: inspection.keywordPreview,
    entries: [],
    inspection,
    signal: input.controlledSample
      ? "ldap-injection-controlled-sample-blocked"
      : "ldap-injection-input-blocked",
    decision: "blocked",
    message: input.controlledSample
      ? "修复版只接受服务端固定目录查询场景，检测到受控学习样例后已阻断。"
      : "该关键词超出本实验受控范围，虚拟目录模拟器已拒绝处理。",
    nextStep:
      input.variantKey === "fixed"
        ? "切换到漏洞版提交同样样例，观察虚拟目录结果范围如何被扩大。"
        : "使用页面提供的受控 LDAP 学习样例，避免提交本实验未开放的过滤条件文本。",
    blockedReason: input.controlledSample
      ? "controlled-sample-blocked"
      : "outside-controlled-sample",
  };
}

function includesKeyword(
  entry: Omit<LdapInjectionDirectoryEntry, "matchedBy">,
  keyword: string,
) {
  const normalizedKeyword = keyword.toLowerCase();

  if (!normalizedKeyword) {
    return false;
  }

  return (
    entry.displayName.toLowerCase().includes(normalizedKeyword) ||
    entry.directoryArea.toLowerCase().includes(normalizedKeyword)
  );
}

function searchPublicEntries(
  scenarioKey: LdapInjectionScenarioKey,
  keyword: string,
): LdapInjectionDirectoryEntry[] {
  return directoryEntries
    .filter(
      (entry) =>
        entry.scenarioKey === scenarioKey &&
        entry.visibility === "public" &&
        includesKeyword(entry, keyword),
    )
    .map((entry) => ({
      ...entry,
      matchedBy: "keyword",
    }));
}

function searchExpandedEntries(
  scenarioKey: LdapInjectionScenarioKey,
): LdapInjectionDirectoryEntry[] {
  return directoryEntries
    .filter((entry) => entry.scenarioKey === scenarioKey)
    .map((entry) => ({
      ...entry,
      matchedBy:
        entry.visibility === "restricted"
          ? "controlled-expanded-scope"
          : "keyword",
    }));
}

export function createLdapInjectionLabService(): LdapInjectionLabService {
  return {
    async searchDirectory(input) {
      const normalizedInput = {
        ...input,
        scenarioKey: input.scenarioKey.trim(),
        keyword: input.keyword.trim(),
      };

      if (!isScenarioKey(normalizedInput.scenarioKey)) {
        return createTemplateNotFoundResult(normalizedInput);
      }

      const initialInspection = createInspection({
        scenarioKey: normalizedInput.scenarioKey,
        keyword: normalizedInput.keyword,
        resultScope: "public",
      });
      const riskyInput = hasRisk(initialInspection.detectedRiskTypes);

      if (riskyInput && normalizedInput.variantKey === "fixed") {
        return createBlockedResult({
          variantKey: normalizedInput.variantKey,
          scenarioKey: normalizedInput.scenarioKey,
          keyword: normalizedInput.keyword,
          controlledSample: initialInspection.matchedControlledSample,
        });
      }

      if (riskyInput && !initialInspection.matchedControlledSample) {
        return createBlockedResult({
          variantKey: normalizedInput.variantKey,
          scenarioKey: normalizedInput.scenarioKey,
          keyword: normalizedInput.keyword,
          controlledSample: false,
        });
      }

      if (
        normalizedInput.variantKey === "vuln" &&
        initialInspection.matchedControlledSample
      ) {
        const entries = searchExpandedEntries(normalizedInput.scenarioKey);

        return {
          status: "ok",
          variantKey: normalizedInput.variantKey,
          scenarioKey: normalizedInput.scenarioKey,
          keywordLength: initialInspection.keywordLength,
          keywordPreview: initialInspection.keywordPreview,
          entries,
          inspection: {
            ...initialInspection,
            resultScope: "expanded",
          },
          signal: "ldap-injection-scope-expanded",
          decision: "accepted",
          message:
            "漏洞版识别到固定受控 LDAP 学习样例，虚拟目录结果范围被扩大。",
          nextStep:
            "切换到修复版提交同样样例，观察服务端固定查询场景如何阻断语义改变。",
        };
      }

      const entries = searchPublicEntries(
        normalizedInput.scenarioKey,
        normalizedInput.keyword,
      );

      return {
        status: "ok",
        variantKey: normalizedInput.variantKey,
        scenarioKey: normalizedInput.scenarioKey,
        keywordLength: initialInspection.keywordLength,
        keywordPreview: initialInspection.keywordPreview,
        entries,
        inspection: {
          ...initialInspection,
          resultScope: "public",
        },
        signal: "ldap-injection-safe-search-completed",
        decision: "accepted",
        message: "虚拟目录查询在固定场景中正常完成，未扩大结果范围。",
        nextStep:
          "填入受控 LDAP 学习样例，对比漏洞版和修复版的后端判定差异。",
      };
    },
  };
}
