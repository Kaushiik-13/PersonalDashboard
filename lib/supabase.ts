import { createClient } from "@supabase/supabase-js";
import { fetchGitHubSignals } from "@/lib/github";

export type Signal = {
  id: string;
  external_id?: string;
  provider?: string;
  title: string;
  source: string;
  category: "AI Tools" | "Models" | "Infrastructure" | "Design" | "Dev Tools" | "Tech Blogs" | "Bookmark";
  url: string;
  summary: string;
  why_it_matters: string;
  stars?: number;
  growth?: number;
  score: number;
  tags: string[];
  published_at: string;
  is_saved?: boolean;
  is_hidden?: boolean;
  last_seen_at?: string;
  previous_score?: number | null;
  previous_stars?: number | null;
  previous_rank?: number | null;
  first_seen_at?: string | null;
  rank_change?: number;
  star_delta?: number;
  score_delta?: number;
  read_status?: string;
};

export type NoteBlockType = "paragraph" | "heading" | "bullet" | "todo" | "quote" | "code" | "divider";

export type NoteBlock = {
  id: string;
  type: NoteBlockType;
  text: string;
  checked?: boolean;
};

export type Note = {
  id: string;
  title: string;
  blocks: NoteBlock[];
  tags: string[];
  is_pinned: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

export const hasSupabaseConfig = Boolean(supabaseUrl && supabasePublishableKey);

export const supabase = hasSupabaseConfig
  ? createClient(supabaseUrl as string, supabasePublishableKey as string)
  : null;

const supabaseServer = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl as string, supabaseServiceKey as string, {
      auth: {
        persistSession: false,
      },
    })
  : supabase;

export async function getSignals(limit = 24, includeHidden = false) {
  if (!supabase) {
    return getFallbackSignals(limit);
  }

  let query = supabase
    .from("signals")
    .select("*")
    .order("score", { ascending: false });

  if (!includeHidden) {
    query = query.eq("is_hidden", false);
  }

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Unable to read signals from Supabase", error);
    return getFallbackSignals(limit);
  }

  if (!data?.length) {
    return getFallbackSignals(limit);
  }

  return data as Signal[];
}

export async function getPipelineStatus() {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("pipeline_status")
    .select("value")
    .eq("key", "github_refresh")
    .single();

  if (error || !data) {
    return null;
  }

  return data.value as Record<string, unknown>;
}

export async function getTrendingSignals(limit = 10) {
  if (!supabase) {
    return [];
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("signals")
    .select("*")
    .eq("is_hidden", false)
    .or(`rank_change.neq.0,first_seen_at.gte.${sevenDaysAgo}`)
    .order("rank_change", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Unable to read trending signals", error);
    return [];
  }

  return (data as Signal[]) ?? [];
}

export async function getBlogSignals(includeHidden = false) {
  if (!supabase) {
    return [];
  }

  let query = supabase
    .from("signals")
    .select("*")
    .eq("provider", "blog")
    .order("published_at", { ascending: false });

  if (!includeHidden) {
    query = query.eq("is_hidden", false);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Unable to read blog signals", error);
    return [];
  }

  return (data as Signal[]) ?? [];
}

export async function getBlogPipelineStatus() {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("pipeline_status")
    .select("value")
    .eq("key", "blog_refresh")
    .single();

  if (error || !data) {
    return null;
  }

  return data.value as Record<string, unknown>;
}

export async function getBookmarkSignals(status?: string, limit = 50) {
  if (!supabase) {
    return [];
  }

  let query = supabase
    .from("signals")
    .select("*")
    .eq("provider", "bookmark")
    .eq("is_hidden", false)
    .order("published_at", { ascending: false });

  if (status) {
    query = query.eq("read_status", status);
  }

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Unable to read bookmark signals", error);
    return [];
  }

  return (data as Signal[]) ?? [];
}

