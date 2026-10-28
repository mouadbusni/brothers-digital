import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { handleInquiry } from '../lib/inquiry-handler.ts';
import { readInquiryBody, MAX_INQUIRY_BYTES } from '../lib/inquiry-body.ts';
import { validateInquiry } from '../lib/inquiries.ts';
import { inquirySignature, submissionFor } from '../site-source/submission-state.mjs';

const payload = (overrides = {}) => ({ id: randomUUID(), name: 'Release QA', email: 'qa@example.invalid', services: ['web'], message: 'A website for our independent studio.', timeframe: 'À définir', language: 'en', ...overrides });
const request = (body, headers = {}) => new Request('https://studio.example/api/inquiries', { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body) });
function database(t, failNotificationUpdate = false) {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(readFileSync(new URL('../drizzle/0000_reflective_veda.sql', import.meta.url), 'utf8'));
  t.after(() => sqlite.close());
  const prepare = sql => {
    let values = [];
    return {
      bind(...args) { values = args; return this; },
      async first() { return sqlite.prepare(sql).get(...values) ?? null; },
      async run() {
        if (failNotificationUpdate && sql.startsWith('UPDATE inquiries')) throw new Error('Simulated status-write failure');
        const result = sqlite.prepare(sql).run(...values);
        return { success: true, meta: { changes: Number(result.changes) }, results: [] };
      },
    };
  };
  const DB = { prepare, async batch(statements) {
    sqlite.exec('BEGIN');
    try { const results = []; for (const statement of statements) results.push(await statement.run()); sqlite.exec('COMMIT'); return results; }
    catch (error) { sqlite.exec('ROLLBACK'); throw error; }
  } };
  // Serialize batches like D1 while allowing simultaneous requests to reach the insert.
  let queue = Promise.resolve();
  const batch = DB.batch;
  DB.batch = statements => { const result = queue.then(() => batch(statements)); queue = result.catch(() => {}); return result; };
  return { DB, sqlite };
}

for (const [name, overrides, error] of [
  ['blank name', { name: '  ' }, 'invalid_name'],
  ['long name', { name: 'a'.repeat(101) }, 'invalid_name'],
  ['invalid email', { email: 'not-an-email' }, 'invalid_email'],
  ['short message', { message: 'short' }, 'invalid_message'],
  ['long message', { message: 'x'.repeat(5001) }, 'invalid_message'],
  ['unknown service', { services: ['unknown'] }, 'missing_service'],
  ['invalid reference', { id: 'not-a-uuid' }, 'invalid_id'],
]) test(`validation rejects ${name}`, () => assert.equal(validateInquiry(payload(overrides)).error, error));

test('validation normalizes contact details and deduplicates services', () => {
  const result = validateInquiry(payload({ name: ' QA Studio ', email: ' QA@EXAMPLE.INVALID ', services: ['design','web','design','unknown'] }));
  assert.equal(result.data.name, 'QA Studio'); assert.equal(result.data.email, 'qa@example.invalid'); assert.deepEqual(result.data.services, ['design','web']);
});
test('retry reference survives whitespace, email case and service ordering; changes get a new reference', () => {
  const original = payload({ services: ['web','design'] }); let ids = 0;
  const first = submissionFor(null, original, () => String(++ids));
  const retry = submissionFor(first, { ...original, email: original.email.toUpperCase(), services: ['design','web'], message: ` ${original.message} ` }, () => String(++ids));
  assert.equal(retry.id, first.id);
  assert.notEqual(submissionFor(first, { ...original, message: 'A different project idea.' }, () => String(++ids)).id, first.id);
  assert.equal(typeof inquirySignature(original), 'string');
});
test('body accepts maximum-length Unicode text, including escaped JSON', async () => {
  const value = payload({ message: '界'.repeat(5000) });
  const body = JSON.stringify(value).replaceAll('界', '\\u754c');
  const result = await readInquiryBody(new Request('https://studio.example', { method: 'POST', body }));
  assert.equal(result.body.message, value.message);
});
test('body rejects invalid JSON and oversized declared body', async () => {
  assert.equal((await readInquiryBody(new Request('https://studio.example', { method: 'POST', body: '{' }))).error, 'invalid_json');
  assert.equal((await readInquiryBody(new Request('https://studio.example', { method: 'POST', body: '{}', headers: { 'content-length': String(MAX_INQUIRY_BYTES + 1) } }))).status, 413);
});
test('body stops consuming oversized chunked input without a content-length header', async () => {
  let cancelled = false;
  const body = new ReadableStream({ pull(controller) { controller.enqueue(new Uint8Array(8192)); }, cancel() { cancelled = true; } });
  const result = await readInquiryBody(new Request('https://studio.example', { method: 'POST', body, duplex: 'half' }));
  assert.equal(result.status, 413); assert.equal(cancelled, true);
});
test('rejects cross-origin requests and misleading content types', async () => {
  assert.equal((await handleInquiry(request(payload(), { origin: 'https://other.example' }), {})).status, 403);
  assert.equal((await handleInquiry(request(payload(), { 'content-type': 'text/application/json-fake' }), {})).status, 415);
});
test('honeypot is acknowledged without storage; missing database reports unavailability', async () => {
  assert.equal((await handleInquiry(request(payload({ website: 'bot' })), {})).status, 202);
  assert.equal((await handleInquiry(request(payload()), {})).status, 503);
});
test('simultaneous retries save one enquiry and all acknowledge it', async t => {
  const { DB, sqlite } = database(t); const body = payload();
  const responses = await Promise.all(Array.from({ length: 3 }, () => handleInquiry(request(body), { DB })));
  assert.deepEqual(responses.map(r => r.status).sort(), [200,200,201]);
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS count FROM inquiries').get().count, 1);
  for (const response of responses) assert.equal((await response.json()).id, body.id);
});
test('reusing a reference for different content is rejected without overwriting it', async t => {
  const { DB, sqlite } = database(t); const body = payload();
  await handleInquiry(request(body), { DB });
  const response = await handleInquiry(request({ ...body, message: 'A completely different request.' }), { DB });
  assert.equal(response.status, 409);
  assert.equal(sqlite.prepare('SELECT message FROM inquiries').get().message, body.message);
});
test('rate limit blocks the sixth new enquiry, while saved retries remain successful', async t => {
  const { DB } = database(t); const first = payload();
  for (let i = 0; i < 5; i++) assert.equal((await handleInquiry(request(i ? payload() : first), { DB })).status, 201);
  const blocked = await handleInquiry(request(payload()), { DB });
  assert.equal(blocked.status, 429); assert.equal(blocked.headers.get('retry-after'), '600');
  assert.equal((await handleInquiry(request(first), { DB })).status, 200);
});
test('notification and status-write failures cannot turn a stored enquiry into failure', async t => {
  const { DB, sqlite } = database(t, true);
  t.mock.method(globalThis, 'fetch', async () => { throw new Error('Simulated mail outage'); });
  const response = await handleInquiry(request(payload()), { DB, RESEND_API_KEY: 'test-only', CONTACT_TO_EMAIL: 'qa@example.invalid', CONTACT_FROM_EMAIL: 'qa@example.invalid' });
  assert.equal(response.status, 201); assert.equal(sqlite.prepare('SELECT COUNT(*) AS count FROM inquiries').get().count, 1);
});
