import { PrismaClient } from "@prisma/client";

// 与主项目 apps/server/src/lib/prisma.ts 同构的单例写法
const globalForPrisma = globalThis as typeof globalThis & {
  nsmPrisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.nsmPrisma ??
  new PrismaClient({
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.nsmPrisma = prisma;
}
