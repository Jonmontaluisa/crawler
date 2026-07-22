import { HackerNewsEntry } from '../entities/HackerNewsEntry';

export interface HackerNewsScraperPort {
  scrapeTopEntries(limit: number): Promise<HackerNewsEntry[]>;
}
