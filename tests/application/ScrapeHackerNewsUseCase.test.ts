import { ScrapeHackerNewsUseCase } from '../../src/application/use-cases/ScrapeHackerNewsUseCase';
import { HackerNewsEntry } from '../../src/domain/entities/HackerNewsEntry';
import { ScrapeSnapshot } from '../../src/domain/entities/ScrapeSnapshot';
import { ScrapingError } from '../../src/domain/errors/AppError';
import { HackerNewsScraperPort } from '../../src/domain/repositories/HackerNewsScraperPort';
import { ScrapeRepository } from '../../src/domain/repositories/ScrapeRepository';
import { UsageLogRepository } from '../../src/domain/repositories/UsageLogRepository';

describe('ScrapeHackerNewsUseCase', () => {
  const entries: HackerNewsEntry[] = [
    { rank: 1, title: 'Alpha', points: 1, commentsCount: 2 },
  ];

  const snapshot: ScrapeSnapshot = {
    id: 1,
    scrapedAt: new Date('2026-01-01T00:00:00.000Z'),
    source: 'news',
    entries,
  };

  function createDeps(overrides?: {
    scraper?: HackerNewsScraperPort;
  }): {
    scraper: HackerNewsScraperPort;
    scrapeRepository: ScrapeRepository;
    usageLogRepository: UsageLogRepository;
  } {
    return {
      scraper: overrides?.scraper ?? {
        scrapeTopEntries: jest.fn().mockResolvedValue(entries),
      },
      scrapeRepository: {
        save: jest.fn().mockResolvedValue(snapshot),
        findLatest: jest.fn(),
        findById: jest.fn(),
      },
      usageLogRepository: {
        create: jest.fn().mockResolvedValue({
          id: 1,
          timestamp: new Date(),
          actionType: 'scrape',
          resultCount: 1,
          source: 'news',
          userId: 'cli-default',
          parameters: {},
        }),
        findRecent: jest.fn(),
      },
    };
  }

  it('scrapes, persists entries, and logs usage', async () => {
    const deps = createDeps();
    const useCase = new ScrapeHackerNewsUseCase(
      deps.scraper,
      deps.scrapeRepository,
      deps.usageLogRepository,
      30,
    );

    const result = await useCase.execute();

    expect(deps.scraper.scrapeTopEntries).toHaveBeenCalledWith(30);
    expect(deps.scrapeRepository.save).toHaveBeenCalledWith(entries, 'news');
    expect(deps.usageLogRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        actionType: 'scrape',
        resultCount: 1,
        userId: 'cli-default',
        source: 'news',
        parameters: expect.objectContaining({ scrapeId: 1, limit: 30 }),
      }),
    );
    expect(result.snapshot.id).toBe(1);
    expect(result.entries).toEqual(entries);
  });

  it('honors a custom limit and userId', async () => {
    const deps = createDeps();
    const useCase = new ScrapeHackerNewsUseCase(
      deps.scraper,
      deps.scrapeRepository,
      deps.usageLogRepository,
    );

    await useCase.execute({ limit: 10, userId: 'alice' });

    expect(deps.scraper.scrapeTopEntries).toHaveBeenCalledWith(10);
    expect(deps.usageLogRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'alice',
        parameters: expect.objectContaining({ limit: 10 }),
      }),
    );
  });

  it('does not log usage when scraping fails', async () => {
    const deps = createDeps({
      scraper: {
        scrapeTopEntries: jest.fn().mockRejectedValue(new Error('network down')),
      },
    });
    const useCase = new ScrapeHackerNewsUseCase(
      deps.scraper,
      deps.scrapeRepository,
      deps.usageLogRepository,
    );

    await expect(useCase.execute()).rejects.toBeInstanceOf(ScrapingError);
    expect(deps.usageLogRepository.create).not.toHaveBeenCalled();
  });

  it('rethrows ScrapingError unchanged', async () => {
    const original = new ScrapingError('boom');
    const deps = createDeps({
      scraper: {
        scrapeTopEntries: jest.fn().mockRejectedValue(original),
      },
    });
    const useCase = new ScrapeHackerNewsUseCase(
      deps.scraper,
      deps.scrapeRepository,
      deps.usageLogRepository,
    );

    await expect(useCase.execute()).rejects.toBe(original);
  });
});
