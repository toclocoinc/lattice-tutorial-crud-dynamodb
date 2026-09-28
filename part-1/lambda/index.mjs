// Part 1: read every product from DynamoDB and return it as JSON.
//
// Runs on the Node.js 22 Lambda runtime, which ships the AWS SDK v3, so there
// is nothing to install. The table name comes from an environment variable so
// the same code works whatever you called the table.
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';

const TABLE = process.env.TABLE_NAME || 'Products';
const db = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export const handler = async () => {
  // A Scan returns at most 1 MB per call, so keep going until DynamoDB says
  // there is no more. Sixty products fit in one page; a real table would not.
  const items = [];
  let ExclusiveStartKey;
  do {
    const page = await db.send(new ScanCommand({ TableName: TABLE, ExclusiveStartKey }));
    items.push(...(page.Items || []));
    ExclusiveStartKey = page.LastEvaluatedKey;
  } while (ExclusiveStartKey);

  // CORS headers are added by the Function URL's own CORS setting (step 3),
  // so the response only needs the content type.
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items, count: items.length }),
  };
};
