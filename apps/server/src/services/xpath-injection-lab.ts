export type XpathInjectionVariantKey = "vuln" | "fixed";

export type XpathInjectionQueryTemplate = "product-catalog-by-name";

export type XpathInjectionScope = "public-catalog";

export type XpathInjectionRiskType =
  | "none"
  | "controlled-scope-expansion"
  | "xpath-like-token";

export type XpathInjectionSignal =
  | "xpath-injection-safe-query-completed"
  | "xpath-injection-controlled-sample-detected"
  | "xpath-injection-result-scope-expanded"
  | "xpath-injection-controlled-sample-blocked"
  | "xpath-injection-template-not-found";

export type XpathInjectionStatus = "ok" | "blocked" | "failed";

export type XpathInjectionInput = {
  userId: string;
  variantKey: XpathInjectionVariantKey;
  queryTemplate: string;
  keyword: string;
  scope: string;
};

export type XpathInjectionDocument = {
  id: string;
  name: string;
  category: string;
  visibility: "public" | "internal";
  matchedBy: "keyword" | "controlled-expanded-scope";
  teachingOnly: boolean;
};

export type XpathInjectionInspection = {
  queryTemplateAllowed: boolean;
  scopeAllowed: boolean;
  keywordLength: number;
  keywordPreview: string;
  detectedRiskTypes: XpathInjectionRiskType[];
  matchedControlledSample: boolean;
  resultScope: "public" | "expanded" | "blocked" | "none";
};

export type XpathInjectionResult = {
  status: XpathInjectionStatus;
  variantKey: XpathInjectionVariantKey;
  queryTemplate: string;
  scope: string;
  keywordLength: number;
  keywordPreview: string;
  documents: XpathInjectionDocument[];
  inspection: XpathInjectionInspection;
  signal: XpathInjectionSignal;
  decision: "accepted" | "blocked" | "failed";
  message: string;
  nextStep: string;
  blockedReason?: string;
};

export type XpathInjectionLabService = {
  searchCatalog(input: XpathInjectionInput): Promise<XpathInjectionResult>;
};

export const xpathInjectionNormalQueryTemplate = "product-catalog-by-name";
export const xpathInjectionNormalScope = "public-catalog";
export const xpathInjectionNormalKeyword = "camera";
export const xpathInjectionControlledKeyword =
  "LAB_CONTROLLED_XPATH:expand-product-catalog";

const allowedQueryTemplates: XpathInjectionQueryTemplate[] = [
  "product-catalog-by-name",
];
const allowedScopes: XpathInjectionScope[] = ["public-catalog"];

const catalogDocuments: Array<
  Omit<XpathInjectionDocument, "matchedBy">
> = [
  {
    id: "product-public-camera",
    name: "公开相机支架",
    category: "camera-accessories",
    visibility: "public",
    teachingOnly: false,
  },
  {
    id: "product-public-cable",
    name: "公开数据线套装",
    category: "mobile-accessories",
    visibility: "public",
    teachingOnly: false,
  },
  {
    id: "product-internal-review",
    name: "虚拟内部审核产品",
    category: "internal-review",
    visibility: "internal",
    teachingOnly: true,
  },
];

function isQueryTemplate(
  value: string,
): value is XpathInjectionQueryTemplate {
  return allowedQueryTemplates.includes(value as XpathInjectionQueryTemplate);
}

function isScope(value: string): value is XpathInjectionScope {
  return allowedScopes.includes(value as XpathInjectionScope);
}

function uniqueValues<T>(values: T[]) {
  return [...new Set(values)];
}

