import { describe, expect, it } from "vitest";

import type { XxeImportResult } from "../src/api/xxe-lab";
import {
  attackXxeVirtualEntitySample,
  createXxeLearningProgress,
  createXxeVerificationRecord,
  formatXxeSignal,
  getXxeVariantConfig,
  normalXxeInvoiceSample,
} from "../src/labs/xxe";

describe("XXE 纵向实验模型", () => {
  it("为漏洞版和修复版提供不同教学信号", () => {
    expect(getXxeVariantConfig("vuln")).toMatchObject({
      key: "vuln",
      badge: "虚拟 XML 资源解析器会解析固定受控实体",
    });
    expect(getXxeVariantConfig("fixed")).toMatchObject({
      key: "fixed",
      badge: "禁用 DTD 与外部实体",
    });
  });

  it("生成进入实验时的学习进度载荷", () => {
    expect(createXxeLearningProgress(getXxeVariantConfig("vuln"))).toEqual({
      variantKey: "vuln",
      status: "in-progress",
      notes: "进入 XXE 漏洞版",
    });
  });

  it("生成漏洞版和修复版验证记录载荷", () => {
    const vulnerableResult: XxeImportResult = {
      status: "ok",
      variantKey: "vuln",
      importKind: "invoice-preview",
      preview: {
        title: "XML 发票导入预览",
        fields: [
          {
            key: "note",
            label: "备注",
            value: "虚拟内部说明：仅用于 XXE 学习复盘",
            fromVirtualEntity: true,
          },
        ],
      },
      inspection: {
        xmlLength: attackXxeVirtualEntitySample.length,
        containsDoctype: true,
        declaredEntityNames: ["labSecret"],
        referencedEntityNames: ["labSecret"],
        entitySourceTypes: ["virtual-file"],
        matchedControlledSample: true,
        unknownEntityCount: 0,
      },
      signal: "xxe-internal-resource-exposed",
      decision: "accepted",
      message: "controlled virtual entity resolved",
      nextStep: "compare fixed",
    };
    const fixedResult: XxeImportResult = {
      ...vulnerableResult,
      status: "blocked",
      variantKey: "fixed",
      preview: {
        title: "XML 发票导入预览",
        fields: [],
      },
      signal: "xxe-doctype-blocked",
      decision: "blocked",
      blockedReason: "doctype-or-entity-disabled",
    };

    expect(
      createXxeVerificationRecord(
        getXxeVariantConfig("vuln"),
        vulnerableResult,
      ),
    ).toEqual({
      variantKey: "vuln",
      result: "passed",
      summary: "漏洞版解析了受控虚拟实体，并返回教学模拟器信号。",
      details: {
        signal: "xxe-internal-resource-exposed",
        containsDoctype: true,
        referencedEntityNames: ["labSecret"],
        matchedControlledSample: true,
      },
    });
    expect(
      createXxeVerificationRecord(getXxeVariantConfig("fixed"), fixedResult),
    ).toEqual({
      variantKey: "fixed",
      result: "passed",
      summary: "修复版检测到 DTD 或外部实体声明，并在解析前阻断请求。",
      details: {
        signal: "xxe-doctype-blocked",
        containsDoctype: true,
        referencedEntityNames: ["labSecret"],
        matchedControlledSample: true,
      },
    });
  });

  it("暴露本机受控 XML 样例与信号文案", () => {
    expect(normalXxeInvoiceSample).toContain("<invoice>");
    expect(attackXxeVirtualEntitySample).toContain("file:///virtual");
    expect(formatXxeSignal("xxe-internal-resource-exposed")).toBe(
      "漏洞版暴露了虚拟内部资源",
    );
  });
});
