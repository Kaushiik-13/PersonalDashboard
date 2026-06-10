export type SourceType = "youtube" | "x" | "instagram" | "reddit" | "linkedin" | "github" | "generic";

export function detectSourceType(url: string): SourceType {
  const lower = url.toLowerCase();
  if (lower.includes("youtube.com") || lower.includes("youtu.be")) return "youtube";
  if (lower.includes("x.com") || lower.includes("twitter.com")) return "x";
  if (lower.includes("instagram.com")) return "instagram";
  if (lower.includes("reddit.com")) return "reddit";
  if (lower.includes("linkedin.com")) return "linkedin";
  if (lower.includes("github.com")) return "github";
  return "generic";
}

export function getSourceLabel(sourceType: SourceType): string {
  const labels: Record<SourceType, string> = {
    youtube: "YouTube",
    x: "X",
    instagram: "Instagram",
    reddit: "Reddit",
    linkedin: "LinkedIn",
    github: "GitHub",
    generic: "Web",
  };
  return labels[sourceType] || "Web";
}

export function getSourceIcon(sourceType: SourceType): string {
  const icons: Record<SourceType, string> = {
    youtube: "▶",
    x: "✕",
    instagram: "◎",
    reddit: "●",
    linkedin: "in",
    github: "⑂",
    generic: "↗",
  };
  return icons[sourceType] || "↗";
}

export function isSourceTypeX(sourceType: SourceType): boolean {
  return sourceType === "x";
}

export function getSourceBannerColor(sourceType: SourceType): string {
  const colors: Record<SourceType, string> = {
    youtube: "#FF0000",
    x: "#EFF3F4",
    instagram: "#E1306C",
    reddit: "#FF4500",
    linkedin: "#0A66C2",
    github: "#333333",
    generic: "#6366F1",
  };
  return colors[sourceType] || "#6366F1";
}

export interface BookmarkMetadata {
  title: string;
  description: string;
  image?: string;
}

export async function fetchBookmarkMetadata(url: string): Promise<BookmarkMetadata> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!response.ok) {
      return { title: url, description: "No description available" };
    }

    const html = await response.text();
    const title = extractMetaTag(html, "og:title") || extractTitle(html) || url;
    const description = extractMetaTag(html, "og:description") || extractMetaTag(html, "description") || "No description available";
    const image = extractMetaTag(html, "og:image") || undefined;

    return { title, description, image };
  } catch (error) {
    console.error("Failed to fetch metadata:", error);
    return { title: url, description: "No description available" };
  }
}

function extractMetaTag(html: string, property: string): string | null {
  const regex = new RegExp(
    `<meta[^>]*(?:property|name)="${property}"[^>]*content="([^"]*)"`,
    "i"
  );
  const match = html.match(regex);
  return match ? match[1] : null;
}

function extractTitle(html: string): string | null {
  const match = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return match ? match[1].trim() : null;
}