function maskKeyword(input: {
  keyword: string;
  matchedControlledSample: boolean;
}) {
  if (input.matchedControlledSample) {
    return "controlled-xpath-keyword";
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

function detectRiskTypes(keyword: string): XpathInjectionRiskType[] {
  const normalized = keyword.trim();
  const detectedRiskTypes: XpathInjectionRiskType[] = [];

  if (!normalized) {
    return ["none"];
  }

  if (normalized === xpathInjectionControlledKeyword) {
    detectedRiskTypes.push("controlled-scope-expansion");
  }

  if (/xpath/i.test(normalized) || /['"[\]/]/.test(normalized)) {
    detectedRiskTypes.push("xpath-like-token");
  }

  return detectedRiskTypes.length > 0
    ? uniqueValues(detectedRiskTypes)
    : ["none"];
}

function hasRisk(riskTypes: XpathInjectionRiskType[]) {
  return riskTypes.some((riskType) => riskType !== "none");
}

function createInspection(input: {
  queryTemplate: string;
  keyword: string;
  scope: string;
  resultScope: XpathInjectionInspection["resultScope"];
}): XpathInjectionInspection {
  const matchedControlledSample =
    input.keyword.trim() === xpathInjectionControlledKeyword;

  return {
    queryTemplateAllowed: isQueryTemplate(input.queryTemplate),
    scopeAllowed: isScope(input.scope),
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
  variantKey: XpathInjectionVariantKey;
  queryTemplate: string;
  keyword: string;
  scope: string;
  blockedReason: string;
}): XpathInjectionResult {
  const inspection = createInspection({
    ...input,
    resultScope: "none",
  });

  return {
    status: "failed",
    variantKey: input.variantKey,
    queryTemplate: input.queryTemplate,
    scope: input.scope,
    keywordLength: inspection.keywordLength,
    keywordPreview: inspection.keywordPreview,
    documents: [],
    inspection,
    signal: "xpath-injection-template-not-found",
    decision: "failed",
    message: "查询模板或查询范围不在允许列表中，虚拟 XML 查询模拟器拒绝处理。",
    nextStep: "选择页面提供的固定模板和查询范围，再观察漏洞版与修复版差异。",
    blockedReason: input.blockedReason,
  };
}

function createBlockedResult(input: {
  variantKey: XpathInjectionVariantKey;
  queryTemplate: XpathInjectionQueryTemplate;
  keyword: string;
  scope: XpathInjectionScope;
  controlledSample: boolean;
}): XpathInjectionResult {
  const inspection = createInspection({
    queryTemplate: input.queryTemplate,
    keyword: input.keyword,
    scope: input.scope,
    resultScope: "blocked",
  });

  return {
    status: "blocked",
    variantKey: input.variantKey,
    queryTemplate: input.queryTemplate,
    scope: input.scope,
    keywordLength: inspection.keywordLength,
    keywordPreview: inspection.keywordPreview,
    documents: [],
    inspection,
    signal: input.controlledSample
      ? "xpath-injection-controlled-sample-blocked"
      : "xpath-injection-controlled-sample-detected",
    decision: "blocked",
    message: input.controlledSample
      ? "修复版只接受服务端固定查询模板，检测到受控 XPath 学习样例后已阻断。"
      : "该关键词超出本实验受控范围，虚拟 XML 查询模拟器已拒绝处理。",
    nextStep:
      input.variantKey === "fixed"
        ? "切换到漏洞版提交同样样例，观察虚拟结果范围扩大时的学习信号。"
        : "使用页面提供的受控 XPath 样例，避免提交本实验未开放的表达式文本。",
    blockedReason: input.controlledSample
      ? "controlled-sample-blocked"
      : "outside-controlled-sample",
  };
}

function includesKeyword(
  document: Omit<XpathInjectionDocument, "matchedBy">,
  keyword: string,
) {
  const normalizedKeyword = keyword.toLowerCase();

  if (!normalizedKeyword) {
    return false;
  }

  return (
    document.name.toLowerCase().includes(normalizedKeyword) ||
    document.category.toLowerCase().includes(normalizedKeyword)
  );
}

function searchPublicDocuments(keyword: string): XpathInjectionDocument[] {
  return catalogDocuments
    .filter(
      (document) =>
        document.visibility === "public" && includesKeyword(document, keyword),
    )
    .map((document) => ({
      ...document,
      matchedBy: "keyword",
    }));
}

function searchExpandedDocuments(): XpathInjectionDocument[] {
  return catalogDocuments.map((document) => ({
    ...document,
    matchedBy:
      document.visibility === "internal"
        ? "controlled-expanded-scope"
        : "keyword",
  }));
}

export function createXpathInjectionLabService(): XpathInjectionLabService {
  return {
    async searchCatalog(input) {
      const normalizedInput = {
        ...input,
        queryTemplate: input.queryTemplate.trim(),
        keyword: input.keyword.trim(),
        scope: input.scope.trim(),
      };

      if (!isQueryTemplate(normalizedInput.queryTemplate)) {
        return createTemplateNotFoundResult({
          variantKey: normalizedInput.variantKey,
          queryTemplate: normalizedInput.queryTemplate,
          keyword: normalizedInput.keyword,
          scope: normalizedInput.scope,
          blockedReason: "query-template-not-allowed",
        });
      }

      if (!isScope(normalizedInput.scope)) {
        return createTemplateNotFoundResult({
          variantKey: normalizedInput.variantKey,
          queryTemplate: normalizedInput.queryTemplate,
          keyword: normalizedInput.keyword,
          scope: normalizedInput.scope,
          blockedReason: "scope-not-allowed",
        });
      }

      const initialInspection = createInspection({
        queryTemplate: normalizedInput.queryTemplate,
        keyword: normalizedInput.keyword,
        scope: normalizedInput.scope,
        resultScope: "public",
      });
      const riskyInput = hasRisk(initialInspection.detectedRiskTypes);

      if (riskyInput && normalizedInput.variantKey === "fixed") {
        return createBlockedResult({
          variantKey: normalizedInput.variantKey,
          queryTemplate: normalizedInput.queryTemplate,
          keyword: normalizedInput.keyword,
          scope: normalizedInput.scope,
          controlledSample: initialInspection.matchedControlledSample,
        });
      }

      if (riskyInput && !initialInspection.matchedControlledSample) {
        return createBlockedResult({
          variantKey: normalizedInput.variantKey,
          queryTemplate: normalizedInput.queryTemplate,
          keyword: normalizedInput.keyword,
          scope: normalizedInput.scope,
          controlledSample: false,
        });
      }

      if (
        normalizedInput.variantKey === "vuln" &&
        initialInspection.matchedControlledSample
      ) {
        const documents = searchExpandedDocuments();

        return {
          status: "ok",
          variantKey: normalizedInput.variantKey,
          queryTemplate: normalizedInput.queryTemplate,
          scope: normalizedInput.scope,
          keywordLength: initialInspection.keywordLength,
          keywordPreview: initialInspection.keywordPreview,
          documents,
          inspection: {
            ...initialInspection,
            resultScope: "expanded",
          },
          signal: "xpath-injection-result-scope-expanded",
          decision: "accepted",
          message:
            "漏洞版识别到固定受控 XPath 学习样例，虚拟产品目录结果范围被扩大。",
          nextStep:
            "切换到修复版提交同样样例，观察服务端固定模板如何阻断查询语义改变。",
        };
      }

      const documents = searchPublicDocuments(normalizedInput.keyword);

      return {
        status: "ok",
        variantKey: normalizedInput.variantKey,
        queryTemplate: normalizedInput.queryTemplate,
        scope: normalizedInput.scope,
        keywordLength: initialInspection.keywordLength,
        keywordPreview: initialInspection.keywordPreview,
        documents,
        inspection: {
          ...initialInspection,
          resultScope: "public",
        },
        signal: "xpath-injection-safe-query-completed",
        decision: "accepted",
        message:
          "XML 产品目录查询在虚拟模拟器中正常完成，未扩大查询范围。",
        nextStep:
          "填入受控 XPath 样例，对比漏洞版和修复版的后端判定差异。",
      };
    },
  };
}
