"use client";

import { Search, LayoutGrid, List, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { SortOption, ViewMode } from "@/lib/types";

interface LibraryFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  sort: SortOption;
  onSortChange: (value: SortOption) => void;
  format: string;
  onFormatChange: (value: string) => void;
  view: ViewMode;
  onViewChange: (value: ViewMode) => void;
}

export function LibraryFilters({
  search,
  onSearchChange,
  sort,
  onSortChange,
  format,
  onFormatChange,
  view,
  onViewChange,
}: LibraryFiltersProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative flex-1 sm:max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          placeholder="Search by title, author, or tag..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full rounded-lg border border-gray-700 bg-surface-raised py-2 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 rounded-lg border border-gray-700 bg-surface-raised p-1">
          <FilterSelect
            icon={<SlidersHorizontal className="h-4 w-4" />}
            value={sort}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            options={[
              { value: "recently_added", label: "Recently added" },
              { value: "recently_read", label: "Recently read" },
              { value: "alphabetical", label: "A–Z" },
            ]}
          />
        </div>

        <select
          value={format}
          onChange={(e) => onFormatChange(e.target.value)}
          className="rounded-lg border border-gray-700 bg-surface-raised px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
        >
          <option value="">All formats</option>
          <option value="epub">EPUB</option>
          <option value="pdf">PDF</option>
        </select>

        <div className="flex rounded-lg border border-gray-700 bg-surface-raised p-1">
          <Button
            variant={view === "grid" ? "primary" : "ghost"}
            size="sm"
            onClick={() => onViewChange("grid")}
            aria-label="Grid view"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={view === "list" ? "primary" : "ghost"}
            size="sm"
            onClick={() => onViewChange("list")}
            aria-label="List view"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function FilterSelect({
  icon,
  value,
  onChange,
  options,
}: {
  icon: React.ReactNode;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex items-center gap-2 px-2">
      <span className="text-muted-foreground">{icon}</span>
      <select
        value={value}
        onChange={onChange}
        className="bg-transparent text-sm text-foreground focus:outline-none"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-surface-raised">
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
