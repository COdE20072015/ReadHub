"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Upload, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DocumentCard } from "@/components/dashboard/DocumentCard";
import { ContinueReading } from "@/components/dashboard/ContinueReading";
import { LibraryFilters } from "@/components/dashboard/LibraryFilters";
import { formatFileSize } from "@/lib/types";
import type { SortOption, ViewMode } from "@/lib/types";

interface DocumentWithProgress {
  id: string;
  title: string;
  author: string | null;
  format: string;
  fileSize: number;
  coverPath: string | null;
  lastReadAt: string | null;
  createdAt: string;
  progress: {
    percentage: number;
    page: number | null;
    totalPages: number | null;
  } | null;
}

export function DashboardClient() {
  const [documents, setDocuments] = useState<DocumentWithProgress[]>([]);
  const [storageUsed, setStorageUsed] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("recently_added");
  const [format, setFormat] = useState("");
  const [view, setView] = useState<ViewMode>("grid");

  const fetchDocuments = useCallback(async () => {
    const params = new URLSearchParams({ sort });
    if (format) params.set("format", format);
    if (search) params.set("search", search);

    const res = await fetch(`/api/documents?${params}`);
    if (res.ok) {
      const data = await res.json();
      setDocuments(data.documents);
      setStorageUsed(data.storageUsed);
    }
    setLoading(false);
  }, [sort, format, search]);

  useEffect(() => {
    const timer = setTimeout(fetchDocuments, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [fetchDocuments, search]);

  const continueReading = useMemo(
    () =>
      documents
        .filter((d) => d.lastReadAt && (d.progress?.percentage ?? 0) > 0 && (d.progress?.percentage ?? 0) < 100)
        .sort((a, b) => new Date(b.lastReadAt!).getTime() - new Date(a.lastReadAt!).getTime())
        .slice(0, 8),
    [documents]
  );

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Your Library</h1>
          <p className="text-sm text-muted-foreground">
            {documents.length} {documents.length === 1 ? "item" : "items"} ·{" "}
            {formatFileSize(storageUsed)} used
          </p>
        </div>
        <Link href="/upload">
          <Button>
            <Upload className="mr-2 h-4 w-4" />
            Upload
          </Button>
        </Link>
      </div>

      <ContinueReading documents={continueReading} />

      <LibraryFilters
        search={search}
        onSearchChange={setSearch}
        sort={sort}
        onSortChange={setSort}
        format={format}
        onFormatChange={setFormat}
        view={view}
        onViewChange={setView}
      />

      {documents.length === 0 ? (
        <EmptyState hasSearch={!!search} />
      ) : (
        <div
          className={
            view === "grid"
              ? "grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
              : "flex flex-col gap-2"
          }
        >
          {documents.map((doc) => (
            <DocumentCard key={doc.id} document={doc} view={view} />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({ hasSearch }: { hasSearch: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-border py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10">
        {hasSearch ? (
          <BookOpen className="h-8 w-8 text-accent" />
        ) : (
          <Upload className="h-8 w-8 text-accent" />
        )}
      </div>
      <h3 className="text-lg font-medium text-foreground">
        {hasSearch ? "No results found" : "Your library is empty"}
      </h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        {hasSearch
          ? "Try a different search term or clear your filters."
          : "Upload your first EPUB or PDF to start reading."}
      </p>
      {!hasSearch && (
        <Link href="/upload" className="mt-6">
          <Button>
            <Upload className="mr-2 h-4 w-4" />
            Upload a file
          </Button>
        </Link>
      )}
    </div>
  );
}
