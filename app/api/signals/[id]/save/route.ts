import { NextResponse } from "next/server";
import { hasSupabaseAdminConfig, supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!hasSupabaseAdminConfig || !supabaseAdmin) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  const { id } = await params;

  const { data, error } = await supabaseAdmin
    .from("signals")
    .select("is_saved")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Signal not found" }, { status: 404 });
  }

  const { error: updateError } = await supabaseAdmin
    .from("signals")
    .update({ is_saved: !data.is_saved })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ is_saved: !data.is_saved });
}
