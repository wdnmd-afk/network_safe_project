export type SstiVariantKey = "vuln" | "fixed";

export type SstiTemplateKey =
  | "shipping-notice"
  | "security-reminder"
  | "invoice-ready";

export type SstiTemplateVariables = {
  customerName: string;
  orderNo: string;
  noticeTitle: string;
};

export type SstiExpressionType =
  | "allowed-variable"
  | "controlled-math-expression"
  | "controlled-debug-context"
  | "unknown-expression";

export type SstiSignal =
  | "ssti-safe-template-rendered"
  | "ssti-expression-evaluated"
  | "ssti-template-context-exposed"
  | "ssti-expression-blocked"
  | "ssti-template-not-found";

export type SstiStatus = "ok" | "blocked" | "failed";

export type SstiPreviewInput = {
  userId: string;
  variantKey: SstiVariantKey;
  templateKey: string;
  templateText?: string;
  variables: SstiTemplateVariables;
};

export type SstiInspection = {
  templateLength: number;
  expressionCount: number;
  expressionTypes: SstiExpressionType[];
  matchedControlledSample: boolean;
  unknownExpressionCount: number;
  variableKeys: string[];
  acceptedVariableKeys: string[];
};

export type SstiPreviewResult = {
  status: SstiStatus;
  variantKey: SstiVariantKey;
  templateKey: string;
  renderedText: string;
  inspection: SstiInspection;
  signal: SstiSignal;
  decision: "accepted" | "blocked" | "failed";
  message: string;
  nextStep: string;
  blockedReason?: string;
};

export type SstiLabService = {
  previewTemplate(input: SstiPreviewInput): Promise<SstiPreviewResult>;
};

export const sstiNormalTemplateText =
  "尊敬的 {{ customerName }}，您的订单 {{ orderNo }} 已进入处理流程。";
export const sstiMathTemplateText =
  "尊敬的 {{ customerName }}，调试结果：{{ 7 * 7 }}";
export const sstiDebugTemplateText =
  "尊敬的 {{ customerName }}，上下文：{{ debugContext }}";
export const sstiNormalVariables: SstiTemplateVariables = {
  customerName: "演示用户",
  orderNo: "ORDER-1001",
  noticeTitle: "发货提醒",
};

const allowedVariableKeys = [
  "customerName",
  "orderNo",
  "noticeTitle",
] as const;

const templateDefinitions: Record<
  SstiTemplateKey,
  {
    title: string;
    templateText: string;
  }
> = {
  "shipping-notice": {
    title: "发货通知",
    templateText:
      "尊敬的 {{ customerName }}，您的订单 {{ orderNo }} 已进入发货流程。",
  },
  "security-reminder": {
    title: "安全提醒",
    templateText:
      "尊敬的 {{ customerName }}，{{ noticeTitle }}：请确认近期登录记录。",
  },
  "invoice-ready": {
    title: "发票就绪提醒",
    templateText:
      "尊敬的 {{ customerName }}，订单 {{ orderNo }} 的发票已可下载。",
  },
};

function isTemplateKey(value: string): value is SstiTemplateKey {
  return Object.hasOwn(templateDefinitions, value);
}

function isAllowedVariableKey(
  value: string,
): value is keyof SstiTemplateVariables {
  return allowedVariableKeys.includes(value as keyof SstiTemplateVariables);
}

function uniqueValues<T>(values: T[]) {
  return [...new Set(values)];
}

function readExpressions(templateText: string) {
  const expressions: string[] = [];
  const expressionPattern = /{{\s*([^{}]+?)\s*}}/g;

  for (const match of templateText.matchAll(expressionPattern)) {
    const expression = match[1]?.trim();

    if (expression) {
      expressions.push(expression);
    }
  }

  return expressions;
}

function classifyExpression(expression: string): SstiExpressionType {
  if (isAllowedVariableKey(expression)) {
    return "allowed-variable";
  }

  if (expression === "7 * 7") {
    return "controlled-math-expression";
  }

  if (expression === "debugContext") {
    return "controlled-debug-context";
  }

  return "unknown-expression";
}

function inspectTemplate(
  templateText: string,
  variables: SstiTemplateVariables,
): SstiInspection {
  const expressions = readExpressions(templateText);
  const expressionTypes = expressions.map(classifyExpression);
  const acceptedVariableKeys = uniqueValues(
    expressions.filter(isAllowedVariableKey),
  );

  return {
    templateLength: templateText.length,
    expressionCount: expressions.length,
    expressionTypes: uniqueValues(expressionTypes),
    matchedControlledSample: expressionTypes.some(
      (expressionType) =>
        expressionType === "controlled-math-expression" ||
        expressionType === "controlled-debug-context",
    ),
    unknownExpressionCount: expressionTypes.filter(
      (expressionType) => expressionType === "unknown-expression",
    ).length,
    variableKeys: allowedVariableKeys.filter(
      (key) => typeof variables[key] === "string",
    ),
    acceptedVariableKeys,
  };
}

function hasBlockedExpression(inspection: SstiInspection) {
  return inspection.expressionTypes.some(
    (expressionType) => expressionType !== "allowed-variable",
  );
}

