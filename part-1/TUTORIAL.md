# Build a CRUD app with Lattice Grid, Node and DynamoDB. Part 1: read the data

This is the first of a short series that builds a working application from
nothing: a DynamoDB table, a Node Lambda function in front of it, and a web
page that shows the data in a grid. Part 1 ends with a page that reads
products from your own AWS account. Later parts add creating, editing and
deleting rows.

It is deliberately basic. Everything is done in the AWS Console, there is no
framework, no build step and no infrastructure tooling to install. If you
have used AWS before you will find some steps slow; they are written for
someone who has not.

**Source:** every file this guide asks you to paste or run is in the
`part-1` folder of
[toclocoinc/lattice-tutorial-crud-dynamodb](https://github.com/toclocoinc/lattice-tutorial-crud-dynamodb)
(Code, Download ZIP).

## What you need

- An AWS account you can sign in to. Everything here fits in the free tier.
- Node.js 22 or later on your machine, for the one script that uploads the demo data.
- The AWS CLI configured with credentials for that account (`aws configure`, or
  `aws sso login`). Only the upload script uses it.

Pick one region and stay in it for every step. The examples use London,
`eu-west-2`; any region works.

## Step 1: create the table

1. In the AWS Console, open **DynamoDB**, then **Tables**, then **Create table**.
2. Table name: `Products`.
3. Partition key: `sku`, type **String**. Leave the sort key empty.
4. Table settings: leave **Default settings** selected. The summary
   underneath lists what that means; the line that matters is
   **Capacity mode: On-demand**, so you pay per request and nothing while
   idle.
5. Choose **Create table**. It is ready in under a minute.

Nothing else about the table needs deciding now. DynamoDB has no schema beyond
the key: every other field on a product is just whatever the item carries.

## Step 2: upload the demo data

The download has sixty products in `seed/products.json`, each with a `sku`,
`name`, `category`, `quantity`, `price` and an `updated` date. The script
beside it writes them to the table in batches of 25, which is the most a single
DynamoDB write call accepts.

```
cd part-1/seed
npm install
AWS_REGION=eu-west-2 node seed.mjs
```

You should see three progress lines and then `done: 60 products in table
"Products"`. If you named the table something else, set `TABLE_NAME` too.

Check it in the console: open the table, choose **Explore table items**, and
the products are there. Notice the order is not the order in the file. DynamoDB
returns items in the order it stores them, which is by a hash of the key. The
grid will sort them for you in a moment.

## Step 3: create the Lambda function

1. Open **Lambda**, then **Create function**.
2. Leave **Author from scratch** selected. Function name: `products-read`.
   Runtime: leave the default, **Node.js 24.x**. (Node.js 22.x also works;
   both ship the AWS SDK the code imports.)
3. Open **Additional settings** at the bottom of the form. Under
   **Networking**, switch on **Function URL**. A panel opens:
   - **Auth type**: choose **NONE**.
   - Tick **Configure cross-origin resource sharing (CORS)**. The default
     allows every origin, which is what a page opened from a file needs.
   - Choose **Save**.
4. Choose **Create function**. A "Getting started" dialog appears over the new
   function; choose **Dismiss**.

The function opens on its **Code** tab with a small editor. In the explorer on
the left, `index.mjs` is already selected.

5. Replace the editor's contents with `lambda/index.mjs` from the download,
   then choose **Deploy** in the panel below the editor. The panel's status
   changes from "Changes not deployed" to "Current".

The function scans the whole table, one page at a time, and returns the items
as JSON. Sixty products come back in one page; the loop is there so the same
code still works when a table has grown past a page.

Now give it permission to read the table, and tell it the table's name.

6. Open the **Configuration** tab, then **Permissions** in the list on the
   left. Under **Execution role**, click the role name (it looks like
   `products-read-role-` followed by a few letters). That opens the role in
   IAM in a new tab. Under **Permissions policies**, choose **Add
   permissions**, then **Attach policies**. Search for
   `AmazonDynamoDBReadOnlyAccess`, tick it, and choose **Add permissions**.
   Read-only is enough for part 1; part 2 replaces it with a policy scoped to
   this one table. Close the IAM tab.
7. Back on the function's **Configuration** tab, choose **Environment
   variables**, then **Edit**, then **Add environment variable**. Key
   `TABLE_NAME`, value `Products`. Save. (Skip this if you kept the default
   table name; the code falls back to it.)
8. Still under **Configuration**, choose **Function URL** and copy the URL. It
   looks like `https://abc123.lambda-url.eu-west-2.on.aws/`.

Paste it into a browser tab. You should see JSON beginning `{"items":[{`.
If you see a permissions error instead, wait a minute; the policy you attached
can take that long to apply.

Two things to be clear about. Auth type NONE means anyone with the URL can read
your products, which is fine for demo data and not fine for anything else;
part 3 puts authentication in front of it. And allowing every origin is a
shortcut for the tutorial; on a real site you would put your own domain there.

## Step 4: the web page

Open `web/index.html` from the download in an editor. Near the top of the
script is one line to change:

```js
const FUNCTION_URL = 'https://xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.lambda-url.eu-west-2.on.aws/';
```

Replace it with your Function URL, save, and open the file in a browser. You
do not need a web server for this page; a file URL is enough.

The status line at the top reads "60 products from DynamoDB" and the grid
below it shows them. Click **Price** to sort by price. Click it again to
reverse. Type in the filter row under **Category** to narrow to one category.
Drag a column header to move it.

That is the whole page. Here is what the thirty lines of script do:

- The grid is created first, empty, with six columns and the filter row
  switched on. Each column names the field it reads from a product. `quantity`
  and `price` are numbers, so they align right and sort numerically. `price`
  is formatted as pounds. `updated` is a date, so it sorts as one rather than
  as text, and shows as "Jul 7, 2026" rather than the raw `2026-07-07` the
  table holds.
- `rowKey: 'sku'` tells the grid which field identifies a row. The grid uses
  it to keep selection and edits attached to the right product when rows move,
  and part 2 uses it to know which item to update.
- `fetch` calls the Lambda, and `grid.rows.load(data.items)` puts the products
  in. That is the only line that touches data.

The grid comes from a CDN, one script and one stylesheet, and shows a small
trial watermark because there is no licence key. Everything works with the
watermark on; a key removes it and does nothing else.

## What you have

A DynamoDB table with data in it, a Lambda function that reads it, and a page
that shows it with sorting and filtering done in the browser. Three pieces,
each one you could replace: a different table, a different function, a
different front end.

The one design decision worth noticing is that the Lambda returns everything
and the grid does the rest. With sixty products that is right. With sixty
thousand it is not, and a later part in this series moves sorting, filtering
and paging into the function so the browser only asks for the rows it is
showing.

## Next

**Part 2: create, edit and delete.** The grid's cells become editable, the
Lambda learns three more verbs, and an edit in the browser lands in DynamoDB
before the cell stops flashing.

## Cleaning up

If you are not continuing, delete the Lambda function (Lambda, Functions,
select `products-read`, Actions, Delete) and the table (DynamoDB, Tables,
select `Products`, Delete). Deleting the function does not delete the role it
created; find it in IAM under Roles as `products-read-role-…` and delete that
too. None of it costs anything at this size while idle, but a deleted resource
cannot surprise you later.
