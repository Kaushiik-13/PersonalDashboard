import { NextRequest } from "next/server";
import { getNotesSupabaseClient, normalizeBlocks, normalizeTags } from "@/lib/notes";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const supabase = getNotesSupabaseClient();

    if (!supabase) {
      return Response.json({ error: "Supabase not configured" }, { status: 500 });
    }

    const update: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if ("title" in body) {
      update.title = typeof body.title === "string" && body.title.trim() ? body.title.trim() : "Untitled";
    }

    if ("blocks" in body) {
      update.blocks = normalizeBlocks(body.blocks);
    }

    if ("tags" in body) {
      update.tags = normalizeTags(body.tags);
    }

    if ("is_pinned" in body) {
      update.is_pinned = Boolean(body.is_pinned);
    }

    if ("is_archived" in body) {
      update.is_archived = Boolean(body.is_archived);
    }

    const { data, error } = await supabase
      .from("notes")
      .update(update)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      console.error("Unable to update note", error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true, note: data });
  } catch (error) {
    console.error("Note update error:", error);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
