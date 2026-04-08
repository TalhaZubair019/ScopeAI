import TurndownService from "turndown";

const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
});

export async function fetchWebContent(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ScopeAI/1.0; +http://scopeai.tech)",
      },
      next: { revalidate: 3600 },
    });

    if (!response.ok) return `[Error fetching ${url}: ${response.statusText}]`;

    const html = await response.text();
    
    // Simple extraction of title and body to avoid boilerplate
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1] : "Untitled Source";
    
    // Remove script, style, and nav tags before converting
    let cleanHtml = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
      .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, "")
      .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, "");

    const markdown = turndown.turndown(cleanHtml);
    
    // Return a condensed version (first 10,000 characters to stay within reasonable context)
    return `--- WEB SOURCE: ${title} (${url}) ---\n${markdown.slice(0, 10000)}\n--- END SOURCE ---`;
  } catch (error) {
    console.error("WebReader Error:", error);
    return `[Failed to ingest Neural Link: ${url}]`;
  }
}
