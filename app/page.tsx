import { Code2, ExternalLink, Star, TrendingUp } from "lucide-react";
import Link from "next/link";
import { getSignals } from "@/lib/supabase";
import { Logo } from "@/components/logo";

export const dynamic = "force-dynamic";

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
  const topSignals = signals.slice(0, 5);
  const topSignal = signals[0];

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
        </div>

        <section className="insights-block">
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
      </section>
    </main>
  );
}
