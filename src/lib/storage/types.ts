export type StorageProvider = "local" | "blob" | "s3";

export interface StoredObject {
  /** Local path or remote URL/key */
  ref: string;
}

export interface StorageAdapter {
  saveFile(userId: string, fileName: string, buffer: Buffer): Promise<string>;
  saveCover(userId: string, coverName: string, buffer: Buffer): Promise<string>;
  readFile(ref: string): Promise<Buffer>;
  deleteFile(ref: string): Promise<void>;
}

export function isRemoteRef(ref: string): boolean {
  return ref.startsWith("http://") || ref.startsWith("https://");
}

export function resolveStorageProvider(): StorageProvider {
  const explicit = process.env.STORAGE_PROVIDER as StorageProvider | undefined;
  if (explicit === "local" || explicit === "blob" || explicit === "s3") {
    return explicit;
  }
  if (process.env.BLOB_READ_WRITE_TOKEN) return "blob";
  if (process.env.S3_BUCKET && process.env.S3_ACCESS_KEY_ID) return "s3";
  return "local";
}
