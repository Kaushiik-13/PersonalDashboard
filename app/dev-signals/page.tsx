"use client";

import { useState, useEffect } from "react";
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
import { Sidebar } from "@/components/sidebar";
import type { Signal } from "@/lib/supabase";

type SortOption = "score" | "stars" | "updated";
type FilterOption = "all" | "AI Tools" | "Models" | "Design" | "Dev Tools";

export default function DevSignalsPage() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("score");
  const [filter, setFilter] = useState<FilterOption>("all");
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchSignals();
  }, []);

  async function fetchSignals() {
    setLoading(true);
    try {
      const res = await fetch("/api/github/signals");
      const data = await res.json();
      setSignals(data.signals || []);
    } catch (error) {
      console.error("Failed to fetch signals", error);
    } finally {
      setLoading(false);
    }
  }

  function toggleSave(id: string) {
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleHide(id: string) {
    setHiddenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const filtered = signals
    .filter((s) => !hiddenIds.has(s.id))
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

  const categories: FilterOption[] = ["all", "AI Tools", "Models", "Design", "Dev Tools"];

  return (
    <main className="shell">
      <Sidebar />

      <section className="main">
        <div className="page-container">
          <header className="page-header">
            <div>
              <h1 className="page-title">Dev Signals</h1>
              <p className="page-subtitle">
                {signals.length} repositories tracked from GitHub
              </p>
            </div>
            <button className="btn-primary" onClick={fetchSignals} disabled={loading}>
              <TrendingUp size={16} />
              {loading ? "Refreshing..." : "Refresh"}
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

          {loading ? (
            <div className="skeleton-grid">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton-card" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <Github size={48} className="empty-icon" />
              <h3>No signals found</h3>
              <p>
                {search || filter !== "all"
                  ? "Try adjusting your search or filters"
                  : "Run the GitHub pipeline to fetch signals"}
              </p>
              {!search && filter === "all" && (
                <button className="btn-primary" onClick={fetchSignals}>
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
                        className={`icon-btn ${savedIds.has(signal.id) ? "saved" : ""}`}
                        onClick={() => toggleSave(signal.id)}
                        title="Save"
                      >
                        <Bookmark size={16} />
                      </button>
                      <button
                        className={`icon-btn ${hiddenIds.has(signal.id) ? "hidden" : ""}`}
                        onClick={() => toggleHide(signal.id)}
                        title="Hide"
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
        </div>
      </section>
    </main>
  );
}
