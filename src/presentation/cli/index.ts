#!/usr/bin/env node
import { createContainer } from '../../infrastructure/dependency-injection/container';
import { runCli } from './program';

async function main(): Promise<void> {
  const container = await createContainer();

  try {
    const exitCode = await runCli(process.argv.slice(2), container);
    await container.dispose();
    process.exit(exitCode);
  } catch (error) {
    await container.dispose();
    throw error;
  }
}

void main();
