import { PrismaClient } from "@prisma/client";

// Serverless-safe singleton: avoids exhausting Neon connections
// when Vercel spins up many function instances in dev/preview.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
