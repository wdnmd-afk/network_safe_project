import "dotenv/config";

import { scryptSync, randomBytes } from "node:crypto";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(password, salt, 64);

  return `scrypt:${salt}:${derivedKey.toString("hex")}`;
}

const users = [
  {
    username: "admin",
    password: "Admin@123456",
    displayName: "平台管理员",
    role: "admin",
    status: "active",
  },
  {
    username: "demo_user",
    password: "Demo@123456",
    displayName: "演示用户",
    role: "member",
    status: "active",
  },
];

try {
  for (const user of users) {
    await prisma.user.upsert({
      where: {
        username: user.username,
      },
      update: {
        passwordHash: hashPassword(user.password),
        displayName: user.displayName,
        role: user.role,
        status: user.status,
      },
      create: {
        username: user.username,
        passwordHash: hashPassword(user.password),
        displayName: user.displayName,
        role: user.role,
        status: user.status,
      },
    });
  }

  console.log(`seeded ${users.length} auth users`);
} finally {
  await prisma.$disconnect();
}
