export type NosqlInjectionVariantKey = "vuln" | "fixed";

export type NosqlInjectionQueryMode = "coupon-search";

export type NosqlInjectionRiskType =
  | "none"
  | "controlled-operator"
  | "object-like-input"
  | "array-like-input"
  | "operator-like-token";

export type NosqlInjectionSignal =
  | "nosql-injection-safe-query-completed"
  | "nosql-injection-operator-detected"
  | "nosql-injection-query-expanded"
  | "nosql-injection-operator-blocked"
  | "nosql-injection-schema-blocked"
  | "nosql-injection-query-mode-not-found";

export type NosqlInjectionStatus = "ok" | "blocked" | "failed";

export type NosqlInjectionInput = {
  userId: string;
  variantKey: NosqlInjectionVariantKey;
  queryMode: string;
  keyword: string;
  filterText?: string;
};

export type NosqlInjectionDocument = {
  id: string;
  title: string;
  channel: string;
  visibility: "public" | "hidden";
  teachingOnly: boolean;
};

export type NosqlInjectionInspection = {
  queryModeAllowed: boolean;
  keywordLength: number;
  filterTextLength: number;
  detectedRiskTypes: NosqlInjectionRiskType[];
  matchedControlledSample: boolean;
  resultScope: "public" | "expanded" | "blocked" | "none";
};

export type NosqlInjectionResult = {
  status: NosqlInjectionStatus;
  variantKey: NosqlInjectionVariantKey;
  queryMode: string;
  keyword: string;
  filterTextLength: number;
  documents: NosqlInjectionDocument[];
  inspection: NosqlInjectionInspection;
  signal: NosqlInjectionSignal;
  decision: "accepted" | "blocked" | "failed";
  message: string;
  nextStep: string;
  blockedReason?: string;
};

export type NosqlInjectionLabService = {
  searchCoupons(input: NosqlInjectionInput): Promise<NosqlInjectionResult>;
};

export const nosqlInjectionNormalKeyword = "shipping";
export const nosqlInjectionNormalFilterText = "public-only";
export const nosqlInjectionAttackFilterText =
  "LAB_CONTROLLED_OPERATOR:include-hidden-coupons";

const couponDocuments: NosqlInjectionDocument[] = [
  {
    id: "coupon-public-shipping",
    title: "公开运费优惠券",
    channel: "shipping",
    visibility: "public",
    teachingOnly: false,
  },
  {
    id: "coupon-public-storefront",
    title: "公开商城优惠券",
    channel: "storefront",
    visibility: "public",
    teachingOnly: false,
  },
  {
    id: "coupon-hidden-review",
    title: "虚拟隐藏复盘优惠券",
    channel: "internal-review",
    visibility: "hidden",
    teachingOnly: true,
  },
];

function isQueryMode(value: string): value is NosqlInjectionQueryMode {
  return value === "coupon-search";
}

function uniqueValues<T>(values: T[]) {
  return [...new Set(values)];
}

function includesKeyword(document: NosqlInjectionDocument, keyword: string) {
  const normalizedKeyword = keyword.toLowerCase();

  if (!normalizedKeyword) {
    return false;
  }

  return (
    document.title.toLowerCase().includes(normalizedKeyword) ||
    document.channel.toLowerCase().includes(normalizedKeyword)
  );
}

function detectRiskTypes(filterText: string): NosqlInjectionRiskType[] {
  const normalized = filterText.trim();
  const riskTypes: NosqlInjectionRiskType[] = [];

  if (!normalized || normalized === nosqlInjectionNormalFilterText) {
    return ["none"];
  }

  if (normalized === nosqlInjectionAttackFilterText) {
    riskTypes.push("controlled-operator");
  }

  if (normalized.startsWith("{")) {
    riskTypes.push("object-like-input");
  }

  if (normalized.startsWith("[")) {
    riskTypes.push("array-like-input");
  }

  if (normalized.includes("$") || /operator/i.test(normalized)) {
    riskTypes.push("operator-like-token");
  }

  return riskTypes.length > 0 ? uniqueValues(riskTypes) : ["none"];
}

function hasRisk(riskTypes: NosqlInjectionRiskType[]) {
  return riskTypes.some((riskType) => riskType !== "none");
}

function createInspection(input: {
  queryMode: string;
  keyword: string;
  filterText: string;
  resultScope: NosqlInjectionInspection["resultScope"];
}): NosqlInjectionInspection {
  const detectedRiskTypes = detectRiskTypes(input.filterText);

  return {
    queryModeAllowed: isQueryMode(input.queryMode),
    keywordLength: input.keyword.length,
    filterTextLength: input.filterText.length,
    detectedRiskTypes,
    matchedControlledSample:
      input.filterText.trim() === nosqlInjectionAttackFilterText,
    resultScope: input.resultScope,
  };
}

function createQueryModeNotFoundResult(input: {
  variantKey: NosqlInjectionVariantKey;
  queryMode: string;
  keyword: string;
  filterText: string;
}): NosqlInjectionResult {
  return {
    status: "failed",
    variantKey: input.variantKey,
    queryMode: input.queryMode,
    keyword: input.keyword,
    filterTextLength: input.filterText.length,
    documents: [],
    inspection: createInspection({
      ...input,
      resultScope: "none",
    }),
    signal: "nosql-injection-query-mode-not-found",
    decision: "failed",
    message: "该查询模式不在允许列表中，虚拟文档查询器拒绝处理。",
    nextStep: "选择页面提供的优惠券检索模式，再观察漏洞版和修复版差异。",
    blockedReason: "query-mode-not-allowed",
  };
}

