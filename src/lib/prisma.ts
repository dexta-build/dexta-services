import { PrismaClient } from "@prisma/client";
import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

const rawConnectionString =
  process.env.DATABASE_URL?.trim() ||
  process.env.DATABASE_URL_UNPOOLED?.trim() ||
  "postgresql://postgres:postgres@localhost:5432/dexta_services?schema=public";

neonConfig.webSocketConstructor = ws;

function withRuntimeConnectionParams(connectionString: string) {
  try {
    const url = new URL(connectionString);

    if (!url.searchParams.has("connect_timeout")) {
      url.searchParams.set(
        "connect_timeout",
        process.env.PG_CONNECT_TIMEOUT_SECONDS?.trim() || "15",
      );
    }

    if (!url.searchParams.has("pool_timeout")) {
      url.searchParams.set(
        "pool_timeout",
        process.env.PG_POOL_TIMEOUT_SECONDS?.trim() || "15",
      );
    }

    return url.toString();
  } catch {
    return connectionString;
  }
}

const connectionString = withRuntimeConnectionParams(rawConnectionString);

const adapter = new PrismaNeon({
  connectionString,
});

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.PRISMA_DEBUG === "true" ? ["query", "error"] : undefined,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
