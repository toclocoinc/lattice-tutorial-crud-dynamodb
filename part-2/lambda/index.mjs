// Part 2: read, add and delete products.
//
// One function, three verbs, chosen from the request the Function URL hands us:
//   GET     /            every product (as in part 1)
//   POST    /            add the product in the JSON body; the sku may be omitted
//   DELETE  /?sku=XXX    delete one product
// Runs on the Node.js 24 (or 22) Lambda runtime, which ships the AWS SDK v3.
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, PutCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';

const TABLE = process.env.TABLE_NAME || 'Products';
const db = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const json = (statusCode, body) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: body === undefined ? '' : JSON.stringify(body),
});

export const handler = async (event) => {
  const method = event.requestContext?.http?.method || 'GET';
  const query = event.queryStringParameters || {};

  if (method === 'GET') {
    const items = [];
    let ExclusiveStartKey;
    do {
      const page = await db.send(new ScanCommand({ TableName: TABLE, ExclusiveStartKey }));
      items.push(...(page.Items || []));
      ExclusiveStartKey = page.LastEvaluatedKey;
    } while (ExclusiveStartKey);
    return json(200, { items, count: items.length });
  }

  if (method === 'POST') {
    let item;
    try { item = JSON.parse(event.body || '{}'); } catch { return json(400, { error: 'Body must be JSON' }); }
    if (!item.name) return json(400, { error: 'A product needs a name' });
    // The browser may leave the sku blank; the server assigns one so two
    // people adding at once can never collide.
    if (!item.sku) item.sku = 'SKU-' + Date.now().toString(36).toUpperCase();
    item.quantity = Number(item.quantity) || 0;
    item.price = Number(item.price) || 0;
    item.updated = new Date().toISOString().slice(0, 10);
    try {
      // The condition refuses to overwrite an existing product with the same sku.
      await db.send(new PutCommand({ TableName: TABLE, Item: item, ConditionExpression: 'attribute_not_exists(sku)' }));
    } catch (err) {
      if (err.name === 'ConditionalCheckFailedException') return json(409, { error: 'That sku already exists' });
      throw err;
    }
    return json(201, item);
  }

  if (method === 'DELETE') {
    const sku = query.sku;
    if (!sku) return json(400, { error: 'sku is required' });
    await db.send(new DeleteCommand({ TableName: TABLE, Key: { sku } }));
    return json(204);
  }

  return json(405, { error: `Method ${method} is not supported` });
};
