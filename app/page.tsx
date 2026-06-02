import {
  Bell,
  Bookmark,
  Boxes,
  Brain,
  CalendarDays,
  CheckCircle2,
  Code2,
  ExternalLink,
  Github,
  LayoutDashboard,
  Library,
  Newspaper,
  RefreshCw,
  Search,
  Sparkles,
  Star,
  Wallet,
} from "lucide-react";
import { dashboardSources, watchKeywords } from "@/lib/sources";
import { getSignals, hasSupabaseConfig } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const navItems = [
  { label: "Dashboard", count: 8, icon: LayoutDashboard, active: true },
  { label: "Dev Signals", count: 9, icon: Github },
  { label: "AI Tools", count: 7, icon: Brain },
  { label: "Calendar", count: 3, icon: CalendarDays },
  { label: "Tasks", count: 5, icon: CheckCircle2 },
  { label: "Notes", count: 4, icon: Library },
  { label: "Saved", count: 12, icon: Bookmark },
];

const quickModules = [
  {
    title: "Dev Signals",
    eyebrow: "Trending repos and AI tooling",
    value: "4 new",
    note: "Open the tab for details",
    icon: Github,
  },
  {
    title: "Tasks",
    eyebrow: "Personal priorities",
    value: "5 open",
    note: "2 planned for today",
    icon: CheckCircle2,
  },
  {
    title: "Calendar",
    eyebrow: "Meetings and reminders",
    value: "3 events",
    note: "Next block this afternoon",
    icon: CalendarDays,
  },
  {
    title: "Finance",
    eyebrow: "Spending and watchlist",
    value: "Quiet",
    note: "No urgent alerts",
    icon: Wallet,
  },
  {
    title: "Reading",
    eyebrow: "Articles and saved links",
    value: "6 saved",
    note: "Development and design queue",
    icon: Newspaper,
  },
  {
    title: "AI Tools",
    eyebrow: "Claude, Codex, models",
    value: "2 updates",
    note: "Filtered by watchlist",
    icon: Sparkles,
  },
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
  const topSignals = signals.slice(0, 3);
  const topSignal = signals[0];
  const bestScore = Math.max(...signals.map((signal) => signal.score));

  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">S</div>
          <div>
            <h1 className="brand-title">Signal Desk</h1>
            <p className="brand-subtitle">Personal dashboard</p>
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
        {watchKeywords.slice(0, 6).map((keyword) => (
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
            <p className="eyebrow">Tuesday, June 2 - Personal command center</p>
            <h2 className="page-title">Dashboard</h2>
          </div>
          <div className="actions">
            <button aria-label="Notifications" className="icon-button" type="button">
              <Bell size={18} />
            </button>
            <button aria-label="Refresh dashboard" className="icon-button" type="button">
              <RefreshCw size={18} />
            </button>
            <button className="primary-button" type="button">
              <Sparkles size={17} />
              Curate
            </button>
          </div>
        </div>

        <section className="hero-strip">
          <div>
            <p className="hero-label">Quick Access</p>
            <h3>Everything important, one glance first.</h3>
          </div>
          <div className="hero-score">
            <span>{bestScore}</span>
            <small>top signal</small>
          </div>
        </section>

        <section className="quick-grid">
          {quickModules.map((module) => {
            const Icon = module.icon;
            return (
              <article className="quick-card" key={module.title}>
                <div className="quick-icon">
                  <Icon size={18} />
                </div>
                <p className="quick-eyebrow">{module.eyebrow}</p>
                <h3>{module.title}</h3>
                <div className="quick-bottom">
                  <strong>{module.value}</strong>
                  <span>{module.note}</span>
                </div>
              </article>
            );
          })}
        </section>

        <div className="overview-grid">
          <section className="section dev-preview">
            <div className="section-header">
              <h3 className="section-title">
                <Code2 size={17} />
                Dev Signals Preview
              </h3>
              <span className="section-meta">Details live in its own tab</span>
            </div>

            <div className="preview-body">
              {topSignal ? (
                <article className="featured-signal">
                  <div className="signal-top">
                    <span className="pill hot">Top</span>
                    <span className="pill">{topSignal.category}</span>
                    <span className="pill">{topSignal.source}</span>
                  </div>
                  <a href={topSignal.url} rel="noreferrer" target="_blank">
                    <h3 className="signal-title">
                      {topSignal.title} <ExternalLink size={14} />
                    </h3>
                  </a>
                  <p className="signal-summary">{topSignal.summary}</p>
                  <div className="signal-footer">
                    <span>{formatTime(topSignal.published_at)}</span>
                    <span>{formatNumber(topSignal.stars)} stars</span>
                    <span>score {topSignal.score}</span>
                  </div>
                </article>
              ) : null}

              <div className="compact-list">
                {topSignals.slice(1).map((signal, index) => (
                  <a className="compact-row" href={signal.url} key={signal.id}>
                    <span className="rank">{index + 2}</span>
                    <span>
                      <p className="row-title">{signal.title}</p>
                      <p className="row-note">{signal.category}</p>
                    </span>
                    <span className="row-note">{signal.score}</span>
                  </a>
                ))}
              </div>
            </div>
          </section>

          <aside className="side-stack">
            <section className="section">
              <div className="section-header">
                <h3 className="section-title">
                  <Star size={17} />
                  Today Focus
                </h3>
                <span className="section-meta">Quick list</span>
              </div>
              <div className="compact-list">
                {[
                  "Review dashboard modules",
                  "Connect real source fetchers",
                  "Create saved items view",
                ].map((item, index) => (
                  <div className="compact-row" key={item}>
                    <span className="rank">{index + 1}</span>
                    <span>
                      <p className="row-title">{item}</p>
                      <p className="row-note">Personal dashboard</p>
                    </span>
                    <span className="row-note">todo</span>
                  </div>
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
                {dashboardSources.slice(0, 4).map((source) => (
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
                  ? "Connected through environment configuration. Once the table has rows, this dashboard can read real modules from Supabase."
                  : "Add your Supabase URL and publishable key to .env.local. Until then, this screen uses curated mock data."}
              </p>
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}