function createBlockedResult(input: {
  variantKey: NosqlInjectionVariantKey;
  queryMode: NosqlInjectionQueryMode;
  keyword: string;
  filterText: string;
  controlledSample: boolean;
}): NosqlInjectionResult {
  const inspection = createInspection({
    queryMode: input.queryMode,
    keyword: input.keyword,
    filterText: input.filterText,
    resultScope: "blocked",
  });

  return {
    status: "blocked",
    variantKey: input.variantKey,
    queryMode: input.queryMode,
    keyword: input.keyword,
    filterTextLength: input.filterText.length,
    documents: [],
    inspection,
    signal: input.controlledSample
      ? "nosql-injection-operator-blocked"
      : "nosql-injection-schema-blocked",
    decision: "blocked",
    message: input.controlledSample
      ? "修复版只接受服务端查询模板，检测到受控操作符样例后已阻断。"
      : "该筛选文本超出本实验受控范围，虚拟文档查询器已拒绝处理。",
    nextStep:
      input.variantKey === "fixed"
        ? "切换到漏洞版提交同样样例，观察查询语义被扩大时的学习信号。"
        : "使用页面提供的受控 NoSQL 样例，避免提交本实验未开放的查询结构。",
    blockedReason: input.controlledSample
      ? "controlled-operator-blocked"
      : "outside-controlled-sample",
  };
}

function searchPublicCoupons(keyword: string) {
  return couponDocuments.filter(
    (document) =>
      document.visibility === "public" && includesKeyword(document, keyword),
  );
}

function searchExpandedCoupons(keyword: string) {
  const publicResults = searchPublicCoupons(keyword);
  const hiddenTeachingResults = couponDocuments.filter(
    (document) => document.visibility === "hidden" && document.teachingOnly,
  );

  return [...publicResults, ...hiddenTeachingResults];
}

export function createNosqlInjectionLabService(): NosqlInjectionLabService {
  return {
    async searchCoupons(input) {
      const normalizedInput = {
        ...input,
        queryMode: input.queryMode.trim(),
        keyword: input.keyword.trim(),
        filterText: input.filterText?.trim() ?? "",
      };

      if (!isQueryMode(normalizedInput.queryMode)) {
        return createQueryModeNotFoundResult(normalizedInput);
      }

      const initialInspection = createInspection({
        queryMode: normalizedInput.queryMode,
        keyword: normalizedInput.keyword,
        filterText: normalizedInput.filterText,
        resultScope: "public",
      });
      const riskyInput = hasRisk(initialInspection.detectedRiskTypes);

      if (riskyInput && normalizedInput.variantKey === "fixed") {
        return createBlockedResult({
          variantKey: normalizedInput.variantKey,
          queryMode: normalizedInput.queryMode,
          keyword: normalizedInput.keyword,
          filterText: normalizedInput.filterText,
          controlledSample: initialInspection.matchedControlledSample,
        });
      }

      if (riskyInput && !initialInspection.matchedControlledSample) {
        return createBlockedResult({
          variantKey: normalizedInput.variantKey,
          queryMode: normalizedInput.queryMode,
          keyword: normalizedInput.keyword,
          filterText: normalizedInput.filterText,
          controlledSample: false,
        });
      }

      if (
        normalizedInput.variantKey === "vuln" &&
        initialInspection.matchedControlledSample
      ) {
        const documents = searchExpandedCoupons(normalizedInput.keyword);

        return {
          status: "ok",
          variantKey: normalizedInput.variantKey,
          queryMode: normalizedInput.queryMode,
          keyword: normalizedInput.keyword,
          filterTextLength: normalizedInput.filterText.length,
          documents,
          inspection: {
            ...initialInspection,
            resultScope: "expanded",
          },
          signal: "nosql-injection-query-expanded",
          decision: "accepted",
          message:
            "漏洞版识别到受控操作符样例，虚拟查询范围被扩大并返回教学隐藏记录。",
          nextStep:
            "切换到修复版提交同样样例，观察服务端查询模板如何阻断结构化输入。",
        };
      }

      const documents = searchPublicCoupons(normalizedInput.keyword);

      return {
        status: "ok",
        variantKey: normalizedInput.variantKey,
        queryMode: normalizedInput.queryMode,
        keyword: normalizedInput.keyword,
        filterTextLength: normalizedInput.filterText.length,
        documents,
        inspection: {
          ...initialInspection,
          resultScope: "public",
        },
        signal: initialInspection.matchedControlledSample
          ? "nosql-injection-operator-detected"
          : "nosql-injection-safe-query-completed",
        decision: "accepted",
        message:
          "优惠券文档检索在虚拟查询器中正常完成，未扩大查询范围。",
        nextStep:
          "填入受控 NoSQL 样例，对比漏洞版和修复版的后端判定差异。",
      };
    },
  };
}
