export type PathTraversalVariantKey = "vuln" | "fixed";

export type PathTraversalSignal =
  | "path-traversal-normal-file-read"
  | "path-traversal-sensitive-file-exposed"
  | "path-traversal-normalized-blocked"
  | "path-traversal-file-not-found";

export type PathTraversalInput = {
  requestedPath: string;
};

export type PathTraversalInspection = {
  allowedRoot: string;
  normalizedPath: string;
  containsTraversalSequence: boolean;
  escapedAllowedRoot: boolean;
  requestedPathLength: number;
};

export type PathTraversalDocument = {
  path: string;
  title: string;
  classification: "public" | "internal";
  content: string;
  isSensitive: boolean;
};

export type PathTraversalResult = {
  status: "ok" | "blocked" | "not-found";
  variantKey: PathTraversalVariantKey;
  requestedPath: string;
  resolvedPath: string;
  inspection: PathTraversalInspection;
  document: PathTraversalDocument | null;
  signal: PathTraversalSignal;
  decision: "accepted" | "blocked" | "failed";
  message: string;
  nextStep: string;
  blockedReason?: string;
};

export type PathTraversalResponse = {
  status: "ok" | "blocked" | "not-found";
  result: PathTraversalResult;
};

async function readJson<T>(response: Response): Promise<T> {
  const body = (await response.json()) as T;

  if (!response.ok) {
    throw new Error(`request failed with status ${response.status}`);
  }

  return body;
}

export async function submitPathTraversalRead(
  variantKey: PathTraversalVariantKey,
  token: string,
  input: PathTraversalInput,
) {
  const response = await fetch(
    `/api/labs/web/path-traversal/${variantKey}/read`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(input),
    },
  );

  if (response.status === 400 || response.status === 403 || response.status === 404) {
    return (await response.json()) as PathTraversalResponse;
  }

  return readJson<PathTraversalResponse>(response);
}
