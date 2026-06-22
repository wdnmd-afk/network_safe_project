export type LearningProgressInput = {
  variantKey: string;
  status: string;
  notes?: string;
};

export type LearningProgressResponse = {
  status: string;
  progress: {
    labKey: string;
    variantKey: string;
    status: string;
  };
};

export type VerificationRecordInput = {
  variantKey: string;
  result: string;
  summary: string;
  details?: Record<string, unknown>;
};

export type VerificationRecordResponse = {
  status: string;
  record: {
    labKey: string;
    variantKey: string;
    result: string;
  };
};

export type UserLearningProgressSummary = {
  labKey: string;
  title: string;
  variantKey: string;
  status: string;
  updatedAt: string;
};

export type UserVerificationSummary = {
  labKey: string;
  title: string;
  variantKey: string;
  result: string;
  summary: string;
  createdAt: string;
};

export type CurrentUserLabRecordsResponse = {
  status: string;
  records: {
    progress: UserLearningProgressSummary[];
    verifications: UserVerificationSummary[];
  };
};

async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(`request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function recordLearningProgress(
  category: string,
  scene: string,
  token: string,
  input: LearningProgressInput,
) {
  const response = await fetch(
    `/api/labs/${category}/${scene}/learning-progress`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(input),
    },
  );

  return readJson<LearningProgressResponse>(response);
}

export async function recordVerificationRecord(
  category: string,
  scene: string,
  token: string,
  input: VerificationRecordInput,
) {
  const response = await fetch(
    `/api/labs/${category}/${scene}/verification-records`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(input),
    },
  );

  return readJson<VerificationRecordResponse>(response);
}

export async function fetchCurrentUserLabRecords(token: string) {
  const response = await fetch("/api/lab-records/me", {
    headers: {
      authorization: `Bearer ${token}`,
    },
  });

  return readJson<CurrentUserLabRecordsResponse>(response);
}
