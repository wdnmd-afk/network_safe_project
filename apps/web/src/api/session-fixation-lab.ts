export type SessionFixationVariantKey = "vuln" | "fixed";

export type SessionFixationSessionSource =
  | "browser"
  | "external-link"
  | "unknown";

export type SessionFixationSignal =
  | "session-normal-id-accepted"
  | "session-normal-id-rotated"
  | "session-fixed-id-bound"
  | "session-fixed-id-rotated";

export type SessionFixationInput = {
  preLoginSessionId: string;
  sessionSource: string;
};

export type SessionFixationTeachingSession = {
  ownerUserId: string;
  ownerUsername: string;
  sessionId: string;
  source: "client" | "server";
  accessSummary: string;
};

export type SessionFixationInspection = {
  preLoginSessionIdLength: number;
  sessionSource: SessionFixationSessionSource;
  attackerControlled: boolean;
  acceptedClientSessionId: boolean;
  rotatedSessionId: boolean;
  sessionIdChanged: boolean;
  currentUserId: string;
  boundSessionIdLength: number;
};

export type SessionFixationResult = {
  status: "ok";
  variantKey: SessionFixationVariantKey;
  preLoginSessionId: string;
  sessionSource: SessionFixationSessionSource;
  teachingSession: SessionFixationTeachingSession;
  inspection: SessionFixationInspection;
  signal: SessionFixationSignal;
  decision: "accepted";
  message: string;
  nextStep: string;
};

export type SessionFixationResponse = {
  status: "ok";
  result: SessionFixationResult;
};

async function readJson<T>(response: Response): Promise<T> {
  const body = (await response.json()) as T;

  if (!response.ok) {
    throw new Error(`request failed with status ${response.status}`);
  }

  return body;
}

export async function submitSessionFixationLogin(
  variantKey: SessionFixationVariantKey,
  token: string,
  input: SessionFixationInput,
) {
  const response = await fetch(
    `/api/labs/auth/session-fixation/${variantKey}/login`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(input),
    },
  );

  if (response.status === 400 || response.status === 404) {
    return (await response.json()) as SessionFixationResponse;
  }

  return readJson<SessionFixationResponse>(response);
}
