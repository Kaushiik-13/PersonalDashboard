import { NextResponse } from "next/server";
import { fetchGitHubSignals } from "@/lib/github";
import { hasSupabaseAdminConfig, supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "object" && error !== null) {
    return JSON.stringify(error);
  }

  return "Unable to refresh GitHub signals";
}

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

    const now = new Date().toISOString();
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
      last_seen_at: now,
    }));

    const { error: upsertError } = await supabaseAdmin
      .from("signals")
      .upsert(rows, { onConflict: "provider,external_id" });

    if (upsertError) {
      throw upsertError;
    }

    const { count: deletedCount } = await supabaseAdmin
      .from("signals")
      .delete({ count: "exact" })
      .lt("last_seen_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .eq("is_saved", false);

    const status = {
      lastRefreshAt: now,
      signalsFetched: result.signals.length,
      signalsSaved: rows.length,
      signalsDeleted: deletedCount ?? 0,
    };

    await supabaseAdmin
      .from("pipeline_status")
      .upsert({ key: "github_refresh", value: status, updated_at: now });

    return NextResponse.json({
      ...result,
      persisted: true,
      ...status,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: getErrorMessage(error),
      },
      { status: 502 },
    );
  }
}
