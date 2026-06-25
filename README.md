# Macro Dashboard Live

This folder is ready to push to GitHub and deploy on Vercel.

## What It Does

- Hosts the web dashboard from `public/index.html`.
- Runs a daily GitHub Action at close of business UK time during BST.
- Creates an Excel workbook in `public/daily_exports/`.
- Updates `public/data/latest-export.json` with the latest export link and asset rows.
- Does **not** use Reuters. Reuters can be added later through an API/export route.

## Deploy Steps

1. Create a new GitHub repository.
2. Upload or push the contents of this folder.
3. In GitHub, run **Actions -> Daily macro Excel export -> Run workflow** once.
4. Connect the repository to Vercel.
5. In Vercel:
   - Framework preset: **Other**
   - Build command: leave empty
   - Output directory: `public`
6. Open the Vercel URL.

## Close Of Business Schedule

The workflow currently uses:

```text
5 16 * * 1-5
```

That means 16:05 UTC, which is 17:05 UK time during British Summer Time.
In winter, change it to `5 17 * * 1-5` unless you replace it with a timezone-aware runner.
