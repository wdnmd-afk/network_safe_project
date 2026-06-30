export type XxeVariantKey = "vuln" | "fixed";

export type XxeImportKind = "invoice-preview" | "config-preview";

export type XxeEntitySourceType =
  | "none"
  | "virtual-file"
  | "virtual-resource"
  | "unknown";

export type XxeSignal =
  | "xxe-safe-xml-imported"
  | "xxe-virtual-entity-resolved"
  | "xxe-internal-resource-exposed"
  | "xxe-doctype-blocked"
  | "xxe-entity-not-found"
  | "xxe-import-kind-not-found"
  | "xxe-xml-too-large";

export type XxeStatus = "ok" | "blocked" | "failed";

export type XxeImportInput = {
  userId: string;
  variantKey: XxeVariantKey;
  importKind: string;
  xmlDocument: string;
};

export type XxePreviewField = {
  key: string;
  label: string;
  value: string;
  fromVirtualEntity: boolean;
};

export type XxeInspection = {
  xmlLength: number;
  containsDoctype: boolean;
  declaredEntityNames: string[];
  referencedEntityNames: string[];
  entitySourceTypes: XxeEntitySourceType[];
  matchedControlledSample: boolean;
  unknownEntityCount: number;
};

export type XxeImportResult = {
  status: XxeStatus;
  variantKey: XxeVariantKey;
  importKind: string;
  preview: {
    title: string;
    fields: XxePreviewField[];
  };
  inspection: XxeInspection;
  signal: XxeSignal;
  decision: "accepted" | "blocked" | "failed";
  message: string;
  nextStep: string;
  blockedReason?: string;
};

export type XxeLabService = {
  importXml(input: XxeImportInput): Promise<XxeImportResult>;
};

export const xxeNormalInvoiceXml =
  "<invoice><customerName>演示用户</customerName><amount>128</amount></invoice>";
export const xxeVirtualEntityXml =
  '<!DOCTYPE invoice [<!ENTITY labSecret SYSTEM "file:///virtual/lab/internal-note">]><invoice><note>&labSecret;</note></invoice>';

const maxXmlLength = 4000;

const importDefinitions: Record<
  XxeImportKind,
  {
    title: string;
    fields: Array<{
      key: string;
      label: string;
      tagName: string;
    }>;
  }
> = {
  "invoice-preview": {
    title: "XML 发票导入预览",
    fields: [
      {
        key: "customerName",
        label: "客户名",
        tagName: "customerName",
      },
      {
        key: "amount",
        label: "金额",
        tagName: "amount",
      },
      {
        key: "note",
        label: "备注",
        tagName: "note",
      },
    ],
  },
  "config-preview": {
    title: "XML 配置导入预览",
    fields: [
      {
        key: "serviceName",
        label: "服务名",
        tagName: "serviceName",
      },
      {
        key: "owner",
        label: "负责人",
        tagName: "owner",
      },
      {
        key: "note",
        label: "备注",
        tagName: "note",
      },
    ],
  },
};

const virtualEntities: Record<
  string,
  {
    source: string;
    sourceType: XxeEntitySourceType;
    value: string;
    exposed: boolean;
  }
> = {
  labSecret: {
    source: "file:///virtual/lab/internal-note",
    sourceType: "virtual-file",
    value: "虚拟内部说明：仅用于 XXE 学习复盘",
    exposed: true,
  },
  labConfig: {
    source: "virtual://internal/config-note",
    sourceType: "virtual-resource",
    value: "虚拟配置说明：禁用 DTD 与外部实体",
    exposed: false,
  },
};

function isImportKind(value: string): value is XxeImportKind {
  return Object.hasOwn(importDefinitions, value);
}

function uniqueValues<T>(values: T[]) {
  return [...new Set(values)];
}

function decodeXmlText(value: string) {
  return value
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'");
}

function extractTagText(xmlDocument: string, tagName: string) {
  const pattern = new RegExp(`<${tagName}>\\s*([\\s\\S]*?)\\s*</${tagName}>`, "i");
  const match = xmlDocument.match(pattern);

  return match?.[1]?.trim() ? decodeXmlText(match[1].trim()) : "";
}

