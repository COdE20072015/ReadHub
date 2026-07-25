import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { extractMetadata } from "@/lib/metadata";
import { readFile } from "@/lib/storage";
import {
  getFormatFromFileName,
  type DocumentFormat,
} from "@/lib/types";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { fileRef, fileName, fileSize } = await request.json();

    if (!fileRef || !fileName || !fileSize) {
      return NextResponse.json(
        { error: "fileRef, fileName, and fileSize are required" },
        { status: 400 }
      );
    }

    const format = getFormatFromFileName(fileName);
    if (!format) {
      return NextResponse.json({ error: "Unsupported file format" }, { status: 400 });
    }

    if (format === "docx" || format === "cbz" || format === "cbr") {
      return NextResponse.json(
        { error: `${format.toUpperCase()} support coming in Phase 2` },
        { status: 501 }
      );
    }

    const buffer = await readFile(fileRef);

    const metadata = await extractMetadata(
      format as DocumentFormat,
      buffer,
      fileName,
      session.user.id
    );

    const document = await prisma.document.create({
      data: {
        userId: session.user.id,
        title: metadata.title,
        author: metadata.author ?? null,
        format,
        fileName,
        filePath: fileRef,
        fileSize,
        pageCount: metadata.pageCount ?? null,
        coverPath: metadata.coverPath ?? null,
        status: "ready",
      },
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error("Register upload error:", error);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
