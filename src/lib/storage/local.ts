import fs from "fs/promises";
import path from "path";
import type { StorageAdapter } from "./types";

const STORAGE_ROOT = process.env.STORAGE_PATH ?? "./storage";

async function ensureStorageDirs(userId: string): Promise<void> {
  const userDir = path.join(STORAGE_ROOT, userId);
  await fs.mkdir(path.join(userDir, "files"), { recursive: true });
  await fs.mkdir(path.join(userDir, "covers"), { recursive: true });
}

export const localStorage: StorageAdapter = {
  async saveFile(userId, fileName, buffer) {
    await ensureStorageDirs(userId);
    const filePath = path.join(STORAGE_ROOT, userId, "files", fileName);
    await fs.writeFile(filePath, buffer);
    return filePath;
  },

  async saveCover(userId, coverName, buffer) {
    await ensureStorageDirs(userId);
    const coverPath = path.join(STORAGE_ROOT, userId, "covers", coverName);
    await fs.writeFile(coverPath, buffer);
    return coverPath;
  },

  async readFile(ref) {
    return fs.readFile(ref);
  },

  async deleteFile(ref) {
    try {
      await fs.unlink(ref);
    } catch {
      // file may already be gone
    }
  },
};
