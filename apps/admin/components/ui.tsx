"use client";

import type { ReactNode } from "react";
import { fmt } from "../lib/api";

export function Loading({ label = "Loading…" }: { label?: string }) {
  return <div className="loading">{label}</div>;
}

export function ErrorBox({ error }: { error: string | null }) {
  if (!error) return null;
  return <div className="error-box">{error}</div>;
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="empty">{children}</div>;
}

export function Badge({
  tone,
  children,
}: {
  tone?: "amber" | "green" | "red" | "blue";
  children: ReactNode;
}) {
  return <span className={`badge${tone ? ` ${tone}` : ""}`}>{children}</span>;
}

export function StatusBadge({ status }: { status: unknown }) {
  const s = fmt(status);
  const tone =
    s === "active" || s === "complete" || s === "approved" || s === "ready" || s === "completed"
      ? "green"
      : s === "archived" || s === "blocked" || s === "suspended" || s === "failed"
        ? "red"
        : s === "draft" || s === "pending" || s === "title_only"
          ? "amber"
          : undefined;
  return <Badge tone={tone}>{s}</Badge>;
}

/** Generic read-only table for arrays of flat-ish records. */
export function DataTable({
  rows,
  columns,
  onRowClick,
  emptyText = "No records.",
}: {
  rows: Record<string, unknown>[];
  columns: string[];
  onRowClick?: (row: Record<string, unknown>) => void;
  emptyText?: string;
}) {
  if (rows.length === 0) return <Empty>{emptyText}</Empty>;
  return (
    <div className="tablewrap">
      <table>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className={onRowClick ? "clickable" : undefined}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
            >
              {columns.map((c) => (
                <td key={c}>{c === "status" || c === "completeness" ? <StatusBadge status={row[c]} /> : fmt(row[c])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
