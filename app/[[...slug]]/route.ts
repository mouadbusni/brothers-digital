import pages from "../../generated/pages.json";

const documents = pages as Record<string, string>;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const path = url.pathname === "/" ? "/" : url.pathname.replace(/\/+$/, "") + "/";
  const html = documents[path];
  if (!html) {
    return new Response(documents["/404/"], { status: 404, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
  }
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=0, s-maxage=3600", "x-content-type-options": "nosniff", "referrer-policy": "strict-origin-when-cross-origin" } });
}
