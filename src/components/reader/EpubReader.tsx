"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  Sun,
  Moon,
  BookOpen,
  ScrollText,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface EpubReaderProps {
  documentId: string;
  initialPosition?: string;
  onProgress: (position: string, percentage: number) => void;
}

type Theme = "light" | "dark" | "sepia";
type ReadingMode = "paginated" | "scroll";

export function EpubReader({ documentId, initialPosition, onProgress }: EpubReaderProps) {
  const viewerRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<unknown>(null);
  const renditionRef = useRef<unknown>(null);
  const [ready, setReady] = useState(false);
  const [fontSize, setFontSize] = useState(110);
  const [theme, setTheme] = useState<Theme>("dark");
  const [readingMode, setReadingMode] = useState<ReadingMode>("paginated");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveProgress = useCallback(
    (cfi: string, percentage: number) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        onProgress(cfi, percentage);
      }, 1000);
    },
    [onProgress]
  );

  useEffect(() => {
    let destroyed = false;

    async function init() {
      setReady(false);
      const epubModule = await import("epubjs");
      const epub = epubModule.default ?? epubModule;

      const response = await fetch(`/api/documents/${documentId}/file`);
      if (!response.ok) {
        throw new Error(`Failed to fetch EPUB file: ${response.status} ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const book = epub(arrayBuffer) as any;
      bookRef.current = book;

      await book.ready;
      if (destroyed || !viewerRef.current) return;

      if (!book.package && book.packaging) {
        book.package = book.packaging;
      }

      const rendition = book.renderTo(viewerRef.current, {
        width: "100%",
        height: "100%",
        spread: "none",
        flow: readingMode === "scroll" ? "scrolled" : "paginated",
        manager: readingMode === "scroll" ? "continuous" : "default",
        view: "iframe",
        style: "body { margin: 0; padding: 0; background: transparent; }",
      });
      renditionRef.current = rendition;

      rendition.themes.fontSize(`${fontSize}%`);
      rendition.themes.default({
        body: {
          background: theme === "dark" ? "#151823" : theme === "light" ? "#faf7f0" : "#f4ecd8",
          color: theme === "dark" ? "#eef2ff" : theme === "light" ? "#111827" : "#3b2b16",
          fontFamily: "Lora, Georgia, serif",
          fontSize: `${fontSize}%`,
          lineHeight: "1.74",
          margin: "0 auto",
          maxWidth: "780px",
          padding: "44px 34px 56px",
          textAlign: "justify",
          hyphens: "auto",
          wordBreak: "normal",
        },
        p: {
          margin: "1.2em 0",
          textIndent: "0",
        },
        "p:first-child": {
          marginTop: "0",
        },
        h1: {
          fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
          color: theme === "dark" ? "#f8fafc" : "#111827",
          margin: "2.8em 0 0.9em",
          lineHeight: "1.06",
          letterSpacing: "-0.03em",
          fontSize: "2.4em",
          textAlign: "left",
        },
        h2: {
          fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
          color: theme === "dark" ? "#f8fafc" : "#111827",
          margin: "2.2em 0 0.8em",
          lineHeight: "1.16",
          fontSize: "1.75em",
        },
        h3: {
          fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
          color: theme === "dark" ? "#f8fafc" : "#111827",
          margin: "1.7em 0 0.55em",
          lineHeight: "1.24",
          fontSize: "1.35em",
        },
        blockquote: {
          margin: "1.6em 0",
          padding: "1.3em 1.5em",
          borderLeft: `4px solid ${theme === "dark" ? "rgba(124, 146, 255, 0.4)" : "rgba(99, 102, 241, 0.35)"}`,
          background: theme === "dark" ? "rgba(255,255,255,0.03)" : "rgba(15, 23, 42, 0.05)",
          fontStyle: "italic",
        },
        ul: {
          margin: "1.4em 0 1.4em 1.4em",
        },
        ol: {
          margin: "1.4em 0 1.4em 1.4em",
        },
        li: {
          margin: "0.6em 0",
        },
        strong: {
          fontWeight: "600",
        },
        em: {
          fontStyle: "italic",
        },
        img: {
          maxWidth: "100%",
          display: "block",
          margin: "2em auto",
        },
      });

      rendition.on("relocated", (location: { start: { cfi: string; percentage: number } }) => {
        saveProgress(location.start.cfi, location.start.percentage * 100);
      });

      if (initialPosition) {
        await rendition.display(initialPosition);
      } else {
        await rendition.display();
      }

      if (!destroyed) {
        setReady(true);
      }
    }

    init();

    return () => {
      destroyed = true;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      const rendition = renditionRef.current as { destroy?: () => void } | null;
      rendition?.destroy?.();
    };
  }, [documentId, initialPosition, readingMode, fontSize, theme, saveProgress]);

  function navigate(direction: "prev" | "next") {
    const rendition = renditionRef.current as { prev: () => void; next: () => void } | null;
    if (!rendition) return;
    direction === "prev" ? rendition.prev() : rendition.next();
  }

  function changeFontSize(delta: number) {
    const newSize = Math.min(200, Math.max(75, fontSize + delta));
    setFontSize(newSize);
    const rendition = renditionRef.current as {
      themes: { fontSize: (s: string) => void };
    } | null;
    rendition?.themes.fontSize(`${newSize}%`);
  }

  function cycleTheme() {
    const order: Theme[] = ["dark", "light", "sepia"];
    const next = order[(order.indexOf(theme) + 1) % order.length];
    setTheme(next);
    const bgColors: Record<Theme, string> = {
      dark: "#0f1117",
      light: "#ffffff",
      sepia: "#f4ecd8",
    };
    viewerRef.current?.style.setProperty("background", bgColors[next]);
  }

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") navigate("prev");
      if (e.key === "ArrowRight") navigate("next");
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-border bg-surface/80 px-4 py-3 shadow-lg shadow-black/10 backdrop-blur-md">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <BookOpen className="h-4 w-4 text-accent" />
          <span className="font-medium text-foreground">{readingMode === "paginated" ? "Paginated" : "Scroll"} reading</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setReadingMode((mode) => (mode === "paginated" ? "scroll" : "paginated"))}
            aria-label="Toggle reading mode"
          >
            <ScrollText className="h-4 w-4" />
            <span className="ml-1 hidden sm:inline">{readingMode === "paginated" ? "Scroll" : "Paginated"}</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => changeFontSize(-10)} aria-label="Decrease font size">
            <Minus className="h-4 w-4" />
          </Button>
          <span className="min-w-[3rem] text-center text-xs text-muted-foreground">{fontSize}%</span>
          <Button variant="ghost" size="sm" onClick={() => changeFontSize(10)} aria-label="Increase font size">
            <Plus className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={cycleTheme} aria-label="Change theme">
            {theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden">
        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <BookOpen className="h-8 w-8 animate-pulse text-accent" />
              <p className="text-sm text-muted-foreground">Loading book...</p>
            </div>
          </div>
        )}

        <div className="mx-auto flex h-full w-full justify-center">
          <div className="reader-page-card flex h-full w-full max-w-[900px] overflow-hidden rounded-[2rem] transition-all duration-300">
            <div className="reader-page-sheet h-full min-h-[78vh] w-full overflow-hidden bg-transparent">
              <div ref={viewerRef} className="h-full min-h-[78vh] w-full rounded-[2rem] bg-transparent" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
