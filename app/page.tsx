import {
  Activity,
  Bell,
  Bookmark,
  Boxes,
  Brain,
  Code2,
  ExternalLink,
  Github,
  LayoutDashboard,
  Library,
  RefreshCw,
  Search,
  Sparkles,
  Star,
} from "lucide-react";
import { dashboardSources, watchKeywords } from "@/lib/sources";
import { getSignals, hasSupabaseConfig } from "@/lib/supabase";

const navItems = [
  { label: "Today", count: 24, icon: LayoutDashboard, active: true },
  { label: "GitHub", count: 9, icon: Github },
  { label: "AI Tools", count: 7, icon: Brain },
  { label: "Models", count: 4, icon: Boxes },
  { label: "Design", count: 3, icon: Library },
  { label: "Saved", count: 12, icon: Bookmark },
];

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

export default async function Home() {
  const signals = await getSignals();
  const topSignals = signals.slice(0, 4);
  const totalGrowth = signals.reduce((sum, signal) => sum + (signal.growth ?? 0), 0);
  const bestScore = Math.max(...signals.map((signal) => signal.score));
  const categories = new Set(signals.map((signal) => signal.category)).size;

  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">S</div>
          <div>
            <h1 className="brand-title">Signal Desk</h1>
            <p className="brand-subtitle">Developer radar</p>
          </div>
        </div>

        <p className="nav-label">Views</p>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              className={`nav-item ${item.active ? "active" : ""}`}
              key={item.label}
              type="button"
            >
              <span className="nav-copy">
                <Icon size={16} />
                {item.label}
              </span>
              <span className="nav-count">{item.count}</span>
            </button>
          );
        })}

        <p className="nav-label">Watchlist</p>
        {watchKeywords.slice(0, 7).map((keyword) => (
          <button className="nav-item" key={keyword} type="button">
            <span className="nav-copy">
              <Search size={15} />
              {keyword}
            </span>
          </button>
        ))}
      </aside>

      <section className="main">
        <div className="topbar">
          <div>
            <p className="eyebrow">Tuesday, June 2 · Dark intelligence console</p>
            <h2 className="page-title">What should I know today?</h2>
          </div>
          <div className="actions">
            <button aria-label="Notifications" className="icon-button" type="button">
              <Bell size={18} />
            </button>
            <button aria-label="Refresh feed" className="icon-button" type="button">
              <RefreshCw size={18} />
            </button>
            <button className="primary-button" type="button">
              <Sparkles size={17} />
              Curate
            </button>
          </div>
        </div>

        <div className="stats-grid">
          <article className="stat">
            <p className="stat-label">Signals tracked</p>
            <p className="stat-value">{signals.length}</p>
            <p className="stat-note">Repos, releases, models, papers</p>
          </article>
          <article className="stat">
            <p className="stat-label">Star growth</p>
            <p className="stat-value">+{formatNumber(totalGrowth)}</p>
            <p className="stat-note">Across current feed</p>
          </article>
          <article className="stat">
            <p className="stat-label">Best relevance</p>
            <p className="stat-value">{bestScore}</p>
            <p className="stat-note">Keyword and freshness score</p>
          </article>
          <article className="stat">
            <p className="stat-label">Active categories</p>
            <p className="stat-value">{categories}</p>
            <p className="stat-note">Reddit intentionally skipped</p>
          </article>
        </div>

        <div className="content-grid">
          <section className="section">
            <div className="section-header">
              <h3 className="section-title">
                <Activity size={17} />
                Priority Feed
              </h3>
              <span className="section-meta">Ranked by freshness, growth, relevance</span>
            </div>

            <div className="feed">
              {signals.map((signal) => (
                <article className="signal-card" key={signal.id}>
                  <div>
                    <div className="signal-top">
                      {signal.score >= 90 ? <span className="pill hot">Hot</span> : null}
                      <span className="pill">{signal.category}</span>
                      <span className="pill">{signal.source}</span>
                    </div>
                    <a href={signal.url} rel="noreferrer" target="_blank">
                      <h3 className="signal-title">
                        {signal.title} <ExternalLink size={14} />
                      </h3>
                    </a>
                    <p className="signal-summary">{signal.summary}</p>
                    <p className="signal-summary">
                      <strong>Why it matters:</strong> {signal.why_it_matters}
                    </p>
                    <div className="signal-footer">
                      <span>{formatTime(signal.published_at)}</span>
                      {signal.tags.map((tag) => (
                        <span key={tag}>#{tag}</span>
                      ))}
                    </div>
                  </div>
                  <div className="metric-stack">
                    <div className="mini-metric">
                      <span className="mini-value">{formatNumber(signal.stars)}</span>
                      <span className="mini-label">stars</span>
                    </div>
                    <div className="mini-metric">
                      <span className="mini-value">+{formatNumber(signal.growth)}</span>
                      <span className="mini-label">growth</span>
                    </div>
                    <div className="mini-metric">
                      <span className="mini-value">{signal.score}</span>
                      <span className="mini-label">score</span>
                    </div>
                    <div className="mini-metric">
                      <span className="mini-value">
                        <Star size={15} />
                      </span>
                      <span className="mini-label">save</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <aside className="side-stack">
            <section className="section">
              <div className="section-header">
                <h3 className="section-title">
                  <Code2 size={17} />
                  Top Watch
                </h3>
                <span className="section-meta">Now</span>
              </div>
              <div className="compact-list">
                {topSignals.map((signal, index) => (
                  <a className="compact-row" href={signal.url} key={signal.id}>
                    <span className="rank">{index + 1}</span>
                    <span>
                      <p className="row-title">{signal.title}</p>
                      <p className="row-note">{signal.category}</p>
                    </span>
                    <span className="row-note">{signal.score}</span>
                  </a>
                ))}
              </div>
            </section>

            <section className="section">
              <div className="section-header">
                <h3 className="section-title">
                  <Library size={17} />
                  Sources
                </h3>
                <span className="section-meta">{dashboardSources.length}</span>
              </div>
              <div className="source-grid">
                {dashboardSources.map((source) => (
                  <a className="source-tile" href={source.url} key={source.name}>
                    <p className="source-name">{source.name}</p>
                    <p className="source-kind">{source.kind}</p>
                  </a>
                ))}
              </div>
            </section>

            <section className="db-status">
              <h3 className="section-title">
                <Boxes size={17} />
                Supabase
              </h3>
              <p>
                {hasSupabaseConfig
                  ? "Connected through environment configuration. The feed is reading from the Postgres signals table."
                  : "Add your Supabase URL and anon key to .env.local. Until then, this screen uses curated mock signals."}
              </p>
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}
