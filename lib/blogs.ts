import type { Signal } from "@/lib/supabase";
import { XMLParser } from "fast-xml-parser";

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
  { name: "Netflix Tech Blog", slug: "netflix-tech-blog", category: "Engineering", url: "https://netflixtechblog.com/feed" },
  { name: "Microsoft Engineering", slug: "microsoft-engineering", category: "Engineering", url: "https://devblogs.microsoft.com/engineering/feed/" },
  { name: "GitHub Engineering", slug: "github-engineering", category: "Engineering", url: "https://github.blog/feed/" },
  { name: "Cloudflare Blog", slug: "cloudflare-blog", category: "Engineering", url: "https://blog.cloudflare.com/rss/" },
  { name: "Uber Engineering", slug: "uber-engineering", category: "Engineering", url: "https://eng.uber.com/feed/" },
  { name: "Spotify Engineering", slug: "spotify-engineering", category: "Engineering", url: "https://engineering.atspotify.com/feed/" },
  { name: "LinkedIn Engineering", slug: "linkedin-engineering", category: "Engineering", url: "https://engineering.linkedin.com/blog/rss.xml" },
  { name: "Meta Engineering", slug: "meta-engineering", category: "Engineering", url: "https://engineering.fb.com/feed/" },
  { name: "DoorDash Engineering", slug: "doordash-engineering", category: "Engineering", url: "https://doordash.engineering/feed/" },

  // AWS Blogs
  { name: "AWS Architecture Blog", slug: "aws-architecture", category: "Architecture", url: "https://aws.amazon.com/blogs/architecture/feed/" },
  { name: "AWS Compute Blog", slug: "aws-compute", category: "DevOps", url: "https://aws.amazon.com/blogs/compute/feed/" },
  { name: "AWS Containers Blog", slug: "aws-containers", category: "DevOps", url: "https://aws.amazon.com/blogs/containers/feed/" },
  { name: "AWS Security Blog", slug: "aws-security", category: "Security", url: "https://aws.amazon.com/blogs/security/feed/" },

  // AI Labs
  { name: "OpenAI Blog", slug: "openai-blog", category: "AI Labs", url: "https://openai.com/blog/rss.xml" },
  { name: "Anthropic News", slug: "anthropic-news", category: "AI Labs", url: "https://www.anthropic.com/rss.xml" },
  { name: "DeepMind Blog", slug: "deepmind-blog", category: "AI Labs", url: "https://deepmind.google/blog/rss.xml" },
  { name: "NVIDIA Developer", slug: "nvidia-developer", category: "AI Labs", url: "https://developer.nvidia.com/blog/feed/" },
  { name: "Mistral News", slug: "mistral-news", category: "AI Labs", url: "https://mistral.ai/news/rss.xml" },
  { name: "Perplexity Blog", slug: "perplexity-blog", category: "AI Labs", url: "https://www.perplexity.ai/blog/rss.xml" },

  // DevOps / Platform
  { name: "HashiCorp Blog", slug: "hashicorp-blog", category: "DevOps", url: "https://www.hashicorp.com/blog/feed.xml" },
  { name: "Docker Blog", slug: "docker-blog", category: "DevOps", url: "https://www.docker.com/blog/feed/" },
  { name: "Grafana Blog", slug: "grafana-blog", category: "DevOps", url: "https://grafana.com/blog/feed.xml" },

  // Databases
  { name: "MongoDB Blog", slug: "mongodb-blog", category: "Databases", url: "https://www.mongodb.com/blog/rss" },
  { name: "Redis Blog", slug: "redis-blog", category: "Databases", url: "https://redis.io/blog/rss.xml" },
  { name: "CockroachDB Blog", slug: "cockroachdb-blog", category: "Databases", url: "https://www.cockroachlabs.com/blog/rss.xml" },
  { name: "Confluent Blog", slug: "confluent-blog", category: "Databases", url: "https://www.confluent.io/blog/feed.xml" },
  { name: "Elastic Blog", slug: "elastic-blog", category: "Databases", url: "https://www.elastic.co/blog/feed.xml" },

  // Architecture
  { name: "InfoQ Architecture", slug: "infoq-architecture", category: "Architecture", url: "https://www.infoq.com/feed/" },
  { name: "Martin Fowler", slug: "martin-fowler", category: "Architecture", url: "https://martinfowler.com/feed.atom" },
  { name: "ByteByteGo Blog", slug: "bytebytego-blog", category: "Architecture", url: "https://blog.bytebytego.com/rss.xml" },

  // Incidents / SRE
  { name: "Google SRE", slug: "google-sre", category: "Incidents", url: "https://sre.google/feed.xml" },

  // Open Source
  { name: "Kubernetes Blog", slug: "kubernetes-blog", category: "Open Source", url: "https://kubernetes.io/feed.xml" },
  { name: "CNCF Blog", slug: "cncf-blog", category: "Open Source", url: "https://www.cncf.io/blog/feed/" },

  // Security
  { name: "Google Security Blog", slug: "google-security", category: "Security", url: "https://security.googleblog.com/feeds/posts/default" },
  { name: "Microsoft Security", slug: "microsoft-security", category: "Security", url: "https://msrc.microsoft.com/blog/feed" },
  { name: "Cloudflare Security", slug: "cloudflare-security", category: "Security", url: "https://blog.cloudflare.com/tag/security/rss/" },

  // Industry
  { name: "Hacker News", slug: "hacker-news", category: "Industry", url: "https://hnrss.org/frontpage" },
  { name: "Stack Overflow Blog", slug: "stackoverflow-blog", category: "Industry", url: "https://stackoverflow.blog/feed/" },
];

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
      .filter((post: BlogPost) => post.url);
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
    published_at: new Date(post.publishedAt).toISOString(),
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
  const results = await Promise.allSettled(BLOG_SOURCES.map((source) => fetchRssFeed(source)));

  const allPosts = results
    .filter((r) => r.status === "fulfilled")
    .flatMap((r) => r.value);

  const seenUrls = new Set<string>();
  return allPosts.filter((post) => {
    if (seenUrls.has(post.url)) return false;
    seenUrls.add(post.url);
    return true;
  });
}

export { BLOG_SOURCES };
