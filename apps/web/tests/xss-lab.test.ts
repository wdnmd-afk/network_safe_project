import { describe, expect, it } from "vitest";

import {
  createXssLearningProgress,
  createXssSubmission,
  createXssVerificationRecord,
  getXssVariantConfig,
  xssSamplePayload,
} from "../src/labs/xss";

describe("XSS 纵向样板实验", () => {
  it("漏洞版将客服留言作为 HTML 风险信号渲染", () => {
    const config = getXssVariantConfig("vuln");
    const submission = createXssSubmission(xssSamplePayload, config);

    expect(config.renderMode).toBe("html");
    expect(submission.renderedContent).toContain("data-xss-lab-signal");
  });

  it("修复版将同样输入作为文本内容处理", () => {
    const config = getXssVariantConfig("fixed");
    const submission = createXssSubmission(xssSamplePayload, config);

    expect(config.renderMode).toBe("text");
    expect(submission.renderedContent).toBe(xssSamplePayload);
  });

  it("为实验进入动作生成学习进度记录载荷", () => {
    const config = getXssVariantConfig("vuln");

    expect(createXssLearningProgress(config)).toEqual({
      variantKey: "vuln",
      status: "in-progress",
      notes: "进入 XSS 漏洞版",
    });
  });

  it("为漏洞版和修复版生成不同验证记录载荷", () => {
    expect(createXssVerificationRecord(getXssVariantConfig("vuln"))).toEqual({
      variantKey: "vuln",
      result: "passed",
      summary: "漏洞版出现 XSS 模拟信号",
      details: {
        signal: "data-xss-lab-signal",
      },
    });
    expect(createXssVerificationRecord(getXssVariantConfig("fixed"))).toEqual({
      variantKey: "fixed",
      result: "passed",
      summary: "修复版原样显示 HTML 字符串",
      details: {
        signal: "text-rendered",
      },
    });
  });
});
