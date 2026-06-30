import { randomBytes } from "node:crypto";

export type CsrfVariantKey = "vuln" | "fixed";

export type CsrfTransferInput = {
  userId: string;
  variantKey: CsrfVariantKey;
  amount: number;
  targetAccount: string;
  csrfToken?: string;
};

export type CsrfLabState = {
  userId: string;
  balance: number;
  status: "idle" | "transferred" | "blocked";
  lastSignal: "none" | "csrf-transfer-accepted" | "csrf-token-required" | "csrf-token-accepted";
  lastTransfer: {
    variantKey: CsrfVariantKey;
    amount: number;
    targetAccount: string;
  } | null;
};

export type CsrfTransferResult = {
  status: "ok" | "blocked";
  state: CsrfLabState;
};

export type CsrfLabService = {
  readState(input: { userId: string }): Promise<CsrfLabState>;
  issueToken(input: { userId: string }): Promise<{ csrfToken: string }>;
  submitTransfer(input: CsrfTransferInput): Promise<CsrfTransferResult>;
};

const initialBalance = 5000;

function createInitialState(userId: string): CsrfLabState {
  return {
    userId,
    balance: initialBalance,
    status: "idle",
    lastSignal: "none",
    lastTransfer: null,
  };
}

export function createCsrfLabService(): CsrfLabService {
  const states = new Map<string, CsrfLabState>();
  const tokens = new Map<string, string>();

  function readOrCreateState(userId: string) {
    const existing = states.get(userId);

    if (existing) {
      return existing;
    }

    const state = createInitialState(userId);
    states.set(userId, state);
    return state;
  }

  function applyTransfer(input: CsrfTransferInput, lastSignal: CsrfLabState["lastSignal"]) {
    const state = readOrCreateState(input.userId);
    const nextState: CsrfLabState = {
      userId: input.userId,
      balance: state.balance - input.amount,
      status: "transferred",
      lastSignal,
      lastTransfer: {
        variantKey: input.variantKey,
        amount: input.amount,
        targetAccount: input.targetAccount,
      },
    };

    states.set(input.userId, nextState);
    return nextState;
  }

  return {
    async readState(input) {
      return readOrCreateState(input.userId);
    },

    async issueToken(input) {
      const csrfToken = randomBytes(18).toString("base64url");
      tokens.set(input.userId, csrfToken);

      return {
        csrfToken,
      };
    },

    async submitTransfer(input) {
      if (input.variantKey === "vuln") {
        return {
          status: "ok",
          state: applyTransfer(input, "csrf-transfer-accepted"),
        };
      }

      const expectedToken = tokens.get(input.userId);

      if (!expectedToken || input.csrfToken !== expectedToken) {
        const state = readOrCreateState(input.userId);
        const blockedState: CsrfLabState = {
          ...state,
          status: "blocked",
          lastSignal: "csrf-token-required",
        };
        states.set(input.userId, blockedState);

        return {
          status: "blocked",
          state: blockedState,
        };
      }

      tokens.delete(input.userId);

      return {
        status: "ok",
        state: applyTransfer(input, "csrf-token-accepted"),
      };
    },
  };
}
