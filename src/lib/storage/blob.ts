import { del, put } from "@vercel/blob";
import type { StorageAdapter } from "./types";

export const blobStorage: StorageAdapter = {
  async saveFile(userId, fileName, buffer) {
    const pathname = `files/${userId}/${fileName}`;
    const blob = await put(pathname, buffer, {
      access: "public",
      addRandomSuffix: false,
    });
    return blob.url;
  },

  async saveCover(userId, coverName, buffer) {
    const pathname = `covers/${userId}/${coverName}`;
    const blob = await put(pathname, buffer, {
      access: "public",
      addRandomSuffix: false,
    });
    return blob.url;
  },

  async readFile(ref) {
    const response = await fetch(ref);
    if (!response.ok) {
      throw new Error(`Failed to fetch blob: ${response.status}`);
    }
    return Buffer.from(await response.arrayBuffer());
  },

  async deleteFile(ref) {
    try {
      await del(ref);
    } catch {
      // blob may already be gone
    }
  },
};
