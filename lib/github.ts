import type { Signal } from "@/lib/supabase";

type GitHubRepository = {
  id: number;
  full_name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  language: string | null;
  topics?: string[];
  created_at: string;
  updated_at: string;
  pushed_at: string;
  owner: {
    login: string;
  };
};

type GitHubSearchResponse = {
  items: GitHubRepository[];
};

export type GitHubPipelineResult = {
  signals: Signal[];
  fetchedAt: string;
  query: string;
};

const githubToken = process.env.GITHUB_TOKEN;

const watchTerms = [
  "ai",
  "llm",
  "agents",
  "mcp",
  "claude",
  "developer-tools",
  "coding-agent",
  "open-source-llm",
  "design-system",
  "typescript",
];

function daysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

function buildSearchQuery() {
  return `pushed:>${daysAgo(21)} stars:>50 archived:false`;
}

function getCategory(repo: GitHubRepository): Signal["category"] {
  const text = `${repo.full_name} ${repo.description ?? ""} ${(repo.topics ?? []).join(" ")}`.toLowerCase();

  if (text.includes("claude") || text.includes("llm") || text.includes("agent")) {
    return "AI Tools";
  }

  if (text.includes("model") || text.includes("ollama") || text.includes("inference")) {
    return "Models";
  }

  if (text.includes("design") || text.includes("ui") || text.includes("figma")) {
    return "Design";
  }

  return "Dev Tools";
}

function getScore(repo: GitHubRepository) {
  const updatedHoursAgo =
    (Date.now() - new Date(repo.pushed_at).getTime()) / (1000 * 60 * 60);
  const freshness = Math.max(0, 35 - Math.floor(updatedHoursAgo / 12));
  const popularity = Math.min(35, Math.floor(Math.log10(repo.stargazers_count + 1) * 10));
  const activity = Math.min(20, repo.forks_count + repo.open_issues_count);
  const topicBoost = Math.min(10, (repo.topics ?? []).length * 2);

  return Math.min(100, freshness + popularity + activity + topicBoost);
}

function summarizeRepo(repo: GitHubRepository) {
  if (repo.description) {
    return repo.description;
  }

  return `${repo.full_name} is an active GitHub repository matching your developer tooling watchlist.`;
}

function whyItMatters(repo: GitHubRepository) {
  const language = repo.language ? `${repo.language} ` : "";
  return `High activity ${language}project with ${repo.stargazers_count.toLocaleString()} stars and recent pushes. Worth scanning before it becomes another buried bookmark.`;
}

function mapRepoToSignal(repo: GitHubRepository): Signal {
  const topics = repo.topics?.slice(0, 5) ?? [];

  return {
    id: `github-${repo.id}`,
    external_id: String(repo.id),
    provider: "github",
    title: repo.full_name,
    source: "GitHub Search",
    category: getCategory(repo),
    url: repo.html_url,
    summary: summarizeRepo(repo),
    why_it_matters: whyItMatters(repo),
    stars: repo.stargazers_count,
    growth: repo.forks_count,
    score: getScore(repo),
    tags: [repo.language, ...topics].filter(Boolean) as string[],
    published_at: repo.pushed_at,
  };
}

export async function fetchGitHubSignals(limit = 12): Promise<GitHubPipelineResult> {
  const baseQuery = buildSearchQuery();
  const searches = watchTerms.slice(0, 8).map(async (term) => {
    const params = new URLSearchParams({
      q: `topic:${term} ${baseQuery}`,
      sort: "updated",
      order: "desc",
      per_page: "5",
    });

    const response = await fetch(`https://api.github.com/search/repositories?${params}`, {
      headers: {
        Accept: "application/vnd.github+json",
        ...(githubToken ? { Authorization: `Bearer ${githubToken}` } : {}),
        "X-GitHub-Api-Version": "2022-11-28",
      },
      next: { revalidate: 900 },
    });

    if (!response.ok) {
      throw new Error(`GitHub search failed for ${term}: ${response.status} ${response.statusText}`);
    }

    const payload = (await response.json()) as GitHubSearchResponse;
    return payload.items;
  });

  const reposById = new Map<number, GitHubRepository>();
  const searchResults = await Promise.all(searches);

  for (const repo of searchResults.flat()) {
    reposById.set(repo.id, repo);
  }

  const signals = [...reposById.values()]
    .map(mapRepoToSignal)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return {
    signals,
    fetchedAt: new Date().toISOString(),
    query: `${watchTerms.slice(0, 8).join(", ")} | ${baseQuery}`,
  };
}
