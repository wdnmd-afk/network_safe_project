import { prisma } from "../lib/prisma.js";

export type StoredUser = {
  id: string;
  username: string;
  passwordHash: string;
  displayName: string;
  role: string;
  status: string;
};

function toStoredUser(user: {
  id: bigint;
  username: string;
  passwordHash: string;
  displayName: string;
  role: string;
  status: string;
}): StoredUser {
  return {
    id: user.id.toString(),
    username: user.username,
    passwordHash: user.passwordHash,
    displayName: user.displayName,
    role: user.role,
    status: user.status,
  };
}

const userSelect = {
  id: true,
  username: true,
  passwordHash: true,
  displayName: true,
  role: true,
  status: true,
};

export async function findUserByUsername(username: string) {
  const user = await prisma.user.findUnique({
    where: {
      username,
    },
    select: userSelect,
  });

  return user ? toStoredUser(user) : null;
}

export async function findUserById(id: string) {
  const userId = BigInt(id);
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: userSelect,
  });

  return user ? toStoredUser(user) : null;
}
