import type { Signal } from "@/lib/supabase";
import { XMLParser } from "fast-xml-parser";
import * as cheerio from "cheerio";

type BlogSubCategory =
  | "Engineering"
  | "AI Labs"
  | "DevOps"
  | "Databases"
  | "Architecture"
  | "Incidents"
  | "Releases"
  | "Open Source"
  | "Security"
  | "Industry";

type BlogSource = {
  name: string;
  slug: string;
  category: BlogSubCategory;
  type: "rss" | "scrape";
  url: string;
};

type BlogPost = {
  title: string;
  url: string;
  summary: string;
  publishedAt: string;
  tags: string[];
  sourceName: string;
  sourceSlug: string;
  sourceCategory: BlogSubCategory;
};

const BLOG_SOURCES: BlogSource[] = [
  // Engineering Blogs
  { name: "Netflix Tech Blog", slug: "netflix-tech-blog", category: "Engineering", type: "rss", url: "https://netflixtechblog.com/feed" },
  { name: "Microsoft Engineering", slug: "microsoft-engineering", category: "Engineering", type: "rss", url: "https://devblogs.microsoft.com/engineering/feed/" },
  { name: "GitHub Engineering", slug: "github-engineering", category: "Engineering", type: "rss", url: "https://github.blog/feed/" },
  { name: "Cloudflare Blog", slug: "cloudflare-blog", category: "Engineering", type: "rss", url: "https://blog.cloudflare.com/rss/" },
  { name: "Uber Engineering", slug: "uber-engineering", category: "Engineering", type: "rss", url: "https://eng.uber.com/feed/" },
  { name: "Spotify Engineering", slug: "spotify-engineering", category: "Engineering", type: "rss", url: "https://engineering.atspotify.com/feed/" },
  { name: "LinkedIn Engineering", slug: "linkedin-engineering", category: "Engineering", type: "rss", url: "https://engineering.linkedin.com/blog/rss.xml" },
  { name: "Meta Engineering", slug: "meta-engineering", category: "Engineering", type: "rss", url: "https://engineering.fb.com/feed/" },
  { name: "DoorDash Engineering", slug: "doordash-engineering", category: "Engineering", type: "rss", url: "https://doordash.engineering/feed/" },
  { name: "Datadog Engineering", slug: "datadog-engineering", category: "Engineering", type: "scrape", url: "https://www.datadoghq.com/engineering/" },
  { name: "Atlassian Engineering", slug: "atlassian-engineering", category: "Engineering", type: "scrape", url: "https://www.atlassian.com/blog/engineering" },

  // AWS Blogs
  { name: "AWS Architecture Blog", slug: "aws-architecture", category: "Architecture", type: "rss", url: "https://aws.amazon.com/blogs/architecture/feed/" },
  { name: "AWS Compute Blog", slug: "aws-compute", category: "DevOps", type: "rss", url: "https://aws.amazon.com/blogs/compute/feed/" },
  { name: "AWS Containers Blog", slug: "aws-containers", category: "DevOps", type: "rss", url: "https://aws.amazon.com/blogs/containers/feed/" },
  { name: "AWS Security Blog", slug: "aws-security", category: "Security", type: "rss", url: "https://aws.amazon.com/blogs/security/feed/" },
  { name: "AWS Builders Library", slug: "aws-builders-library", category: "Architecture", type: "scrape", url: "https://aws.amazon.com/builders-library/" },

  // AI Labs
  { name: "OpenAI Blog", slug: "openai-blog", category: "AI Labs", type: "rss", url: "https://openai.com/blog/rss.xml" },
  { name: "Anthropic News", slug: "anthropic-news", category: "AI Labs", type: "rss", url: "https://www.anthropic.com/rss.xml" },
  { name: "DeepMind Blog", slug: "deepmind-blog", category: "AI Labs", type: "rss", url: "https://deepmind.google/blog/rss.xml" },
  { name: "NVIDIA Developer", slug: "nvidia-developer", category: "AI Labs", type: "rss", url: "https://developer.nvidia.com/blog/feed/" },
  { name: "Mistral News", slug: "mistral-news", category: "AI Labs", type: "rss", url: "https://mistral.ai/news/rss.xml" },
  { name: "Perplexity Blog", slug: "perplexity-blog", category: "AI Labs", type: "rss", url: "https://www.perplexity.ai/blog/rss.xml" },
  { name: "NVIDIA Newsroom", slug: "nvidia-newsroom", category: "AI Labs", type: "scrape", url: "https://blogs.nvidia.com/" },

  // DevOps / Platform
  { name: "HashiCorp Blog", slug: "hashicorp-blog", category: "DevOps", type: "rss", url: "https://www.hashicorp.com/blog/feed.xml" },
  { name: "Docker Blog", slug: "docker-blog", category: "DevOps", type: "rss", url: "https://www.docker.com/blog/feed/" },
  { name: "Grafana Blog", slug: "grafana-blog", category: "DevOps", type: "rss", url: "https://grafana.com/blog/feed.xml" },

  // Databases
  { name: "MongoDB Blog", slug: "mongodb-blog", category: "Databases", type: "rss", url: "https://www.mongodb.com/blog/rss" },
  { name: "Redis Blog", slug: "redis-blog", category: "Databases", type: "rss", url: "https://redis.io/blog/rss.xml" },
  { name: "CockroachDB Blog", slug: "cockroachdb-blog", category: "Databases", type: "rss", url: "https://www.cockroachlabs.com/blog/rss.xml" },
  { name: "Confluent Blog", slug: "confluent-blog", category: "Databases", type: "rss", url: "https://www.confluent.io/blog/feed.xml" },
  { name: "Elastic Blog", slug: "elastic-blog", category: "Databases", type: "rss", url: "https://www.elastic.co/blog/feed.xml" },

  // Architecture
  { name: "InfoQ Architecture", slug: "infoq-architecture", category: "Architecture", type: "rss", url: "https://www.infoq.com/feed/" },
  { name: "Martin Fowler", slug: "martin-fowler", category: "Architecture", type: "rss", url: "https://martinfowler.com/feed.atom" },
  { name: "ByteByteGo Blog", slug: "bytebytego-blog", category: "Architecture", type: "rss", url: "https://blog.bytebytego.com/rss.xml" },

  // Incidents / SRE
  { name: "Google SRE", slug: "google-sre", category: "Incidents", type: "rss", url: "https://sre.google/feed.xml" },

  // Releases
  { name: "Azure Updates", slug: "azure-updates", category: "Releases", type: "scrape", url: "https://azure.microsoft.com/en-us/updates/" },
  { name: "GCP Release Notes", slug: "gcp-releases", category: "Releases", type: "scrape", url: "https://cloud.google.com/docs/release-notes" },
  { name: "GitHub Changelog", slug: "github-changelog", category: "Releases", type: "scrape", url: "https://github.blog/changelog/" },

  // Open Source
  { name: "Kubernetes Blog", slug: "kubernetes-blog", category: "Open Source", type: "rss", url: "https://kubernetes.io/feed.xml" },
  { name: "CNCF Blog", slug: "cncf-blog", category: "Open Source", type: "rss", url: "https://www.cncf.io/blog/feed/" },
  { name: "OpenTelemetry Blog", slug: "opentelemetry-blog", category: "Open Source", type: "scrape", url: "https://opentelemetry.io/blog/" },
  { name: "Prometheus Blog", slug: "prometheus-blog", category: "Open Source", type: "scrape", url: "https://prometheus.io/blog/" },
  { name: "Helm Blog", slug: "helm-blog", category: "Open Source", type: "scrape", url: "https://helm.sh/blog/" },

  // Security
  { name: "Google Security Blog", slug: "google-security", category: "Security", type: "rss", url: "https://security.googleblog.com/feeds/posts/default" },
  { name: "Microsoft Security", slug: "microsoft-security", category: "Security", type: "rss", url: "https://msrc.microsoft.com/blog/feed" },
  { name: "Cloudflare Security", slug: "cloudflare-security", category: "Security", type: "rss", url: "https://blog.cloudflare.com/tag/security/rss/" },

  // Industry
  { name: "Hacker News", slug: "hacker-news", category: "Industry", type: "rss", url: "https://hnrss.org/frontpage" },
  { name: "Stack Overflow Blog", slug: "stackoverflow-blog", category: "Industry", type: "rss", url: "https://stackoverflow.blog/feed/" },
];

