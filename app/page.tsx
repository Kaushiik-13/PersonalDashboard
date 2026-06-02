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
  const topSignals = signals.slice(0, 3);
  const topSignal = signals[0];

  return (
    <main className="shell">
      <Sidebar />

      <section className="main">
        <div className="topbar">
          <div>
            <p className="eyebrow">Personal command center</p>
            <h2 className="page-title">Dashboard</h2>
          </div>
        </div>

        <section className="section dev-preview">
          <div className="section-header">
            <h3 className="section-title">
              <Code2 size={17} />
              Dev Signals Preview
            </h3>
            <span className="section-meta">
              {signals.length} signal{signals.length !== 1 ? "s" : ""} loaded
            </span>
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
            ) : (
              <article className="featured-signal empty-state">
                <div className="signal-top">
                  <span className="pill">GitHub</span>
                  <span className="pill">Waiting</span>
                </div>
                <h3 className="signal-title">No dev signals loaded yet</h3>
                <p className="signal-summary">
                  Run the GitHub pipeline endpoint or add rows to Supabase. Once
                  data is available, this preview will show the highest-ranked
                  repo signal here.
                </p>
              </article>
            )}

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
      </section>
    </main>
  );
}
