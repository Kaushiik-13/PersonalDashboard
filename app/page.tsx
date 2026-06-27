import { Briefcase, Code2, ExternalLink, Star, TrendingUp } from "lucide-react";
import Link from "next/link";
import { getRecentBookmarks, getRecentNotes, getSignals, getTrendingSignals } from "@/lib/supabase";
import { Logo } from "@/components/logo";
import { HomeBookmarksClient } from "./home-bookmarks-client";
import { HomeNotesClient } from "./home-notes-client";

export const dynamic = "force-dynamic";

function isWithin24h(dateStr: string | null | undefined) {
  if (!dateStr) return false;
  return Date.now() - new Date(dateStr).getTime() < 24 * 60 * 60 * 1000;
}

function formatCompact(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(value);
}

const formatNumber = (value?: number) => {
  if (!value) return "0";
  return Intl.NumberFormat("en", { notation: "compact" }).format(value);
};

const formatTime = (date: string) =>
  new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));

function generateMovementReason(signal: {
  first_seen_at?: string | null;
  rank_change?: number;
  star_delta?: number;
  score_delta?: number;
}): string {
  if (isWithin24h(signal.first_seen_at)) {
    return "First time in top signals";
  }
  const parts: string[] = [];
  if ((signal.rank_change ?? 0) > 5) parts.push(`Jumped ${signal.rank_change} spots`);
  if ((signal.star_delta ?? 0) > 500) parts.push(`+${formatCompact(signal.star_delta ?? 0)} stars`);
  if ((signal.score_delta ?? 0) > 10) parts.push(`Score +${signal.score_delta}`);
  return parts.join(" · ") || "Rank changed";
}

export default async function Home() {
  const [signals, trending, recentBookmarks, recentNotes] = await Promise.all([
    getSignals(),
    getTrendingSignals(5),
    getRecentBookmarks(5),
    getRecentNotes(5),
  ]);

  const topSignals = signals.slice(0, 5);
  const topSignal = signals[0];

  const movedSignals = trending
    .filter((s) => (s.rank_change ?? 0) !== 0 || isWithin24h(s.first_seen_at))
    .sort((a, b) => {
      const aIsNew = isWithin24h(a.first_seen_at);
      const bIsNew = isWithin24h(b.first_seen_at);
      if (aIsNew && !bIsNew) return -1;
      if (!aIsNew && bIsNew) return 1;
      return Math.abs(b.rank_change ?? 0) - Math.abs(a.rank_change ?? 0);
    })
    .slice(0, 5);

  return (
    <main className="shell">
      <Logo />
      <section className="main">

        <div className="topbar">
          <div>
            <h2 className="greeting">
              Hi Kaushiik <span className="blink-dot" />
            </h2>
            <p className="status-text">All systems operational</p>
          </div>
          <div className="actions">
            <a
              href="https://kct.neopat.ai/placements/drives?status=Ongoing"
              target="_blank"
              rel="noreferrer"
              className="icon-button"
              title="Placements"
            >
              <Briefcase size={18} />
            </a>
            <a
              href="https://www.workatastartup.com/conversations"
              target="_blank"
              rel="noreferrer"
              className="icon-button yc-button"
              title="YC Work at a Startup Conversations"
            >
              <span className="yc-logo" aria-hidden="true">Y</span>
              <span className="sr-only">YC Work at a Startup Conversations</span>
            </a>
          </div>
        </div>

        <div className="bento-grid">
          <section className="insights-block bento-main">
            <div className="insights-header">
              <div className="insights-header-left">
                <div className="insights-icon">
                  <Code2 size={16} />
                </div>
                <Link href="/dev-signals" className="insights-title-link">
                  <h3 className="insights-title">
                    GitHub Repo Insights
                    <ExternalLink size={14} className="insights-external" />
                  </h3>
                </Link>
              </div>
              <div className="insights-header-right">
                <span className="insights-badge">
                  <TrendingUp size={12} />
                  Live
                </span>
              </div>
            </div>

            <div className="insights-pills">
              <span className="insights-pills-label">Filters</span>
              <span className="insight-pill active">Top</span>
              <span className="insight-pill">{topSignal?.category || "AI Tools"}</span>
              <span className="insight-pill">GitHub Search</span>
            </div>

            {topSignal ? (
              <div className="insights-body">
                <div className="insights-featured">
                  <a href={topSignal.url} rel="noreferrer" target="_blank" className="featured-link">
                    <h4 className="featured-title">
                      {topSignal.title}
                      <ExternalLink size={14} className="external-icon" />
                    </h4>
                  </a>
                  <p className="featured-summary">{topSignal.summary}</p>
                  <div className="featured-footer">
                    <span className="footer-item">{formatTime(topSignal.published_at)}</span>
                    <span className="footer-divider" />
                    <span className="footer-item">
                      <Star size={13} />
                      {formatNumber(topSignal.stars)}
                    </span>
                    <span className="footer-divider" />
                    <span className="footer-item footer-score">
                      Score {topSignal.score}
                    </span>
                  </div>
                </div>

                <div className="insights-ranked">
                  {topSignals.slice(1).map((signal, index) => (
                    <a className="ranked-row" href={signal.url} key={signal.id}>
                      <span className="ranked-num">{index + 2}</span>
                      <div className="ranked-info">
                        <span className="ranked-title">{signal.title}</span>
                        <span className="ranked-cat">{signal.category}</span>
                      </div>
                      <div className="ranked-meta">
                        <span className="ranked-stars">
                          <Star size={11} />
                          {formatNumber(signal.stars)}
                        </span>
                        <span className="ranked-score">{signal.score}</span>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            ) : (
              <div className="insights-empty">
                <p>No signals loaded yet</p>
                <span>Run the GitHub pipeline to fetch signals</span>
              </div>
            )}
          </section>

          <HomeBookmarksClient bookmarks={recentBookmarks} />
          <HomeNotesClient notes={recentNotes} />
        </div>

        {movedSignals.length > 0 && (
          <section className="moved-block">
            <h3 className="moved-title">What moved today</h3>
            <div className="moved-list">
              {movedSignals.map((signal) => (
                <a key={signal.id} href={signal.url} className="moved-row" rel="noreferrer" target="_blank">
                  <div className="moved-indicator">
                    {isWithin24h(signal.first_seen_at) ? (
                      <span className="moved-badge-new">NEW</span>
                    ) : (signal.rank_change ?? 0) > 0 ? (
                      <span className="moved-badge-up">↑{signal.rank_change}</span>
                    ) : (
                      <span className="moved-badge-down">↓{Math.abs(signal.rank_change ?? 0)}</span>
                    )}
                  </div>
                  <div className="moved-info">
                    <span className="moved-name">{signal.title}</span>
                    <span className="moved-reason">{generateMovementReason(signal)}</span>
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}
      </section>
    </main>
  );
}
