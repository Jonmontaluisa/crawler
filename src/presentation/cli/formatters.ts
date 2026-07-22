import { HackerNewsEntry } from '../../domain/entities/HackerNewsEntry';
import { UsageLog } from '../../domain/entities/UsageLog';

export function formatEntriesTable(entries: readonly HackerNewsEntry[]): string {
  if (entries.length === 0) {
    return 'No entries matched the filter.';
  }

  const header = pad('RANK', 6) + pad('PTS', 6) + pad('CMTS', 6) + 'TITLE';
  const separator = '-'.repeat(Math.min(80, header.length + 40));
  const rows = entries.map(
    (entry) =>
      pad(String(entry.rank), 6) +
      pad(String(entry.points), 6) +
      pad(String(entry.commentsCount), 6) +
      entry.title,
  );

  return [header, separator, ...rows].join('\n');
}

export function formatUsageLogs(logs: readonly UsageLog[]): string {
  if (logs.length === 0) {
    return 'No usage history yet.';
  }

  const lines = logs.map((log) => {
    const time = log.timestamp.toISOString();
    const duration =
      log.executionTimeMs !== undefined ? `${log.executionTimeMs}ms` : 'n/a';
    return [
      `#${log.id} ${time}`,
      `  action=${log.actionType} results=${log.resultCount} source=${log.source}`,
      `  user=${log.userId} duration=${duration}`,
      `  parameters=${JSON.stringify(log.parameters)}`,
    ].join('\n');
  });

  return lines.join('\n\n');
}

function pad(value: string, width: number): string {
  return value.padEnd(width, ' ');
}
