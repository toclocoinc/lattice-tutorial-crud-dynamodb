// Part 3: read, add, delete and PATCH products.
//
//   GET     /              every product
//   POST    /              add the product in the JSON body
//   PATCH   /?sku=XXX      change the fields in the JSON body on one product
//   DELETE  /?sku=XXX      delete one product
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, PutCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';

const TABLE = process.env.TABLE_NAME || 'Products';
const EDITABLE = ['name', 'category', 'quantity', 'price'];
const db = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const json = (statusCode, body) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: body === undefined ? '' : JSON.stringify(body),
});

const parse = (event) => { try { return JSON.parse(event.body || '{}'); } catch { return null; } };

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
    const item = parse(event);
    if (!item) return json(400, { error: 'Body must be JSON' });
    if (!item.name) return json(400, { error: 'A product needs a name' });
    if (!item.sku) item.sku = 'SKU-' + Date.now().toString(36).toUpperCase();
    item.quantity = Number(item.quantity) || 0;
    item.price = Number(item.price) || 0;
    item.updated = new Date().toISOString().slice(0, 10);
    try {
      await db.send(new PutCommand({ TableName: TABLE, Item: item, ConditionExpression: 'attribute_not_exists(sku)' }));
    } catch (err) {
      if (err.name === 'ConditionalCheckFailedException') return json(409, { error: 'That sku already exists' });
      throw err;
    }
    return json(201, item);
  }

  if (method === 'PATCH') {
    const sku = query.sku;
    const changes = parse(event);
    if (!sku) return json(400, { error: 'sku is required' });
    if (!changes) return json(400, { error: 'Body must be JSON' });
    // Only the fields we allow, each as a SET clause. Numbers arrive as numbers
    // from the grid, but coerce anyway: a PATCH is a public door.
    const names = {}, values = {}, sets = [];
    for (const field of EDITABLE) {
      if (!(field in changes)) continue;
      const v = field === 'quantity' || field === 'price' ? Number(changes[field]) : String(changes[field]);
      names['#' + field] = field; values[':' + field] = v; sets.push(`#${field} = :${field}`);
    }
    if (!sets.length) return json(400, { error: 'Nothing to change' });
    names['#updated'] = 'updated'; values[':updated'] = new Date().toISOString().slice(0, 10); sets.push('#updated = :updated');
    try {
      const out = await db.send(new UpdateCommand({
        TableName: TABLE, Key: { sku },
        UpdateExpression: 'SET ' + sets.join(', '),
        ExpressionAttributeNames: names, ExpressionAttributeValues: values,
        ConditionExpression: 'attribute_exists(sku)',   // never create by accident
        ReturnValues: 'ALL_NEW',
      }));
      return json(200, out.Attributes);
    } catch (err) {
      if (err.name === 'ConditionalCheckFailedException') return json(404, { error: 'No such product' });
      throw err;
    }
  }

  if (method === 'DELETE') {
    const sku = query.sku;
    if (!sku) return json(400, { error: 'sku is required' });
    await db.send(new DeleteCommand({ TableName: TABLE, Key: { sku } }));
    return json(204);
  }

  return json(405, { error: `Method ${method} is not supported` });
};
