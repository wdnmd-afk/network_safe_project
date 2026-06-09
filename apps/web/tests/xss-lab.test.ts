import { describe, expect, it } from "vitest";

import {
  createXssSubmission,
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
});
