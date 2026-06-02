import { NextResponse } from "next/server";
import { fetchGitHubSignals } from "@/lib/github";

export const dynamic = "force-dynamic";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "object" && error !== null) {
    return JSON.stringify(error);
  }

  return "Unable to fetch GitHub signals";
}

export async function GET() {
  try {
    const result = await fetchGitHubSignals();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: getErrorMessage(error),
      },
      { status: 502 },
    );
  }
}
