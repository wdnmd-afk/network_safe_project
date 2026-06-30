import { describe, expect, it } from "vitest";

import type { PathTraversalResult } from "../src/api/path-traversal-lab";
import {
  attackPathTraversalSample,
  createPathTraversalLearningProgress,
  createPathTraversalVerificationRecord,
  formatPathTraversalSignal,
  getPathTraversalVariantConfig,
  normalPathTraversalSample,
} from "../src/labs/path-traversal";

describe("目录遍历纵向实验模型", () => {
  it("为漏洞版和修复版提供不同教学信号", () => {
    expect(getPathTraversalVariantConfig("vuln")).toMatchObject({
      key: "vuln",
      badge: "未限制规范化后的根目录",
    });
    expect(getPathTraversalVariantConfig("fixed")).toMatchObject({
      key: "fixed",
      badge: "规范化路径并限制公开根目录",
    });
  });

  it("生成进入实验时的学习进度载荷", () => {
    expect(
      createPathTraversalLearningProgress(
        getPathTraversalVariantConfig("vuln"),
      ),
    ).toEqual({
      variantKey: "vuln",
      status: "in-progress",
      notes: "进入 目录遍历漏洞版",
    });
  });

  it("生成漏洞版和修复版验证记录载荷", () => {
    const vulnerableResult: PathTraversalResult = {
      status: "ok",
      variantKey: "vuln",
      requestedPath: attackPathTraversalSample,
      resolvedPath: "internal/admin-note.txt",
      inspection: {
        allowedRoot: "public",
        normalizedPath: "internal/admin-note.txt",
        containsTraversalSequence: true,
        escapedAllowedRoot: true,
        requestedPathLength: 26,
      },
      document: {
        path: "internal/admin-note.txt",
        title: "内部运维备忘录",
        classification: "internal",
        content: "internal training note",
        isSensitive: true,
      },
      signal: "path-traversal-sensitive-file-exposed",
      decision: "accepted",
      message: "internal document exposed",
      nextStep: "compare fixed",
    };
    const fixedResult: PathTraversalResult = {
      ...vulnerableResult,
      status: "blocked",
      variantKey: "fixed",
      document: null,
      signal: "path-traversal-normalized-blocked",
      decision: "blocked",
      blockedReason: "path-escaped-allowed-root",
    };

    expect(
      createPathTraversalVerificationRecord(
        getPathTraversalVariantConfig("vuln"),
        vulnerableResult,
      ),
    ).toEqual({
      variantKey: "vuln",
      result: "passed",
      summary: "漏洞版接受了路径遍历样例，内部模拟文档被越权读取。",
      details: {
        signal: "path-traversal-sensitive-file-exposed",
        normalizedPath: "internal/admin-note.txt",
        escapedAllowedRoot: true,
      },
    });
    expect(
      createPathTraversalVerificationRecord(
        getPathTraversalVariantConfig("fixed"),
        fixedResult,
      ),
    ).toEqual({
      variantKey: "fixed",
      result: "passed",
      summary: "修复版在规范化后阻断了逃逸 public 目录的读取请求。",
      details: {
        signal: "path-traversal-normalized-blocked",
        normalizedPath: "internal/admin-note.txt",
        escapedAllowedRoot: true,
      },
    });
  });

  it("暴露本机受控路径样例与信号文案", () => {
    expect(normalPathTraversalSample).toBe("user-guide.md");
    expect(attackPathTraversalSample).toBe("../internal/admin-note.txt");
    expect(formatPathTraversalSignal("path-traversal-sensitive-file-exposed")).toBe(
      "漏洞版暴露了内部模拟文档",
    );
  });
});
