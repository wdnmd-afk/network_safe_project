export type CrlfInjectionVariantKey = "vuln" | "fixed";

export type CrlfInjectionHeaderTemplate = "download-filename";

export type CrlfInjectionDispositionType = "attachment" | "inline";

export type CrlfInjectionControlCharType = "cr" | "lf" | "other-control";

export type CrlfInjectionHeaderSource =
  | "template"
  | "user-input"
  | "virtual-injected";

export type CrlfInjectionSignal =
  | "crlf-injection-safe-header-previewed"
  | "crlf-injection-control-chars-detected"
  | "crlf-injection-virtual-header-injected"
  | "crlf-injection-control-chars-blocked"
  | "crlf-injection-template-not-found";

export type CrlfInjectionStatus = "ok" | "blocked" | "failed";

export type CrlfInjectionPreviewInput = {
  userId: string;
  variantKey: CrlfInjectionVariantKey;
  headerTemplate: string;
  fileName: string;
  dispositionType: string;
};

export type CrlfInjectionVirtualHeader = {
  name: string;
  valuePreview: string;
  source: CrlfInjectionHeaderSource;
  polluted: boolean;
};

export type CrlfInjectionInspection = {
  headerTemplateAllowed: boolean;
  dispositionTypeAllowed: boolean;
  fileNameLength: number;
  fileNamePreview: string;
  detectedControlChars: CrlfInjectionControlCharType[];
  matchedControlledSample: boolean;
  virtualHeaderCount: number;
  pollutedHeaderCount: number;
};

export type CrlfInjectionPreviewResult = {
  status: CrlfInjectionStatus;
  variantKey: CrlfInjectionVariantKey;
  headerTemplate: string;
  dispositionType: string;
  fileNameLength: number;
  fileNamePreview: string;
  headers: CrlfInjectionVirtualHeader[];
  inspection: CrlfInjectionInspection;
  signal: CrlfInjectionSignal;
  decision: "accepted" | "blocked" | "failed";
  message: string;
  nextStep: string;
  blockedReason?: string;
};

export type CrlfInjectionLabService = {
  previewHeaders(
    input: CrlfInjectionPreviewInput,
  ): Promise<CrlfInjectionPreviewResult>;
};

export const crlfInjectionNormalHeaderTemplate = "download-filename";
export const crlfInjectionNormalDispositionType = "attachment";
export const crlfInjectionNormalFileName = "invoice.pdf";
export const crlfInjectionControlledFileName =
  "invoice.pdf\r\nX-Lab-Debug: exposed";

const allowedHeaderTemplates: CrlfInjectionHeaderTemplate[] = [
  "download-filename",
];
const allowedDispositionTypes: CrlfInjectionDispositionType[] = [
  "attachment",
  "inline",
];

function isHeaderTemplate(
  value: string,
): value is CrlfInjectionHeaderTemplate {
  return allowedHeaderTemplates.includes(value as CrlfInjectionHeaderTemplate);
}

function isDispositionType(
  value: string,
): value is CrlfInjectionDispositionType {
  return allowedDispositionTypes.includes(
    value as CrlfInjectionDispositionType,
  );
}

function uniqueValues<T>(values: T[]) {
  return [...new Set(values)];
}

function detectControlChars(fileName: string): CrlfInjectionControlCharType[] {
  const detected: CrlfInjectionControlCharType[] = [];

  for (const char of fileName) {
    const code = char.charCodeAt(0);

    if (code === 13) {
      detected.push("cr");
      continue;
    }

    if (code === 10) {
      detected.push("lf");
      continue;
    }

    if ((code >= 0 && code <= 31) || code === 127) {
      detected.push("other-control");
    }
  }

  return uniqueValues(detected);
}

function maskFileName(fileName: string) {
  const normalized = fileName.replace(/[\x00-\x1F\x7F]/g, "?").trim();

  if (!normalized) {
    return "empty-file-name";
  }

  if (normalized.length <= 4) {
    return "***";
  }

  return `${normalized.slice(0, 3)}***${normalized.slice(-2)}`;
}

