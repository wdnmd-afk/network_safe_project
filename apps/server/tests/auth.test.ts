import assert from "node:assert/strict";
import { after, test } from "node:test";

import { createApp } from "../src/app.js";

type AuthUserResponse = {
  id: string;
  username: string;
  displayName: string;
  role: string;
  status: string;
};

type LoginResponse = {
  token: string;
  user: AuthUserResponse;
};

const demoUser: AuthUserResponse = {
  id: "1",
  username: "demo_user",
  displayName: "演示用户",
  role: "member",
  status: "active",
};

test("POST /api/auth/login returns a signed session and user profile", async () => {
  const app = createApp({
    authService: {
      login: async () => ({
        token: "local-session-token",
        user: demoUser,
      }),
      getCurrentUser: async () => demoUser,
    },
  });
  const server = app.listen(0);
  after(() => {
    server.close();
  });

  const address = server.address();

  assert.ok(address && typeof address === "object");

  const response = await fetch(`http://127.0.0.1:${address.port}/api/auth/login`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      username: "demo_user",
      password: "Demo@123456",
    }),
  });
  const body = (await response.json()) as LoginResponse;

  assert.equal(response.status, 200);
  assert.equal(body.token, "local-session-token");
  assert.deepEqual(body.user, demoUser);
});

test("POST /api/auth/login returns 401 for invalid credentials", async () => {
  const app = createApp({
    authService: {
      login: async () => null,
      getCurrentUser: async () => null,
    },
  });
  const server = app.listen(0);
  after(() => {
    server.close();
  });

  const address = server.address();

  assert.ok(address && typeof address === "object");

  const response = await fetch(`http://127.0.0.1:${address.port}/api/auth/login`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      username: "demo_user",
      password: "wrong-password",
    }),
  });
  const body = (await response.json()) as {
    status: string;
    message: string;
  };

  assert.equal(response.status, 401);
  assert.equal(body.status, "error");
  assert.equal(body.message, "invalid credentials");
});

test("GET /api/auth/me returns current user from bearer token", async () => {
  const app = createApp({
    authService: {
      login: async () => null,
      getCurrentUser: async (token: string) =>
        token === "local-session-token" ? demoUser : null,
    },
  });
  const server = app.listen(0);
  after(() => {
    server.close();
  });

  const address = server.address();

  assert.ok(address && typeof address === "object");

  const response = await fetch(`http://127.0.0.1:${address.port}/api/auth/me`, {
    headers: {
      authorization: "Bearer local-session-token",
    },
  });
  const body = (await response.json()) as {
    user: AuthUserResponse;
  };

  assert.equal(response.status, 200);
  assert.deepEqual(body.user, demoUser);
});

test("POST /api/auth/logout returns a local session clear signal", async () => {
  const app = createApp({
    authService: {
      login: async () => null,
      getCurrentUser: async () => null,
    },
  });
  const server = app.listen(0);
  after(() => {
    server.close();
  });

  const address = server.address();

  assert.ok(address && typeof address === "object");

  const response = await fetch(`http://127.0.0.1:${address.port}/api/auth/logout`, {
    method: "POST",
  });
  const body = (await response.json()) as {
    status: string;
  };

  assert.equal(response.status, 200);
  assert.equal(body.status, "ok");
});
