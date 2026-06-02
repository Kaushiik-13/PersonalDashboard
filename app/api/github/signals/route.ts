import { NextResponse } from "next/server";
import { fetchGitHubSignals } from "@/lib/github";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await fetchGitHubSignals();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to fetch GitHub signals",
      },
      { status: 502 },
    );
  }
}
