// Run: node --import ./test/register.mjs --test test/   (from part-3/)
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { handler } from '../lambda/index.mjs';
import { sent, responses } from './stub-lib-dynamodb.mjs';

const patch = (body, sku = 'A-1') => handler({
  requestContext: { http: { method: 'PATCH' } },
  queryStringParameters: { sku },
  body: JSON.stringify(body),
});

beforeEach(() => { sent.length = 0; responses.length = 0; });

for (const name of ['', '   ', '\t\n', null]) {
  test(`PATCH with name ${JSON.stringify(name)} is refused and writes nothing`, async () => {
    const res = await patch({ name });
    assert.equal(res.statusCode, 400);
    assert.deepEqual(JSON.parse(res.body), { error: 'name is required' });
    assert.equal(sent.length, 0);
  });
}

test('PATCH without a name field still updates other fields', async () => {
  responses.push({ Attributes: { sku: 'A-1', quantity: 5 } });
  const res = await patch({ quantity: 5 });
  assert.equal(res.statusCode, 200);
  assert.equal(sent.length, 1);
});

test('PATCH with a real name updates', async () => {
  responses.push({ Attributes: { sku: 'A-1', name: 'Widget' } });
  const res = await patch({ name: 'Widget' });
  assert.equal(res.statusCode, 200);
  assert.equal(sent.length, 1);
});
