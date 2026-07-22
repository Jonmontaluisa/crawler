import { HackerNewsEntry } from '../entities/HackerNewsEntry';
import { countWords } from '../services/WordCounter';
import { FilterStrategy } from './FilterStrategy';

export class LongTitleFilterStrategy implements FilterStrategy {
  readonly name: string = 'long';
  readonly filterType = 'long-title' as const;

  apply(entries: readonly HackerNewsEntry[]): HackerNewsEntry[] {
    return entries
      .filter((entry) => countWords(entry.title) > 5)
      .sort((a, b) => b.commentsCount - a.commentsCount);
  }
}
