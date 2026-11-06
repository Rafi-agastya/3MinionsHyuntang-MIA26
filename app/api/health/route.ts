import { prisma } from "@/lib/prisma";
import { apiHandler, ok } from "@/lib/api";

export const GET = apiHandler(async () => {
  let databaseStatus = "connected";

  try {
    if ("$queryRaw" in prisma && typeof prisma.$queryRaw === "function") {
      await prisma.$queryRaw`SELECT 1`;
    }
  } catch {
    databaseStatus = "disconnected";
  }

  const isHealthy = databaseStatus === "connected";

  return ok(
    {
      status: isHealthy ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: databaseStatus,
      versi: "1.0.0",
      lingkungan: process.env.NODE_ENV || "development",
    },
    undefined,
    isHealthy ? 200 : 503
  );
});