function createFileNamePreview(input: {
  fileName: string;
  matchedControlledSample: boolean;
}) {
  return input.matchedControlledSample
    ? "controlled-crlf-file-name"
    : maskFileName(input.fileName);
}

function createVirtualHeaders(input: {
  dispositionType: CrlfInjectionDispositionType;
  fileNamePreview: string;
  polluted: boolean;
}): CrlfInjectionVirtualHeader[] {
  const contentDispositionHeader: CrlfInjectionVirtualHeader = {
    name: "Content-Disposition",
    valuePreview: `${input.dispositionType}; filename="${input.fileNamePreview}"`,
    source: input.polluted ? "user-input" : "template",
    polluted: input.polluted,
  };

  if (!input.polluted) {
    return [contentDispositionHeader];
  }

  return [
    contentDispositionHeader,
    {
      name: "X-Lab-Debug",
      valuePreview: "virtual teaching header",
      source: "virtual-injected",
      polluted: true,
    },
  ];
}

function createInspection(input: {
  headerTemplate: string;
  dispositionType: string;
  fileName: string;
  headers: CrlfInjectionVirtualHeader[];
}): CrlfInjectionInspection {
  const detectedControlChars = detectControlChars(input.fileName);
  const matchedControlledSample =
    input.fileName === crlfInjectionControlledFileName;
  const fileNamePreview = createFileNamePreview({
    fileName: input.fileName,
    matchedControlledSample,
  });

  return {
    headerTemplateAllowed: isHeaderTemplate(input.headerTemplate),
    dispositionTypeAllowed: isDispositionType(input.dispositionType),
    fileNameLength: input.fileName.length,
    fileNamePreview,
    detectedControlChars,
    matchedControlledSample,
    virtualHeaderCount: input.headers.length,
    pollutedHeaderCount: input.headers.filter((header) => header.polluted)
      .length,
  };
}

function createTemplateNotFoundResult(input: {
  variantKey: CrlfInjectionVariantKey;
  headerTemplate: string;
  dispositionType: string;
  fileName: string;
  blockedReason: string;
}): CrlfInjectionPreviewResult {
  const headers: CrlfInjectionVirtualHeader[] = [];
  const inspection = createInspection({
    headerTemplate: input.headerTemplate,
    dispositionType: input.dispositionType,
    fileName: input.fileName,
    headers,
  });

  return {
    status: "failed",
    variantKey: input.variantKey,
    headerTemplate: input.headerTemplate,
    dispositionType: input.dispositionType,
    fileNameLength: inspection.fileNameLength,
    fileNamePreview: inspection.fileNamePreview,
    headers,
    inspection,
    signal: "crlf-injection-template-not-found",
    decision: "failed",
    message: "响应头模板或下载方式不在允许列表中，虚拟预览请求已失败。",
    nextStep: "选择页面提供的固定模板和下载方式，再观察漏洞版与修复版差异。",
    blockedReason: input.blockedReason,
  };
}

function createControlCharBlockedResult(input: {
  variantKey: CrlfInjectionVariantKey;
  headerTemplate: CrlfInjectionHeaderTemplate;
  dispositionType: CrlfInjectionDispositionType;
  fileName: string;
}): CrlfInjectionPreviewResult {
  const headers: CrlfInjectionVirtualHeader[] = [];
  const inspection = createInspection({
    headerTemplate: input.headerTemplate,
    dispositionType: input.dispositionType,
    fileName: input.fileName,
    headers,
  });

  return {
    status: "blocked",
    variantKey: input.variantKey,
    headerTemplate: input.headerTemplate,
    dispositionType: input.dispositionType,
    fileNameLength: inspection.fileNameLength,
    fileNamePreview: inspection.fileNamePreview,
    headers,
    inspection,
    signal: "crlf-injection-control-chars-blocked",
    decision: "blocked",
    message:
      "修复版在服务端检测到 CR / LF 或控制字符，已阻断虚拟响应头预览。",
    nextStep: "切换到漏洞版提交同样受控样例，观察虚拟头部污染信号。",
    blockedReason: "control-chars-blocked",
  };
}

