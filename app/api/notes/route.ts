import { getNotesSupabaseClient, DEFAULT_NOTE_BLOCKS } from "@/lib/notes";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const supabase = getNotesSupabaseClient();

    if (!supabase) {
      return Response.json({ error: "Supabase not configured" }, { status: 500 });
    }

    const now = new Date().toISOString();
    const note = {
      title: "Untitled",
      blocks: DEFAULT_NOTE_BLOCKS,
      tags: [],
      is_pinned: false,
      is_archived: false,
      created_at: now,
      updated_at: now,
    };

    const { data, error } = await supabase
      .from("notes")
      .insert(note)
      .select("*")
      .single();

    if (error) {
      console.error("Unable to create note", error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true, note: data });
  } catch (error) {
    console.error("Note create error:", error);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
