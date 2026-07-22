import fs from 'fs';
import os from 'os';
import path from 'path';
import { Knex } from 'knex';
import { createDatabase } from '../../src/infrastructure/database/createDatabase';
import { KnexScrapeRepository } from '../../src/infrastructure/database/KnexScrapeRepository';
import { KnexUsageLogRepository } from '../../src/infrastructure/database/KnexUsageLogRepository';
import { HackerNewsEntry } from '../../src/domain/entities/HackerNewsEntry';

describe('Knex repositories', () => {
  let dbPath: string;
  let db: Knex;

  beforeEach(async () => {
    dbPath = path.join(
      os.tmpdir(),
      `hn-crawler-test-${Date.now()}-${Math.random().toString(16).slice(2)}.db`,
    );
    db = await createDatabase(dbPath);
  });

  afterEach(async () => {
    await db.destroy();
    for (const suffix of ['', '-wal', '-shm']) {
      const file = `${dbPath}${suffix}`;
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    }
  });

  it('saves and loads the latest scrape snapshot', async () => {
    const repository = new KnexScrapeRepository(db);
    const entries: HackerNewsEntry[] = [
      { rank: 1, title: 'First', points: 10, commentsCount: 2 },
      { rank: 2, title: 'Second', points: 5, commentsCount: 0 },
    ];

    const saved = await repository.save(entries, 'news');
    const latest = await repository.findLatest();
    const byId = await repository.findById(saved.id);

    expect(latest).not.toBeNull();
    expect(latest?.id).toBe(saved.id);
    expect(latest?.entries).toEqual(entries);
    expect(byId?.entries).toEqual(entries);
  });

  it('returns null when no scrapes exist', async () => {
    const repository = new KnexScrapeRepository(db);
    expect(await repository.findLatest()).toBeNull();
    expect(await repository.findById(999)).toBeNull();
  });

  it('creates and lists usage logs', async () => {
    const repository = new KnexUsageLogRepository(db);

    await repository.create({
      actionType: 'long-title',
      resultCount: 4,
      executionTimeMs: 15,
      parameters: { filterName: 'long' },
    });
    await repository.create({
      actionType: 'short-title',
      resultCount: 2,
      userId: 'user-2',
    });

    const recent = await repository.findRecent(10);
    expect(recent).toHaveLength(2);
    expect(recent[0].actionType).toBe('short-title');
    expect(recent[0].userId).toBe('user-2');
    expect(recent[1].parameters).toEqual({ filterName: 'long' });
    expect(recent[1].executionTimeMs).toBe(15);
  });
});
