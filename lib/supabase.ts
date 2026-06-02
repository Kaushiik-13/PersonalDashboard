import { createClient } from "@supabase/supabase-js";

export type Signal = {
  id: string;
  title: string;
  source: string;
  category: "GitHub" | "AI Tools" | "Models" | "Design" | "Dev Tools";
  url: string;
  summary: string;
  why_it_matters: string;
  stars?: number;
  growth?: number;
  score: number;
  tags: string[];
  published_at: string;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const hasSupabaseConfig = Boolean(supabaseUrl && supabasePublishableKey);

export const supabase = hasSupabaseConfig
  ? createClient(supabaseUrl as string, supabasePublishableKey as string)
  : null;

export async function getSignals() {
  if (!supabase) {
    return mockSignals;
  }

  const { data, error } = await supabase
    .from("signals")
    .select("*")
    .order("score", { ascending: false })
    .limit(24);

  if (error) {
    console.error("Unable to read signals from Supabase", error);
    return mockSignals;
  }

  return data as Signal[];
}

export const mockSignals: Signal[] = [
  {
    id: "1",
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
