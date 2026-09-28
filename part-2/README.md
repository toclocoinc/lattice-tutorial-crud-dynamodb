# Part 2: add and delete products

Source for part 2 of the Lattice Grid CRUD tutorial. It builds on part 1: the
same table, the same function, the same page, with two more verbs. The guide is
on the Lattice Grid site and in [`TUTORIAL.md`](TUTORIAL.md) beside this file.

| File | What it is |
| --- | --- |
| `lambda/index.mjs` | The function with GET, POST and DELETE. Paste it over part 1's code and deploy. |
| `iam/products-policy.json` | An inline policy scoped to the one table, replacing the read-only managed policy. Fill in your region and account id. |
| `web/index.html` | The page: an Add button that opens the grid's built-in form, and a Delete item on the right-click menu. |

Needs Lattice Grid 1.76.0 or later, which is what the page loads from the CDN.
Part 1's table and data carry over; nothing needs re-seeding.
