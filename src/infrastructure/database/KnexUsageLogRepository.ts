import { Knex } from 'knex';
import {
  CreateUsageLogInput,
  DataSource,
  UsageActionType,
  UsageLog,
} from '../../domain/entities/UsageLog';
import { UsageLogRepository } from '../../domain/repositories/UsageLogRepository';

interface UsageLogRow {
  id: number;
  timestamp: string;
  filter_type: string;
  result_count: number;
  source: string;
  user_id: string;
  execution_time_ms: number | null;
  parameters: string;
}

export class KnexUsageLogRepository implements UsageLogRepository {
  constructor(private readonly db: Knex) {}

  async create(input: CreateUsageLogInput): Promise<UsageLog> {
    const timestamp = new Date();
    const source: DataSource = input.source ?? 'news';
    const userId = input.userId ?? 'cli-default';
    const parameters = input.parameters ?? {};

    const [id] = await this.db('usage_logs').insert({
      timestamp: timestamp.toISOString(),
      filter_type: input.actionType,
      result_count: input.resultCount,
      source,
      user_id: userId,
      execution_time_ms: input.executionTimeMs ?? null,
      parameters: JSON.stringify(parameters),
    });

    return {
      id: Number(id),
      timestamp,
      actionType: input.actionType,
      resultCount: input.resultCount,
      source,
      userId,
      executionTimeMs: input.executionTimeMs,
      parameters,
    };
  }

  async findRecent(limit: number): Promise<UsageLog[]> {
    const rows = (await this.db('usage_logs')
      .select(
        'id',
        'timestamp',
        'filter_type',
        'result_count',
        'source',
        'user_id',
        'execution_time_ms',
        'parameters',
      )
      .orderBy('id', 'desc')
      .limit(limit)) as UsageLogRow[];

    return rows.map(mapRow);
  }
}

function mapRow(row: UsageLogRow): UsageLog {
  return {
    id: row.id,
    timestamp: new Date(row.timestamp),
    actionType: row.filter_type as UsageActionType,
    resultCount: row.result_count,
    source: row.source as DataSource,
    userId: row.user_id,
    executionTimeMs: row.execution_time_ms ?? undefined,
    parameters: parseParameters(row.parameters),
  };
}

function parseParameters(raw: string): Readonly<Record<string, unknown>> {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return {};
  } catch {
    return {};
  }
}
