import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PUT(request: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { documentId, position, percentage, page, totalPages } =
    await request.json();

  if (!documentId || position === undefined) {
    return NextResponse.json(
      { error: "documentId and position are required" },
      { status: 400 }
    );
  }

  const document = await prisma.document.findFirst({
    where: { id: documentId, userId: session.user.id },
  });

  if (!document) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const progress = await prisma.readingProgress.upsert({
    where: { documentId },
    create: {
      documentId,
      position: String(position),
      percentage: percentage ?? 0,
      page: page ?? null,
      totalPages: totalPages ?? null,
    },
    update: {
      position: String(position),
      percentage: percentage ?? 0,
      page: page ?? null,
      totalPages: totalPages ?? null,
    },
  });

  await prisma.document.update({
    where: { id: documentId },
    data: { lastReadAt: new Date() },
  });

  return NextResponse.json(progress);
}