function renderTeachingTemplate(input: {
  templateText: string;
  templateKey: SstiTemplateKey;
  variables: SstiTemplateVariables;
}) {
  return input.templateText.replace(/{{\s*([^{}]+?)\s*}}/g, (match, raw) => {
    const expression = String(raw).trim();

    if (isAllowedVariableKey(expression)) {
      return input.variables[expression];
    }

    if (expression === "7 * 7") {
      return "49";
    }

    if (expression === "debugContext") {
      return `虚拟上下文：templateId=${input.templateKey}, tenantId=demo-tenant, debugMode=true`;
    }

    return match;
  });
}

function createTemplateNotFoundResult(
  input: SstiPreviewInput,
): SstiPreviewResult {
  return {
    status: "failed",
    variantKey: input.variantKey,
    templateKey: input.templateKey,
    renderedText: "",
    inspection: {
      templateLength: 0,
      expressionCount: 0,
      expressionTypes: [],
      matchedControlledSample: false,
      unknownExpressionCount: 0,
      variableKeys: allowedVariableKeys.filter(
        (key) => typeof input.variables[key] === "string",
      ),
      acceptedVariableKeys: [],
    },
    signal: "ssti-template-not-found",
    decision: "failed",
    message: "该通知模板不在允许列表中，预览请求已失败。",
    nextStep: "选择页面提供的固定模板，再对比漏洞版和修复版的表达式处理差异。",
    blockedReason: "template-not-allowed",
  };
}

function createBlockedResult(input: {
  variantKey: SstiVariantKey;
  templateKey: SstiTemplateKey;
  inspection: SstiInspection;
  reason: string;
}): SstiPreviewResult {
  return {
    status: "blocked",
    variantKey: input.variantKey,
    templateKey: input.templateKey,
    renderedText: "",
    inspection: input.inspection,
    signal: "ssti-expression-blocked",
    decision: "blocked",
    message:
      "模板中包含非允许变量表达式，教学模拟器已按安全边界阻断预览。",
    nextStep:
      input.variantKey === "fixed"
        ? "切换到漏洞版提交同样样例，观察表达式被解释时的学习信号。"
        : "使用页面提供的受控表达式样例，避免提交本实验未开放的表达式。",
    blockedReason: input.reason,
  };
}

function createSignal(input: {
  variantKey: SstiVariantKey;
  inspection: SstiInspection;
}): SstiSignal {
  if (
    input.variantKey === "vuln" &&
    input.inspection.expressionTypes.includes("controlled-debug-context")
  ) {
    return "ssti-template-context-exposed";
  }

  if (
    input.variantKey === "vuln" &&
    input.inspection.expressionTypes.includes("controlled-math-expression")
  ) {
    return "ssti-expression-evaluated";
  }

  return "ssti-safe-template-rendered";
}

export function createSstiLabService(): SstiLabService {
  return {
    async previewTemplate(input) {
      const normalizedTemplateKey = input.templateKey.trim();
      const normalizedInput = {
        ...input,
        templateKey: normalizedTemplateKey,
        templateText: input.templateText?.trim(),
      };

      if (!isTemplateKey(normalizedTemplateKey)) {
        return createTemplateNotFoundResult(normalizedInput);
      }

      const systemTemplate =
        templateDefinitions[normalizedTemplateKey].templateText;
      const requestedTemplate =
        normalizedInput.templateText && normalizedInput.templateText.length > 0
          ? normalizedInput.templateText
          : systemTemplate;
      const inspection = inspectTemplate(requestedTemplate, input.variables);

      if (inspection.unknownExpressionCount > 0) {
        return createBlockedResult({
          variantKey: input.variantKey,
          templateKey: normalizedTemplateKey,
          inspection,
          reason: "unknown-expression",
        });
      }

      if (input.variantKey === "fixed" && hasBlockedExpression(inspection)) {
        return createBlockedResult({
          variantKey: input.variantKey,
          templateKey: normalizedTemplateKey,
          inspection,
          reason: "expression-not-allowed",
        });
      }

      const renderSource =
        input.variantKey === "fixed" ? systemTemplate : requestedTemplate;
      const renderedText = renderTeachingTemplate({
        templateText: renderSource,
        templateKey: normalizedTemplateKey,
        variables: input.variables,
      });
      const signal = createSignal({
        variantKey: input.variantKey,
        inspection,
      });

      return {
        status: "ok",
        variantKey: input.variantKey,
        templateKey: normalizedTemplateKey,
        renderedText,
        inspection,
        signal,
        decision: "accepted",
        message:
          signal === "ssti-template-context-exposed"
            ? "漏洞版把受控上下文表达式当作模板语法解释，返回了虚拟上下文说明。"
            : signal === "ssti-expression-evaluated"
              ? "漏洞版把受控数学表达式当作模板语法解释，返回了固定教学结果。"
              : "通知模板只使用允许变量，预览在教学模拟器中正常完成。",
        nextStep:
          input.variantKey === "vuln"
            ? "切换到修复版提交同样样例，观察变量允许列表如何阻断表达式。"
            : "尝试提交受控表达式样例，观察修复版如何拒绝非允许变量表达式。",
      };
    },
  };
}
