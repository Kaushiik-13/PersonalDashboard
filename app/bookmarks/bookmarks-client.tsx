"use client";

import { useState, useCallback } from "react";
import {
  Bookmark,
  Check,
  ExternalLink,
  Plus,
  Trash2,
} from "lucide-react";
import type { Signal } from "@/lib/supabase";
import { getSourceLabel, getSourceIcon, getSourceBannerColor, isSourceTypeX } from "@/lib/bookmarks";

type StatusFilter = "all" | "unread" | "read" | "archived";

interface BookmarksClientProps {
  initialBookmarks: Signal[];
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function BookmarksClient({ initialBookmarks }: BookmarksClientProps) {
  const [bookmarks, setBookmarks] = useState<Signal[]>(initialBookmarks);
  const [newUrl, setNewUrl] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");
  const [tab, setTab] = useState<StatusFilter>("all");
  const [mutatingIds, setMutatingIds] = useState<Set<string>>(new Set());

  const handleAdd = useCallback(async () => {
    if (!newUrl.trim()) return;
    setAdding(true);
    setAddError("");
    try {
      const res = await fetch("/api/bookmarks/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: newUrl.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setBookmarks((prev) => [data.bookmark, ...prev]);
        setNewUrl("");
      } else {
        setAddError(data.error || "Failed to add");
      }
    } catch {
      setAddError("Failed to add");
    } finally {
      setAdding(false);
    }
  }, [newUrl]);

  async function handleStatus(id: string, status: string) {
    setMutatingIds((prev) => new Set(prev).add(id));
    try {
      const res = await fetch(`/api/bookmarks/${id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        setBookmarks((prev) =>
          prev.map((b) => (b.id === id ? { ...b, read_status: status } : b))
        );
      }
    } catch { /* ignore */ } finally {
      setMutatingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  async function handleDelete(id: string) {
    setMutatingIds((prev) => new Set(prev).add(id));
    try {
      const res = await fetch(`/api/bookmarks/${id}/delete`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setBookmarks((prev) => prev.filter((b) => b.id !== id));
      }
    } catch { /* ignore */ } finally {
      setMutatingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  const filtered = bookmarks.filter((b) => {
    if (tab === "all") return true;
    return b.read_status === tab;
  });

  const unreadCount = bookmarks.filter((b) => b.read_status === "unread").length;
  const readCount = bookmarks.filter((b) => b.read_status === "read").length;
  const archivedCount = bookmarks.filter((b) => b.read_status === "archived").length;

  return (
    <>
      <header className="page-header">
        <div>
          <h1 className="page-title">Bookmarks</h1>
          <p className="page-subtitle">{bookmarks.length} saved · {unreadCount} unread</p>
        </div>
      </header>

      <div className="add-bookmark-bar">
        <div className="add-bookmark-input">
          <Plus size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Paste any link — YouTube, X, Instagram, Reddit..."
            value={newUrl}
            onChange={(e) => { setNewUrl(e.target.value); setAddError(""); }}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            disabled={adding}
          />
          <button
            className="btn-primary"
            onClick={handleAdd}
            disabled={adding || !newUrl.trim()}
          >
            {adding ? "..." : "Add"}
          </button>
        </div>
        {addError && <span className="add-bookmark-error">{addError}</span>}
      </div>

      <div className="bookmark-tabs">
        <button className={`pill ${tab === "all" ? "active" : ""}`} onClick={() => setTab("all")}>All</button>
        <button className={`pill ${tab === "unread" ? "active" : ""}`} onClick={() => setTab("unread")}>Unread ({unreadCount})</button>
        <button className={`pill ${tab === "read" ? "active" : ""}`} onClick={() => setTab("read")}>Read ({readCount})</button>
        <button className={`pill ${tab === "archived" ? "active" : ""}`} onClick={() => setTab("archived")}>Archived ({archivedCount})</button>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <Bookmark size={48} className="empty-icon" />
          <h3>No bookmarks found</h3>
          <p>{tab !== "all" ? "No bookmarks in this category" : "Paste a link above to get started"}</p>
        </div>
      ) : (
        <div className="bookmark-list">
          {filtered.map((bookmark) => {
            const st = bookmark.tags?.[0] || "generic";
            const color = getSourceBannerColor(st as any);
            return (
              <div key={bookmark.id} className="bookmark-row">
                <span className="bookmark-dot" style={{ background: color }} />
                <a className="bookmark-title" href={bookmark.url} target="_blank" rel="noreferrer">
                  {bookmark.title}
                </a>
                <span className="bookmark-meta">
                  {isSourceTypeX(st as any) ? (
                    <span style={{ background: "#000", color: "#fff", fontWeight: 900, fontSize: "10px", borderRadius: "2px", padding: "1px 4px", lineHeight: 1 }}>X</span>
                  ) : (
                    <>
                      {getSourceIcon(st as any)} {getSourceLabel(st as any)}
                    </>
                  )}
                  {" · "}
                  {timeAgo(new Date(bookmark.published_at))}
                </span>
                <div className="bookmark-row-actions">
                  {bookmark.read_status === "unread" && (
                    <button className="icon-btn" title="Mark read" onClick={() => handleStatus(bookmark.id, "read")} disabled={mutatingIds.has(bookmark.id)}>
                      <Check size={14} />
                    </button>
                  )}
                  {bookmark.read_status === "read" && (
                    <button className="icon-btn" title="Mark unread" onClick={() => handleStatus(bookmark.id, "unread")} disabled={mutatingIds.has(bookmark.id)}>
                      <Bookmark size={14} />
                    </button>
                  )}
                  <a className="icon-btn" href={bookmark.url} target="_blank" rel="noreferrer" title="Open">
                    <ExternalLink size={14} />
                  </a>
                  <button className="icon-btn" title="Delete" onClick={() => handleDelete(bookmark.id)} disabled={mutatingIds.has(bookmark.id)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}