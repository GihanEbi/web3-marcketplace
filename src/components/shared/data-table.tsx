"use client";

import { useMemo, useState, type KeyboardEvent, type MouseEvent, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Pagination                                                          */
/* ------------------------------------------------------------------ */

export interface PaginationState<T> {
  page: number;
  setPage: (page: number) => void;
  pageCount: number;
  pageItems: T[];
  total: number;
}

/** Client-side pagination. Resets to page 1 when the number of items changes. `pageSize` 0 = no paging. */
export function usePagination<T>(items: T[], pageSize = 10): PaginationState<T> {
  const [page, setPageState] = useState(1);
  const [prevLength, setPrevLength] = useState(items.length);

  if (prevLength !== items.length) {
    setPrevLength(items.length);
    setPageState(1);
  }

  const total = items.length;
  const pageCount = pageSize > 0 ? Math.max(1, Math.ceil(total / pageSize)) : 1;
  const current = Math.min(Math.max(1, page), pageCount);

  const pageItems = useMemo(
    () => (pageSize > 0 ? items.slice((current - 1) * pageSize, current * pageSize) : items),
    [items, current, pageSize],
  );

  return {
    page: current,
    setPage: (next: number) => setPageState(Math.min(Math.max(1, next), pageCount)),
    pageCount,
    pageItems,
    total,
  };
}

function pageWindow(page: number, pageCount: number): (number | "gap")[] {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1);
  const pages = new Set<number>([1, pageCount, page - 1, page, page + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= pageCount).sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push("gap");
    out.push(p);
  });
  return out;
}

