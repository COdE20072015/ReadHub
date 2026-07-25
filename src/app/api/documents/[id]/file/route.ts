import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { readFile } from "@/lib/storage";
import path from "path";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const document = await prisma.document.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!document) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const buffer = await readFile(document.filePath);
  const ext = path.extname(document.fileName).toLowerCase();

  const contentTypes: Record<string, string> = {
    ".epub": "application/epub+zip",
    ".pdf": "application/pdf",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".cbz": "application/x-cbz",
    ".cbr": "application/x-cbr",
  };

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": contentTypes[ext] ?? "application/octet-stream",
      "Content-Disposition": `inline; filename="${document.fileName}"`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
