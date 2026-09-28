# Part 3: edit in place, full screen, and the form inside the page

Source for part 3 of the Lattice Grid CRUD tutorial. Builds on part 2. The
guide is on the Lattice Grid site and in [`TUTORIAL.md`](TUTORIAL.md).

| File | What it is |
| --- | --- |
| `lambda/index.mjs` | The function with GET, POST, PATCH and DELETE. Paste it over part 2's code and deploy. |
| `web/index.html` | The page: editable cells that PATCH as you commit them, a Full screen button, and the row form drawn in a side panel instead of over the grid. |

The IAM policy from part 2 already allows `UpdateItem`, so nothing changes in
IAM. The Function URL's CORS needs PATCH added to its allowed methods.

Needs Lattice Grid 1.76.0 or later.
