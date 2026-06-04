import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  const [githubResult, blogResult] = await Promise.allSettled([
    fetch(`${baseUrl}/api/github/refresh`, { method: "POST" }).then((r) => r.json()),
    fetch(`${baseUrl}/api/blogs/refresh`, { method: "POST" }).then((r) => r.json()),
  ]);

  return NextResponse.json({
    github: githubResult.status === "fulfilled" ? githubResult.value : { error: String(githubResult.reason) },
    blogs: blogResult.status === "fulfilled" ? blogResult.value : { error: String(blogResult.reason) },
  });
}
