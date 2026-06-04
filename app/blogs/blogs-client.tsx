"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpDown,
  Bookmark,
  EyeOff,
  Filter,
  Rss,
  Search,
  TrendingUp,
} from "lucide-react";
import type { Signal } from "@/lib/supabase";

type SortOption = "recent" | "source";
type SubCategoryFilter = "all" | "Engineering" | "AI Labs" | "DevOps" | "Databases" | "Architecture" | "Incidents" | "Releases" | "Open Source" | "Security" | "Industry";

interface BlogsClientProps {
  initialSignals: Signal[];
  pipelineStatus: Record<string, unknown> | null;
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export function BlogsClient({ initialSignals, pipelineStatus }: BlogsClientProps) {
  const router = useRouter();
  const [signals] = useState<Signal[]>(initialSignals);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [subCategory, setSubCategory] = useState<SubCategoryFilter>("all");
  const [mutatingIds, setMutatingIds] = useState<Set<string>>(new Set());

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await fetch("/api/blogs/refresh", { method: "POST" });
      router.refresh();
    } catch (error) {
      console.error("Refresh failed", error);
    } finally {
      setRefreshing(false);
    }
  }

  async function toggleSave(id: string) {
    setMutatingIds((prev) => new Set(prev).add(id));
    try {
      await fetch(`/api/signals/${id}/save`, { method: "POST" });
      router.refresh();
    } catch (error) {
      console.error("Save toggle failed", error);
    } finally {
      setMutatingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  async function toggleHide(id: string) {
    setMutatingIds((prev) => new Set(prev).add(id));
    try {
      await fetch(`/api/signals/${id}/hide`, { method: "POST" });
      router.refresh();
    } catch (error) {
      console.error("Hide toggle failed", error);
    } finally {
      setMutatingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  const subCategories: SubCategoryFilter[] = ["all", "Engineering", "AI Labs", "DevOps", "Databases", "Architecture", "Incidents", "Releases", "Open Source", "Security", "Industry"];

  const uniqueSources = new Set(signals.map((s) => s.source)).size;

  const filtered = signals
    .filter((s) => {
      if (subCategory === "all") return true;
      return s.tags.includes(subCategory);
    })
    .filter((s) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        s.title.toLowerCase().includes(q) ||
        s.summary.toLowerCase().includes(q) ||
        s.tags.some((t) => t.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      if (sortBy === "recent") return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
      return a.source.localeCompare(b.source);
    });

  const statusText = pipelineStatus ? formatStatusText(pipelineStatus) : null;

  return (
    <>
      <header className="page-header">
        <div>
          <h1 className="page-title">Tech Blogs</h1>
          <p className="page-subtitle">
            {signals.length} posts from {uniqueSources} sources
          </p>
          {statusText && <p className="page-status">{statusText}</p>}
        </div>
        <button className="btn-primary" onClick={handleRefresh} disabled={refreshing}>
          <TrendingUp size={16} />
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </header>

      <div className="controls-bar">
        <div className="search-input">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search posts, sources, tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <div className="filter-label">
            <Filter size={14} />
            Source Type
          </div>
          <div className="filter-pills">
            {subCategories.map((cat) => (
              <button
                key={cat}
                className={`pill ${subCategory === cat ? "active" : ""}`}
                onClick={() => setSubCategory(cat)}
              >
                {cat === "all" ? "All" : cat}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-group">
          <div className="filter-label">
            <ArrowUpDown size={14} />
            Sort
          </div>
          <div className="filter-pills">
            {[
              { key: "recent", label: "Recent" },
              { key: "source", label: "Source" },
            ].map(({ key, label }) => (
              <button
                key={key}
                className={`pill ${sortBy === key ? "active" : ""}`}
                onClick={() => setSortBy(key as SortOption)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <Rss size={48} className="empty-icon" />
          <h3>No blog posts found</h3>
          <p>
            {search || subCategory !== "all"
              ? "Try adjusting your search or filters"
              : "Run the blog pipeline to fetch posts"}
          </p>
          {!search && subCategory === "all" && (
            <button className="btn-primary" onClick={handleRefresh} disabled={refreshing}>
              Fetch Posts
            </button>
          )}
        </div>
      ) : (
        <div className="signals-grid">
          {filtered.map((signal) => (
            <article key={signal.id} className="signal-card">
              <div className="signal-header">
                <div className="signal-meta">
                  <span className="pill category">{signal.tags[0] || "Tech Blogs"}</span>
                  <span className="pill source">{signal.source}</span>
                </div>
                <div className="signal-actions">
                  <button
                    className={`icon-btn ${signal.is_saved ? "saved" : ""} ${mutatingIds.has(signal.id) ? "mutating" : ""}`}
                    onClick={() => toggleSave(signal.id)}
                    title={signal.is_saved ? "Unsave" : "Save"}
                    disabled={mutatingIds.has(signal.id)}
                  >
                    <Bookmark size={16} />
                  </button>
                  <button
                    className={`icon-btn ${signal.is_hidden ? "hidden" : ""} ${mutatingIds.has(signal.id) ? "mutating" : ""}`}
                    onClick={() => toggleHide(signal.id)}
                    title={signal.is_hidden ? "Unhide" : "Hide"}
                    disabled={mutatingIds.has(signal.id)}
                  >
                    <EyeOff size={16} />
                  </button>
                </div>
              </div>

              <a href={signal.url} target="_blank" rel="noreferrer" className="signal-title">
                {signal.title}
              </a>

              <p className="signal-summary">{signal.summary}</p>

              {signal.tags.length > 1 && (
                <div className="signal-tags">
                  {signal.tags.slice(1, 5).map((tag) => (
                    <span key={tag} className="tag">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="signal-footer">
                <span className="signal-date">{timeAgo(new Date(signal.published_at))}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}

function formatStatusText(status: Record<string, unknown>): string {
  const parts: string[] = [];

  if (status.lastRefreshAt) {
    const ago = timeAgoStatus(new Date(status.lastRefreshAt as string));
    parts.push(`Last refreshed ${ago}`);
  }

  if (typeof status.postsFetched === "number") {
    parts.push(`${status.postsFetched} posts`);
  }

  if (typeof status.signalsDeleted === "number" && status.signalsDeleted > 0) {
    parts.push(`${status.signalsDeleted} cleaned`);
  }

  return parts.join(" · ");
}

function timeAgoStatus(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