const SCRAPE_CONFIGS: Record<string, { selectors: { post: string; title: string; link: string; date?: string; summary?: string }; linkPrefix?: string; maxPosts?: number }> = {
  "aws-builders-library": {
    selectors: { post: ".lb-post-card", title: ".lb-post-card__title", link: "a", date: ".lb-post-card__date" },
    maxPosts: 10,
  },
  "azure-updates": {
    selectors: { post: ".update-item", title: ".update-title", link: "a", date: ".update-date" },
    linkPrefix: "https://azure.microsoft.com",
    maxPosts: 20,
  },
  "gcp-releases": {
    selectors: { post: "tr", title: "td:first-child a", link: "td:first-child a", date: "td:nth-child(2)" },
    maxPosts: 20,
  },
  "github-changelog": {
    selectors: { post: ".post-card", title: ".post-card__title", link: "a", date: ".post-card__date" },
    maxPosts: 15,
  },
  "atlassian-engineering": {
    selectors: { post: ".blog-card", title: ".blog-card__title", link: "a", date: ".blog-card__date" },
    maxPosts: 12,
  },
  "datadog-engineering": {
    selectors: { post: ".blog-post", title: ".blog-post__title", link: "a", date: ".blog-post__date" },
    maxPosts: 12,
  },
  "nvidia-newsroom": {
    selectors: { post: ".post", title: ".post-title", link: "a", date: ".post-date" },
    maxPosts: 15,
  },
  "opentelemetry-blog": {
    selectors: { post: ".post-card", title: ".post-card__title", link: "a", date: ".post-card__date" },
    maxPosts: 10,
  },
  "prometheus-blog": {
    selectors: { post: ".post", title: "h2 a", link: "h2 a", date: ".post-date" },
    maxPosts: 10,
  },
  "helm-blog": {
    selectors: { post: ".blog-post", title: ".blog-post__title", link: "a", date: ".blog-post__date" },
    maxPosts: 10,
  },
  "grafana-blog": {
    selectors: { post: ".blog-card", title: ".blog-card__title", link: "a", date: ".blog-card__date" },
    maxPosts: 12,
  },
  "cncf-blog": {
    selectors: { post: ".blog-post", title: ".blog-post__title", link: "a", date: ".blog-post__date" },
    maxPosts: 12,
  },
  "elastic-blog": {
    selectors: { post: ".blog-card", title: ".blog-card__title", link: "a", date: ".blog-card__date" },
    maxPosts: 12,
  },
};

