import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { saveFile, usesClientUpload } from "@/lib/storage";
import { extractMetadata } from "@/lib/metadata";
import {
  getFormatFromFileName,
  MAX_FILE_SIZE,
  type DocumentFormat,
} from "@/lib/types";
import { v4 as uuidv4 } from "uuid";

/** Local-dev upload via multipart form. Cloud deploys use /api/upload/handlers + /register. */
export async function POST(request: Request) {
  if (usesClientUpload()) {
    return NextResponse.json(
      {
        error:
          "Direct upload is disabled in cloud mode. Use client-side upload instead.",
      },
      { status: 400 }
    );
  }

  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File exceeds 100MB limit" },
        { status: 400 }
      );
    }

    const format = getFormatFromFileName(file.name);
    if (!format) {
      return NextResponse.json(
        { error: "Unsupported file format. Supported: EPUB, PDF, DOCX, CBZ, CBR" },
        { status: 400 }
      );
    }

    if (format === "docx" || format === "cbz" || format === "cbr") {
      return NextResponse.json(
        { error: `${format.toUpperCase()} support coming in Phase 2` },
        { status: 501 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const storedName = `${uuidv4()}${getExtension(file.name)}`;
    const filePath = await saveFile(session.user.id, storedName, buffer);

    const metadata = await extractMetadata(
      format as DocumentFormat,
      buffer,
      file.name,
      session.user.id
    );

    const document = await prisma.document.create({
      data: {
        userId: session.user.id,
        title: metadata.title,
        author: metadata.author ?? null,
        format,
        fileName: file.name,
        filePath,
        fileSize: file.size,
        pageCount: metadata.pageCount ?? null,
        coverPath: metadata.coverPath ?? null,
        status: "ready",
      },
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

function getExtension(fileName: string): string {
  return fileName.slice(fileName.lastIndexOf(".")).toLowerCase();
}
