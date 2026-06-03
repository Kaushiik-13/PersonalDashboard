import { Code2, ExternalLink } from "lucide-react";
import { getSignals } from "@/lib/supabase";
import { Sidebar } from "@/components/sidebar";

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
      <Sidebar />

      <section className="main">
        <div className="topbar">
          <div>
            <h2 className="greeting">
              Hi Kaushiik <span className="blink-dot" />
            </h2>
          </div>
        </div>

        <section className="insights-block">
          <div className="insights-header">
            <h3 className="insights-title">
              <Code2 size={16} />
              GitHub Repo Insights
            </h3>
            <span className="insights-count">
              {signals.length} signal{signals.length !== 1 ? "s" : ""} loaded
            </span>
          </div>

          <div className="insights-pills">
            <span className="insight-pill active">Top</span>
            <span className="insight-pill">{topSignal?.category || "AI Tools"}</span>
            <span className="insight-pill">GitHub Search</span>
          </div>

          {topSignal ? (
            <div className="insights-body">
              <div className="insights-featured">
                <a href={topSignal.url} rel="noreferrer" target="_blank" className="featured-link">
                  <h4 className="featured-title">
                    {topSignal.title} <ExternalLink size={13} />
                  </h4>
                </a>
                <p className="featured-summary">{topSignal.summary}</p>
                <div className="featured-footer">
                  <span>{formatTime(topSignal.published_at)}</span>
                  <span>{formatNumber(topSignal.stars)} stars</span>
                  <span>score {topSignal.score}</span>
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
                    <span className="ranked-score">{signal.score}</span>
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
