"use client";

import Link from "next/link";
import Image from "next/image";
import { FileText } from "lucide-react";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { formatLabel } from "@/lib/types";

interface DocumentCardProps {
  document: {
    id: string;
    title: string;
    author: string | null;
    format: string;
    coverPath: string | null;
    progress: { percentage: number; page: number | null; totalPages: number | null } | null;
  };
  view: "grid" | "list";
}

export function DocumentCard({ document: doc, view }: DocumentCardProps) {
  const progress = doc.progress?.percentage ?? 0;

  if (view === "list") {
    return (
      <Link
        href={`/reader/${doc.id}`}
        className="group flex items-center gap-4 rounded-xl border border-gray-800 bg-surface-raised p-3 transition-colors hover:border-gray-700 hover:bg-surface-overlay"
      >
        <CoverThumbnail doc={doc} size="sm" />
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-medium text-white group-hover:text-accent">
            {doc.title}
          </h3>
          <p className="truncate text-sm text-muted-foreground">
            {doc.author ?? "Unknown author"} · {formatLabel(doc.format)}
          </p>
          {progress > 0 && (
            <div className="mt-2 max-w-xs">
              <ProgressBar value={progress} showLabel />
            </div>
          )}
        </div>
        {doc.progress?.page && doc.progress.totalPages && (
          <span className="hidden text-sm text-muted-foreground sm:block">
            Page {doc.progress.page}/{doc.progress.totalPages}
          </span>
        )}
      </Link>
    );
  }

  return (
    <Link
      href={`/reader/${doc.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-gray-800 bg-surface-raised transition-all hover:border-gray-700 hover:shadow-lg hover:shadow-accent/5"
    >
      <div className="relative aspect-[2/3] overflow-hidden bg-surface-overlay">
        <CoverThumbnail doc={doc} size="lg" />
        <span className="absolute right-2 top-2 rounded-md bg-black/60 px-2 py-0.5 text-xs font-medium uppercase text-white">
          {doc.format}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-3">
        <h3 className="line-clamp-2 font-medium text-white group-hover:text-accent">
          {doc.title}
        </h3>
        {doc.author && (
          <p className="mt-1 truncate text-xs text-muted-foreground">{doc.author}</p>
        )}
        {progress > 0 && (
          <div className="mt-auto pt-3">
            <ProgressBar value={progress} />
          </div>
        )}
      </div>
    </Link>
  );
}

function CoverThumbnail({
  doc,
  size,
}: {
  doc: DocumentCardProps["document"];
  size: "sm" | "lg";
}) {
  const dimensions = size === "sm" ? "h-16 w-12" : "h-full w-full";

  if (doc.coverPath) {
    return (
      <Image
        src={`/api/documents/${doc.id}/cover`}
        alt={doc.title}
        width={size === "sm" ? 48 : 200}
        height={size === "sm" ? 64 : 300}
        className={`${dimensions} ${size === "lg" ? "object-cover" : "rounded-md object-cover"}`}
        unoptimized
      />
    );
  }

  return (
    <div
      className={`${dimensions} flex items-center justify-center ${size === "sm" ? "rounded-md" : ""} bg-gradient-to-br from-accent/30 to-surface-overlay`}
    >
      <FileText className={size === "sm" ? "h-6 w-6 text-accent" : "h-12 w-12 text-accent"} />
    </div>
  );
}
