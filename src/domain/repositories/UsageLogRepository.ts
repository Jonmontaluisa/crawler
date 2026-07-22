import { CreateUsageLogInput, UsageLog } from '../entities/UsageLog';

export interface UsageLogRepository {
  create(input: CreateUsageLogInput): Promise<UsageLog>;
  findRecent(limit: number): Promise<UsageLog[]>;
}
