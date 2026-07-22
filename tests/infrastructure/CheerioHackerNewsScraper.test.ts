import {
  parseCommentsCountFromSubtext,
  parseHackerNewsHtml,
  CheerioHackerNewsScraper,
} from '../../src/infrastructure/scraping/CheerioHackerNewsScraper';
import { ScrapingError } from '../../src/domain/errors/AppError';

const sampleHtml = `
<html><body>
  <table>
    <tr class="athing" id="1">
      <td><span class="rank">1.</span></td>
      <td class="title"><span class="titleline"><a href="https://example.com">Ask HN: Best tools 2025?</a></span></td>
    </tr>
    <tr>
      <td></td>
      <td class="subtext">
        <span class="score">42 points</span> by alice |
        <a href="item?id=1">18 comments</a>
      </td>
    </tr>
    <tr class="athing" id="2">
      <td><span class="rank">2.</span></td>
      <td class="title"><span class="titleline"><a href="https://example.com/2">Short title</a></span></td>
    </tr>
    <tr>
      <td></td>
      <td class="subtext">
        <span class="score">7 points</span> by bob |
        <a href="item?id=2">discuss</a>
      </td>
    </tr>
    <tr class="athing" id="3">
      <td><span class="rank">3.</span></td>
      <td class="title"><span class="titleline"><a href="https://example.com/3">Third entry here</a></span></td>
    </tr>
    <tr>
      <td></td>
      <td class="subtext">
        <span class="score">100 points</span> by carol |
        <a href="item?id=3">3 comments</a>
      </td>
    </tr>
  </table>
</body></html>
`;

describe('parseHackerNewsHtml', () => {
  it('parses rank, title, points, and comments', () => {
    const entries = parseHackerNewsHtml(sampleHtml, 30);

    expect(entries).toHaveLength(3);
    expect(entries[0]).toEqual({
      rank: 1,
      title: 'Ask HN: Best tools 2025?',
      points: 42,
      commentsCount: 18,
    });
    expect(entries[1].commentsCount).toBe(0);
    expect(entries[2].points).toBe(100);
  });

  it('respects the limit', () => {
    const entries = parseHackerNewsHtml(sampleHtml, 2);
    expect(entries).toHaveLength(2);
    expect(entries.map((e) => e.rank)).toEqual([1, 2]);
  });
});

describe('parseCommentsCountFromSubtext', () => {
  it('parses comment counts', () => {
    expect(parseCommentsCountFromSubtext('42 points | 18 comments')).toBe(18);
  });

  it('returns 0 for discuss', () => {
    expect(parseCommentsCountFromSubtext('7 points | discuss')).toBe(0);
  });
});

describe('CheerioHackerNewsScraper', () => {
  it('fetches HTML and returns entries', async () => {
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => sampleHtml,
    });

    const scraper = new CheerioHackerNewsScraper(
      'https://news.ycombinator.com/',
      fetchImpl as unknown as typeof fetch,
    );

    const entries = await scraper.scrapeTopEntries(2);
    expect(entries).toHaveLength(2);
    expect(fetchImpl).toHaveBeenCalled();
  });

  it('throws ScrapingError on non-OK response', async () => {
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: false,
      status: 503,
      text: async () => '',
    });

    const scraper = new CheerioHackerNewsScraper(
      'https://news.ycombinator.com/',
      fetchImpl as unknown as typeof fetch,
    );

    await expect(scraper.scrapeTopEntries(30)).rejects.toBeInstanceOf(ScrapingError);
  });

  it('throws ScrapingError when no entries are found', async () => {
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => '<html><body>empty</body></html>',
    });

    const scraper = new CheerioHackerNewsScraper(
      'https://news.ycombinator.com/',
      fetchImpl as unknown as typeof fetch,
    );

    await expect(scraper.scrapeTopEntries(30)).rejects.toBeInstanceOf(ScrapingError);
  });
});
