# Part 1: a web page that reads products from DynamoDB

Source for part 1 of the Lattice Grid CRUD tutorial. The step-by-step guide is
on the Lattice Grid site and in [`TUTORIAL.md`](TUTORIAL.md) beside this file;
this folder holds everything it asks you to paste or run.

| Folder | What it is |
| --- | --- |
| `seed/products.json` | Sixty demo products: SKU, name, category, quantity, price, updated. |
| `seed/seed.mjs` | Uploads them to your DynamoDB table with the AWS SDK. `cd seed && npm install && node seed.mjs` |
| `lambda/index.mjs` | The Lambda function: scans the table and returns the products as JSON. Paste it into the Lambda console. |
| `web/index.html` | The web page: loads Lattice Grid from a CDN, fetches the Lambda's Function URL, shows the products. |

What you need: an AWS account, Node.js 22 or later, and the AWS CLI configured
with credentials for that account (only the seed script uses it).

What it costs: DynamoDB on-demand and Lambda both sit inside the AWS free tier
at this size. Delete the table and the function when you are done if you want
to be sure.

The grid loads without a licence key and shows a small trial watermark. That is
fine for a tutorial; a key removes the watermark and changes nothing else.

Part 2 adds create, update and delete through the same Lambda and the grid's
own editing.
