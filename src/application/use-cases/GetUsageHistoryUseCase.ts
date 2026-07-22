import { UsageLog } from '../../domain/entities/UsageLog';
import { ValidationError } from '../../domain/errors/AppError';
import { UsageLogRepository } from '../../domain/repositories/UsageLogRepository';

export interface GetUsageHistoryInput {
  readonly limit?: number;
}

export interface GetUsageHistoryResult {
  readonly logs: readonly UsageLog[];
}

export class GetUsageHistoryUseCase {
  constructor(
    private readonly usageLogRepository: UsageLogRepository,
    private readonly defaultLimit: number = 20,
  ) {}

  async execute(input: GetUsageHistoryInput = {}): Promise<GetUsageHistoryResult> {
    const limit = input.limit ?? this.defaultLimit;
    if (limit < 1) {
      throw new ValidationError('History limit must be at least 1');
    }

    const logs = await this.usageLogRepository.findRecent(limit);
    return { logs };
  }
}
