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

export type CurrentUserLabEventLogSummary = {
  traceId: string;
  labKey: string;
  title: string;
  variantKey: string;
  phase: "attack" | "defense" | "normal";
  eventType: "request" | "validation" | "blocked" | "success" | "failure";
  actorPerspective: "attacker" | "user" | "system";
  decision: "accepted" | "blocked" | "failed";
  signal: string;
  statusCode: number;
  message: string;
  riskLevel: "low" | "medium" | "high" | "critical";
  createdAt: string;
};

export type CurrentUserLabEventLogsResponse = {
  status: string;
  events: CurrentUserLabEventLogSummary[];
};

export type UserRecapQuestionCompletionSummary = {
  traceId: string;
  labKey: string;
  questionIndex: number;
  questionKey: string;
  completed: boolean;
  completedAt: string | null;
  updatedAt: string;
};

export type CurrentUserRecapQuestionCompletionsResponse = {
  status: string;
  items: UserRecapQuestionCompletionSummary[];
};

export type SetRecapQuestionCompletionResponse = {
  status: string;
  item: UserRecapQuestionCompletionSummary;
};

export type LabEventLogFilters = {
  labKey?: string;
  phase?: CurrentUserLabEventLogSummary["phase"];
  riskLevel?: CurrentUserLabEventLogSummary["riskLevel"];
};

export type RecapQuestionCompletionFilters = {
  labKey?: string;
  traceIds?: string[];
};

export type RecapQuestionCompletionInput = {
  traceId: string;
  labKey: string;
  questionIndex: number;
  completed: boolean;
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

export async function fetchCurrentUserLabEventLogs(
  token: string,
  options: LabEventLogFilters = {},
) {
  const searchParams = new URLSearchParams();

  if (options.labKey) {
    searchParams.set("labKey", options.labKey);
  }

  if (options.phase) {
    searchParams.set("phase", options.phase);
  }

  if (options.riskLevel) {
    searchParams.set("riskLevel", options.riskLevel);
  }

  const query = searchParams.toString();
  const response = await fetch(
    `/api/lab-event-logs/me${query ? `?${query}` : ""}`,
    {
      headers: {
        authorization: `Bearer ${token}`,
      },
    },
  );

  return readJson<CurrentUserLabEventLogsResponse>(response);
}

export async function fetchCurrentUserRecapQuestionCompletions(
  token: string,
  options: RecapQuestionCompletionFilters = {},
) {
  const searchParams = new URLSearchParams();

  if (options.labKey) {
    searchParams.set("labKey", options.labKey);
  }

  if (options.traceIds && options.traceIds.length > 0) {
    searchParams.set("traceIds", options.traceIds.join(","));
  }

  const query = searchParams.toString();
  const response = await fetch(
    `/api/lab-recap-question-completions/me${query ? `?${query}` : ""}`,
    {
      headers: {
        authorization: `Bearer ${token}`,
      },
    },
  );

  return readJson<CurrentUserRecapQuestionCompletionsResponse>(response);
}

export async function setCurrentUserRecapQuestionCompletion(
  token: string,
  input: RecapQuestionCompletionInput,
) {
  const response = await fetch("/api/lab-recap-question-completions/me", {
    method: "PUT",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(input),
  });

  return readJson<SetRecapQuestionCompletionResponse>(response);
}
