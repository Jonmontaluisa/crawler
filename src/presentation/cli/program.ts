import { Command } from 'commander';
import { ApplicationContainer } from '../../infrastructure/dependency-injection/container';
import { formatCliError } from './errorHandler';
import { formatEntriesTable, formatUsageLogs } from './formatters';

export function buildCliProgram(container: ApplicationContainer): Command {
  const program = new Command();

  program
    .name('hn')
    .description('Hacker News crawler — scrape, filter, and inspect usage history')
    .showHelpAfterError()
    .exitOverride();

  program
    .command('scrape')
    .description('Fresh scrape from Hacker News and save the results')
    .action(async () => {
      const result = await container.scrapeHackerNews.execute();
      console.log(
        `Scraped ${result.entries.length} entries (snapshot #${result.snapshot.id}).`,
      );
      console.log(formatEntriesTable(result.entries));
    });

  const filter = program
    .command('filter')
    .description('Filter the most recent scrape using a named strategy');

  filter
    .command('long')
    .description('Titles with more than 5 words, ordered by comments descending')
    .option('--fresh', 'Force a fresh scrape before filtering', false)
    .action(async (options: { fresh?: boolean }) => {
      const result = await container.filterEntries.execute({
        filterName: 'long',
        fresh: Boolean(options.fresh),
        userId: container.config.defaultUserId,
      });
      console.log(
        `Filter "${result.filterName}" → ${result.resultCount} entries ` +
          `(${result.executionTimeMs}ms, scrape #${result.scrapeId}).`,
      );
      console.log(formatEntriesTable(result.entries));
    });

  filter
    .command('short')
    .description('Titles with 5 or fewer words, ordered by points descending')
    .option('--fresh', 'Force a fresh scrape before filtering', false)
    .action(async (options: { fresh?: boolean }) => {
      const result = await container.filterEntries.execute({
        filterName: 'short',
        fresh: Boolean(options.fresh),
        userId: container.config.defaultUserId,
      });
      console.log(
        `Filter "${result.filterName}" → ${result.resultCount} entries ` +
          `(${result.executionTimeMs}ms, scrape #${result.scrapeId}).`,
      );
      console.log(formatEntriesTable(result.entries));
    });

  program
    .command('history')
    .description('Show recent usage logs')
    .option('-n, --limit <number>', 'Number of log entries to show')
    .action(async (options: { limit?: string }) => {
      const limit = options.limit
        ? Number.parseInt(options.limit, 10)
        : undefined;
      const result = await container.getUsageHistory.execute({ limit });
      console.log(formatUsageLogs(result.logs));
    });

  return program;
}

export async function runCli(
  argv: string[],
  container: ApplicationContainer,
): Promise<number> {
  const program = buildCliProgram(container);

  try {
    await program.parseAsync(argv, { from: 'user' });
    return 0;
  } catch (error) {
    console.error(formatCliError(error));
    return 1;
  }
}
