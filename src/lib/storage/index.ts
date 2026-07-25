import { prisma } from "@/lib/db";
import { blobStorage } from "./blob";
import { localStorage } from "./local";
import { s3Storage } from "./s3";
import {
  isRemoteRef,
  resolveStorageProvider,
  type StorageAdapter,
  type StorageProvider,
} from "./types";

export { isRemoteRef, resolveStorageProvider };
export type { StorageProvider };

function getAdapter(): StorageAdapter {
  switch (resolveStorageProvider()) {
    case "blob":
      return blobStorage;
    case "s3":
      return s3Storage;
    default:
      return localStorage;
  }
}

export async function saveFile(
  userId: string,
  fileName: string,
  buffer: Buffer
): Promise<string> {
  return getAdapter().saveFile(userId, fileName, buffer);
}

export async function saveCover(
  userId: string,
  coverName: string,
  buffer: Buffer
): Promise<string> {
  return getAdapter().saveCover(userId, coverName, buffer);
}

export async function readFile(ref: string): Promise<Buffer> {
  return getAdapter().readFile(ref);
}

export async function deleteFile(ref: string): Promise<void> {
  return getAdapter().deleteFile(ref);
}

/** Sum document file sizes from DB — works on all providers including Vercel. */
export async function getUserStorageUsage(userId: string): Promise<number> {
  const result = await prisma.document.aggregate({
    where: { userId },
    _sum: { fileSize: true },
  });
  return result._sum.fileSize ?? 0;
}

/** Whether uploads should go direct-to-cloud from the browser (Vercel 4.5MB limit). */
export function usesClientUpload(): boolean {
  const provider = resolveStorageProvider();
  return provider === "blob" || provider === "s3";
}
