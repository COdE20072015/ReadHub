"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { DocumentCard } from "./DocumentCard";
import { ProgressBar } from "@/components/ui/ProgressBar";

interface ContinueReadingProps {
  documents: Array<{
    id: string;
    title: string;
    author: string | null;
    format: string;
    coverPath: string | null;
    progress: { percentage: number; page: number | null; totalPages: number | null } | null;
  }>;
}

export function ContinueReading({ documents }: ContinueReadingProps) {
  if (documents.length === 0) return null;

  return (
    <section className="mb-8">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Continue Reading</h2>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
        {documents.map((doc) => (
          <Link
            key={doc.id}
            href={`/reader/${doc.id}`}
            className="group min-w-[200px] max-w-[200px] flex-shrink-0 rounded-xl border border-gray-800 bg-surface-raised p-3 transition-colors hover:border-accent/50"
          >
            <h3 className="line-clamp-1 font-medium text-white group-hover:text-accent">
              {doc.title}
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground uppercase">
              {doc.format}
            </p>
            <div className="mt-3">
              <ProgressBar value={doc.progress?.percentage ?? 0} showLabel />
            </div>
            <div className="mt-2 flex items-center text-xs text-accent">
              Resume
              <ChevronRight className="h-3 w-3" />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
