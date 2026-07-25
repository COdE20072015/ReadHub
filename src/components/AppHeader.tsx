"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { BookOpen, Upload, LogOut } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function AppHeader() {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-50 border-b border-gray-800 bg-surface/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-accent" />
          <span className="text-lg font-semibold text-white">ReadHub</span>
        </Link>

        <div className="flex items-center gap-3">
          <Link href="/upload">
            <Button variant="secondary" size="sm">
              <Upload className="mr-1.5 h-4 w-4" />
              Upload
            </Button>
          </Link>
          {session?.user && (
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {session.user.name ?? session.user.email}
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => signOut({ callbackUrl: "/login" })}
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
