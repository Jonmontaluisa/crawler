import { HackerNewsEntry } from '../entities/HackerNewsEntry';
import { countWords } from '../services/WordCounter';
import { FilterStrategy } from './FilterStrategy';

export class ShortTitleFilterStrategy implements FilterStrategy {
  readonly name: string = 'short';
  readonly filterType = 'short-title' as const;

  apply(entries: readonly HackerNewsEntry[]): HackerNewsEntry[] {
    return entries
      .filter((entry) => countWords(entry.title) <= 5)
      .sort((a, b) => b.points - a.points);
  }
}
