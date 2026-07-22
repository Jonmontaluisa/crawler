import { HackerNewsEntry } from '../entities/HackerNewsEntry';
import { ScrapeSnapshot } from '../entities/ScrapeSnapshot';

export interface ScrapeRepository {
  save(entries: readonly HackerNewsEntry[], source?: string): Promise<ScrapeSnapshot>;
  findLatest(): Promise<ScrapeSnapshot | null>;
  findById(id: number): Promise<ScrapeSnapshot | null>;
}
