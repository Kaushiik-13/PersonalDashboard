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

    const validSignals = result.signals.filter((s) => s.external_id);
    const { data: existingSignals } = await supabaseAdmin
      .from("signals")
      .select("external_id, score, stars, previous_rank, first_seen_at")
      .in("external_id", validSignals.map((s) => s.external_id as string));

    const existingMap = new Map<string, { score: number | null; stars: number | null; previous_rank: number | null; first_seen_at: string | null }>();
    if (existingSignals) {
      for (const sig of existingSignals) {
        existingMap.set(sig.external_id, {
          score: sig.score,
          stars: sig.stars,
          previous_rank: sig.previous_rank,
          first_seen_at: sig.first_seen_at,
        });
      }
    }

    const ranked = validSignals
      .sort((a, b) => b.score - a.score)
      .map((signal, index) => {
        const existing = existingMap.get(signal.external_id as string);
        const isNew = !existing;
        const currentRank = index + 1;

        return {
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
          first_seen_at: isNew ? now : existing?.first_seen_at,
          previous_score: existing?.score ?? signal.score,
          previous_stars: existing?.stars ?? signal.stars,
          previous_rank: existing?.previous_rank ?? currentRank,
          rank_change: existing ? (existing.previous_rank ?? currentRank) - currentRank : 0,
          star_delta: existing ? (signal.stars ?? 0) - (existing.stars ?? 0) : (signal.stars ?? 0),
          score_delta: existing ? signal.score - (existing.score ?? 0) : signal.score,
        };
      });

    const { error: upsertError } = await supabaseAdmin
      .from("signals")
      .upsert(ranked, { onConflict: "signals_provider_external_id_unique" });

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
      signalsFetched: validSignals.length,
      signalsSaved: ranked.length,
      signalsDeleted: deletedCount ?? 0,
    };

    await supabaseAdmin
      .from("pipeline_status")
      .upsert({ key: "github_refresh", value: status, updated_at: now });

    return NextResponse.json({
      ...result,
      signals: validSignals,
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
