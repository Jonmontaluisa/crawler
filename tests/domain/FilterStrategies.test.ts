import { LongTitleFilterStrategy } from '../../src/domain/filters/LongTitleFilterStrategy';
import { ShortTitleFilterStrategy } from '../../src/domain/filters/ShortTitleFilterStrategy';
import {
  listFilterStrategyNames,
  resolveFilterStrategy,
} from '../../src/domain/filters/FilterStrategyRegistry';
import { HackerNewsEntry } from '../../src/domain/entities/HackerNewsEntry';

const sampleEntries: HackerNewsEntry[] = [
  { rank: 1, title: 'Ask HN: Best tools 2025?', points: 10, commentsCount: 50 }, // 5 words → short
  { rank: 2, title: 'One Two Three Four Five Six', points: 100, commentsCount: 20 }, // 6 → long
  { rank: 3, title: 'Short', points: 200, commentsCount: 5 }, // 1 → short
  { rank: 4, title: 'A very long title with many extra words here', points: 5, commentsCount: 99 }, // 9 → long
  { rank: 5, title: 'Five word title right here', points: 150, commentsCount: 1 }, // 5 → short
];

describe('LongTitleFilterStrategy', () => {
  const strategy = new LongTitleFilterStrategy();

  it('keeps titles with more than 5 words', () => {
    const result = strategy.apply(sampleEntries);
    expect(result.map((e) => e.rank)).toEqual([4, 2]);
  });

  it('orders by comments descending', () => {
    const result = strategy.apply(sampleEntries);
    expect(result[0].commentsCount).toBeGreaterThanOrEqual(result[1].commentsCount);
  });

  it('exposes long-title filter type', () => {
    expect(strategy.filterType).toBe('long-title');
    expect(strategy.name).toBe('long');
  });
});

describe('ShortTitleFilterStrategy', () => {
  const strategy = new ShortTitleFilterStrategy();

  it('keeps titles with 5 or fewer words', () => {
    const result = strategy.apply(sampleEntries);
    expect(result.map((e) => e.rank)).toEqual([3, 5, 1]);
  });

  it('orders by points descending', () => {
    const result = strategy.apply(sampleEntries);
    expect(result[0].points).toBe(200);
    expect(result[1].points).toBe(150);
    expect(result[2].points).toBe(10);
  });

  it('exposes short-title filter type', () => {
    expect(strategy.filterType).toBe('short-title');
  });
});

describe('FilterStrategyRegistry', () => {
  it('resolves known strategies', () => {
    expect(resolveFilterStrategy('long')).toBeInstanceOf(LongTitleFilterStrategy);
    expect(resolveFilterStrategy('short')).toBeInstanceOf(ShortTitleFilterStrategy);
  });

  it('lists available strategy names', () => {
    expect(listFilterStrategyNames()).toEqual(expect.arrayContaining(['long', 'short']));
  });

  it('throws for unknown strategies', () => {
    expect(() => resolveFilterStrategy('unknown')).toThrow(/Unknown filter/);
  });
});
