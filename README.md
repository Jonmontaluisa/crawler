# HN Crawler

A Clean Architecture TypeScript crawler for [Hacker News](https://news.ycombinator.com/). It scrapes the first 30 front-page entries, stores snapshots and usage logs in SQLite, and exposes filter strategies via a CLI (with a ready-to-extend Express HTTP layer).

## Features

- Fresh scrape of the top 30 HN entries (`rank`, `title`, `points`, `commentsCount`)
- Extensible `FilterStrategy` filters:
  - **long** — titles with **more than 5 words**, ordered by comments descending
  - **short** — titles with **5 or fewer words**, ordered by points descending
- SQLite persistence for scrape snapshots and usage logs
- Usage history with multi-user-ready fields (`userId`, `parameters` JSON)
- Jest tests targeting ≥ 80% coverage
- Express stub so the same use cases can power a REST API later

## Word counting rule

Titles are split on whitespace. Leading/trailing punctuation and symbols are stripped from each token; empty tokens are dropped.

Example: `"Ask HN: Best tools 2025?"` → `Ask`, `HN`, `Best`, `tools`, `2025` → **5 words**.

## Requirements

- Node.js ≥ 18
- npm

## Setup

```bash
npm install
npm run build
```

For local development without building first:

```bash
npm run hn -- scrape
```

After `npm run build`, you can also run:

```bash
node dist/presentation/cli/index.js scrape
```

## CLI commands

| Command | Description |
|---------|-------------|
| `npm run hn -- scrape` | Fresh scrape and save a snapshot |
| `npm run hn -- filter long` | Titles with more than 5 words, by comments desc |
| `npm run hn -- filter short` | Titles with 5 or fewer words, by points desc |
| `npm run hn -- filter long --fresh` | Scrape first, then apply long filter |
| `npm run hn -- filter short --fresh` | Scrape first, then apply short filter |
| `npm run hn -- history` | Recent usage logs |
| `npm run hn -- history -n 5` | Last 5 usage logs |

## Configuration

Optional environment variables:

| Variable | Default | Purpose |
|----------|---------|---------|
| `HN_URL` | `https://news.ycombinator.com/` | Front-page URL |
| `HN_SCRAPE_LIMIT` | `30` | Entries to scrape |
| `HN_DATABASE_PATH` | `./data/hn-crawler.db` | SQLite file path |
| `HN_DEFAULT_USER_ID` | `cli-default` | Usage-log user id |
| `HN_HISTORY_LIMIT` | `20` | Default history page size |
| `PORT` | `3000` | Express listen port |

## Storage & usage logs

SQLite via **Knex**. Schema lives in versioned migrations under `src/infrastructure/database/migrations/`. Pending migrations run automatically when the CLI or HTTP server starts (move that to deploy/CI later for production).

Tables:

- **scrapes** / **scrape_entries** — each scrape snapshot and its entries
- **usage_logs** — audit trail with:
  - `id`, `timestamp`
  - `filterType` / `actionType` (`scrape` \| `long-title` \| `short-title`)
  - `resultCount`, `source` (default `news`)
  - `userId` (default `cli-default`)
  - `executionTimeMs` (optional)
  - `parameters` (JSON for future filter params)

## Tests

```bash
npm test                 # tests only (no coverage files)
npm run test:coverage    # coverage table in the terminal only
```

Coverage targets word counting, filter strategies, use cases, HTML parsing, Knex repositories, config, and CLI helpers.

## Future REST API

A minimal Express app lives under `src/presentation/http/`:

```bash
npm run server
```

| Method | Path | Use case |
|--------|------|----------|
| `GET` | `/health` | Liveness |
| `POST` | `/api/scrape` | `ScrapeHackerNewsUseCase` |
| `GET` | `/api/entries/filter/:name?fresh=true` | `FilterEntriesUseCase` |
| `GET` | `/api/history?limit=20` | `GetUsageHistoryUseCase` |

Controllers stay thin: parse HTTP → call use cases → map status codes. Auth, validation middleware, and OpenAPI can be added without touching domain or application layers.

Import the Postman collection from `postman/HN-Crawler.postman_collection.json` to exercise the same endpoints.

## Technical Consideration (for reviewers)

Priority was **Clean Architecture + SOLID**: business rules stay free of Cheerio, Express, Knex, and Commander so the same use cases serve the CLI today and HTTP tomorrow. Wiring lives only in `infrastructure/dependency-injection/container.ts`.

**Ports** (e.g. `HackerNewsScraperPort`) are not required for the app to run. They exist so production can plug in Cheerio and tests can plug in fakes — without changing use-case code. Same idea for repositories (Dependency Inversion).

**Filters:** `FilterStrategy` + registry keep the system open for new filters without editing use cases. `name` is the CLI/API key (`long` / `short`); `actionType` is what usage logs store (`long-title` / `short-title` / `scrape`). Word counting is one shared domain rule.

**Persistence:** Knex + versioned migrations instead of bootstrap `CREATE TABLE IF NOT EXISTS`, for real schema evolution and an easier Postgres path later. Migrations run on CLI/HTTP boot for local convenience (`TODO(deploy)`: move to deploy/CI in production). Each scrape **appends** a snapshot; filters without `--fresh` use `findLatest()` only. Older snapshots stay in the DB.

**Usage history** logs both scrapes and filters. `--fresh` therefore writes two rows. `userId` / `parameters` are ready for multi-user and richer options later.

**Testing:** `npm test` writes no `coverage/` files; `npm run test:coverage` prints coverage in the terminal only.

## License

MIT
