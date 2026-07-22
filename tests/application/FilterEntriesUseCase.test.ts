import { FilterEntriesUseCase } from '../../src/application/use-cases/FilterEntriesUseCase';
import { ScrapeHackerNewsUseCase } from '../../src/application/use-cases/ScrapeHackerNewsUseCase';
import { HackerNewsEntry } from '../../src/domain/entities/HackerNewsEntry';
import { ScrapeSnapshot } from '../../src/domain/entities/ScrapeSnapshot';
import { NotFoundError, ValidationError } from '../../src/domain/errors/AppError';
import { FilterStrategy } from '../../src/domain/filters/FilterStrategy';
import { ScrapeRepository } from '../../src/domain/repositories/ScrapeRepository';
import { UsageLogRepository } from '../../src/domain/repositories/UsageLogRepository';

describe('FilterEntriesUseCase', () => {
  const entries: HackerNewsEntry[] = [
    { rank: 1, title: 'One Two Three Four Five Six', points: 10, commentsCount: 40 },
    { rank: 2, title: 'Short', points: 99, commentsCount: 1 },
  ];

  const snapshot: ScrapeSnapshot = {
    id: 7,
    scrapedAt: new Date(),
    source: 'news',
    entries,
  };

  const longStrategy: FilterStrategy = {
    name: 'long',
    filterType: 'long-title',
    apply: (all) => all.filter((e) => e.rank === 1),
  };

  function createDeps(overrides?: {
    latest?: ScrapeSnapshot | null;
  }): {
    scrapeRepository: ScrapeRepository;
    usageLogRepository: UsageLogRepository;
    scrapeUseCase: ScrapeHackerNewsUseCase;
  } {
    const scrapeRepository: ScrapeRepository = {
      save: jest.fn(),
      findLatest: jest.fn().mockResolvedValue(
        overrides && 'latest' in overrides ? overrides.latest : snapshot,
      ),
      findById: jest.fn(),
    };

    const usageLogRepository: UsageLogRepository = {
      create: jest.fn().mockResolvedValue({
        id: 1,
        timestamp: new Date(),
        actionType: 'long-title',
        resultCount: 1,
        source: 'news',
        userId: 'cli-default',
        parameters: {},
      }),
      findRecent: jest.fn(),
    };

    const scrapeUseCase = {
      execute: jest.fn().mockResolvedValue({ snapshot, entries }),
    } as unknown as ScrapeHackerNewsUseCase;

    return { scrapeRepository, usageLogRepository, scrapeUseCase };
  }

  it('filters using the latest scrape and logs usage', async () => {
    const deps = createDeps();
    const useCase = new FilterEntriesUseCase(
      deps.scrapeRepository,
      deps.usageLogRepository,
      deps.scrapeUseCase,
      () => longStrategy,
    );

    const result = await useCase.execute({ filterName: 'long' });

    expect(deps.scrapeUseCase.execute).not.toHaveBeenCalled();
    expect(result.resultCount).toBe(1);
    expect(result.entries[0].rank).toBe(1);
    expect(result.scrapeId).toBe(7);
    expect(deps.usageLogRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        actionType: 'long-title',
        resultCount: 1,
        userId: 'cli-default',
        source: 'news',
      }),
    );
  });

  it('forces a fresh scrape when fresh=true', async () => {
    const deps = createDeps();
    const useCase = new FilterEntriesUseCase(
      deps.scrapeRepository,
      deps.usageLogRepository,
      deps.scrapeUseCase,
      () => longStrategy,
    );

    await useCase.execute({ filterName: 'long', fresh: true });

    expect(deps.scrapeUseCase.execute).toHaveBeenCalled();
  });

  it('throws NotFoundError when no scrape exists', async () => {
    const deps = createDeps({ latest: null });
    const useCase = new FilterEntriesUseCase(
      deps.scrapeRepository,
      deps.usageLogRepository,
      deps.scrapeUseCase,
      () => longStrategy,
    );

    await expect(useCase.execute({ filterName: 'long' })).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it('throws ValidationError for unknown filters', async () => {
    const deps = createDeps();
    const useCase = new FilterEntriesUseCase(
      deps.scrapeRepository,
      deps.usageLogRepository,
      deps.scrapeUseCase,
      () => {
        throw new Error('Unknown filter "nope"');
      },
    );

    await expect(useCase.execute({ filterName: 'nope' })).rejects.toBeInstanceOf(
      ValidationError,
    );
  });
});
