import { NextResponse } from "next/server";
import { fetchGitHubSignals } from "@/lib/github";
import { hasSupabaseAdminConfig, supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const result = await fetchGitHubSignals(20);

    if (!hasSupabaseAdminConfig || !supabaseAdmin) {
      return NextResponse.json({
        ...result,
        persisted: false,
        message:
          "Fetched GitHub signals. Add SUPABASE_SERVICE_ROLE_KEY to .env.local to save them to Supabase.",
      });
    }

    const rows = result.signals.map((signal) => ({
      external_id: signal.external_id,
      provider: signal.provider,
      title: signal.title,
      source: signal.source,
      category: signal.category,
      url: signal.url,
      summary: signal.summary,
      why_it_matters: signal.why_it_matters,
      stars: signal.stars,
      growth: signal.growth,
      score: signal.score,
      tags: signal.tags,
      published_at: signal.published_at,
    }));

    const { error } = await supabaseAdmin
      .from("signals")
      .upsert(rows, { onConflict: "provider,external_id" });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      ...result,
      persisted: true,
      saved: rows.length,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to refresh GitHub signals",
      },
      { status: 502 },
    );
  }
}
