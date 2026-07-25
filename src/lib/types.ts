export type DocumentFormat = "epub" | "pdf" | "docx" | "cbz" | "cbr";

export interface DocumentMetadata {
  title: string;
  author?: string;
  pageCount?: number;
  coverPath?: string;
}

export interface ReadingPosition {
  position: string;
  percentage: number;
  page?: number;
  totalPages?: number;
}

export type ViewMode = "grid" | "list";

export type SortOption =
  | "recently_read"
  | "recently_added"
  | "alphabetical"
  | "progress";

export interface DashboardDocument {
  id: string;
  title: string;
  author: string | null;
  format: string;
  fileSize: number;
  pageCount: number | null;
  coverPath: string | null;
  tags: string;
  lastReadAt: string | null;
  createdAt: string;
  progress: {
    percentage: number;
    page: number | null;
    totalPages: number | null;
  } | null;
}

export const SUPPORTED_FORMATS = [".epub", ".pdf", ".docx", ".cbz", ".cbr"] as const;

export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatLabel(format: string): string {
  return format.toUpperCase();
}

export function getFormatFromFileName(fileName: string): DocumentFormat | null {
  const ext = fileName.toLowerCase().slice(fileName.lastIndexOf("."));
  const map: Record<string, DocumentFormat> = {
    ".epub": "epub",
    ".pdf": "pdf",
    ".docx": "docx",
    ".cbz": "cbz",
    ".cbr": "cbr",
  };
  return map[ext] ?? null;
}
