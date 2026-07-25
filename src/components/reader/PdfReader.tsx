"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize,
  ScrollText,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface PdfReaderProps {
  documentId: string;
  initialPage?: number;
  onProgress: (page: number, totalPages: number, percentage: number) => void;
}

type ViewMode = "page" | "scroll";

export function PdfReader({ documentId, initialPage = 1, onProgress }: PdfReaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map());
  const pdfRef = useRef<{ numPages: number; getPage: (n: number) => Promise<unknown> } | null>(null);
  const [ready, setReady] = useState(false);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.2);
  const [viewMode, setViewMode] = useState<ViewMode>("page");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const saveProgress = useCallback(
    (page: number, total: number) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        onProgress(page, total, (page / total) * 100);
      }, 1000);
    },
    [onProgress]
  );

  const renderPage = useCallback(
    async (pageNum: number) => {
      const pdf = pdfRef.current;
      if (!pdf) return;

      const page = (await pdf.getPage(pageNum)) as {
        getViewport: (opts: { scale: number }) => { width: number; height: number };
        render: (ctx: { canvasContext: CanvasRenderingContext2D; viewport: unknown }) => { promise: Promise<void> };
      };

      const viewport = page.getViewport({ scale });
      let canvas = canvasRefs.current.get(pageNum);

      if (!canvas) {
        canvas = document.createElement("canvas");
        canvasRefs.current.set(pageNum, canvas);
      }

      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const context = canvas.getContext("2d")!;

      await page.render({ canvasContext: context, viewport }).promise;
      return canvas;
    },
    [scale]
  );

  useEffect(() => {
    let destroyed = false;

    async function init() {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

      const loadingTask = pdfjs.getDocument(`/api/documents/${documentId}/file`);
      const pdf = await loadingTask.promise;

      if (destroyed) return;

      pdfRef.current = pdf;
      setTotalPages(pdf.numPages);
      setReady(true);

      if (viewMode === "page") {
        await renderPage(initialPage);
      }
    }

    init();

    return () => {
      destroyed = true;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [documentId, initialPage, renderPage, viewMode]);

  useEffect(() => {
    if (!ready || !containerRef.current) return;

    async function display() {
      const container = containerRef.current!;
      container.innerHTML = "";

      if (viewMode === "page") {
        const canvas = await renderPage(currentPage);
        if (canvas) container.appendChild(canvas);
        saveProgress(currentPage, totalPages);
      } else {
        for (let i = 1; i <= totalPages; i++) {
          const canvas = await renderPage(i);
          if (canvas) {
            canvas.className = "mx-auto mb-4 block shadow-lg";
            container.appendChild(canvas);
          }
        }
      }
    }

    display();
  }, [ready, currentPage, scale, viewMode, totalPages, renderPage, saveProgress]);

  function goToPage(page: number) {
    const clamped = Math.min(totalPages, Math.max(1, page));
    setCurrentPage(clamped);
  }

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (viewMode !== "page") return;
      if (e.key === "ArrowLeft") goToPage(currentPage - 1);
      if (e.key === "ArrowRight") goToPage(currentPage + 1);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [currentPage, viewMode]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <div className="flex items-center gap-1">
          {viewMode === "page" && (
            <>
              <Button variant="ghost" size="sm" onClick={() => goToPage(currentPage - 1)} disabled={currentPage <= 1}>
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <span className="px-2 text-sm text-muted-foreground">
                {currentPage} / {totalPages}
              </span>
              <Button variant="ghost" size="sm" onClick={() => goToPage(currentPage + 1)} disabled={currentPage >= totalPages}>
                <ChevronRight className="h-5 w-5" />
              </Button>
            </>
          )}
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => setScale((s) => Math.max(0.5, s - 0.2))}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setScale((s) => Math.min(3, s + 0.2))}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode(viewMode === "page" ? "scroll" : "page")}
            aria-label="Toggle view mode"
          >
            {viewMode === "page" ? <ScrollText className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="mx-auto flex h-full w-full justify-center px-3 pb-3 pt-4 sm:px-4 sm:pb-4">
          <div className="reader-page-card flex h-full w-full max-w-[900px] overflow-hidden rounded-[2rem] transition-all duration-300">
            <div className="reader-page-sheet flex-1 overflow-auto bg-transparent p-4 sm:p-6">
              {!ready ? (
                <div className="flex h-full min-h-[60vh] items-center justify-center">
                  <div className="flex flex-col items-center gap-3">
                    <FileText className="h-8 w-8 animate-pulse text-accent" />
                    <p className="text-sm text-muted-foreground">Loading PDF...</p>
                  </div>
                </div>
              ) : (
                <div
                  ref={containerRef}
                  className={viewMode === "page" ? "flex h-full items-center justify-center" : "space-y-6"}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
