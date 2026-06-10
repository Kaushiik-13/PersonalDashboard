import { XMLParser } from "fast-xml-parser";

const NETFLIX_RSS_URL = "https://netflixtechblog.com/feed";

async function testNetflixRSS() {
  console.log("Fetching Netflix Tech Blog RSS...\n");

  try {
    const response = await fetch(NETFLIX_RSS_URL);
    console.log(`Response status: ${response.status}`);

    if (!response.ok) {
      console.error(`Failed to fetch: HTTP ${response.status}`);
      return;
    }

    const xml = await response.text();
    console.log(`RSS feed size: ${xml.length} bytes\n`);

    // Show first 500 chars of raw XML
    console.log("Raw XML preview:");
    console.log(xml.slice(0, 500));
    console.log("\n---\n");

    // Parse XML
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
    });
    const parsed = parser.parse(xml);

    console.log("Parsed structure keys:", Object.keys(parsed));
    console.log("\n");

    // Extract items
    const items = parsed.rss?.channel?.item || parsed.feed?.entry || [];
    const itemArray = Array.isArray(items) ? items : [items];

    console.log(`Total items found: ${itemArray.length}\n`);

    // Show first 5 items
    itemArray.slice(0, 5).forEach((item, i) => {
      console.log(`--- Item ${i + 1} ---`);
      console.log("Title:", typeof item.title === "string" ? item.title : item.title?.["#text"]);
      console.log("Link:", item.link?.["@_href"] || item.link || item.id);
      console.log("PubDate:", item.pubDate || item.published || item.updated);
      console.log("Description preview:", (item.description || "").slice(0, 100));
      console.log("Category:", item.category);
      console.log("\n");
    });

    // Check date filtering
    const now = Date.now();
    const within24h = itemArray.filter((item) => {
      const pubDate = item.pubDate || item.published || item.updated;
      if (!pubDate) return false;
      const date = new Date(pubDate);
      return now - date.getTime() < 24 * 60 * 60 * 1000;
    });

    console.log(`Items within 24h: ${within24h.length} out of ${itemArray.length}`);

    if (within24h.length === 0) {
      console.log("\n⚠️  No items within 24h! This explains why the pipeline returns 0 posts.");
      console.log("Most recent item date:", itemArray[0]?.pubDate || itemArray[0]?.published);
    }

  } catch (error) {
    console.error("Error:", error.message);
    console.error("Stack:", error.stack);
    if (error.cause) {
      console.error("Cause:", error.cause);
    }
  }
}

testNetflixRSS();
