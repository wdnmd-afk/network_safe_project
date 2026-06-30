import type {
  FileUploadInput,
  FileUploadResult,
  FileUploadSignal,
  FileUploadVariantKey,
} from "../api/file-upload-lab";

export type { FileUploadVariantKey };

export type FileUploadVariantConfig = {
  key: FileUploadVariantKey;
  title: string;
  badge: string;
  explanation: string;
  expectedSignal: string;
};

export type FileUploadLearningProgressInput = {
  variantKey: FileUploadVariantKey;
  status: "in-progress";
  notes: string;
};

export type FileUploadVerificationRecordInput = {
  variantKey: FileUploadVariantKey;
  result: "passed";
  summary: string;
  details: {
    signal: FileUploadSignal;
    extension: string;
    detectedExecutableContent: boolean;
  };
};

export const normalFileUploadSample: FileUploadInput = {
  fileName: "avatar.png",
  contentType: "image/png",
  contentText: "PNG image bytes for local learning sample",
};

export const attackFileUploadSample: FileUploadInput = {
  fileName: "shell.php",
  contentType: "application/x-php",
  contentText: "<?php echo 'local controlled sample'; ?>",
};

const fileUploadVariantConfigs: Record<
  FileUploadVariantKey,
  FileUploadVariantConfig
> = {
  vuln: {
    key: "vuln",
    title: "文件上传漏洞版",
    badge: "缺少文件类型与内容校验",
    explanation:
      "漏洞版模拟后端只把上传内容当作文件保存，没有校验扩展名、MIME 和内容特征，攻击方可以把可执行内容伪装成上传文件。",
    expectedSignal:
      "提交攻击样例后应出现 file-upload-executable-stored 信号，并看到模拟存储路径。",
  },
  fixed: {
    key: "fixed",
    title: "文件上传修复版",
    badge: "白名单校验与危险内容阻断",
    explanation:
      "修复版在业务入口同时校验扩展名、MIME 和内容特征，不可信上传会在进入存储前被阻断。",
    expectedSignal:
      "提交攻击样例后应出现 file-upload-validation-blocked 信号。",
  },
};

export function getFileUploadVariantConfig(variant: FileUploadVariantKey) {
  return fileUploadVariantConfigs[variant];
}

export function createFileUploadLearningProgress(
  config: FileUploadVariantConfig,
): FileUploadLearningProgressInput {
  return {
    variantKey: config.key,
    status: "in-progress",
    notes: `进入 ${config.title}`,
  };
}

export function createFileUploadVerificationRecord(
  config: FileUploadVariantConfig,
  result: FileUploadResult,
): FileUploadVerificationRecordInput {
  if (config.key === "vuln") {
    return {
      variantKey: config.key,
      result: "passed",
      summary: "漏洞版接受了可执行上传样例，并返回了模拟存储位置。",
      details: {
        signal: result.signal,
        extension: result.inspection.extension,
        detectedExecutableContent: result.inspection.detectedExecutableContent,
      },
    };
  }

  return {
    variantKey: config.key,
    result: "passed",
    summary: "修复版在存储前阻断了扩展名、MIME 或内容不可信的上传。",
    details: {
      signal: result.signal,
      extension: result.inspection.extension,
      detectedExecutableContent: result.inspection.detectedExecutableContent,
    },
  };
}

export function formatFileUploadSignal(signal: FileUploadSignal) {
  const labels: Record<FileUploadSignal, string> = {
    "file-upload-normal-image-stored": "正常图片样例被接受",
    "file-upload-executable-stored": "漏洞版接受了可执行上传样例",
    "file-upload-validation-blocked": "修复版阻断了不可信上传",
  };

  return labels[signal];
}
