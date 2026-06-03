import { getSignals, getPipelineStatus } from "@/lib/supabase";
import { SignalsClient } from "./signals-client";
import { Logo } from "@/components/logo";

export const dynamic = "force-dynamic";

export default async function DevSignalsPage() {
  const [signals, status] = await Promise.all([
    getSignals(100),
    getPipelineStatus(),
  ]);

  return (
    <main className="shell">
      <Logo />
      <section className="main">
        <div className="page-container">
          <SignalsClient initialSignals={signals} pipelineStatus={status} />
        </div>
      </section>
    </main>
  );
}
