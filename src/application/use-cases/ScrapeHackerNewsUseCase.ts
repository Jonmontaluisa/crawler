import { HackerNewsEntry } from '../../domain/entities/HackerNewsEntry';
import { ScrapeSnapshot } from '../../domain/entities/ScrapeSnapshot';
import { ScrapingError } from '../../domain/errors/AppError';
import { HackerNewsScraperPort } from '../../domain/repositories/HackerNewsScraperPort';
import { ScrapeRepository } from '../../domain/repositories/ScrapeRepository';
import { UsageLogRepository } from '../../domain/repositories/UsageLogRepository';

export interface ScrapeHackerNewsInput {
  readonly limit?: number;
  readonly userId?: string;
}

export interface ScrapeHackerNewsResult {
  readonly snapshot: ScrapeSnapshot;
  readonly entries: readonly HackerNewsEntry[];
  readonly executionTimeMs: number;
}

export class ScrapeHackerNewsUseCase {
  constructor(
    private readonly scraper: HackerNewsScraperPort,
    private readonly scrapeRepository: ScrapeRepository,
    private readonly usageLogRepository: UsageLogRepository,
    private readonly defaultLimit: number = 30,
    private readonly defaultUserId: string = 'cli-default',
  ) {}

  async execute(input: ScrapeHackerNewsInput = {}): Promise<ScrapeHackerNewsResult> {
    const limit = input.limit ?? this.defaultLimit;
    const startedAt = Date.now();

    try {
      const entries = await this.scraper.scrapeTopEntries(limit);
      const snapshot = await this.scrapeRepository.save(entries, 'news');
      const executionTimeMs = Date.now() - startedAt;

      await this.usageLogRepository.create({
        actionType: 'scrape',
        resultCount: entries.length,
        source: 'news',
        userId: input.userId ?? this.defaultUserId,
        executionTimeMs,
        parameters: {
          scrapeId: snapshot.id,
          limit,
        },
      });

      return { snapshot, entries, executionTimeMs };
    } catch (error) {
      if (error instanceof ScrapingError) {
        throw error;
      }
      throw new ScrapingError('Failed to scrape Hacker News', error);
    }
  }
}