async function fetchWithRetry<T>(fn: () => Promise<T>, retries = 3, delayMs = 1000): Promise<T> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === retries) throw error;
      const waitTime = delayMs * Math.pow(2, attempt - 1);
      console.warn(`Attempt ${attempt} failed for blog source, retrying in ${waitTime}ms...`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }
  throw new Error("Unreachable");
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim().slice(0, 300);
}

function extractTags(category: unknown): string[] {
  if (!category) return [];
  if (typeof category === "string") return [category];
  if (Array.isArray(category)) return category.map((c: unknown) => (typeof c === "string" ? c : (c as any)?.["#text"])).filter(Boolean) as string[];
  return [];
}

function isWithin24h(dateStr: string): boolean {
  return Date.now() - new Date(dateStr).getTime() < 24 * 60 * 60 * 1000;
}

function parseScrapedDate(dateStr: string): string | null {
  if (!dateStr) return null;
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

export async function fetchRssFeed(source: BlogSource): Promise<BlogPost[]> {
  return fetchWithRetry(async () => {
    const response = await fetch(source.url, { next: { revalidate: 3600 } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const xml = await response.text();
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });
    const parsed = parser.parse(xml);

    const items = parsed.rss?.channel?.item || parsed.feed?.entry || [];
    const itemArray = Array.isArray(items) ? items : [items];

    return itemArray
      .filter((item: any) => item.title && (item.link || item.id || item["link@_href"]))
      .map((item: any) => {
        const title = typeof item.title === "string" ? item.title : item.title?.["#text"] || "";
        const link = item.link?.["@_href"] || item.link || item.id || "";
        const description = item.description || item.summary || item.content?.["#text"] || "";
        const pubDate = item.pubDate || item.published || item.updated || new Date().toISOString();

        return {
          title: stripHtml(title),
          url: typeof link === "string" ? link : link?.["#text"] || "",
          summary: stripHtml(description) || stripHtml(title),
          publishedAt: typeof pubDate === "string" ? pubDate : pubDate?.["#text"] || new Date().toISOString(),
          tags: extractTags(item.category),
          sourceName: source.name,
          sourceSlug: source.slug,
          sourceCategory: source.category,
        };
      })
      .filter((post: BlogPost) => post.url && isWithin24h(post.publishedAt));
  });
}

export async function scrapeBlogPage(source: BlogSource): Promise<BlogPost[]> {
  const config = SCRAPE_CONFIGS[source.slug];
  if (!config) {
    console.warn(`No scrape config for ${source.name}`);
    return [];
  }

  return fetchWithRetry(async () => {
    const response = await fetch(config.selectors.link.startsWith("http") ? source.url : source.url, { next: { revalidate: 3600 } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const html = await response.text();
    const $ = cheerio.load(html);
    const posts: BlogPost[] = [];

    $(config.selectors.post).each((_, el) => {
      if (posts.length >= (config.maxPosts ?? 20)) return;

      const $el = $(el);
      const title = $el.find(config.selectors.title).text().trim();
      let link = $el.find(config.selectors.link).attr("href") || "";
      const date = config.selectors.date ? $el.find(config.selectors.date).text().trim() : "";
      const summary = config.selectors.summary ? $el.find(config.selectors.summary).text().trim().slice(0, 300) : "";

      if (!title || !link) return;

      if (config.linkPrefix && link.startsWith("/")) {
        link = config.linkPrefix + link;
      } else if (!link.startsWith("http")) {
        try {
          link = new URL(link, source.url).href;
        } catch {
          return;
        }
      }

      posts.push({
        title,
        url: link,
        summary: summary || title,
        publishedAt: parseScrapedDate(date) || new Date().toISOString(),
        tags: [source.category],
        sourceName: source.name,
        sourceSlug: source.slug,
        sourceCategory: source.category,
      });
    });

    return posts.filter((post) => isWithin24h(post.publishedAt));
  });
}

export function mapPostToSignal(post: BlogPost): Signal {
  const externalId = `${post.sourceSlug}:${post.url}`;
  const id = `blog-${Buffer.from(externalId).toString("base64").slice(0, 16)}`;

  const timeAgoStr = timeAgo(new Date(post.publishedAt));

  return {
    id,
    external_id: externalId,
    provider: "blog",
    title: post.title,
    source: post.sourceName,
    category: "Tech Blogs",
    url: post.url,
    summary: post.summary,
    why_it_matters: `Recent ${post.sourceCategory.toLowerCase()} article from ${post.sourceName}. Published ${timeAgoStr}.`,
    stars: undefined,
    growth: undefined,
    score: 0,
    tags: [post.sourceCategory, ...post.tags],
    published_at: post.publishedAt,
  };
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export async function fetchAllBlogPosts(): Promise<BlogPost[]> {
  const rssSources = BLOG_SOURCES.filter((s) => s.type === "rss");
  const scrapeSources = BLOG_SOURCES.filter((s) => s.type === "scrape");

  const rssResults = await Promise.allSettled(rssSources.map((source) => fetchRssFeed(source)));
  
  const scrapeResults = await Promise.allSettled(
    scrapeSources.map(async (source) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return scrapeBlogPage(source);
    })
  );

  const allPosts = [
    ...rssResults.filter((r) => r.status === "fulfilled").flatMap((r) => r.value),
    ...scrapeResults.filter((r) => r.status === "fulfilled").flatMap((r) => r.value),
  ];

  const seenUrls = new Set<string>();
  return allPosts.filter((post) => {
    if (seenUrls.has(post.url)) return false;
    seenUrls.add(post.url);
    return true;
  });
}

export { BLOG_SOURCES };
