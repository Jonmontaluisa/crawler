import { FilterStrategy } from './FilterStrategy';
import { LongTitleFilterStrategy } from './LongTitleFilterStrategy';
import { ShortTitleFilterStrategy } from './ShortTitleFilterStrategy';

const strategies = new Map<string, FilterStrategy>([
  ['long', new LongTitleFilterStrategy()],
  ['short', new ShortTitleFilterStrategy()],
]);

export function resolveFilterStrategy(name: string): FilterStrategy {
  const strategy = strategies.get(name);
  if (!strategy) {
    const available = Array.from(strategies.keys()).join(', ');
    throw new Error(`Unknown filter "${name}". Available filters: ${available}`);
  }
  return strategy;
}

export function listFilterStrategyNames(): string[] {
  return Array.from(strategies.keys());
}
