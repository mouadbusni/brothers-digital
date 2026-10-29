import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { build } from 'esbuild';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'dist-pages');
const sourceOrigin = 'https://brothers-digital-studio.wisesnow.chatgpt.site';
const value = process.env.SITE_ORIGIN;
if (!value) throw new Error('Set SITE_ORIGIN to your production address, for example https://brothers-digital.pages.dev');
const url = new URL(value);
if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
  throw new Error('SITE_ORIGIN must be an HTTPS origin without credentials, a path, query, or fragment.');
}
const origin = url.origin;
execFileSync(process.execPath, ['scripts/build-content.mjs'], { cwd: root, stdio: 'inherit' });
const pages = JSON.parse(await fs.readFile(path.join(root, 'generated/pages.json'), 'utf8'));
await fs.rm(output, { recursive: true, force: true });
await fs.cp(path.join(root, 'public'), output, { recursive: true });
const rewrite = text => text.replaceAll(sourceOrigin, origin);
const staticRoutes = [];
for (const [route, html] of Object.entries(pages)) {
  if (route.endsWith('/404/')) continue;
  const file = path.join(output, route.slice(1), 'index.html');
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, rewrite(html));
  if (route !== '/') staticRoutes.push(route, route.replace(/\/$/, ''));
}
await fs.writeFile(path.join(output, '404.html'), rewrite(pages['/fr/404/']));
for (const file of ['robots.txt', 'sitemap.xml']) {
  await fs.writeFile(path.join(output, file), rewrite(await fs.readFile(path.join(root, 'public', file), 'utf8')));
}
await fs.writeFile(path.join(output, '_headers'), '/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n');
// Known content and assets stay on Pages' free static delivery path.
// Only the enquiry endpoint and missing localized pages invoke the Worker.
await fs.writeFile(path.join(output, '_routes.json'), JSON.stringify({
  version: 1,
  include: ['/api', '/api/*', '/fr', '/fr/*', '/en', '/en/*', '/404', '/404/'],
  exclude: staticRoutes,
}, null, 2) + '\n');
await build({
  stdin: {
    contents: `import { createPagesWorker } from './cloudflare/worker.ts';\nexport default createPagesWorker(${JSON.stringify({ fr: rewrite(pages['/fr/404/']), en: rewrite(pages['/en/404/']) })});`,
    resolveDir: root, sourcefile: 'pages-entry.ts', loader: 'ts',
  },
  outfile: path.join(output, '_worker.js'), bundle: true, minify: true,
  format: 'esm', platform: 'browser', target: 'es2022', sourcemap: false,
});
console.log(`Cloudflare Pages build ready: ${staticRoutes.length / 2 + 1} pages at ${origin}. Output: dist-pages`);
