export type FilterType = 'long-title' | 'short-title';

export type UsageActionType = FilterType | 'scrape';

export type DataSource = 'news';

export interface UsageLog {
  readonly id: number;
  readonly timestamp: Date;
  readonly actionType: UsageActionType;
  readonly resultCount: number;
  readonly source: DataSource;
  readonly userId: string;
  readonly executionTimeMs?: number;
  readonly parameters: Readonly<Record<string, unknown>>;
}

export interface CreateUsageLogInput {
  readonly actionType: UsageActionType;
  readonly resultCount: number;
  readonly source?: DataSource;
  readonly userId?: string;
  readonly executionTimeMs?: number;
  readonly parameters?: Readonly<Record<string, unknown>>;
}
