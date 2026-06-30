import { pathToFileURL } from "node:url";

export type FileUploadVerificationCase = {
  key: string;
  variantKey: "vuln" | "fixed";
  method: "POST";
  path: string;
  body: {
    fileName: string;
    contentType: string;
    contentText: string;
  };
  expectedStatus: number;
  expectedSignal:
    | "file-upload-normal-image-stored"
    | "file-upload-executable-stored"
    | "file-upload-validation-blocked";
  description: string;
};

export const fileUploadNormalSample = {
  fileName: "avatar.png",
  contentType: "image/png",
  contentText: "PNG image bytes for local learning sample",
};

export const fileUploadControlledPayload = {
  fileName: "shell.php",
  contentType: "application/x-php",
  contentText: "<?php echo 'local controlled sample'; ?>",
};

export const fileUploadVerificationCases: FileUploadVerificationCase[] = [
  {
    key: "file-upload-vuln-normal-image",
    variantKey: "vuln",
    method: "POST",
    path: "/api/labs/web/file-upload/vuln/upload",
    body: fileUploadNormalSample,
    expectedStatus: 200,
    expectedSignal: "file-upload-normal-image-stored",
    description: "漏洞版正常图片样例应被接受。",
  },
  {
    key: "file-upload-vuln-executable-stored",
    variantKey: "vuln",
    method: "POST",
    path: "/api/labs/web/file-upload/vuln/upload",
    body: fileUploadControlledPayload,
    expectedStatus: 200,
    expectedSignal: "file-upload-executable-stored",
    description: "漏洞版受控可执行上传样例会被模拟存储。",
  },
  {
    key: "file-upload-fixed-validation-blocked",
    variantKey: "fixed",
    method: "POST",
    path: "/api/labs/web/file-upload/fixed/upload",
    body: fileUploadControlledPayload,
    expectedStatus: 403,
    expectedSignal: "file-upload-validation-blocked",
    description: "修复版应在进入存储前阻断同一上传样例。",
  },
];

export const fileUploadVerificationNotes = [
  "这些配置只描述本项目本机接口的预期行为。",
  "执行真实请求前需要先通过平台登录获得本机演示账号 token。",
  "本文件不读取真实文件，不生成可执行上传物，不访问外部目标。",
];

export function getFileUploadVerificationPlan() {
  return {
    labKey: "web.file-upload",
    scope: "localhost-only",
    safeBoundary:
      "仅验证本项目本机模拟上传接口的校验差异，不写入真实上传文件，不访问外部目标。",
    cases: fileUploadVerificationCases,
    notes: fileUploadVerificationNotes,
  };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  console.log(JSON.stringify(getFileUploadVerificationPlan(), null, 2));
}
