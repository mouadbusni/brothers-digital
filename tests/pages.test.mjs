import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const pages = JSON.parse(readFileSync(new URL('../generated/pages.json', import.meta.url), 'utf8'));
const origin = 'https://brothers-digital-studio.wisesnow.chatgpt.site';
for (const [route, html] of Object.entries(pages)) {
  test(`${route} has a complete localized document with valid internal links and assets`, () => {
    assert.equal((html.match(/<h1\b/g) || []).length, 1, 'Exactly one page heading');
    assert.match(html, /<title>[^<]+<\/title>/);
    assert.match(html, /<meta name="description" content="[^"]+">/);
    assert.match(html, new RegExp(`<html lang="${route.startsWith('/en/') ? 'en' : 'fr'}"`));
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
    assert.equal(ids.length, new Set(ids).size, 'Unique element IDs');
    for (const [, attribute, value] of html.matchAll(/\b(href|src)="([^"]+)"/g)) {
      if (!value.startsWith('/') && !value.startsWith('#') && !value.startsWith(origin)) continue;
      const target = new URL(value, origin + route);
      const path = target.pathname.replace(/\/+$/, '') + '/';
      if (attribute === 'href' && pages[path]) continue;
      if (target.pathname === new URL(origin + route).pathname && target.hash) {
        assert.ok(ids.includes(decodeURIComponent(target.hash.slice(1))), `Anchor ${value}`); continue;
      }
      if (value.startsWith('#')) { assert.ok(ids.includes(value.slice(1)), `Anchor ${value}`); continue; }
      assert.ok(existsSync(new URL('../public' + target.pathname, import.meta.url)), `Missing ${attribute}: ${value}`);
    }
    if (route.endsWith('/404/')) assert.match(html, /<meta name="robots" content="noindex,follow">/);
  });
}
test('sitemap includes every public content route and excludes error pages', () => {
  const sitemap = readFileSync(new URL('../public/sitemap.xml', import.meta.url), 'utf8');
  const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => new URL(m[1]).pathname).sort();
  assert.deepEqual(locations, Object.keys(pages).filter(p => p !== '/' && !p.endsWith('/404/')).sort());
});
