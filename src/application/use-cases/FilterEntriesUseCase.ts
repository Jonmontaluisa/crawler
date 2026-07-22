import { HackerNewsEntry } from '../../domain/entities/HackerNewsEntry';
import { FilterType } from '../../domain/entities/UsageLog';
import { NotFoundError, ValidationError } from '../../domain/errors/AppError';
import { FilterStrategy } from '../../domain/filters/FilterStrategy';
import { resolveFilterStrategy } from '../../domain/filters/FilterStrategyRegistry';
import { ScrapeRepository } from '../../domain/repositories/ScrapeRepository';
import { UsageLogRepository } from '../../domain/repositories/UsageLogRepository';
import { ScrapeHackerNewsUseCase } from './ScrapeHackerNewsUseCase';

export interface FilterEntriesInput {
  readonly filterName: string;
  readonly fresh?: boolean;
  readonly userId?: string;
  readonly parameters?: Readonly<Record<string, unknown>>;
}

export interface FilterEntriesResult {
  readonly filterType: FilterType;
  readonly filterName: string;
  readonly entries: readonly HackerNewsEntry[];
  readonly resultCount: number;
  readonly executionTimeMs: number;
  readonly scrapeId: number;
}

export class FilterEntriesUseCase {
  constructor(
    private readonly scrapeRepository: ScrapeRepository,
    private readonly usageLogRepository: UsageLogRepository,
    private readonly scrapeUseCase: ScrapeHackerNewsUseCase,
    private readonly resolveStrategy: (name: string) => FilterStrategy = resolveFilterStrategy,
  ) {}

  async execute(input: FilterEntriesInput): Promise<FilterEntriesResult> {
    const startedAt = Date.now();
    const strategy = this.resolveStrategySafely(input.filterName);

    if (input.fresh) {
      await this.scrapeUseCase.execute({ userId: input.userId });
    }

    const snapshot = await this.scrapeRepository.findLatest();
    if (!snapshot) {
      throw new NotFoundError(
        'No scrape data found. Run "hn scrape" first or use --fresh.',
      );
    }

    const filtered = strategy.apply(snapshot.entries);
    const executionTimeMs = Date.now() - startedAt;

    await this.usageLogRepository.create({
      actionType: strategy.filterType,
      resultCount: filtered.length,
      source: 'news',
      userId: input.userId ?? 'cli-default',
      executionTimeMs,
      parameters: {
        filterName: strategy.name,
        fresh: Boolean(input.fresh),
        scrapeId: snapshot.id,
        ...input.parameters,
      },
    });

    return {
      filterType: strategy.filterType,
      filterName: strategy.name,
      entries: filtered,
      resultCount: filtered.length,
      executionTimeMs,
      scrapeId: snapshot.id,
    };
  }

  private resolveStrategySafely(filterName: string): FilterStrategy {
    try {
      return this.resolveStrategy(filterName);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid filter';
      throw new ValidationError(message);
    }
  }
}
