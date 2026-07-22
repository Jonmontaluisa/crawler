import { loadConfig } from '../../src/infrastructure/config/AppConfig';
import { formatCliError } from '../../src/presentation/cli/errorHandler';
import {
  formatEntriesTable,
  formatUsageLogs,
} from '../../src/presentation/cli/formatters';
import { AppError, NotFoundError } from '../../src/domain/errors/AppError';
import { HackerNewsEntry } from '../../src/domain/entities/HackerNewsEntry';
import { UsageLog } from '../../src/domain/entities/UsageLog';

describe('loadConfig', () => {
  it('uses defaults when env is empty', () => {
    const config = loadConfig({});
    expect(config.hackerNewsUrl).toContain('ycombinator');
    expect(config.scrapeLimit).toBe(30);
    expect(config.defaultUserId).toBe('cli-default');
    expect(config.httpPort).toBe(3000);
  });

  it('reads overrides from env', () => {
    const config = loadConfig({
      HN_URL: 'https://example.test/',
      HN_SCRAPE_LIMIT: '10',
      HN_DEFAULT_USER_ID: 'alice',
      PORT: '4000',
      HN_HISTORY_LIMIT: '5',
      HN_DATABASE_PATH: '/tmp/custom.db',
    });

    expect(config.hackerNewsUrl).toBe('https://example.test/');
    expect(config.scrapeLimit).toBe(10);
    expect(config.defaultUserId).toBe('alice');
    expect(config.httpPort).toBe(4000);
    expect(config.defaultHistoryLimit).toBe(5);
    expect(config.databasePath).toBe('/tmp/custom.db');
  });

  it('falls back on invalid numeric env values', () => {
    const config = loadConfig({ HN_SCRAPE_LIMIT: 'nope', PORT: '0' });
    expect(config.scrapeLimit).toBe(30);
    expect(config.httpPort).toBe(3000);
  });
});

describe('CLI formatters', () => {
  it('formats entries as a table', () => {
    const entries: HackerNewsEntry[] = [
      { rank: 1, title: 'Hello', points: 10, commentsCount: 2 },
    ];
    const output = formatEntriesTable(entries);
    expect(output).toContain('RANK');
    expect(output).toContain('Hello');
  });

  it('handles empty entry lists', () => {
    expect(formatEntriesTable([])).toContain('No entries');
  });

  it('formats usage logs', () => {
    const logs: UsageLog[] = [
      {
        id: 3,
        timestamp: new Date('2026-01-02T00:00:00.000Z'),
        actionType: 'long-title',
        resultCount: 2,
        source: 'news',
        userId: 'cli-default',
        executionTimeMs: 9,
        parameters: { fresh: false },
      },
    ];
    const output = formatUsageLogs(logs);
    expect(output).toContain('#3');
    expect(output).toContain('long-title');
    expect(output).toContain('9ms');
  });

  it('handles empty history', () => {
    expect(formatUsageLogs([])).toContain('No usage history');
  });
});

describe('formatCliError', () => {
  it('formats AppError with code', () => {
    expect(formatCliError(new NotFoundError('missing'))).toContain('NOT_FOUND');
  });

  it('formats generic Error', () => {
    expect(formatCliError(new Error('boom'))).toBe('Error: boom');
  });

  it('formats unknown values', () => {
    expect(formatCliError(42)).toContain('unexpected');
  });

  it('formats AppError subclasses', () => {
    expect(formatCliError(new AppError('x', 'CUSTOM'))).toContain('CUSTOM');
  });
});
