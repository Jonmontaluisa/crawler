import fs from 'fs';
import knex, { Knex } from 'knex';
import path from 'path';

type SqliteConnection = {
  run: (sql: string, callback: (error: Error | null) => void) => void;
};

export async function createDatabase(databasePath: string): Promise<Knex> {
  const directory = path.dirname(databasePath);
  fs.mkdirSync(directory, { recursive: true });

  const db = knex({
    client: 'sqlite3',
    connection: { filename: databasePath },
    useNullAsDefault: true,
    migrations: {
      directory: path.join(__dirname, 'migrations'),
      loadExtensions: ['.js', '.ts'],
    },
    pool: {
      afterCreate(connection: unknown, done: (error: Error | null, connection: unknown) => void): void {
        (connection as SqliteConnection).run('PRAGMA foreign_keys = ON', (error) => {
          done(error, connection);
        });
      },
    },
  });

  // TODO(deploy): run migrations in deploy/CI instead of app boot for production.
  await db.migrate.latest();

  return db;
}
