import "server-only";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/** Used only so `next build` can import modules that touch Prisma before env vars exist. */
const BUILD_PLACEHOLDER = "postgresql://build:build@127.0.0.1:5432/build?schema=public";

function createClient() {
  return new PrismaClient({
    datasources: {
      db: { url: process.env.DATABASE_URL || BUILD_PLACEHOLDER },
    },
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
