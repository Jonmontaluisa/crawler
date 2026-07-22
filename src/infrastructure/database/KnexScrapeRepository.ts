import { Knex } from 'knex';
import { HackerNewsEntry } from '../../domain/entities/HackerNewsEntry';
import { ScrapeSnapshot } from '../../domain/entities/ScrapeSnapshot';
import { ScrapeRepository } from '../../domain/repositories/ScrapeRepository';

interface ScrapeRow {
  id: number;
  scraped_at: string;
  source: string;
}

interface EntryRow {
  rank: number;
  title: string;
  points: number;
  comments_count: number;
}

export class KnexScrapeRepository implements ScrapeRepository {
  constructor(private readonly db: Knex) {}

  async save(
    entries: readonly HackerNewsEntry[],
    source: string = 'news',
  ): Promise<ScrapeSnapshot> {
    const scrapedAt = new Date();

    const scrapeId = await this.db.transaction(async (trx) => {
      const [id] = await trx('scrapes').insert({
        scraped_at: scrapedAt.toISOString(),
        source,
      });

      if (entries.length > 0) {
        await trx('scrape_entries').insert(
          entries.map((entry) => ({
            scrape_id: id,
            rank: entry.rank,
            title: entry.title,
            points: entry.points,
            comments_count: entry.commentsCount,
          })),
        );
      }

      return Number(id);
    });

    return {
      id: scrapeId,
      scrapedAt,
      source,
      entries: [...entries],
    };
  }

  async findLatest(): Promise<ScrapeSnapshot | null> {
    const scrape = (await this.db('scrapes')
      .select('id', 'scraped_at', 'source')
      .orderBy('id', 'desc')
      .first()) as ScrapeRow | undefined;

    if (!scrape) {
      return null;
    }

    return this.toSnapshot(scrape);
  }

  async findById(id: number): Promise<ScrapeSnapshot | null> {
    const scrape = (await this.db('scrapes')
      .select('id', 'scraped_at', 'source')
      .where('id', id)
      .first()) as ScrapeRow | undefined;

    if (!scrape) {
      return null;
    }

    return this.toSnapshot(scrape);
  }

  private async toSnapshot(scrape: ScrapeRow): Promise<ScrapeSnapshot> {
    const rows = await this.db('scrape_entries')
      .select('rank', 'title', 'points', 'comments_count')
      .where('scrape_id', scrape.id)
      .orderBy('rank', 'asc') as EntryRow[];

    return {
      id: scrape.id,
      scrapedAt: new Date(scrape.scraped_at),
      source: scrape.source,
      entries: rows.map((row) => ({
        rank: row.rank,
        title: row.title,
        points: row.points,
        commentsCount: row.comments_count,
      })),
    };
  }
}
