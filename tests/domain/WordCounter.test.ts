import { countWords } from '../../src/domain/services/WordCounter';

describe('countWords', () => {
  it('counts words and strips surrounding punctuation (spec example)', () => {
    expect(countWords('Ask HN: Best tools 2025?')).toBe(5);
  });

  it('returns 0 for empty or whitespace-only titles', () => {
    expect(countWords('')).toBe(0);
    expect(countWords('   ')).toBe(0);
  });

  it('counts a single word', () => {
    expect(countWords('Hello')).toBe(1);
  });

  it('collapses multiple spaces', () => {
    expect(countWords('one   two    three')).toBe(3);
  });

  it('strips leading and trailing symbols from tokens', () => {
    expect(countWords('"Quoted" (title) — wow!')).toBe(3);
  });

  it('keeps digits inside words', () => {
    expect(countWords('Node.js 22 released')).toBe(3);
  });

  it('treats hyphenated tokens as a single word when punctuation is only surrounding', () => {
    expect(countWords('well-known tip')).toBe(2);
  });
});
