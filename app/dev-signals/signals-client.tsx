"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpDown,
  Bookmark,
  EyeOff,
  Filter,
  Github,
  Search,
  Star,
  TrendingUp,
} from "lucide-react";
import type { Signal } from "@/lib/supabase";

type SortOption = "score" | "stars" | "updated";
type FilterOption = "all" | "AI Tools" | "Models" | "Infrastructure" | "Design" | "Dev Tools";

interface SignalsClientProps {
  initialSignals: Signal[];
  pipelineStatus: Record<string, unknown> | null;
}

export function SignalsClient({ initialSignals, pipelineStatus }: SignalsClientProps) {
  const router = useRouter();
  const [signals] = useState<Signal[]>(initialSignals);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("score");
  const [filter, setFilter] = useState<FilterOption>("all");
  const [mutatingIds, setMutatingIds] = useState<Set<string>>(new Set());

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await fetch("/api/github/refresh", { method: "POST" });
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

  const filtered = signals
    .filter((s) => {
      if (filter === "all") return true;
      return s.category === filter;
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
      if (sortBy === "score") return b.score - a.score;
      if (sortBy === "stars") return (b.stars || 0) - (a.stars || 0);
      return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
    });

  const categories: FilterOption[] = ["all", "AI Tools", "Models", "Infrastructure", "Design", "Dev Tools"];

  const statusText = pipelineStatus
    ? formatStatusText(pipelineStatus)
    : null;

  return (
    <>
      <header className="page-header">
        <div>
          <h1 className="page-title">Dev Signals</h1>
          <p className="page-subtitle">
            {signals.length} repositories tracked from GitHub
          </p>
          {statusText && (
            <p className="page-status">{statusText}</p>
          )}
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
            placeholder="Search repos, tags, descriptions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <div className="filter-label">
            <Filter size={14} />
            Category
          </div>
          <div className="filter-pills">
            {categories.map((cat) => (
              <button
                key={cat}
                className={`pill ${filter === cat ? "active" : ""}`}
                onClick={() => setFilter(cat)}
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
              { key: "score", label: "Score" },
              { key: "stars", label: "Stars" },
              { key: "updated", label: "Updated" },
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
          <Github size={48} className="empty-icon" />
          <h3>No signals found</h3>
          <p>
            {search || filter !== "all"
              ? "Try adjusting your search or filters"
              : "Run the GitHub pipeline to fetch signals"}
          </p>
          {!search && filter === "all" && (
            <button className="btn-primary" onClick={handleRefresh} disabled={refreshing}>
              Fetch Signals
            </button>
          )}
        </div>
      ) : (
        <div className="signals-grid">
          {filtered.map((signal) => (
            <article key={signal.id} className="signal-card">
              <div className="signal-header">
                <div className="signal-meta">
                  <span className="pill category">{signal.category}</span>
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

              {signal.tags.length > 0 && (
                <div className="signal-tags">
                  {signal.tags.slice(0, 4).map((tag) => (
                    <span key={tag} className="tag">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="signal-footer">
                <div className="signal-stats">
                  <span className="stat">
                    <Star size={14} />
                    {signal.stars?.toLocaleString() || 0}
                  </span>
                  <span className="stat score">
                    Score: <strong>{signal.score}</strong>
                  </span>
                </div>
                <span className="signal-date">
                  {new Date(signal.published_at).toLocaleDateString("en", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
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
    const ago = timeAgo(new Date(status.lastRefreshAt as string));
    parts.push(`Last refreshed ${ago}`);
  }

  if (typeof status.signalsSaved === "number") {
    parts.push(`${status.signalsSaved} saved`);
  }

  if (typeof status.signalsDeleted === "number" && status.signalsDeleted > 0) {
    parts.push(`${status.signalsDeleted} cleaned`);
  }

  return parts.join(" · ");
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
