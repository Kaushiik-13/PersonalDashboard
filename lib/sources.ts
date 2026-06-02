export type DashboardSource = {
  name: string;
  kind: "Repository" | "Release" | "Model" | "Article" | "Paper" | "Product";
  url: string;
};

export const dashboardSources: DashboardSource[] = [
  {
    name: "GitHub Trending",
    kind: "Repository",
    url: "https://github.com/trending",
  },
  {
    name: "GitHub Search",
    kind: "Repository",
    url: "https://docs.github.com/en/rest/search/search",
  },
  {
    name: "Hacker News",
    kind: "Article",
    url: "https://hn.algolia.com/api",
  },
  {
    name: "Hugging Face",
    kind: "Model",
    url: "https://huggingface.co/models",
  },
  {
    name: "arXiv",
    kind: "Paper",
    url: "https://export.arxiv.org/api/query",
  },
  {
    name: "Product Hunt",
    kind: "Product",
    url: "https://www.producthunt.com",
  },
  {
    name: "OpenAI",
    kind: "Release",
    url: "https://openai.com/news",
  },
  {
    name: "Anthropic",
    kind: "Release",
    url: "https://www.anthropic.com/news",
  },
];

export const watchKeywords = [
  "claude code",
  "mcp",
  "agent framework",
  "open source llm",
  "local llm",
  "developer productivity",
  "ai coding assistant",
  "design system",
  "next.js",
  "typescript",
];
