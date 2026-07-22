import { HackerNewsEntry } from './HackerNewsEntry';

export interface ScrapeSnapshot {
  readonly id: number;
  readonly scrapedAt: Date;
  readonly source: string;
  readonly entries: readonly HackerNewsEntry[];
}