function readDeclaredEntities(xmlDocument: string) {
  const entities: Array<{
    name: string;
    source: string;
    sourceType: XxeEntitySourceType;
    known: boolean;
  }> = [];
  const entityPattern =
    /<!ENTITY\s+([A-Za-z][\w.-]*)\s+SYSTEM\s+["']([^"']+)["']\s*>/gi;

  for (const match of xmlDocument.matchAll(entityPattern)) {
    const name = match[1] ?? "";
    const source = match[2] ?? "";
    const known =
      Object.hasOwn(virtualEntities, name) &&
      virtualEntities[name].source === source;
    const sourceType = known
      ? virtualEntities[name].sourceType
      : source.startsWith("file:///virtual/")
        ? "virtual-file"
        : source.startsWith("virtual://")
          ? "virtual-resource"
          : "unknown";

    entities.push({
      name,
      source,
      sourceType,
      known,
    });
  }

  return entities;
}

function readReferencedEntities(xmlDocument: string) {
  const names: string[] = [];
  const referencePattern = /&([A-Za-z][\w.-]*);/g;
  const xmlBuiltIns = new Set(["amp", "lt", "gt", "quot", "apos"]);

  for (const match of xmlDocument.matchAll(referencePattern)) {
    const name = match[1] ?? "";

    if (!xmlBuiltIns.has(name)) {
      names.push(name);
    }
  }

  return uniqueValues(names);
}

function inspectXml(xmlDocument: string): XxeInspection {
  const declaredEntities = readDeclaredEntities(xmlDocument);
  const referencedEntityNames = readReferencedEntities(xmlDocument);
  const declaredEntityNames = uniqueValues(
    declaredEntities.map((entity) => entity.name),
  );
  const knownDeclaredEntityNames = new Set(
    declaredEntities.filter((entity) => entity.known).map((entity) => entity.name),
  );
  const entitySourceTypes = uniqueValues(
    declaredEntities.length > 0
      ? declaredEntities.map((entity) => entity.sourceType)
      : (["none"] as XxeEntitySourceType[]),
  );
  const matchedControlledSample = referencedEntityNames.some((name) =>
    knownDeclaredEntityNames.has(name),
  );
  const unknownEntityCount = referencedEntityNames.filter(
    (name) => !knownDeclaredEntityNames.has(name),
  ).length;

  return {
    xmlLength: xmlDocument.length,
    containsDoctype: /<!DOCTYPE/i.test(xmlDocument),
    declaredEntityNames,
    referencedEntityNames,
    entitySourceTypes,
    matchedControlledSample,
    unknownEntityCount,
  };
}

function emptyPreview(title = "") {
  return {
    title,
    fields: [],
  };
}

function createImportKindNotFoundResult(
  input: XxeImportInput,
): XxeImportResult {
  return {
    status: "failed",
    variantKey: input.variantKey,
    importKind: input.importKind,
    preview: emptyPreview(),
    inspection: inspectXml(input.xmlDocument),
    signal: "xxe-import-kind-not-found",
    decision: "failed",
    message: "该 XML 导入类型不在允许列表中，请选择页面提供的导入类型。",
    nextStep: "选择发票导入预览或配置导入预览，再对比漏洞版和修复版的实体处理差异。",
    blockedReason: "import-kind-not-allowed",
  };
}

function createXmlTooLargeResult(input: XxeImportInput): XxeImportResult {
  return {
    status: "failed",
    variantKey: input.variantKey,
    importKind: input.importKind,
    preview: emptyPreview(),
    inspection: inspectXml(input.xmlDocument),
    signal: "xxe-xml-too-large",
    decision: "failed",
    message: "XML 文档长度超过教学实验限制，已拒绝导入。",
    nextStep: "缩短 XML 样例，只保留本实验需要观察的发票或配置字段。",
    blockedReason: "xml-too-large",
  };
}

function createDoctypeBlockedResult(input: {
  variantKey: XxeVariantKey;
  importKind: XxeImportKind;
  inspection: XxeInspection;
}): XxeImportResult {
  return {
    status: "blocked",
    variantKey: input.variantKey,
    importKind: input.importKind,
    preview: emptyPreview(importDefinitions[input.importKind].title),
    inspection: input.inspection,
    signal: "xxe-doctype-blocked",
    decision: "blocked",
    message: "修复版在解析前发现 DTD 或外部实体声明，已阻断 XML 导入。",
    nextStep: "切换到漏洞版提交同样样例，观察虚拟实体被解析时的学习信号。",
    blockedReason: "doctype-or-entity-disabled",
  };
}

