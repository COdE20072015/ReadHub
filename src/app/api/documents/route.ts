import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getUserStorageUsage } from "@/lib/storage";
import type { SortOption } from "@/lib/types";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const sort = (searchParams.get("sort") ?? "recently_added") as SortOption;
  const format = searchParams.get("format");
  const search = searchParams.get("search");
  const collectionId = searchParams.get("collection");

  const where: Record<string, unknown> = { userId: session.user.id };

  if (format) where.format = format;
  if (collectionId) where.collectionId = collectionId;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { author: { contains: search, mode: "insensitive" } },
      { tags: { contains: search, mode: "insensitive" } },
    ];
  }

  let orderBy: Record<string, string> = { createdAt: "desc" };
  switch (sort) {
    case "recently_read":
      orderBy = { lastReadAt: "desc" };
      break;
    case "alphabetical":
      orderBy = { title: "asc" };
      break;
    case "progress":
      orderBy = { lastReadAt: "desc" };
      break;
  }

  const documents = await prisma.document.findMany({
    where,
    orderBy,
    include: { progress: true },
  });

  const storageUsed = await getUserStorageUsage(session.user.id);

  return NextResponse.json({ documents, storageUsed });
}
