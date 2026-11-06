import { prisma } from "@/lib/prisma";
import { apiHandler, ok } from "@/lib/api";
import { LevelAkun } from "@prisma/client";

export const GET = apiHandler(async (req) => {
  const url = new URL(req.url);
  const levelParam = url.searchParams.get("level");
  const parentIdParam = url.searchParams.get("parentId");

  const whereClause: {
    level?: LevelAkun;
    parentId?: string | null;
  } = {};

  if (
    levelParam &&
    Object.values(LevelAkun).includes(levelParam as LevelAkun)
  ) {
    whereClause.level = levelParam as LevelAkun;
  }

  if (parentIdParam) {
    whereClause.parentId = parentIdParam;
  }

  const akunList = await prisma.refAkun.findMany({
    where: whereClause,
    orderBy: { kode: "asc" },
  });

  return ok(akunList, { total: akunList.length });
});