function createEntityNotFoundResult(input: {
  variantKey: XxeVariantKey;
  importKind: XxeImportKind;
  inspection: XxeInspection;
}): XxeImportResult {
  return {
    status: "blocked",
    variantKey: input.variantKey,
    importKind: input.importKind,
    preview: emptyPreview(importDefinitions[input.importKind].title),
    inspection: input.inspection,
    signal: "xxe-entity-not-found",
    decision: "blocked",
    message: "XML 引用了本实验未开放的实体，虚拟解析器不会尝试读取文件或访问网络。",
    nextStep: "使用页面提供的受控 XXE 样例，或切换修复版观察 DTD 阻断信号。",
    blockedReason: "entity-not-in-controlled-map",
  };
}

function resolveTeachingEntities(xmlDocument: string) {
  return Object.entries(virtualEntities).reduce(
    (currentXml, [name, entity]) =>
      currentXml.replaceAll(`&${name};`, entity.value),
    xmlDocument,
  );
}

function createPreview(input: {
  importKind: XxeImportKind;
  xmlDocument: string;
}) {
  const definition = importDefinitions[input.importKind];

  return {
    title: definition.title,
    fields: definition.fields.map((field) => {
      const value = extractTagText(input.xmlDocument, field.tagName);

      return {
        key: field.key,
        label: field.label,
        value: value || "未提供",
        fromVirtualEntity: Object.values(virtualEntities).some(
          (entity) => value === entity.value,
        ),
      };
    }),
  };
}

function createSignal(inspection: XxeInspection): XxeSignal {
  if (
    inspection.referencedEntityNames.some(
      (name) => virtualEntities[name]?.exposed,
    )
  ) {
    return "xxe-internal-resource-exposed";
  }

  if (inspection.matchedControlledSample) {
    return "xxe-virtual-entity-resolved";
  }

  return "xxe-safe-xml-imported";
}

export function createXxeLabService(): XxeLabService {
  return {
    async importXml(input) {
      const normalizedInput = {
        ...input,
        importKind: input.importKind.trim(),
        xmlDocument: input.xmlDocument.trim(),
      };

      if (!isImportKind(normalizedInput.importKind)) {
        return createImportKindNotFoundResult(normalizedInput);
      }

      if (normalizedInput.xmlDocument.length > maxXmlLength) {
        return createXmlTooLargeResult(normalizedInput);
      }

      const inspection = inspectXml(normalizedInput.xmlDocument);

      if (
        normalizedInput.variantKey === "fixed" &&
        (inspection.containsDoctype ||
          inspection.declaredEntityNames.length > 0 ||
          inspection.referencedEntityNames.length > 0)
      ) {
        return createDoctypeBlockedResult({
          variantKey: normalizedInput.variantKey,
          importKind: normalizedInput.importKind,
          inspection,
        });
      }

      if (
        normalizedInput.variantKey === "vuln" &&
        inspection.unknownEntityCount > 0
      ) {
        return createEntityNotFoundResult({
          variantKey: normalizedInput.variantKey,
          importKind: normalizedInput.importKind,
          inspection,
        });
      }

      const resolvedXml =
        normalizedInput.variantKey === "vuln"
          ? resolveTeachingEntities(normalizedInput.xmlDocument)
          : normalizedInput.xmlDocument;
      const signal = createSignal(inspection);

      return {
        status: "ok",
        variantKey: normalizedInput.variantKey,
        importKind: normalizedInput.importKind,
        preview: createPreview({
          importKind: normalizedInput.importKind,
          xmlDocument: resolvedXml,
        }),
        inspection,
        signal,
        decision: "accepted",
        message:
          signal === "xxe-internal-resource-exposed"
            ? "漏洞版解析了受控虚拟实体，导入预览中出现了虚拟内部说明。"
            : signal === "xxe-virtual-entity-resolved"
              ? "漏洞版解析了受控虚拟实体，返回固定教学内容。"
              : "XML 只包含普通业务字段，导入预览正常完成。",
        nextStep:
          normalizedInput.variantKey === "vuln"
            ? "切换到修复版提交同样 XML，观察 DTD 和外部实体如何在解析前被阻断。"
            : "尝试提交受控 XXE 样例，观察修复版的阻断信号和日志摘要。",
      };
    },
  };
}
