export type FileUploadVariantKey = "vuln" | "fixed";

export type FileUploadSignal =
  | "file-upload-normal-image-stored"
  | "file-upload-executable-stored"
  | "file-upload-validation-blocked";

export type FileUploadInput = {
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
  status: "ok" | "blocked";
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

export type FileUploadResponse = {
  status: "ok" | "blocked";
  result: FileUploadResult;
};

async function readJson<T>(response: Response): Promise<T> {
  const body = (await response.json()) as T;

  if (!response.ok) {
    throw new Error(`request failed with status ${response.status}`);
  }

  return body;
}

export async function submitFileUpload(
  variantKey: FileUploadVariantKey,
  token: string,
  input: FileUploadInput,
) {
  const response = await fetch(`/api/labs/web/file-upload/${variantKey}/upload`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (response.status === 400 || response.status === 403) {
    return (await response.json()) as FileUploadResponse;
  }

  return readJson<FileUploadResponse>(response);
}
