import { NextRequest } from "next/server";
import { getNotesSupabaseClient } from "@/lib/notes";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = getNotesSupabaseClient();

    if (!supabase) {
      return Response.json({ error: "Supabase not configured" }, { status: 500 });
    }

    const { error } = await supabase
      .from("notes")
      .update({ is_archived: true, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      console.error("Unable to archive note", error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Note archive error:", error);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
