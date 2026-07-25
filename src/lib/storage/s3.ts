import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import type { StorageAdapter } from "./types";

function getClient() {
  return new S3Client({
    region: process.env.S3_REGION ?? "auto",
    endpoint: process.env.S3_ENDPOINT,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    },
    forcePathStyle: !!process.env.S3_ENDPOINT,
  });
}

function getBucket() {
  return process.env.S3_BUCKET!;
}

function toPublicUrl(key: string): string {
  if (process.env.S3_PUBLIC_URL) {
    return `${process.env.S3_PUBLIC_URL.replace(/\/$/, "")}/${key}`;
  }
  const endpoint = process.env.S3_ENDPOINT?.replace(/\/$/, "");
  const bucket = getBucket();
  if (endpoint) {
    return `${endpoint}/${bucket}/${key}`;
  }
  const region = process.env.S3_REGION ?? "us-east-1";
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

function keyFromRef(ref: string): string {
  if (ref.startsWith("s3://")) {
    return ref.slice(5);
  }
  const bucket = getBucket();
  const marker = `/${bucket}/`;
  const idx = ref.indexOf(marker);
  if (idx >= 0) {
    return ref.slice(idx + marker.length);
  }
  return ref;
}

export const s3Storage: StorageAdapter = {
  async saveFile(userId, fileName, buffer) {
    const key = `files/${userId}/${fileName}`;
    await getClient().send(
      new PutObjectCommand({
        Bucket: getBucket(),
        Key: key,
        Body: buffer,
      })
    );
    return toPublicUrl(key);
  },

  async saveCover(userId, coverName, buffer) {
    const key = `covers/${userId}/${coverName}`;
    await getClient().send(
      new PutObjectCommand({
        Bucket: getBucket(),
        Key: key,
        Body: buffer,
      })
    );
    return toPublicUrl(key);
  },

  async readFile(ref) {
    const key = keyFromRef(ref);
    const response = await getClient().send(
      new GetObjectCommand({ Bucket: getBucket(), Key: key })
    );
    const bytes = await response.Body?.transformToByteArray();
    if (!bytes) throw new Error("Empty S3 object");
    return Buffer.from(bytes);
  },

  async deleteFile(ref) {
    try {
      const key = keyFromRef(ref);
      await getClient().send(
        new DeleteObjectCommand({ Bucket: getBucket(), Key: key })
      );
    } catch {
      // object may already be gone
    }
  },
};
