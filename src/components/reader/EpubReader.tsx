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
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface EpubReaderProps {
  documentId: string;
  initialPosition?: string;
  onProgress: (position: string, percentage: number) => void;
}

type Theme = "light" | "dark" | "sepia";

export function EpubReader({ documentId, initialPosition, onProgress }: EpubReaderProps) {
  const viewerRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<unknown>(null);
  const renditionRef = useRef<unknown>(null);
  const [ready, setReady] = useState(false);
  const [fontSize, setFontSize] = useState(100);
  const [theme, setTheme] = useState<Theme>("dark");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>();

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
      const ePub = (await import("epubjs")).default;
      const book = ePub(`/api/documents/${documentId}/file`, { openAs: "epub" });
      bookRef.current = book;

      await book.ready;
      if (destroyed || !viewerRef.current) return;

      const rendition = book.renderTo(viewerRef.current, {
        width: "100%",
        height: "100%",
        spread: "none",
        flow: "paginated",
      });
      renditionRef.current = rendition;

      rendition.themes.fontSize(`${fontSize}%`);

      rendition.on("relocated", (location: { start: { cfi: string; percentage: number } }) => {
        saveProgress(location.start.cfi, location.start.percentage * 100);
      });

      if (initialPosition) {
        await rendition.display(initialPosition);
      } else {
        await rendition.display();
      }

      setReady(true);
    }

    init();

    return () => {
      destroyed = true;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      const rendition = renditionRef.current as { destroy?: () => void } | null;
      rendition?.destroy?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId, initialPosition, saveProgress]);

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
      <div className="flex items-center justify-between border-b border-gray-800 px-4 py-2">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => navigate("prev")} aria-label="Previous page">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate("next")} aria-label="Next page">
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => changeFontSize(-10)} aria-label="Decrease font size">
            <Minus className="h-4 w-4" />
          </Button>
          <span className="text-xs text-muted-foreground w-10 text-center">{fontSize}%</span>
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
        <div ref={viewerRef} className="h-full w-full" />
      </div>
    </div>
  );
}