interface PaginationProps {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({ page, pageCount, onPageChange, className }: PaginationProps) {
  if (pageCount <= 1) return null;
  return (
    <nav aria-label="Pagination" className={cn("flex items-center gap-1", className)}>
      <Button
        variant="outline"
        size="icon-sm"
        aria-label="Previous page"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        <ChevronLeft aria-hidden />
      </Button>
      <div className="hidden items-center gap-1 sm:flex">
        {pageWindow(page, pageCount).map((p, i) =>
          p === "gap" ? (
            <span key={`gap-${i}`} aria-hidden className="px-1 text-xs text-muted-foreground">
              …
            </span>
          ) : (
            <Button
              key={p}
              variant={p === page ? "default" : "ghost"}
              size="icon-sm"
              aria-label={`Page ${p}`}
              aria-current={p === page ? "page" : undefined}
              onClick={() => onPageChange(p)}
              className="text-xs tabular-nums"
            >
              {p}
            </Button>
          ),
        )}
      </div>
      <span className="px-2 text-xs text-muted-foreground tabular-nums sm:hidden">
        {page} / {pageCount}
      </span>
      <Button
        variant="outline"
        size="icon-sm"
        aria-label="Next page"
        disabled={page >= pageCount}
        onClick={() => onPageChange(page + 1)}
      >
        <ChevronRight aria-hidden />
      </Button>
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/* DataTable                                                           */
/* ------------------------------------------------------------------ */

export interface DataTableColumn<T> {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  /** Makes the column sortable. */
  sortValue?: (row: T) => string | number;
  className?: string;
  headerClassName?: string;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  /** Rows per page (default 10, 0 = no paging) */
  pageSize?: number;
  emptyState?: ReactNode;
  loading?: boolean;
  caption?: string;
  className?: string;
}

type SortDir = "asc" | "desc";

const INTERACTIVE_SELECTOR = "a, button, input, select, textarea, label, [role='menuitem'], [data-no-row-click]";

export function DataTable<T>({
  columns,
  data,
  rowKey,
  onRowClick,
  pageSize = 10,
  emptyState,
  loading = false,
  caption,
  className,
}: DataTableProps<T>) {
  const [sort, setSort] = useState<{ key: string; dir: SortDir } | null>(null);

  const sorted = useMemo(() => {
    if (!sort) return data;
    const column = columns.find((c) => c.key === sort.key);
    const getValue = column?.sortValue;
    if (!getValue) return data;
    const factor = sort.dir === "asc" ? 1 : -1;
    return data
      .map((row, index) => ({ row, index, value: getValue(row) }))
      .sort((a, b) => {
        const cmp =
          typeof a.value === "number" && typeof b.value === "number"
            ? a.value - b.value
            : String(a.value).localeCompare(String(b.value), undefined, { numeric: true, sensitivity: "base" });
        return cmp !== 0 ? cmp * factor : a.index - b.index;
      })
      .map((entry) => entry.row);
  }, [data, columns, sort]);

  const { page, setPage, pageCount, pageItems, total } = usePagination(sorted, pageSize);

  function toggleSort(key: string) {
    setSort((current) => {
      if (!current || current.key !== key) return { key, dir: "asc" };
      return { key, dir: current.dir === "asc" ? "desc" : "asc" };
    });
    setPage(1);
  }

  function handleRowClick(e: MouseEvent<HTMLTableRowElement>, row: T) {
    if (!onRowClick) return;
    // React events bubble through portals (menus, dialogs); ignore clicks that did not originate inside this row's DOM.
    if (!e.currentTarget.contains(e.target as Node)) return;
    const interactive = (e.target as HTMLElement).closest(INTERACTIVE_SELECTOR);
    if (interactive && e.currentTarget.contains(interactive)) return;
    onRowClick(row);
  }

  function handleRowKey(e: KeyboardEvent<HTMLTableRowElement>, row: T) {
    if (!onRowClick || e.target !== e.currentTarget) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onRowClick(row);
    }
  }

  const from = total === 0 ? 0 : pageSize > 0 ? (page - 1) * pageSize + 1 : 1;
  const to = pageSize > 0 ? Math.min(page * pageSize, total) : total;

  return (
    <div className={cn("overflow-hidden rounded-xl border border-border bg-card", className)}>
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full caption-bottom text-sm">
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead className="sticky top-0 z-10 bg-muted/60 backdrop-blur supports-backdrop-filter:bg-muted/40">
            <tr className="border-b border-border">
              {columns.map((column) => {
                const sortable = Boolean(column.sortValue);
                const active = sort?.key === column.key ? sort : null;
                const SortIcon = active ? (active.dir === "asc" ? ArrowUp : ArrowDown) : ChevronsUpDown;
                return (
                  <th
                    key={column.key}
                    scope="col"
                    aria-sort={sortable ? (active ? (active.dir === "asc" ? "ascending" : "descending") : "none") : undefined}
                    className={cn(
                      "h-10 px-4 text-left align-middle text-xs font-semibold tracking-wide whitespace-nowrap text-muted-foreground uppercase",
                      column.headerClassName,
                    )}
                  >
                    {sortable ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(column.key)}
                        className={cn(
                          "-mx-1.5 inline-flex items-center gap-1 rounded-md px-1.5 py-1 uppercase outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60",
                          active && "text-foreground",
                        )}
                      >
                        {column.header}
                        <SortIcon className={cn("size-3.5", !active && "opacity-50")} aria-hidden />
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: pageSize > 0 ? Math.min(pageSize, 5) : 5 }, (_, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  {columns.map((column) => (
                    <td key={column.key} className="px-4 py-3.5">
                      <Skeleton className="h-4 w-full max-w-40" />
                    </td>
                  ))}
                </tr>
              ))
            ) : pageItems.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10">
                  {emptyState ?? <p className="text-center text-sm text-muted-foreground">No results to display.</p>}
                </td>
              </tr>
            ) : (
              pageItems.map((row) => (
                <tr
                  key={rowKey(row)}
                  tabIndex={onRowClick ? 0 : undefined}
                  onClick={onRowClick ? (e) => handleRowClick(e, row) : undefined}
                  onKeyDown={onRowClick ? (e) => handleRowKey(e, row) : undefined}
                  className={cn(
                    "border-b border-border transition-colors last:border-0 hover:bg-muted/40",
                    onRowClick &&
                      "cursor-pointer outline-none focus-visible:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset",
                  )}
                >
                  {columns.map((column) => (
                    <td key={column.key} className={cn("px-4 py-3 align-middle", column.className)}>
                      {column.cell(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {!loading && total > 0 && (
        <div className="flex flex-col items-center justify-between gap-3 border-t border-border px-4 py-3 sm:flex-row">
          <p className="text-xs text-muted-foreground tabular-nums" aria-live="polite">
            Showing {from}–{to} of {total}
          </p>
          <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
