import { HackerNewsEntry } from '../entities/HackerNewsEntry';

export interface FilterStrategy {
  readonly name: string;
  readonly filterType: 'long-title' | 'short-title';

  apply(entries: readonly HackerNewsEntry[]): HackerNewsEntry[];
}
