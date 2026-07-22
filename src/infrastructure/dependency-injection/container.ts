import { Knex } from 'knex';
import { FilterEntriesUseCase } from '../../application/use-cases/FilterEntriesUseCase';
import { GetUsageHistoryUseCase } from '../../application/use-cases/GetUsageHistoryUseCase';
import { ScrapeHackerNewsUseCase } from '../../application/use-cases/ScrapeHackerNewsUseCase';
import { AppConfig, loadConfig } from '../config/AppConfig';
import { createDatabase } from '../database/createDatabase';
import { KnexScrapeRepository } from '../database/KnexScrapeRepository';
import { KnexUsageLogRepository } from '../database/KnexUsageLogRepository';
import { CheerioHackerNewsScraper } from '../scraping/CheerioHackerNewsScraper';

export interface ApplicationContainer {
  readonly config: AppConfig;
  readonly db: Knex;
  readonly scrapeHackerNews: ScrapeHackerNewsUseCase;
  readonly filterEntries: FilterEntriesUseCase;
  readonly getUsageHistory: GetUsageHistoryUseCase;
  dispose(): Promise<void>;
}

export async function createContainer(
  config: AppConfig = loadConfig(),
): Promise<ApplicationContainer> {
  const db = await createDatabase(config.databasePath);
  const scrapeRepository = new KnexScrapeRepository(db);
  const usageLogRepository = new KnexUsageLogRepository(db);
  const scraper = new CheerioHackerNewsScraper(config.hackerNewsUrl);

  const scrapeHackerNews = new ScrapeHackerNewsUseCase(
    scraper,
    scrapeRepository,
    usageLogRepository,
    config.scrapeLimit,
    config.defaultUserId,
  );

  const filterEntries = new FilterEntriesUseCase(
    scrapeRepository,
    usageLogRepository,
    scrapeHackerNews,
  );

  const getUsageHistory = new GetUsageHistoryUseCase(
    usageLogRepository,
    config.defaultHistoryLimit,
  );

  return {
    config,
    db,
    scrapeHackerNews,
    filterEntries,
    getUsageHistory,
    async dispose(): Promise<void> {
      await db.destroy();
    },
  };
}
