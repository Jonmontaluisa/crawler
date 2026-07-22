import { AppError } from '../../domain/errors/AppError';

export function formatCliError(error: unknown): string {
  if (error instanceof AppError) {
    return `Error [${error.code}]: ${error.message}`;
  }
  if (error instanceof Error) {
    return `Error: ${error.message}`;
  }
  return 'Error: An unexpected failure occurred';
}
