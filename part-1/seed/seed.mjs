// Part 1: upload the demo products into the DynamoDB table.
//
//   cd seed && npm install && node seed.mjs
//
// Uses whatever AWS credentials your shell already has (the same ones the AWS
// CLI uses: environment variables, a profile, or SSO). Set AWS_REGION to the
// region you created the table in, and TABLE_NAME if you did not call it
// "Products".
import { readFileSync } from 'node:fs';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';

const TABLE = process.env.TABLE_NAME || 'Products';
const products = JSON.parse(readFileSync(new URL('./products.json', import.meta.url), 'utf8'));
const db = DynamoDBDocumentClient.from(new DynamoDBClient({}));

// BatchWrite takes at most 25 items per call, and may hand some back as
// unprocessed when the table is busy, so retry those until none are left.
for (let i = 0; i < products.length; i += 25) {
  let requests = products.slice(i, i + 25).map((Item) => ({ PutRequest: { Item } }));
  while (requests.length) {
    const out = await db.send(new BatchWriteCommand({ RequestItems: { [TABLE]: requests } }));
    requests = (out.UnprocessedItems && out.UnprocessedItems[TABLE]) || [];
    if (requests.length) await new Promise((r) => setTimeout(r, 500));
  }
  console.log(`wrote ${Math.min(i + 25, products.length)} of ${products.length}`);
}
console.log(`done: ${products.length} products in table "${TABLE}"`);
