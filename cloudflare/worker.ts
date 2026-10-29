import { handleInquiry } from '../lib/inquiry-handler.ts';

type PagesEnvironment = Parameters<typeof handleInquiry>[1] & {
  ASSETS: { fetch(request: Request): Promise<Response> };
};

export function createPagesWorker(errorPages: { fr: string; en: string }) {
  return {
    async fetch(request: Request, env: PagesEnvironment): Promise<Response> {
      const pathname = new URL(request.url).pathname.replace(/\/+$/, '') || '/';
      if (pathname === '/api/inquiries') {
        if (request.method !== 'POST') {
          return Response.json({ error: 'method_not_allowed' }, { status: 405, headers: { allow: 'POST', 'cache-control': 'no-store' } });
        }
        return handleInquiry(request, env);
      }
      if (pathname === '/api' || pathname.startsWith('/api/')) {
        return Response.json({ error: 'not_found' }, { status: 404, headers: { 'cache-control': 'no-store' } });
      }
      if (!['GET', 'HEAD'].includes(request.method)) {
        return new Response(null, { status: 405, headers: { allow: 'GET, HEAD' } });
      }
      const explicitError = ['/404', '/fr/404', '/en/404'].includes(pathname);
      const asset = explicitError ? null : await env.ASSETS.fetch(request);
      if (asset && asset.status !== 404) return asset;
      const language = pathname === '/en' || pathname.startsWith('/en/') ? 'en' : 'fr';
      return new Response(request.method === 'HEAD' ? null : errorPages[language], {
        status: 404,
        headers: {
          'content-type': 'text/html; charset=utf-8',
          'cache-control': 'no-store',
          'x-content-type-options': 'nosniff',
          'referrer-policy': 'strict-origin-when-cross-origin',
          'x-robots-tag': 'noindex',
        },
      });
    },
  };
}
