import { prisma } from "../lib/prisma.js";

export async function checkDatabaseHealth() {
  await prisma.$queryRaw`SELECT 1`;

  return {
    status: "ok" as const,
  };
}
