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
  "ai-agent",
  "mcp",
  "claude",
  "developer-tools",
  "coding-agent",
  "open-source-llm",
  "design-system",
  "typescript",
  "rag",
  "vector-database",
  "embeddings",
  "prompt-engineering",
  "inference",
  "fine-tuning",
  "multimodal",
  "local-llm",
  "ai-coding",
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

  // AI Tools first — catch agent/assistant/prompt tools before infrastructure keywords
  if (
    text.includes("genkit") ||
    text.includes("weknora") ||
    text.includes("agent") ||
    text.includes("assistant") ||
    text.includes("chatbot") ||
    text.includes("copilot") ||
    text.includes("prompt") ||
    text.includes("claude") ||
    text.includes("mcp") ||
    text.includes("workflow")
  ) {
    return "AI Tools";
  }

  // Models — fine-tuning, training, model weights
  if (
    text.includes("weights") ||
    text.includes("lora") ||
    text.includes("qlora") ||
    text.includes("fine-tun") ||
    text.includes("peft") ||
    text.includes("unsloth") ||
    text.includes("axolotl") ||
    text.includes("modelscope") ||
    text.includes("ms-swift") ||
    text.includes("open models") ||
    text.includes("training") ||
    text.includes("sft") ||
    text.includes("dpo") ||
    text.includes("grpo")
  ) {
    return "Models";
  }

  // Infrastructure — serving engines, vector DBs, data platforms
  if (
    text.includes("inference") ||
    text.includes("serving") ||
    text.includes("vllm") ||
    text.includes("sglang") ||
    text.includes("tgi") ||
    text.includes("tensorrt") ||
    text.includes("llama.cpp") ||
    text.includes("vector database") ||
    text.includes("vector search") ||
    text.includes("embedding store") ||
    text.includes("embedding database") ||
    text.includes("milvus") ||
    text.includes("qdrant") ||
    text.includes("weaviate") ||
    text.includes("chroma") ||
    text.includes("pinecone") ||
    text.includes("lakehouse") ||
    text.includes("data engine") ||
    text.includes("data warehouse") ||
    text.includes("kv cache") ||
    text.includes("compute engine") ||
    text.includes("distributed runtime") ||
    text.includes("openllm") ||
    text.includes("bentoml") ||
    text.includes("databend") ||
    text.includes("xinference") ||
    text.includes("lmcache") ||
    text.includes("ray-project") ||
    text.includes("ray ") ||
    text.includes(" lancedb") ||
    text.includes("lance-format") ||
    text.includes("openvino") ||
    text.includes("semble")
  ) {
    return "Infrastructure";
  }

  if (text.includes("design") || text.includes("ui") || text.includes("figma") || text.includes("component")) {
    return "Design";
  }

  return "Dev Tools";
}

function getScore(repo: GitHubRepository) {
  const updatedHoursAgo =
    (Date.now() - new Date(repo.pushed_at).getTime()) / (1000 * 60 * 60);
  const freshness = Math.max(0, 15 - Math.floor(updatedHoursAgo / 72));
  const popularity = Math.min(45, Math.floor(Math.log10(repo.stargazers_count + 1) * 9));
  const activity = Math.min(15, Math.floor(Math.log10(repo.forks_count + repo.open_issues_count + 1) * 6));
  const topicMatch = Math.min(10, watchTerms.filter((t) => repo.topics?.includes(t)).length * 2);

  return Math.min(100, freshness + popularity + activity + topicMatch);
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

export async function fetchGitHubSignals(limit = 24): Promise<GitHubPipelineResult> {
  const baseQuery = buildSearchQuery();
  const searches = watchTerms.map(async (term) => {
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
    query: `${watchTerms.join(", ")} | ${baseQuery}`,
  };
}
