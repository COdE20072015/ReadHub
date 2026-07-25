import { NextResponse } from "next/server";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getSession } from "@/lib/auth";
import { getFormatFromFileName, MAX_FILE_SIZE } from "@/lib/types";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { fileName, fileSize } = await request.json();

  if (!fileName || !fileSize) {
    return NextResponse.json({ error: "fileName and fileSize required" }, { status: 400 });
  }

  if (fileSize > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "File exceeds 100MB limit" }, { status: 400 });
  }

  const format = getFormatFromFileName(fileName);
  if (!format) {
    return NextResponse.json({ error: "Unsupported file format" }, { status: 400 });
  }

  const ext = fileName.slice(fileName.lastIndexOf(".")).toLowerCase();
  const key = `files/${session.user.id}/${uuidv4()}${ext}`;

  const client = new S3Client({
    region: process.env.S3_REGION ?? "auto",
    endpoint: process.env.S3_ENDPOINT,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    },
    forcePathStyle: !!process.env.S3_ENDPOINT,
  });

  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET!,
    Key: key,
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn: 3600 });

  const publicUrl = process.env.S3_PUBLIC_URL
    ? `${process.env.S3_PUBLIC_URL.replace(/\/$/, "")}/${key}`
    : uploadUrl.split("?")[0];

  return NextResponse.json({ uploadUrl, key, publicUrl });
}
