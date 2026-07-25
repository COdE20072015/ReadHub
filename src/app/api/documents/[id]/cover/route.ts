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

  if (!document?.coverPath) {
    return NextResponse.json({ error: "No cover" }, { status: 404 });
  }

  const buffer = await readFile(document.coverPath);
  const ext = path.extname(document.coverPath).toLowerCase();

  const contentTypes: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
  };

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": contentTypes[ext] ?? "image/jpeg",
      "Cache-Control": "private, max-age=86400",
    },
  });
}
