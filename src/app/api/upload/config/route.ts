import { NextResponse } from "next/server";
import { resolveStorageProvider, usesClientUpload } from "@/lib/storage";

export async function GET() {
  return NextResponse.json({
    provider: resolveStorageProvider(),
    clientUpload: usesClientUpload(),
  });
}
