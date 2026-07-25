"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EpubReader } from "@/components/reader/EpubReader";
import { PdfReader } from "@/components/reader/PdfReader";

interface ReaderClientProps {
  documentId: string;
}

interface DocumentData {
  id: string;
  title: string;
  author: string | null;
  format: string;
  progress: {
    position: string;
    percentage: number;
    page: number | null;
    totalPages: number | null;
  } | null;
}

export function ReaderClient({ documentId }: ReaderClientProps) {
  const router = useRouter();
  const [document, setDocument] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch(`/api/documents/${documentId}`)
      .then((res) => res.json())
      .then((data) => {
        setDocument(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [documentId]);

  const saveProgress = useCallback(
    async (position: string, percentage: number, page?: number, totalPages?: number) => {
      await fetch("/api/progress", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId,
          position,
          percentage,
          page,
          totalPages,
        }),
      });
    },
    [documentId]
  );

  async function handleDelete() {
    if (!confirm("Delete this document from your library?")) return;
    setDeleting(true);
    const res = await fetch(`/api/documents/${documentId}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/dashboard");
    } else {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  if (!document) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Document not found</p>
        <Link href="/dashboard">
          <Button variant="secondary">Back to library</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 top-14 flex flex-col bg-surface">
      <div className="flex items-center justify-between border-b border-gray-800 px-4 py-2">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" aria-label="Back to library">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="min-w-0">
            <h1 className="truncate text-sm font-medium text-white">{document.title}</h1>
            {document.author && (
              <p className="truncate text-xs text-muted-foreground">{document.author}</p>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          disabled={deleting}
          aria-label="Delete document"
        >
          <Trash2 className="h-4 w-4 text-red-400" />
        </Button>
      </div>

      <div className="flex-1 overflow-hidden">
        {document.format === "epub" ? (
          <EpubReader
            documentId={documentId}
            initialPosition={document.progress?.position}
            onProgress={(position, percentage) => saveProgress(position, percentage)}
          />
        ) : document.format === "pdf" ? (
          <PdfReader
            documentId={documentId}
            initialPage={document.progress?.page ?? 1}
            onProgress={(page, total, percentage) =>
              saveProgress(String(page), percentage, page, total)
            }
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground">
              {document.format.toUpperCase()} reader coming in Phase 2
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
