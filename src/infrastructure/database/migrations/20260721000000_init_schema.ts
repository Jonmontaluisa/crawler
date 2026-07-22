import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('scrapes', (table) => {
    table.increments('id').primary();
    table.text('scraped_at').notNullable();
    table.text('source').notNullable().defaultTo('news');
  });

  await knex.schema.createTable('scrape_entries', (table) => {
    table.increments('id').primary();
    table
      .integer('scrape_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('scrapes')
      .onDelete('CASCADE');
    table.integer('rank').notNullable();
    table.text('title').notNullable();
    table.integer('points').notNullable();
    table.integer('comments_count').notNullable();
    table.index(['scrape_id'], 'idx_scrape_entries_scrape_id');
  });

  await knex.schema.createTable('usage_logs', (table) => {
    table.increments('id').primary();
    table.text('timestamp').notNullable();
    table.text('filter_type').notNullable();
    table.integer('result_count').notNullable();
    table.text('source').notNullable().defaultTo('news');
    table.text('user_id').notNullable().defaultTo('cli-default');
    table.integer('execution_time_ms').nullable();
    table.text('parameters').notNullable().defaultTo('{}');
    table.index(['timestamp'], 'idx_usage_logs_timestamp');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('scrape_entries');
  await knex.schema.dropTableIfExists('usage_logs');
  await knex.schema.dropTableIfExists('scrapes');
}
