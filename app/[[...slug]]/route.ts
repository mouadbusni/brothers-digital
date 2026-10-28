import pages from "../../generated/pages.json";

const documents = pages as Record<string, string>;
const headers = {
  "content-type": "text/html; charset=utf-8",
  "x-content-type-options": "nosniff",
  "referrer-policy": "strict-origin-when-cross-origin",
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const path = url.pathname === "/" ? "/" : url.pathname.replace(/\/+$/, "") + "/";
  const html = documents[path];
  if (!html || path.endsWith("/404/")) {
    const language = path === "/en/" || path.startsWith("/en/") ? "en" : "fr";
    return new Response(documents[`/${language}/404/`], {
      status: 404, headers: { ...headers, "cache-control": "no-store", "x-robots-tag": "noindex" },
    });
  }
  return new Response(html, { headers: { ...headers, "cache-control": "public, max-age=0, s-maxage=3600" } });
}
