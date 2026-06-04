import { getBlogSignals, getBlogPipelineStatus } from "@/lib/supabase";
import { BlogsClient } from "./blogs-client";
import { Logo } from "@/components/logo";

export const dynamic = "force-dynamic";

export default async function BlogsPage() {
  const [signals, status] = await Promise.all([
    getBlogSignals(),
    getBlogPipelineStatus(),
  ]);

  return (
    <main className="shell">
      <Logo />
      <section className="main">
        <div className="page-container">
          <BlogsClient initialSignals={signals} pipelineStatus={status} />
        </div>
      </section>
    </main>
  );
}
