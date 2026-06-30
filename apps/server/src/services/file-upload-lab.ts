export type FileUploadVariantKey = "vuln" | "fixed";

export type FileUploadSignal =
  | "file-upload-normal-image-stored"
  | "file-upload-executable-stored"
  | "file-upload-validation-blocked";

export type FileUploadStatus = "ok" | "blocked";

export type FileUploadInput = {
  userId: string;
  variantKey: FileUploadVariantKey;
  fileName: string;
  contentType: string;
  contentText: string;
};

export type FileUploadInspection = {
  extension: string;
  allowedExtension: boolean;
  allowedContentType: boolean;
  detectedExecutableContent: boolean;
  contentLength: number;
};

export type FileUploadStoredAsset = {
  originalName: string;
  storedName: string;
  storagePath: string;
  publicUrl: string;
};

export type FileUploadResult = {
  status: FileUploadStatus;
  variantKey: FileUploadVariantKey;
  fileName: string;
  contentType: string;
  inspection: FileUploadInspection;
  storedAsset: FileUploadStoredAsset | null;
  signal: FileUploadSignal;
  decision: "accepted" | "blocked";
  message: string;
  nextStep: string;
  blockedReason?: string;
};

export type FileUploadLabService = {
  submitUpload(input: FileUploadInput): Promise<FileUploadResult>;
};

const allowedExtensions = new Set([".png", ".jpg", ".jpeg", ".webp"]);
const allowedContentTypes = new Set(["image/png", "image/jpeg", "image/webp"]);
const executableContentPattern =
  /<\?(php)?|<script\b|<%|system\s*\(|exec\s*\(|Runtime\.getRuntime|ProcessBuilder/i;

function normalizeFileName(fileName: string) {
  return fileName.trim().replaceAll("\\", "/").split("/").pop() ?? "";
}

function getExtension(fileName: string) {
  const normalized = normalizeFileName(fileName).toLowerCase();
  const dotIndex = normalized.lastIndexOf(".");

  return dotIndex === -1 ? "" : normalized.slice(dotIndex);
}

function sanitizeStoredName(fileName: string) {
  const normalized = normalizeFileName(fileName);
  const sanitized = normalized.replace(/[^a-zA-Z0-9._-]/g, "-");

  return sanitized || "upload.bin";
}

function createInspection(input: FileUploadInput): FileUploadInspection {
  const extension = getExtension(input.fileName);

  return {
    extension,
    allowedExtension: allowedExtensions.has(extension),
    allowedContentType: allowedContentTypes.has(input.contentType.toLowerCase()),
    detectedExecutableContent: executableContentPattern.test(input.contentText),
    contentLength: input.contentText.length,
  };
}

function createStoredAsset(input: FileUploadInput, variantKey: FileUploadVariantKey) {
  const storedName = `${variantKey}-${Date.now()}-${sanitizeStoredName(input.fileName)}`;

  return {
    originalName: normalizeFileName(input.fileName),
    storedName,
    storagePath: `/simulated-uploads/${variantKey}/${storedName}`,
    publicUrl: `/uploads/${variantKey}/${storedName}`,
  };
}

function isDangerousUpload(inspection: FileUploadInspection) {
  return (
    !inspection.allowedExtension ||
    !inspection.allowedContentType ||
    inspection.detectedExecutableContent
  );
}

export function createFileUploadLabService(): FileUploadLabService {
  return {
    async submitUpload(input) {
      const fileName = normalizeFileName(input.fileName);
      const inspection = createInspection({
        ...input,
        fileName,
      });
      const dangerousUpload = isDangerousUpload(inspection);

      if (input.variantKey === "fixed" && dangerousUpload) {
        return {
          status: "blocked",
          variantKey: input.variantKey,
          fileName,
          contentType: input.contentType,
          inspection,
          storedAsset: null,
          signal: "file-upload-validation-blocked",
          decision: "blocked",
          message: "修复版拒绝了扩展名、MIME 或内容特征不可信的上传。",
          nextStep: "切回漏洞版提交同样样例，观察危险文件为什么会被错误接收。",
          blockedReason: "file-validation-failed",
        };
      }

      const storedAsset = createStoredAsset(
        {
          ...input,
          fileName,
        },
        input.variantKey,
      );

      if (dangerousUpload) {
        return {
          status: "ok",
          variantKey: input.variantKey,
          fileName,
          contentType: input.contentType,
          inspection,
          storedAsset,
          signal: "file-upload-executable-stored",
          decision: "accepted",
          message: "漏洞版缺少文件类型和内容校验，危险上传被模拟存储。",
          nextStep: "切到修复版提交同样样例，观察后端如何阻断。",
        };
      }

      return {
        status: "ok",
        variantKey: input.variantKey,
        fileName,
        contentType: input.contentType,
        inspection,
        storedAsset,
        signal: "file-upload-normal-image-stored",
        decision: "accepted",
        message: "上传被作为正常图片凭证接收。",
        nextStep: "填入攻击样例，观察漏洞版和修复版的判断差异。",
      };
    },
  };
}