function createOutsideControlledSampleResult(input: {
  variantKey: CrlfInjectionVariantKey;
  headerTemplate: CrlfInjectionHeaderTemplate;
  dispositionType: CrlfInjectionDispositionType;
  fileName: string;
}): CrlfInjectionPreviewResult {
  const headers: CrlfInjectionVirtualHeader[] = [];
  const inspection = createInspection({
    headerTemplate: input.headerTemplate,
    dispositionType: input.dispositionType,
    fileName: input.fileName,
    headers,
  });

  return {
    status: "blocked",
    variantKey: input.variantKey,
    headerTemplate: input.headerTemplate,
    dispositionType: input.dispositionType,
    fileNameLength: inspection.fileNameLength,
    fileNamePreview: inspection.fileNamePreview,
    headers,
    inspection,
    signal: "crlf-injection-control-chars-detected",
    decision: "blocked",
    message:
      "检测到控制字符，但该输入不属于本项目固定受控样例，已按实验边界拒绝。",
    nextStep: "使用页面提供的固定受控样例，避免提交本实验未开放的头部文本。",
    blockedReason: "outside-controlled-sample",
  };
}

export function createCrlfInjectionLabService(): CrlfInjectionLabService {
  return {
    async previewHeaders(input) {
      const normalizedHeaderTemplate = input.headerTemplate.trim();
      const normalizedDispositionType = input.dispositionType.trim();
      const matchedControlledSample =
        input.fileName === crlfInjectionControlledFileName;
      const fileNamePreview = createFileNamePreview({
        fileName: input.fileName,
        matchedControlledSample,
      });

      if (!isHeaderTemplate(normalizedHeaderTemplate)) {
        return createTemplateNotFoundResult({
          variantKey: input.variantKey,
          headerTemplate: normalizedHeaderTemplate,
          dispositionType: normalizedDispositionType,
          fileName: input.fileName,
          blockedReason: "header-template-not-allowed",
        });
      }

      if (!isDispositionType(normalizedDispositionType)) {
        return createTemplateNotFoundResult({
          variantKey: input.variantKey,
          headerTemplate: normalizedHeaderTemplate,
          dispositionType: normalizedDispositionType,
          fileName: input.fileName,
          blockedReason: "disposition-type-not-allowed",
        });
      }

      const detectedControlChars = detectControlChars(input.fileName);

      if (detectedControlChars.length > 0 && input.variantKey === "fixed") {
        return createControlCharBlockedResult({
          variantKey: input.variantKey,
          headerTemplate: normalizedHeaderTemplate,
          dispositionType: normalizedDispositionType,
          fileName: input.fileName,
        });
      }

      if (detectedControlChars.length > 0 && !matchedControlledSample) {
        return createOutsideControlledSampleResult({
          variantKey: input.variantKey,
          headerTemplate: normalizedHeaderTemplate,
          dispositionType: normalizedDispositionType,
          fileName: input.fileName,
        });
      }

      const polluted =
        input.variantKey === "vuln" && matchedControlledSample;
      const headers = createVirtualHeaders({
        dispositionType: normalizedDispositionType,
        fileNamePreview,
        polluted,
      });
      const inspection = createInspection({
        headerTemplate: normalizedHeaderTemplate,
        dispositionType: normalizedDispositionType,
        fileName: input.fileName,
        headers,
      });
      const signal: CrlfInjectionSignal = polluted
        ? "crlf-injection-virtual-header-injected"
        : "crlf-injection-safe-header-previewed";

      return {
        status: "ok",
        variantKey: input.variantKey,
        headerTemplate: normalizedHeaderTemplate,
        dispositionType: normalizedDispositionType,
        fileNameLength: inspection.fileNameLength,
        fileNamePreview: inspection.fileNamePreview,
        headers,
        inspection,
        signal,
        decision: "accepted",
        message: polluted
          ? "漏洞版识别到固定受控 CRLF 样例，虚拟响应头预览出现教学污染头部。"
          : "文件名以普通文本值进入虚拟响应头预览，未发现控制字符污染。",
        nextStep:
          input.variantKey === "vuln"
            ? "切换到修复版提交同样样例，观察服务端控制字符阻断。"
            : "提交受控 CRLF 样例，观察修复版如何在进入头部构造器前阻断。",
      };
    },
  };
}
