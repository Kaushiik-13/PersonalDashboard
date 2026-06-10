import { NextResponse } from "next/server";
import { fetchAllBlogPosts, mapPostToSignal } from "@/lib/blogs";
import { hasSupabaseAdminConfig, supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const now = new Date().toISOString();
    const allPosts = await fetchAllBlogPosts();
    const signals = allPosts.map(mapPostToSignal);

    if (!hasSupabaseAdminConfig || !supabaseAdmin) {
      return NextResponse.json({
        signals,
        persisted: false,
        message: "Add SUPABASE_SERVICE_ROLE_KEY to persist blog signals.",
      });
    }

    const rows = signals.map((signal) => ({
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
      first_seen_at: now,
    }));

    const { error: upsertError } = await supabaseAdmin
      .from("signals")
      .upsert(rows, { onConflict: "signals_provider_external_id_unique" });

    if (upsertError) {
      console.error("Blog upsert failed:", upsertError);
      return NextResponse.json(
        { error: upsertError.message, persisted: false },
        { status: 500 }
      );
    }

    const { count: deletedCount } = await supabaseAdmin
      .from("signals")
      .delete({ count: "exact" })
      .lt("last_seen_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .eq("provider", "blog")
      .eq("is_saved", false);

    const status = {
      lastRefreshAt: now,
      postsFetched: allPosts.length,
      signalsSaved: signals.length,
      signalsDeleted: deletedCount ?? 0,
    };

    await supabaseAdmin
      .from("pipeline_status")
      .upsert({ key: "blog_refresh", value: status, updated_at: now });

    return NextResponse.json({
      signals,
      persisted: true,
      ...status,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Blog refresh failed" },
      { status: 502 }
    );
  }
}
