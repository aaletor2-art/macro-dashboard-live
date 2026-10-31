# Delivery requirements — not complete

Keep the existing layout and preserve provider history independently of current feeds.

## Existing preview
- Device-local trade journal, images, discipline statistics, CSV exports.
- Stochastic/Fibonacci/Bollinger guide and deterministic cashflow scenarios.

## Prepared, not activated
- Server-side Trading Economics calendar adapter, bounded date queries, explicit unavailable states.
- PostgreSQL schema for immutable economic versions, trade revisions and exact version links.

## Required setup
1. Connect a PostgreSQL provider and private object storage to the existing Vercel project. No integrations or environment variables were present when inspected on 28 October 2026.
2. Obtain a Trading Economics API subscription with calendar/history access and contractual permission to retain snapshots. Configure TRADING_ECONOMICS_API_KEY in Vercel; never in GitHub source or browser JavaScript.
3. Choose and configure authenticated user access before enabling private trade storage.
4. Configure background collector credentials and cadence within provider and hosting quotas.

## Must implement and verify before completion
- Transactional ingestion, retry-safe writes, collection gaps, pagination, cache separate from archive.
- Scheduled collection independent of page views; historical import with provenance; versions distinguish capture time from release time.
- Private authenticated trade/image persistence and migration from browser records.
- Reopen and amend any trade with revision history; preserve original macro snapshot.
- Dated releases/news linked to entry/exit; event-window outcome cohorts without causal claims.
- Screenshot-assisted review with confidence and user-confirmed extracted values.
- Equity/drawdown, expectancy, sample deviation, R distributions and discipline cohorts.
- Historical outcome-based forecast ranges with explicit assumptions and sample-size limits.
- Saved dated reports, version references and exportable backups including screenshots.
- Restore into a fresh database and compare record counts/hashes.
- Repeat refresh, provider outage/removal/revisions, concurrency and large-history performance tests.
- Browser workflow and API integration checks on Vercel; production release after these pass.

Never call this finished because Vercel reports a successful build. Never store private trades in the public GitHub repository. Database triggers are a foundation, not a backup or complete authorization system.
