import path from 'path';

export interface AppConfig {
  readonly hackerNewsUrl: string;
  readonly scrapeLimit: number;
  readonly databasePath: string;
  readonly defaultUserId: string;
  readonly defaultHistoryLimit: number;
  readonly httpPort: number;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  return {
    hackerNewsUrl: env.HN_URL ?? 'https://news.ycombinator.com/',
    scrapeLimit: parsePositiveInt(env.HN_SCRAPE_LIMIT, 30),
    databasePath:
      env.HN_DATABASE_PATH ?? path.join(process.cwd(), 'data', 'hn-crawler.db'),
    defaultUserId: env.HN_DEFAULT_USER_ID ?? 'cli-default',
    defaultHistoryLimit: parsePositiveInt(env.HN_HISTORY_LIMIT, 20),
    httpPort: parsePositiveInt(env.PORT, 3000),
  };
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (value === undefined || value === '') {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }
  return parsed;
}
