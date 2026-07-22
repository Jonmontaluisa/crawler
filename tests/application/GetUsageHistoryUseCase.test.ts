import { GetUsageHistoryUseCase } from '../../src/application/use-cases/GetUsageHistoryUseCase';
import { UsageLog } from '../../src/domain/entities/UsageLog';
import { ValidationError } from '../../src/domain/errors/AppError';
import { UsageLogRepository } from '../../src/domain/repositories/UsageLogRepository';

describe('GetUsageHistoryUseCase', () => {
  const logs: UsageLog[] = [
    {
      id: 1,
      timestamp: new Date(),
      actionType: 'long-title',
      resultCount: 3,
      source: 'news',
      userId: 'cli-default',
      executionTimeMs: 12,
      parameters: {},
    },
  ];

  it('returns recent logs with default limit', async () => {
    const repository: UsageLogRepository = {
      create: jest.fn(),
      findRecent: jest.fn().mockResolvedValue(logs),
    };

    const useCase = new GetUsageHistoryUseCase(repository, 20);
    const result = await useCase.execute();

    expect(repository.findRecent).toHaveBeenCalledWith(20);
    expect(result.logs).toEqual(logs);
  });

  it('honors a custom limit', async () => {
    const repository: UsageLogRepository = {
      create: jest.fn(),
      findRecent: jest.fn().mockResolvedValue([]),
    };

    const useCase = new GetUsageHistoryUseCase(repository);
    await useCase.execute({ limit: 5 });

    expect(repository.findRecent).toHaveBeenCalledWith(5);
  });

  it('rejects non-positive limits', async () => {
    const repository: UsageLogRepository = {
      create: jest.fn(),
      findRecent: jest.fn(),
    };

    const useCase = new GetUsageHistoryUseCase(repository);
    await expect(useCase.execute({ limit: 0 })).rejects.toBeInstanceOf(
      ValidationError,
    );
  });
});
