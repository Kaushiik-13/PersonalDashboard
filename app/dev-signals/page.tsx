import { Sidebar } from "@/components/sidebar";
import { getSignals, getPipelineStatus } from "@/lib/supabase";
import { SignalsClient } from "./signals-client";

export const dynamic = "force-dynamic";

export default async function DevSignalsPage() {
  const [signals, status] = await Promise.all([
    getSignals(100),
    getPipelineStatus(),
  ]);

  return (
    <main className="shell">
      <Sidebar />

      <section className="main">
        <div className="page-container">
          <SignalsClient initialSignals={signals} pipelineStatus={status} />
        </div>
      </section>
    </main>
  );
}
