import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { detectSourceType, fetchBookmarkMetadata, getSourceLabel } from "@/lib/bookmarks";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const url = body.url;

    if (!url || typeof url !== "string") {
      return new Response(JSON.stringify({ error: "URL is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const sourceType = detectSourceType(url);
    const source = getSourceLabel(sourceType);

    const metadata = await fetchBookmarkMetadata(url);
    const title = metadata.title || url;
    const summary = metadata.description || "No description available";
    const image = metadata.image || null;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return new Response(JSON.stringify({ error: "Supabase not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const externalId = `bookmark:${url}`;
    const now = new Date().toISOString();

    const bookmark = {
      provider: "bookmark",
      external_id: externalId,
      title,
      source,
      category: "Bookmark",
      url,
      summary,
      why_it_matters: "",
      score: 0,
      tags: sourceType !== "generic" ? [sourceType] : [],
      published_at: now,
      last_seen_at: now,
      is_hidden: false,
      is_saved: false,
      read_status: "unread",
    };

    const { data, error } = await supabase
      .from("signals")
      .upsert(bookmark, { onConflict: "provider,external_id" });

    if (error) {
      console.error("Supabase error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        bookmark: {
          ...bookmark,
          image,
          source_type: sourceType,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Bookmark add error:", error);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
