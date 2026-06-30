export type CommandInjectionVariantKey = "vuln" | "fixed";

export type CommandInjectionDetectedOperator =
  | "none"
  | "semicolon"
  | "and"
  | "or"
  | "pipe"
  | "redirect";

export type CommandInjectionSignal =
  | "command-injection-normal-task-completed"
  | "command-injection-command-separator-detected"
  | "command-injection-virtual-command-executed"
  | "command-injection-allowlist-blocked"
  | "command-injection-task-not-found";

export type CommandInjectionInput = {
  taskKey: string;
  target: string;
};

export type CommandInjectionInspection = {
  targetLength: number;
  containsCommandSeparator: boolean;
  detectedOperator: CommandInjectionDetectedOperator;
  matchedControlledSample: boolean;
  allowedTask: boolean;
};

export type CommandInjectionVirtualStep = {
  label: string;
  output: string;
  injected: boolean;
};

export type CommandInjectionResult = {
  status: "ok" | "blocked" | "failed";
  variantKey: CommandInjectionVariantKey;
  taskKey: string;
  target: string;
  inspection: CommandInjectionInspection;
  virtualSteps: CommandInjectionVirtualStep[];
  signal: CommandInjectionSignal;
  decision: "accepted" | "blocked" | "failed";
  message: string;
  nextStep: string;
  blockedReason?: string;
};

export type CommandInjectionResponse = {
  status: "ok" | "blocked" | "failed";
  result: CommandInjectionResult;
};

async function readJson<T>(response: Response): Promise<T> {
  const body = (await response.json()) as T;

  if (!response.ok) {
    throw new Error(`request failed with status ${response.status}`);
  }

  return body;
}

export async function submitCommandInjectionRun(
  variantKey: CommandInjectionVariantKey,
  token: string,
  input: CommandInjectionInput,
) {
  const response = await fetch(
    `/api/labs/web/command-injection/${variantKey}/run`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(input),
    },
  );

  if (response.status === 403 || response.status === 404) {
    return (await response.json()) as CommandInjectionResponse;
  }

  return readJson<CommandInjectionResponse>(response);
}
