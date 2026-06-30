import { describe, expect, it } from "vitest";

import type { FileUploadResult } from "../src/api/file-upload-lab";
import {
  attackFileUploadSample,
  createFileUploadLearningProgress,
  createFileUploadVerificationRecord,
  formatFileUploadSignal,
  getFileUploadVariantConfig,
  normalFileUploadSample,
} from "../src/labs/file-upload";

describe("文件上传纵向实验模型", () => {
  it("为漏洞版和修复版提供不同教学信号", () => {
    expect(getFileUploadVariantConfig("vuln")).toMatchObject({
      key: "vuln",
      badge: "缺少文件类型与内容校验",
    });
    expect(getFileUploadVariantConfig("fixed")).toMatchObject({
      key: "fixed",
      badge: "白名单校验与危险内容阻断",
    });
  });

  it("生成进入实验时的学习进度载荷", () => {
    expect(
      createFileUploadLearningProgress(getFileUploadVariantConfig("vuln")),
    ).toEqual({
      variantKey: "vuln",
      status: "in-progress",
      notes: "进入 文件上传漏洞版",
    });
  });

  it("生成漏洞版和修复版验证记录载荷", () => {
    const vulnerableResult: FileUploadResult = {
      status: "ok",
      variantKey: "vuln",
      fileName: "shell.php",
      contentType: "application/x-php",
      inspection: {
        extension: ".php",
        allowedExtension: false,
        allowedContentType: false,
        detectedExecutableContent: true,
        contentLength: 38,
      },
      storedAsset: {
        originalName: "shell.php",
        storedName: "vuln-1-shell.php",
        storagePath: "/simulated-uploads/vuln/vuln-1-shell.php",
        publicUrl: "/uploads/vuln/vuln-1-shell.php",
      },
      signal: "file-upload-executable-stored",
      decision: "accepted",
      message: "dangerous upload accepted",
      nextStep: "compare fixed",
    };
    const fixedResult: FileUploadResult = {
      ...vulnerableResult,
      status: "blocked",
      variantKey: "fixed",
      storedAsset: null,
      signal: "file-upload-validation-blocked",
      decision: "blocked",
      blockedReason: "file-validation-failed",
    };

    expect(
      createFileUploadVerificationRecord(
        getFileUploadVariantConfig("vuln"),
        vulnerableResult,
      ),
    ).toEqual({
      variantKey: "vuln",
      result: "passed",
      summary: "漏洞版接受了可执行上传样例，并返回了模拟存储位置。",
      details: {
        signal: "file-upload-executable-stored",
        extension: ".php",
        detectedExecutableContent: true,
      },
    });
    expect(
      createFileUploadVerificationRecord(
        getFileUploadVariantConfig("fixed"),
        fixedResult,
      ),
    ).toEqual({
      variantKey: "fixed",
      result: "passed",
      summary: "修复版在存储前阻断了扩展名、MIME 或内容不可信的上传。",
      details: {
        signal: "file-upload-validation-blocked",
        extension: ".php",
        detectedExecutableContent: true,
      },
    });
  });

  it("暴露本机受控上传样例与信号文案", () => {
    expect(normalFileUploadSample).toMatchObject({
      fileName: "avatar.png",
      contentType: "image/png",
    });
    expect(attackFileUploadSample).toMatchObject({
      fileName: "shell.php",
      contentType: "application/x-php",
    });
    expect(formatFileUploadSignal("file-upload-executable-stored")).toBe(
      "漏洞版接受了可执行上传样例",
    );
  });
});
