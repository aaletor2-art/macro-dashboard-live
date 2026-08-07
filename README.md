# Macro Dashboard Live

Production dashboard: https://macro-dashboard-live.vercel.app

This folder is connected to GitHub and deploys automatically on Vercel.

## What It Does

- Hosts the web dashboard from `public/index.html`.
- Provides separate public routes for Countries, individual country profiles, Markets, Economic Calendar, and Companies.
- Runs a daily GitHub Action at close of business UK time during BST.
- Creates an Excel workbook in `public/daily_exports/`.
- Updates `public/data/latest-export.json` with the latest export link and asset rows.
- Keeps the previous valid quote when an upstream market request times out, and marks it stale in the data file.
- Adds current Reuters and Trading Economics headline links through Google News RSS, with source attribution and no copied article bodies.
- Serves five-minute-cached market and company quotes from `/api/live`, with the daily hosted snapshot as a fallback.
- Does **not** use Reuters. Reuters can be added later through an API/export route.

## Deployment

The `main` branch of `aaletor2-art/macro-dashboard-live` is connected to Vercel. Every successful data refresh commits the new snapshot and triggers a production deployment. `vercel.json` keeps the static output directory and cache behaviour in source control.

## Close Of Business Schedule

The workflow currently uses:

```text
5 16 * * 1-5
```

That means 16:05 UTC, which is 17:05 UK time during British Summer Time.
In winter, change it to `5 17 * * 1-5` unless you replace it with a timezone-aware runner.
