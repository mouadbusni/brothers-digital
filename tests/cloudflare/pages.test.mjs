import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import worker from '../../dist-pages/_worker.js';

const root = new URL('../../dist-pages/', import.meta.url);
const read = file => readFileSync(new URL(file, root), 'utf8');
const pages = JSON.parse(readFileSync(new URL('../../generated/pages.json', import.meta.url), 'utf8'));
const routing = JSON.parse(read('_routes.json'));
const matches = (rule, path) => rule.endsWith('/*') ? path.startsWith(rule.slice(0, -1)) : rule === path;
const invokes = path => routing.include.some(r => matches(r, path)) && !routing.exclude.some(r => matches(r, path));
const env = { ASSETS: { fetch: async () => new Response('asset', { status: 200 }) } };

test('Pages exports every content page and rewrites metadata to the deployment origin', () => {
  const origin = new URL(read('index.html').match(/rel="canonical" href="([^"]+)"/)[1]).origin;
  assert.notEqual(origin, 'https://brothers-digital-studio.wisesnow.chatgpt.site');
  for (const [route] of Object.entries(pages)) {
    if (route.endsWith('/404/')) continue;
    const html = read(route.slice(1) + 'index.html');
    assert.ok(html.includes(origin));
    assert.ok(!html.includes('https://brothers-digital-studio.wisesnow.chatgpt.site'));
    assert.equal(invokes(route), false, `${route} should be served as a static page`);
    if (route !== '/') assert.equal(invokes(route.replace(/\/$/, '')), false);
  }
  assert.ok(read('sitemap.xml').includes(origin)); assert.ok(read('robots.txt').includes(origin));
  assert.match(read('404.html'), /noindex,follow/);
});
test('routing invokes API and localized errors while assets stay static', () => {
  assert.ok(routing.include.length + routing.exclude.length <= 100);
  for (const route of ['/api/inquiries','/api/inquiries/','/api/missing','/fr/missing','/en/missing','/en/404','/404/']) assert.equal(invokes(route), true, route);
  for (const route of ['/assets/sculpture-1024.webp','/styles.css','/common.js','/sitemap.xml']) assert.equal(invokes(route), false, route);
});
test('Pages output has required scripts, assets, and no Site manifest or database files', () => {
  for (const file of ['_worker.js','_routes.json','_headers','contact.js','studio-3d.js','assets/sculpture-1024.webp']) assert.ok(existsSync(new URL(file, root)), file);
  for (const file of ['.openai/hosting.json','.dev.vars','drizzle/0000_reflective_veda.sql']) assert.equal(existsSync(new URL(file, root)), false, file);
});
test('compiled Worker delegates matching asset requests', async () => {
  const response = await worker.fetch(new Request('https://example.pages.dev/fr/studio/'), env);
  assert.equal(response.status, 200); assert.equal(await response.text(), 'asset');
});
test('compiled Worker returns French and English missing pages with real 404 responses', async () => {
  const missing = { ASSETS: { fetch: async () => new Response('not found', { status: 404 }) } };
  for (const [path, lang] of [['/en/missing','en'],['/fr/missing','fr'],['/404','fr'],['/en/404/','en']]) {
    const response = await worker.fetch(new Request('https://example.pages.dev'+path), missing);
    assert.equal(response.status, 404); assert.equal(response.headers.get('x-robots-tag'), 'noindex');
    assert.match(await response.text(), new RegExp(`<html lang="${lang}"`));
  }
  const head = await worker.fetch(new Request('https://example.pages.dev/en/missing', { method: 'HEAD' }), missing);
  assert.equal(head.status, 404); assert.equal(await head.text(), '');
});
test('compiled enquiry endpoint preserves method, origin and storage validation', async () => {
  const url = 'https://example.pages.dev/api/inquiries';
  const get = await worker.fetch(new Request(url), env);
  assert.equal(get.status, 405); assert.equal(get.headers.get('allow'), 'POST');
  const data = { id: randomUUID(), name: 'Release QA', email: 'qa@example.invalid', message: 'Cloudflare Pages build validation only.', services: ['web'] };
  const send = headers => new Request(url, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(data) });
  assert.equal((await worker.fetch(send({ origin: 'https://other.example' }), env)).status, 403);
  assert.equal((await worker.fetch(send({}), env)).status, 503);
  assert.equal((await worker.fetch(new Request('https://example.pages.dev/api/unknown'), env)).status, 404);
});
