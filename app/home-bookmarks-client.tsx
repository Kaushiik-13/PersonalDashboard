"use client";

import { useState, useCallback } from "react";
import { Bookmark, ExternalLink, Plus } from "lucide-react";
import type { Signal } from "@/lib/supabase";
import { getSourceIcon, getSourceBannerColor, isSourceTypeX } from "@/lib/bookmarks";
import Link from "next/link";

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

interface HomeBookmarksClientProps {
  bookmarks: Signal[];
}

export function HomeBookmarksClient({ bookmarks }: HomeBookmarksClientProps) {
  const [list, setList] = useState<Signal[]>(bookmarks);
  const [showModal, setShowModal] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");

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
        setList((prev) => [data.bookmark, ...prev].slice(0, 5));
        setNewUrl("");
        setShowModal(false);
      } else {
        setAddError(data.error || "Failed to add");
      }
    } catch {
      setAddError("Failed to add");
    } finally {
      setAdding(false);
    }
  }, [newUrl]);

  return (
    <>
      <section className="insights-block">
        <div className="insights-header">
          <div className="insights-header-left">
            <div className="insights-icon">
              <Bookmark size={16} />
            </div>
            <Link href="/bookmarks" className="insights-title-link">
              <h3 className="insights-title">
                Bookmarks
                <ExternalLink size={14} className="insights-external" />
              </h3>
            </Link>
          </div>
          <div className="insights-header-right">
            <button
              className="insights-add-btn"
              onClick={() => setShowModal(true)}
              title="Add bookmark"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>

        {list.length > 0 ? (
          <div className="insights-list">
            {list.map((bookmark) => {
              const sourceType = bookmark.tags?.[0] || "generic";
              return (
                <a key={bookmark.id} href={bookmark.url} className="insights-list-row" rel="noreferrer" target="_blank">
                  <div className="insights-list-icon" style={{ color: getSourceBannerColor(sourceType as any) }}>
                    {isSourceTypeX(sourceType as any) ? (
                      <span style={{ background: "#000", color: "#fff", fontWeight: 900, fontSize: "13px", borderRadius: "3px", width: "18px", height: "18px", display: "inline-flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>X</span>
                    ) : (
                      getSourceIcon(sourceType as any)
                    )}
                  </div>
                  <div className="insights-list-info">
                    <span className="insights-list-title">{bookmark.title}</span>
                    <span className="insights-list-meta">
                      {bookmark.source} · {timeAgo(new Date(bookmark.published_at))}
                    </span>
                  </div>
                </a>
              );
            })}
          </div>
        ) : (
          <div className="insights-empty">
            <p>No bookmarks yet</p>
            <span>Paste a link to save your first bookmark</span>
          </div>
        )}
      </section>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Add Bookmark</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="modal-input-row">
                <input
                  type="text"
                  placeholder="Paste any link — YouTube, X, Instagram, Reddit..."
                  value={newUrl}
                  onChange={(e) => { setNewUrl(e.target.value); setAddError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                  disabled={adding}
                  className="modal-input"
                  autoFocus
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
          </div>
        </div>
      )}
    </>
  );
}