import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { getSession } from "@/lib/auth";
import { MAX_FILE_SIZE } from "@/lib/types";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        return {
          allowedContentTypes: [
            "application/epub+zip",
            "application/pdf",
            "application/octet-stream",
            "application/x-epub+zip",
          ],
          maximumSizeInBytes: MAX_FILE_SIZE,
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async () => {
        // Document registration happens via /api/upload/register
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error("Blob upload handler error:", error);
    return NextResponse.json({ error: "Upload token failed" }, { status: 500 });
  }
}