export async function getRecentBookmarks(limit = 5) {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("signals")
    .select("*")
    .eq("provider", "bookmark")
    .eq("is_hidden", false)
    .eq("read_status", "unread")
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Unable to read recent bookmarks", error);
    return [];
  }

  return (data as Signal[]) ?? [];
}

export async function getNotes(includeArchived = false, limit = 100) {
  if (!supabaseServer) {
    return [];
  }

  let query = supabaseServer
    .from("notes")
    .select("*")
    .order("is_pinned", { ascending: false })
    .order("updated_at", { ascending: false });

  if (!includeArchived) {
    query = query.eq("is_archived", false);
  }

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Unable to read notes", error);
    return [];
  }

  return (data as Note[]) ?? [];
}

export async function getNote(id: string) {
  if (!supabaseServer) {
    return null;
  }

  const { data, error } = await supabaseServer
    .from("notes")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Unable to read note", error);
    return null;
  }

  return data as Note;
}

export async function getRecentNotes(limit = 5) {
  if (!supabaseServer) {
    return [];
  }

  const { data, error } = await supabaseServer
    .from("notes")
    .select("*")
    .eq("is_archived", false)
    .order("is_pinned", { ascending: false })
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Unable to read recent notes", error);
    return [];
  }

  return (data as Note[]) ?? [];
}

async function getFallbackSignals(limit = 24) {
  try {
    const result = await fetchGitHubSignals(limit);
    return result.signals;
  } catch (error) {
    console.error("Unable to fetch GitHub fallback signals", error);
    return mockSignals;
  }
}

export const mockSignals: Signal[] = [
  {
    id: "1",
    external_id: "mock-1",
    provider: "mock",
    title: "Claude Code workflow monitor",
    source: "GitHub Trending",
    category: "AI Tools",
    url: "https://github.com",
    summary:
      "A small terminal dashboard for tracking coding-agent usage, session limits, and command history across development tasks.",
    why_it_matters:
      "Useful if you rely on agentic coding tools and want visibility before a session hits a limit.",
    stars: 1240,
    growth: 318,
    score: 94,
    tags: ["claude-code", "cli", "developer-productivity"],
    published_at: "2026-06-02T06:30:00.000Z",
  },
  {
    id: "2",
    external_id: "mock-2",
    provider: "mock",
    title: "LLM Council for code review routing",
    source: "Hacker News",
    category: "Dev Tools",
    url: "https://news.ycombinator.com",
    summary:
      "A multi-model review layer that asks several coding models to inspect risky changes and merges the strongest findings.",
    why_it_matters:
      "Good pattern for high-value pull requests where one model may miss subtle behavior regressions.",
    stars: 860,
    growth: 201,
    score: 89,
    tags: ["llm", "code-review", "agents"],
    published_at: "2026-06-02T05:00:00.000Z",
  },
  {
    id: "3",
    external_id: "mock-3",
    provider: "mock",
    title: "Open source model optimized for local coding",
    source: "Hugging Face",
    category: "Models",
    url: "https://huggingface.co/models",
    summary:
      "A compact coding model focused on repo navigation, shell command planning, and TypeScript-heavy codebases.",
    why_it_matters:
      "Promising for private local experiments where hosted APIs are not desirable.",
    stars: 640,
    growth: 145,
    score: 83,
    tags: ["local-llm", "coding-model", "typescript"],
    published_at: "2026-06-01T18:15:00.000Z",
  },
  {
    id: "4",
    external_id: "mock-4",
    provider: "mock",
    title: "Design system primitives for dense SaaS dashboards",
    source: "GitHub Search",
    category: "Design",
    url: "https://github.com",
    summary:
      "A React component kit focused on tables, filters, command palettes, data cards, and compact operational workflows.",
    why_it_matters:
      "Matches the kind of interface this dashboard needs: low-noise, scannable, and built for repeated use.",
    stars: 2110,
    growth: 96,
    score: 78,
    tags: ["react", "design-system", "dashboard"],
    published_at: "2026-06-01T12:20:00.000Z",
  },
];
