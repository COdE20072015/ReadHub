import type { DocumentFormat, DocumentMetadata } from "./types";
import { saveCover } from "./storage";
import { v4 as uuidv4 } from "uuid";
import path from "path";

export async function extractMetadata(
  format: DocumentFormat,
  buffer: Buffer,
  fileName: string,
  userId: string
): Promise<DocumentMetadata> {
  const baseTitle = fileName.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ");

  switch (format) {
    case "epub":
      return extractEpubMetadata(buffer, baseTitle, userId);
    case "pdf":
      return extractPdfMetadata(buffer, baseTitle);
    default:
      return { title: baseTitle };
  }
}

async function extractEpubMetadata(
  buffer: Buffer,
  fallbackTitle: string,
  userId: string
): Promise<DocumentMetadata> {
  try {
    const JSZip = (await import("jszip")).default;
    const zip = await JSZip.loadAsync(buffer);

    const containerXml = await zip.file("META-INF/container.xml")?.async("string");
    if (!containerXml) return { title: fallbackTitle };

    const rootfileMatch = containerXml.match(/full-path="([^"]+)"/);
    if (!rootfileMatch) return { title: fallbackTitle };

    const opfContent = await zip.file(rootfileMatch[1])?.async("string");
    if (!opfContent) return { title: fallbackTitle };

    const titleMatch = opfContent.match(/<dc:title[^>]*>([^<]+)<\/dc:title>/i);
    const authorMatch = opfContent.match(/<dc:creator[^>]*>([^<]+)<\/dc:creator>/i);

    let coverPath: string | undefined;
    const coverIdMatch = opfContent.match(/name="cover"\s+content="([^"]+)"/i);
    if (coverIdMatch) {
      const itemMatch = opfContent.match(
        new RegExp(`id="${coverIdMatch[1]}"[^>]*href="([^"]+)"`, "i")
      );
      if (itemMatch) {
        const opfDir = rootfileMatch[1].includes("/")
          ? rootfileMatch[1].substring(0, rootfileMatch[1].lastIndexOf("/") + 1)
          : "";
        const coverFile = zip.file(opfDir + itemMatch[1]);
        if (coverFile) {
          const coverBuffer = Buffer.from(await coverFile.async("arraybuffer"));
          const ext = path.extname(itemMatch[1]) || ".jpg";
          const coverName = `${uuidv4()}${ext}`;
          coverPath = await saveCover(userId, coverName, coverBuffer);
        }
      }
    }

    if (!coverPath) {
      const imageFiles = Object.keys(zip.files).filter(
        (f) => /\.(jpg|jpeg|png|webp)$/i.test(f) && !f.startsWith("__")
      );
      if (imageFiles.length > 0) {
        const coverFile = zip.file(imageFiles[0]);
        if (coverFile) {
          const coverBuffer = Buffer.from(await coverFile.async("arraybuffer"));
          const ext = path.extname(imageFiles[0]) || ".jpg";
          const coverName = `${uuidv4()}${ext}`;
          coverPath = await saveCover(userId, coverName, coverBuffer);
        }
      }
    }

    return {
      title: titleMatch?.[1]?.trim() || fallbackTitle,
      author: authorMatch?.[1]?.trim(),
      coverPath,
    };
  } catch {
    return { title: fallbackTitle };
  }
}

async function extractPdfMetadata(
  buffer: Buffer,
  fallbackTitle: string
): Promise<DocumentMetadata> {
  try {
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const loadingTask = pdfjs.getDocument({ data: new Uint8Array(buffer) });
    const pdf = await loadingTask.promise;

    const metadata = await pdf.getMetadata().catch(() => null);
    const info = metadata?.info as Record<string, string> | undefined;

    return {
      title: info?.Title?.trim() || fallbackTitle,
      author: info?.Author?.trim(),
      pageCount: pdf.numPages,
    };
  } catch {
    return { title: fallbackTitle };
  }
}
