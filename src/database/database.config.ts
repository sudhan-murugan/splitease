import { join } from 'path';
import { DataSourceOptions } from 'typeorm';

type Env = Record<string, string | undefined>;

function required(env: Env, key: string): string {
  const value = env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

// Single source of DB settings for both the Nest app and the TypeORM CLI.
// Accepts either DATABASE_URL (as provided by Render/Heroku) or discrete DB_* vars.
export function buildDatabaseOptions(
  env: Env = process.env,
): DataSourceOptions {
  const isProduction = env.NODE_ENV === 'production';

  const connection = env.DATABASE_URL
    ? { url: env.DATABASE_URL }
    : {
        host: required(env, 'DB_HOST'),
        port: Number(env.DB_PORT ?? 5432),
        username: required(env, 'DB_USERNAME'),
        password: required(env, 'DB_PASSWORD'),
        database: required(env, 'DB_NAME'),
      };

  return {
    type: 'postgres',
    ...connection,
    ssl: env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    // Globs work from src/ (ts, CLI) and dist/ (js, compiled app)
    entities: [join(__dirname, '..', '**', '*.entity.{ts,js}')],
    migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
    // Never auto-sync schema in production; migrations own the schema there
    synchronize: !isProduction && env.DB_SYNCHRONIZE === 'true',
    // Apply pending migrations on boot (default on in production)
    migrationsRun: (env.DB_MIGRATIONS_RUN ?? String(isProduction)) === 'true',
  };
}
