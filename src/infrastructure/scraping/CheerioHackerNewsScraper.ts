import * as cheerio from 'cheerio';
import { HackerNewsEntry } from '../../domain/entities/HackerNewsEntry';
import { ScrapingError } from '../../domain/errors/AppError';
import { HackerNewsScraperPort } from '../../domain/repositories/HackerNewsScraperPort';

export class CheerioHackerNewsScraper implements HackerNewsScraperPort {
  constructor(
    private readonly url: string,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async scrapeTopEntries(limit: number): Promise<HackerNewsEntry[]> {
    const html = await this.fetchHtml();
    const entries = parseHackerNewsHtml(html, limit);

    if (entries.length === 0) {
      throw new ScrapingError('No entries found on Hacker News front page');
    }

    return entries;
  }

  private async fetchHtml(): Promise<string> {
    try {
      const response = await this.fetchImpl(this.url, {
        headers: {
          'User-Agent': 'hn-crawler/1.0 (+https://github.com/stackbuilders)',
          Accept: 'text/html',
        },
      });

      if (!response.ok) {
        throw new ScrapingError(
          `Hacker News responded with HTTP ${response.status}`,
        );
      }

      return await response.text();
    } catch (error) {
      if (error instanceof ScrapingError) {
        throw error;
      }
      throw new ScrapingError('Unable to fetch Hacker News', error);
    }
  }
}

export function parseHackerNewsHtml(html: string, limit: number): HackerNewsEntry[] {
  const $ = cheerio.load(html);
  const entries: HackerNewsEntry[] = [];

  for (const element of $('tr.athing').toArray()) {
    if (entries.length >= limit) {
      break;
    }

    const row = $(element);
    const rankText = row.find('span.rank').text().trim().replace(/\./g, '');
    const title = row.find('span.titleline > a').first().text().trim();
    const subtext = row.next('tr').find('td.subtext');

    const points = parseCount(subtext.find('span.score').text(), 0);
    const comments = parseCommentsCountFromSubtext(subtext.text());

    const rank = Number.parseInt(rankText, 10);
    if (!title || !Number.isFinite(rank)) {
      continue;
    }

    entries.push({
      rank,
      title,
      points,
      commentsCount: comments,
    });
  }

  return entries;
}

function parseCount(text: string, fallback: number): number {
  const match = text.match(/(\d+)/);
  if (!match) {
    return fallback;
  }
  return Number.parseInt(match[1], 10);
}

export function parseCommentsCountFromSubtext(subtext: string): number {
  const normalized = subtext.toLowerCase();
  if (normalized.includes('discuss')) {
    const commentsMatch = normalized.match(/(\d+)\s+comments?/);
    return commentsMatch ? Number.parseInt(commentsMatch[1], 10) : 0;
  }

  const match = normalized.match(/(\d+)\s+comments?/);
  return match ? Number.parseInt(match[1], 10) : 0;
}
