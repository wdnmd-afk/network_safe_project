export type AuthUser = {
  id: string;
  username: string;
  displayName: string;
  role: string;
  status: string;
};

export type LoginInput = {
  username: string;
  password: string;
};

export type LoginResponse = {
  token: string;
  user: AuthUser;
};

export type CurrentUserResponse = {
  user: AuthUser;
};

async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(`request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function login(input: LoginInput) {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(input),
  });

  return readJson<LoginResponse>(response);
}

export async function fetchCurrentUser(token: string) {
  const response = await fetch("/api/auth/me", {
    headers: {
      authorization: `Bearer ${token}`,
    },
  });

  return readJson<CurrentUserResponse>(response);
}

export async function logout() {
  const response = await fetch("/api/auth/logout", {
    method: "POST",
  });

  return readJson<{ status: string }>(response);
}
